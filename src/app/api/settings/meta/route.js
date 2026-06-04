import { getUserFromRequest } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/settings/meta
 * Retrieves Meta integration settings for the calling user's organization.
 */
export async function GET(req) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database client not initialized.' }, { status: 500 });
    }

    const { data: config, error } = await supabase
      .from('meta_integrations')
      .select('*')
      .eq('org_id', user.orgId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching meta integrations:', error);
      throw error;
    }

    // Mask page access token for security
    const maskedConfig = config ? {
      ...config,
      page_access_token: config.page_access_token ? `${config.page_access_token.substring(0, 8)}...` : ''
    } : null;

    return NextResponse.json({
      success: true,
      config: maskedConfig,
      rawConfigExists: !!config,
      verifyToken: process.env.META_VERIFY_TOKEN || 'meta_verify_token_123'
    });
  } catch (err) {
    console.error('GET meta-settings error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

/**
 * POST /api/settings/meta
 * Creates or updates Meta integration settings for the organization (restricted to owner role).
 * Body: { pageId, pageName, pageAccessToken, formId }
 */
export async function POST(req) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (user.role !== 'owner') {
      return NextResponse.json({ error: 'Only organization owners can modify integrations.' }, { status: 403 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database client not initialized.' }, { status: 500 });
    }

    const body = await req.json();
    const { pageId, pageName, pageAccessToken, formId } = body;

    if (!pageId || !pageId.trim()) {
      return NextResponse.json({ error: 'Page ID is required.' }, { status: 400 });
    }

    if (!pageAccessToken || !pageAccessToken.trim()) {
      return NextResponse.json({ error: 'Page Access Token is required.' }, { status: 400 });
    }

    // Check if configuration already exists
    const { data: existing, error: findError } = await supabase
      .from('meta_integrations')
      .select('id, page_access_token')
      .eq('org_id', user.orgId)
      .maybeSingle();

    if (findError) {
      console.error('Error finding existing meta integration:', findError);
      throw findError;
    }

    // Handle token update logic: if the user passes masked token (starts with prefix + '...'),
    // we keep the existing token. Otherwise we update to the new token.
    let finalToken = pageAccessToken.trim();
    if (existing && finalToken.endsWith('...') && finalToken.length <= 15) {
      finalToken = existing.page_access_token;
    }

    let result;
    if (existing) {
      // Update
      const { data, error: updateError } = await supabase
        .from('meta_integrations')
        .update({
          page_id: pageId.trim(),
          page_name: pageName ? pageName.trim() : '',
          page_access_token: finalToken,
          form_id: formId ? formId.trim() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select('*')
        .single();

      if (updateError) {
        console.error('Error updating meta integration:', updateError);
        throw updateError;
      }
      result = data;
    } else {
      // Insert
      const { data, error: insertError } = await supabase
        .from('meta_integrations')
        .insert([
          {
            org_id: user.orgId,
            page_id: pageId.trim(),
            page_name: pageName ? pageName.trim() : '',
            page_access_token: finalToken,
            form_id: formId ? formId.trim() : null
          }
        ])
        .select('*')
        .single();

      if (insertError) {
        console.error('Error inserting meta integration:', insertError);
        throw insertError;
      }
      result = data;
    }

    // Mask page access token for response
    const maskedResult = {
      ...result,
      page_access_token: result.page_access_token ? `${result.page_access_token.substring(0, 8)}...` : ''
    };

    return NextResponse.json({
      success: true,
      message: 'Meta integration settings saved successfully.',
      config: maskedResult
    });
  } catch (err) {
    console.error('POST meta-settings error:', err);
    return NextResponse.json({ error: 'Internal server error.', details: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/settings/meta
 * Deletes Meta integration settings for the organization (restricted to owner role).
 */
export async function DELETE(req) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (user.role !== 'owner') {
      return NextResponse.json({ error: 'Only organization owners can delete integrations.' }, { status: 403 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database client not initialized.' }, { status: 500 });
    }

    const { error } = await supabase
      .from('meta_integrations')
      .delete()
      .eq('org_id', user.orgId);

    if (error) {
      console.error('Error deleting meta integration:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Meta integration configuration removed successfully.'
    });
  } catch (err) {
    console.error('DELETE meta-settings error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
