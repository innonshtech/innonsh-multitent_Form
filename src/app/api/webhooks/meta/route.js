import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/webhooks/meta
 * Webhook validation endpoint required by Meta.
 * Meta calls this with hub.mode, hub.verify_token, and hub.challenge.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const expectedToken = process.env.META_VERIFY_TOKEN || 'meta_verify_token_123';

    if (mode === 'subscribe' && token === expectedToken) {
      console.log('✅ Meta webhook verified successfully.');
      return new Response(challenge, { status: 200 });
    } else {
      console.warn(`❌ Meta webhook verification failed. Expected token: ${expectedToken}, received: ${token}`);
      return new Response('Forbidden', { status: 403 });
    }
  } catch (err) {
    console.error('Meta webhook GET error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * POST /api/webhooks/meta
 * Receives real-time lead events from Meta.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    console.log('📬 Received Meta webhook payload:', JSON.stringify(body));

    if (body.object !== 'page') {
      return NextResponse.json({ success: true, message: 'Event ignored (not a page object)' });
    }

    if (!supabase) {
      console.error('❌ Database client not initialized.');
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Process all entries and changes
    for (const entry of body.entry || []) {
      const pageId = entry.id;
      for (const change of entry.changes || []) {
        if (change.field === 'leadgen') {
          const leadgenId = change.value.leadgen_id;
          const formId = change.value.form_id;

          if (!leadgenId) continue;

          console.log(`Processing Meta Lead Gen Event - Page ID: ${pageId}, Form ID: ${formId}, LeadGen ID: ${leadgenId}`);

          // 1. Find the organization configuration
          let config = null;

          // Try searching by specific form_id first
          if (formId) {
            const { data } = await supabase
              .from('meta_integrations')
              .select('*')
              .eq('form_id', formId)
              .limit(1)
              .maybeSingle();
            config = data;
          }

          // Fallback to searching by page_id if form_id isn't specifically mapped
          if (!config && pageId) {
            const { data } = await supabase
              .from('meta_integrations')
              .select('*')
              .eq('page_id', pageId)
              .limit(1)
              .maybeSingle();
            config = data;
          }

          if (!config) {
            console.warn(`⚠️ No Meta integration settings found for Form ID: ${formId} or Page ID: ${pageId}`);
            continue;
          }

          // 2. Fetch detailed lead data from Meta Graph API
          const metaUrl = `https://graph.facebook.com/v20.0/${leadgenId}?access_token=${config.page_access_token}`;
          const metaRes = await fetch(metaUrl);

          if (!metaRes.ok) {
            const errText = await metaRes.text();
            console.error(`❌ Failed to fetch lead details from Meta for leadgen_id ${leadgenId}:`, errText);
            continue;
          }

          const rawLead = await metaRes.json();
          console.log(`Successfully fetched lead details for ${leadgenId}:`, JSON.stringify(rawLead));

          // 3. Extract and parse field values
          let email = '';
          let phone = '';
          let firstName = '';
          let lastName = '';
          const customData = {};

          if (rawLead.field_data) {
            for (const field of rawLead.field_data) {
              const name = field.name.toLowerCase();
              const value = field.values && field.values[0] ? field.values[0] : '';

              if (name === 'email') {
                email = value;
              } else if (name === 'phone_number' || name === 'phone') {
                phone = value;
              } else if (name === 'first_name') {
                firstName = value;
              } else if (name === 'last_name') {
                lastName = value;
              } else if (name === 'full_name') {
                if (!firstName) {
                  const parts = value.trim().split(/\s+/);
                  firstName = parts[0];
                  lastName = parts.slice(1).join(' ');
                }
              } else {
                // Store any other custom question fields in custom_data
                customData[field.name] = value;
              }
            }
          }

          // Fallbacks for empty name to satisfy DB constraints
          if (!firstName) {
            firstName = 'Meta';
            lastName = 'Lead';
          }

          // 4. Duplicate Check (Email & Phone)
          let isDuplicate = false;
          if (email && email.trim()) {
            const { data: dupEmail } = await supabase
              .from('leads')
              .select('id')
              .eq('email', email.toLowerCase().trim())
              .maybeSingle();

            if (dupEmail) {
              console.log(`⚠️ Skipping duplicate lead creation. Email "${email}" already exists.`);
              isDuplicate = true;
            }
          }

          if (!isDuplicate && phone && phone.trim()) {
            const { data: dupPhone } = await supabase
              .from('leads')
              .select('id')
              .eq('phone', phone.trim())
              .maybeSingle();

            if (dupPhone) {
              console.log(`⚠️ Skipping duplicate lead creation. Phone "${phone}" already exists.`);
              isDuplicate = true;
            }
          }

          if (isDuplicate) continue;

          // 5. Determine Assignee (Round-Robin logic or fallback to owner)
          let finalAssignee = null;
          const { data: activeReps } = await supabase
            .from('users')
            .select('id')
            .eq('org_id', config.org_id)
            .eq('role', 'sales_rep')
            .eq('is_active', true)
            .order('created_at', { ascending: true });

          if (activeReps && activeReps.length > 0) {
            const repIds = activeReps.map(r => r.id);
            const { data: lastLead } = await supabase
              .from('leads')
              .select('assigned_to')
              .in('assigned_to', repIds)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (lastLead && lastLead.assigned_to) {
              const lastRepIndex = activeReps.findIndex(r => r.id === lastLead.assigned_to);
              const nextRepIndex = (lastRepIndex + 1) % activeReps.length;
              finalAssignee = activeReps[nextRepIndex].id;
            } else {
              finalAssignee = activeReps[0].id;
            }
          }

          // Fallback to organization owner if no active sales reps
          if (!finalAssignee) {
            const { data: owner } = await supabase
              .from('users')
              .select('id')
              .eq('org_id', config.org_id)
              .eq('role', 'owner')
              .limit(1)
              .maybeSingle();
            if (owner) {
              finalAssignee = owner.id;
            }
          }

          // 6. Create the Lead
          const { data: newLead, error: insertError } = await supabase
            .from('leads')
            .insert([
              {
                first_name: firstName,
                last_name: lastName || '',
                company: 'Meta Ads',
                designation: 'Lead from Instagram/Facebook',
                email: email || '',
                phone: phone || '',
                whatsapp: phone || '',
                website: '',
                city: '',
                state: '',
                country: 'India',
                industry: '',
                employee_count: 0,
                annual_revenue: 0,
                priority: 'Warm',
                status: 'New',
                lost_reason: '',
                source: 'Meta Ads',
                requirements: `Form Name/ID: ${formId || 'N/A'}\nMeta Lead ID: ${leadgenId}`,
                interested_product: '',
                follow_up_type: 'None',
                next_follow_up_date: null,
                assigned_to: finalAssignee,
                custom_fields: [],
                custom_data: customData,
                org_id: config.org_id
              }
            ])
            .select('*')
            .single();

          if (insertError) {
            console.error('❌ Supabase error inserting Meta lead:', insertError);
            continue;
          }

          console.log(`✅ Successfully created Meta Lead: ID ${newLead.id}, Name: ${firstName} ${lastName}`);

          // 7. Log timeline creation note
          await supabase
            .from('lead_notes')
            .insert([
              {
                lead_id: newLead.id,
                text: `Lead created automatically via Meta Webhook (Lead ID: ${leadgenId}, Form ID: ${formId || 'N/A'})`,
                created_by: finalAssignee,
                created_by_name: 'Meta Integration'
              }
            ]);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Meta webhook POST error:', err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
