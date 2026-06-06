import connectToDatabase from '@/lib/db';
import ClientOrganization from '@/lib/models/ClientOrganization';
import { supabase } from '@/lib/supabaseClient';
import { mapClientOrgToFrontend } from '@/lib/dbMapper';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET /api/client-organizations - List client organizations
export async function GET(req) {
  try {
    const decodedUser = getUserFromRequest(req);

    if (!decodedUser) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const assignedToFilter = searchParams.get('assignedTo') || '';

    let orgs = [];

    // 1. DYNAMIC DATABASE DETECTOR
    if (supabase) {
      let queryBuilder = supabase
        .from('client_organizations')
        .select('*, users(id, name, email, role)');

      // STRICT MULTI-TENANT ISOLATION
      if (decodedUser.orgId) {
        queryBuilder = queryBuilder.eq('org_id', decodedUser.orgId);
      }

      // STRICT ROLE-BASED ACCESS CONTROL (RBAC) SECURITY ENFORCEMENT
      if (decodedUser.role === 'sales_rep') {
        queryBuilder = queryBuilder.eq('assigned_to', decodedUser.id);
      } else if (assignedToFilter) {
        queryBuilder = queryBuilder.eq('assigned_to', assignedToFilter);
      }

      if (search) {
        const s = `%${search}%`;
        queryBuilder = queryBuilder.or(
          `name.ilike.${s},website.ilike.${s},industry.ilike.${s},email.ilike.${s},phone.ilike.${s},city.ilike.${s}`
        );
      }

      const { data, error } = await queryBuilder.order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch client organizations error:', error);
        throw error;
      }

      orgs = (data || []).map(mapClientOrgToFrontend);

    } else {
      // Fallback to MongoDB
      await connectToDatabase();
      let query = {};

      if (decodedUser.orgId) {
        query.orgId = decodedUser.orgId;
      }

      if (decodedUser.role === 'sales_rep') {
        query.assignedTo = decodedUser.id;
      } else if (assignedToFilter) {
        query.assignedTo = assignedToFilter;
      }

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { name: searchRegex },
          { website: searchRegex },
          { industry: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { city: searchRegex }
        ];
      }

      const mongoOrgs = await ClientOrganization.find(query)
        .populate('assignedTo', 'name email role')
        .sort({ createdAt: -1 });

      orgs = mongoOrgs;
    }

    return NextResponse.json({
      success: true,
      organizations: orgs
    });
  } catch (error) {
    console.error('Fetch client organizations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching client organizations.' },
      { status: 500 }
    );
  }
}

// POST /api/client-organizations - Manually create a new client organization
export async function POST(req) {
  try {
    const decodedUser = getUserFromRequest(req);

    if (!decodedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      website,
      industry,
      phone,
      email,
      city,
      state,
      country,
      assignedTo,
      customData
    } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Organization Name is a required field.' }, { status: 400 });
    }

    const companyName = name.trim();
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const cleanPhone = phone ? phone.trim() : '';

    let targetAssignee = decodedUser.id;
    if (decodedUser.role !== 'sales_rep' && assignedTo) {
      targetAssignee = assignedTo;
    }

    let finalOrg = null;

    // 1. DYNAMIC DATABASE DETECTOR
    if (supabase) {
      // Duplicate protection check
      const { data: existingOrg } = await supabase
        .from('client_organizations')
        .select('id')
        .eq('org_id', decodedUser.orgId)
        .ilike('name', companyName)
        .maybeSingle();

      if (existingOrg) {
        return NextResponse.json(
          { error: 'Duplicate Warning: A client organization with this name already exists in your account.' },
          { status: 400 }
        );
      }

      // Insert into Supabase
      const { data: newOrg, error: insertError } = await supabase
        .from('client_organizations')
        .insert([
          {
            org_id: decodedUser.orgId,
            name: companyName,
            website: website || '',
            industry: industry || '',
            phone: cleanPhone,
            email: cleanEmail,
            city: city || '',
            state: state || '',
            country: country || 'India',
            assigned_to: targetAssignee,
            custom_data: customData || {}
          }
        ])
        .select('*')
        .single();

      if (insertError) {
        console.error('Supabase create client organization error:', insertError);
        throw insertError;
      }

      // Fetch with user details joined
      const { data: refreshedOrg } = await supabase
        .from('client_organizations')
        .select('*, users(id, name, email, role)')
        .eq('id', newOrg.id)
        .single();

      finalOrg = mapClientOrgToFrontend(refreshedOrg);

    } else {
      // Fallback to MongoDB
      await connectToDatabase();

      // Duplicate protection check
      const existingOrg = await ClientOrganization.findOne({
        orgId: decodedUser.orgId,
        name: { $regex: new RegExp(`^${companyName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
      });

      if (existingOrg) {
        return NextResponse.json(
          { error: 'Duplicate Warning: A client organization with this name already exists in your account.' },
          { status: 400 }
        );
      }

      const mongoOrg = await ClientOrganization.create({
        orgId: decodedUser.orgId,
        name: companyName,
        website: website || '',
        industry: industry || '',
        phone: cleanPhone,
        email: cleanEmail,
        city: city || '',
        state: state || '',
        country: country || 'India',
        assignedTo: targetAssignee,
        customData: customData || {}
      });

      finalOrg = mongoOrg;
    }

    return NextResponse.json({
      success: true,
      message: 'Client organization record created successfully!',
      organization: finalOrg
    }, { status: 201 });
  } catch (error) {
    console.error('Create client organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error while creating client organization.', details: error.message },
      { status: 500 }
    );
  }
}
