import connectToDatabase from '@/lib/db';
import Deal from '@/lib/models/Deal';
import ClientOrganization from '@/lib/models/ClientOrganization';
import { supabase } from '@/lib/supabaseClient';
import { mapDealToFrontend } from '@/lib/dbMapper';
import { getUserFromRequest, checkModuleAccess } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET /api/deals - Fetch deals list with role-based access control
export async function GET(req) {
  try {
    const decodedUser = getUserFromRequest(req);

    if (!decodedUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    if (!checkModuleAccess(decodedUser, 'deals')) {
      return NextResponse.json(
        { error: '🔒 This module is not enabled for your organization. Please upgrade your subscription.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const stage = searchParams.get('stage') || '';

    if (supabase) {
      let queryBuilder = supabase
        .from('deals')
        .select('*, users(id, name, email), client_organizations(*)');

      // STRICT MULTI-TENANT ISOLATION
      if (decodedUser.orgId) {
        queryBuilder = queryBuilder.eq('org_id', decodedUser.orgId);
      }

      // STRICT ROLE-BASED ACCESS CONTROL (Deals Isolation)
      if (decodedUser.role === 'sales_rep') {
        // Sales Representative can ONLY see deals assigned directly to them
        queryBuilder = queryBuilder.eq('assigned_to', decodedUser.id);
      }

      if (stage) {
        queryBuilder = queryBuilder.eq('stage', stage);
      }

      const { data, error } = await queryBuilder.order('updated_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch deals error:', error);
        throw error;
      }

      const deals = (data || []).map(mapDealToFrontend);

      return NextResponse.json({
        success: true,
        count: deals.length,
        deals,
      });

    } else {
      // Fallback to MongoDB
      await connectToDatabase();

      // 1. Build dynamic MongoDB query filters
      const query = {};

      // 2. STRICT ROLE-BASED ACCESS CONTROL (Deals Isolation)
      if (decodedUser.role === 'sales_rep') {
        // Sales Representative can ONLY see deals assigned directly to them
        query.assignedTo = decodedUser.id;
      }

      if (stage) {
        query.stage = stage;
      }

      // Fetch deals and populate assignee details
      const deals = await Deal.find(query)
        .populate('assignedTo', 'name email')
        .populate('organizationId')
        .sort({ updatedAt: -1 });

      return NextResponse.json({
        success: true,
        count: deals.length,
        deals,
      });
    }
  } catch (error) {
    console.error('Fetch deals error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching deals.' },
      { status: 500 }
    );
  }
}

// POST /api/deals - Manually create a deal card
export async function POST(req) {
  try {
    const decodedUser = getUserFromRequest(req);

    if (!decodedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkModuleAccess(decodedUser, 'deals')) {
      return NextResponse.json(
        { error: '🔒 This module is not enabled for your organization. Please upgrade your subscription.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      value,
      closingDate,
      assignedTo,
      organizationId,
      company,
      contactEmail,
      contactPhone,
      customData
    } = body;

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Deal title is a required field.' }, { status: 400 });
    }
    if (value === undefined || isNaN(Number(value))) {
      return NextResponse.json({ error: 'Deal budget value is required.' }, { status: 400 });
    }
    if (!closingDate) {
      return NextResponse.json({ error: 'Estimated closing date is required.' }, { status: 400 });
    }
    if (!company || !company.trim()) {
      return NextResponse.json({ error: 'Company name is required.' }, { status: 400 });
    }

    let targetAssignee = decodedUser.id;
    if (decodedUser.role !== 'sales_rep' && assignedTo) {
      targetAssignee = assignedTo;
    }

    let finalDeal = null;

    if (supabase) {
      // Find or create Client Organization in Supabase
      let finalOrgId = organizationId;
      if (!finalOrgId && company && company.trim()) {
        const companyName = company.trim();
        const { data: existingOrg } = await supabase
          .from('client_organizations')
          .select('id')
          .eq('org_id', decodedUser.orgId)
          .ilike('name', companyName)
          .maybeSingle();

        if (existingOrg) {
          finalOrgId = existingOrg.id;
        } else {
          const { data: newOrg } = await supabase
            .from('client_organizations')
            .insert([
              {
                org_id: decodedUser.orgId,
                name: companyName,
                assigned_to: targetAssignee,
                custom_data: {}
              }
            ])
            .select('id')
            .single();
          if (newOrg) finalOrgId = newOrg.id;
        }
      }

      // Insert into Supabase
      const { data: newDeal, error: insertError } = await supabase
        .from('deals')
        .insert([
          {
            title: title.trim(),
            value: Number(value),
            stage: 'Prospecting', // default
            closing_date: new Date(closingDate).toISOString(),
            organization_id: finalOrgId || null,
            assigned_to: targetAssignee,
            company: company.trim(),
            contact_email: contactEmail || '',
            contact_phone: contactPhone || '',
            org_id: decodedUser.orgId,
            custom_data: customData || {}
          }
        ])
        .select('*')
        .single();

      if (insertError) {
        console.error('Supabase create deal error:', insertError);
        throw insertError;
      }

      // Fresh fetch to get user join details and client organization
      const { data: refreshedDeal } = await supabase
        .from('deals')
        .select('*, users(id, name, email), client_organizations(*)')
        .eq('id', newDeal.id)
        .single();

      finalDeal = mapDealToFrontend(refreshedDeal);

    } else {
      // Fallback to MongoDB
      await connectToDatabase();

      // Find or create Client Organization in Mongoose
      let finalOrgId = organizationId;
      if (!finalOrgId && company && company.trim()) {
        const companyName = company.trim();
        let existingOrg = await ClientOrganization.findOne({
          orgId: decodedUser.orgId,
          name: { $regex: new RegExp(`^${companyName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
        });

        if (existingOrg) {
          finalOrgId = existingOrg._id;
        } else {
          const newOrg = await ClientOrganization.create({
            orgId: decodedUser.orgId,
            name: companyName,
            assignedTo: targetAssignee,
            customData: {}
          });
          finalOrgId = newOrg._id;
        }
      }

      const mongoDeal = await Deal.create({
        title: title.trim(),
        value: Number(value),
        stage: 'Prospecting',
        closingDate: new Date(closingDate),
        organizationId: finalOrgId || null,
        assignedTo: targetAssignee,
        company: company.trim(),
        contactEmail: contactEmail || '',
        contactPhone: contactPhone || '',
      });

      finalDeal = await Deal.findById(mongoDeal._id)
        .populate('organizationId')
        .populate('assignedTo', 'name email');
    }

    return NextResponse.json({
      success: true,
      message: 'Deal card created successfully!',
      deal: finalDeal
    }, { status: 201 });

  } catch (error) {
    console.error('Create deal error:', error);
    return NextResponse.json(
      { error: 'Internal server error while creating deal.', details: error.message },
      { status: 500 }
    );
  }
}


