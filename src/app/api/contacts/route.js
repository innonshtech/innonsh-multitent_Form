import connectToDatabase from '@/lib/db';
import Contact from '@/lib/models/Contact';
import User from '@/lib/models/User';
import ClientOrganization from '@/lib/models/ClientOrganization';
import { supabase } from '@/lib/supabaseClient';
import { mapContactToFrontend } from '@/lib/dbMapper';
import { getUserFromRequest, checkModuleAccess } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET /api/contacts - Retrieve customer contacts lists with strict role permissions
export async function GET(req) {
  try {
    const decodedUser = getUserFromRequest(req);

    if (!decodedUser) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    if (!checkModuleAccess(decodedUser, 'contacts')) {
      return NextResponse.json(
        { error: '🔒 This module is not enabled for your organization. Please upgrade your subscription.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const assignedToFilter = searchParams.get('assignedTo') || '';
    const status = searchParams.get('status') || '';

    let contacts = [];

    // 1. DYNAMIC DATABASE DETECTOR
    if (supabase) {
      let queryBuilder = supabase
        .from('contacts')
        .select('*, users(id, name, email, role), client_organizations(*)');

      // STRICT MULTI-TENANT ISOLATION
      if (decodedUser.orgId) {
        queryBuilder = queryBuilder.eq('org_id', decodedUser.orgId);
      }

      // STICT ROLE-BASED ACCESS CONTROL (RBAC) SECURITY ENFORCEMENT
      if (decodedUser.role === 'sales_rep') {
        queryBuilder = queryBuilder.eq('assigned_to', decodedUser.id);
      } else if (assignedToFilter) {
        queryBuilder = queryBuilder.eq('assigned_to', assignedToFilter);
      }

      if (status) {
        queryBuilder = queryBuilder.eq('status', status);
      }

      if (search) {
        const s = `%${search}%`;
        queryBuilder = queryBuilder.or(
          `first_name.ilike.${s},last_name.ilike.${s},company.ilike.${s},email.ilike.${s},phone.ilike.${s},city.ilike.${s}`
        );
      }

      const { data, error } = await queryBuilder.order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch contacts error:', error);
        throw error;
      }

      contacts = (data || []).map(mapContactToFrontend);

    } else {
      // Fallback to MongoDB
      await connectToDatabase();
      let query = {};

      if (decodedUser.role === 'sales_rep') {
        query.assignedTo = decodedUser.id;
      } else if (assignedToFilter) {
        query.assignedTo = assignedToFilter;
      }

      if (status) {
        query.status = status;
      }

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { company: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { city: searchRegex }
        ];
      }

      const mongoContacts = await Contact.find(query)
        .populate('assignedTo', 'name email role')
        .populate('organizationId')
        .sort({ createdAt: -1 });

      contacts = mongoContacts;
    }

    return NextResponse.json({
      success: true,
      contacts
    });
  } catch (error) {
    console.error('Fetch contacts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching contacts.' },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Manually create a permanent customer contact record
export async function POST(req) {
  try {
    const decodedUser = getUserFromRequest(req);

    if (!decodedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkModuleAccess(decodedUser, 'contacts')) {
      return NextResponse.json(
        { error: '🔒 This module is not enabled for your organization. Please upgrade your subscription.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      company,
      designation,
      email,
      phone,
      whatsapp,
      city,
      state,
      country,
      assignedTo,
      organizationId,
      status,
      customData
    } = body;

    // Validation
    if (!firstName || !firstName.trim()) {
      return NextResponse.json({ error: 'First Name is a required field.' }, { status: 400 });
    }

    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const cleanPhone = phone ? phone.trim() : '';

    let targetAssignee = decodedUser.id;
    if (decodedUser.role !== 'sales_rep' && assignedTo) {
      targetAssignee = assignedTo;
    }

    let finalContact = null;

    // 1. DYNAMIC DATABASE DETECTOR
    if (supabase) {
      // Duplicate checks
      if (cleanEmail) {
        const { data: existingEmail } = await supabase
          .from('contacts')
          .select('id')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (existingEmail) {
          return NextResponse.json(
            { error: 'Duplicate Protection Check: A customer contact record with this Email already exists.' },
            { status: 400 }
          );
        }
      }

      if (cleanPhone) {
        const { data: existingPhone } = await supabase
          .from('contacts')
          .select('id')
          .eq('phone', cleanPhone)
          .maybeSingle();

        if (existingPhone) {
          return NextResponse.json(
            { error: 'Duplicate Protection Check: A customer contact record with this Phone number already exists.' },
            { status: 400 }
          );
        }
      }

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
                city: city || '',
                state: state || '',
                country: country || 'India',
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
      const { data: newContact, error: insertError } = await supabase
        .from('contacts')
        .insert([
          {
            first_name: firstName.trim(),
            last_name: lastName || '',
            company: company || '',
            designation: designation || '',
            email: cleanEmail,
            phone: cleanPhone,
            whatsapp: whatsapp || '',
            city: city || '',
            state: state || '',
            country: country || 'India',
            organization_id: finalOrgId || null,
            assigned_to: targetAssignee,
            status: status || 'Active',
            org_id: decodedUser.orgId,
            custom_data: customData || {}
          }
        ])
        .select('*')
        .single();

      if (insertError) {
        console.error('Supabase create contact error:', insertError);
        throw insertError;
      }

      // Fresh fetch to fetch user join details and client organization
      const { data: refreshedContact } = await supabase
        .from('contacts')
        .select('*, users(id, name, email, role), client_organizations(*)')
        .eq('id', newContact.id)
        .single();

      finalContact = mapContactToFrontend(refreshedContact);

    } else {
      // Fallback to MongoDB
      await connectToDatabase();

      if (cleanEmail) {
        const existingEmail = await Contact.findOne({ email: cleanEmail });
        if (existingEmail) {
          return NextResponse.json(
            { error: 'Duplicate Protection Check: A customer contact record with this Email already exists.' },
            { status: 400 }
          );
        }
      }

      if (cleanPhone) {
        const existingPhone = await Contact.findOne({ phone: cleanPhone });
        if (existingPhone) {
          return NextResponse.json(
            { error: 'Duplicate Protection Check: A customer contact record with this Phone number already exists.' },
            { status: 400 }
          );
        }
      }

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
            city: city || '',
            state: state || '',
            country: country || 'India',
            assignedTo: targetAssignee,
            customData: {}
          });
          finalOrgId = newOrg._id;
        }
      }

      const mongoContact = await Contact.create({
        firstName: firstName.trim(),
        lastName: lastName || '',
        company: company || '',
        designation: designation || '',
        email: cleanEmail,
        phone: cleanPhone,
        whatsapp: whatsapp || '',
        city: city || '',
        state: state || '',
        country: country || 'India',
        organizationId: finalOrgId || null,
        assignedTo: targetAssignee,
        status: status || 'Active'
      });

      finalContact = await Contact.findById(mongoContact._id)
        .populate('organizationId')
        .populate('assignedTo', 'name email role');
    }

    return NextResponse.json({
      success: true,
      message: 'Permanent customer contact record created successfully!',
      contact: finalContact
    }, { status: 201 });
  } catch (error) {
    console.error('Create contact error:', error);
    return NextResponse.json(
      { error: 'Internal server error while creating contact.', details: error.message },
      { status: 500 }
    );
  }
}
