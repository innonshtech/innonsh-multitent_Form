import connectToDatabase from '@/lib/db';
import Lead from '@/lib/models/Lead';
import User from '@/lib/models/User';
import Task from '@/lib/models/Task';
import { supabase } from '@/lib/supabaseClient';
import { mapLeadToFrontend } from '@/lib/dbMapper';
import { getUserFromRequest, checkModuleAccess } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET /api/leads - Fetch lead list with strict role-based access control & dynamic filters
export async function GET(req) {
  try {
    const decodedUser = getUserFromRequest(req);

    if (!decodedUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to access leads.' },
        { status: 401 }
      );
    }

    if (!checkModuleAccess(decodedUser, 'leads')) {
      return NextResponse.json(
        { error: '🔒 This module is not enabled for your organization. Please upgrade your subscription.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const source = searchParams.get('source') || '';
    const priority = searchParams.get('priority') || '';
    const assignedToFilter = searchParams.get('assignedTo') || '';
    const sortBy = searchParams.get('sortBy') || 'newest';

    let leads = [];

    // 1. DYNAMIC DATABASE DETECTOR
    if (supabase) {
      // Query Supabase
      let queryBuilder = supabase
        .from('leads')
        .select('*, assignee:users!assigned_to(id, name, email), creator:users!created_by(id, name, email, role), lead_notes(*), lead_attachments(*)');

      // STRICT MULTI-TENANT ISOLATION
      if (decodedUser.orgId) {
        queryBuilder = queryBuilder.eq('org_id', decodedUser.orgId);
      }

      // STICT ROLE-BASED ACCESS CONTROL (Leads Isolation)
      let rolesPermissions = {};
      if (decodedUser.orgId) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('roles_permissions')
          .eq('id', decodedUser.orgId)
          .maybeSingle();
        if (orgData && orgData.roles_permissions) {
          rolesPermissions = orgData.roles_permissions;
        }
      }

      const defaultReadScopes = {
        owner: 'Global',
        sales_admin: 'Global',
        sales_rep: 'Assigned Only'
      };

      const userRole = decodedUser.role;
      const rolePerms = rolesPermissions[userRole] || [];
      const leadsPerm = Array.isArray(rolePerms) 
        ? rolePerms.find(p => p.module === 'Leads Directory')
        : rolePerms['Leads Directory'];
      
      const readScope = leadsPerm ? leadsPerm.read : defaultReadScopes[userRole] || 'Assigned Only';

      if (readScope === 'Global') {
        if (assignedToFilter) {
          if (assignedToFilter === 'all') {
            queryBuilder = queryBuilder.is('assigned_to', null);
          } else {
            queryBuilder = queryBuilder.eq('assigned_to', assignedToFilter);
          }
        }
      } else if (readScope === 'No') {
        return NextResponse.json({ success: true, leads: [] });
      } else if (readScope === 'Team List only') {
        queryBuilder = queryBuilder.or(`created_by.eq.${decodedUser.id},assigned_to.eq.${decodedUser.id},created_by_role.eq.sales_rep,created_by_role.eq.sales_admin,created_by.is.null,is_public.eq.true`);
      } else {
        // Assigned Only or Personal Only
        queryBuilder = queryBuilder.or(`created_by.eq.${decodedUser.id},assigned_to.eq.${decodedUser.id},and(created_by.is.null,assigned_to.is.null),is_public.eq.true`);
      }

      // Filters
      if (status) {
        queryBuilder = queryBuilder.eq('status', status);
      }
      if (source) {
        queryBuilder = queryBuilder.eq('source', source);
      }
      if (priority) {
        queryBuilder = queryBuilder.eq('priority', priority);
      }

      // Dynamic Search on columns
      if (search) {
        const s = `%${search}%`;
        queryBuilder = queryBuilder.or(
          `first_name.ilike.${s},last_name.ilike.${s},company.ilike.${s},email.ilike.${s},phone.ilike.${s},designation.ilike.${s},city.ilike.${s},industry.ilike.${s}`
        );
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('Supabase fetch leads error:', error);
        throw error;
      }

      // Map raw postgres rows to frontend camelCase formats
      leads = (data || []).map(mapLeadToFrontend);

      // Sort results
      if (sortBy === 'latest_communication') {
        leads.sort((a, b) => {
          const aLatest = Math.max(
            new Date(a.createdAt || 0).getTime() || 0,
            ...(a.notes || []).map((n) => new Date(n.createdAt || 0).getTime() || 0)
          );
          const bLatest = Math.max(
            new Date(b.createdAt || 0).getTime() || 0,
            ...(b.notes || []).map((n) => new Date(n.createdAt || 0).getTime() || 0)
          );
          return bLatest - aLatest;
        });
      } else {
        leads.sort((a, b) => (new Date(b.createdAt || 0).getTime() || 0) - (new Date(a.createdAt || 0).getTime() || 0));
      }

    } else {
      // Fallback to MongoDB
      await connectToDatabase();
      const query = {};

      if (decodedUser.role === 'sales_rep') {
        query.$or = [
          { createdBy: decodedUser.id },
          { assignedTo: decodedUser.id },
          { $and: [ { createdBy: null }, { assignedTo: null } ] },
          { isPublic: true }
        ];
      } else {
        query.$or = [
          { createdBy: decodedUser.id },
          { assignedTo: decodedUser.id },
          { createdByRole: 'sales_rep' },
          { createdByRole: 'sales_admin' },
          { createdBy: null },
          { isPublic: true }
        ];

        if (assignedToFilter) {
          if (assignedToFilter === 'all') {
            query.assignedTo = null;
          } else {
            query.assignedTo = assignedToFilter;
          }
        }
      }

      if (status) query.status = status;
      if (source) query.source = source;
      if (priority) query.priority = priority;

      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { designation: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } },
          { industry: { $regex: search, $options: 'i' } },
        ];
      }

      let mongoLeads = await Lead.find(query)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email role');

      if (sortBy === 'latest_communication') {
        mongoLeads = mongoLeads.sort((a, b) => {
          const aLatest = Math.max(
            new Date(a.createdAt || 0).getTime() || 0,
            ...(a.notes || []).map((n) => new Date(n.createdAt || 0).getTime() || 0)
          );
          const bLatest = Math.max(
            new Date(b.createdAt || 0).getTime() || 0,
            ...(b.notes || []).map((n) => new Date(n.createdAt || 0).getTime() || 0)
          );
          return bLatest - aLatest;
        });
      } else {
        mongoLeads = mongoLeads.sort((a, b) => (new Date(b.createdAt || 0).getTime() || 0) - (new Date(a.createdAt || 0).getTime() || 0));
      }

      leads = mongoLeads;
    }

    return NextResponse.json({
      success: true,
      count: leads.length,
      leads,
    });
  } catch (error) {
    console.error('Fetch leads error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching leads.' },
      { status: 500 }
    );
  }
}

// POST /api/leads - Create a new standard industrial lead with duplicate check & flow validations
export async function POST(req) {
  try {
    const decodedUser = getUserFromRequest(req);

    if (!decodedUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!checkModuleAccess(decodedUser, 'leads')) {
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
      website,
      city,
      state,
      country,
      industry,
      employeeCount,
      annualRevenue,
      priority,
      status,
      lostReason,
      source,
      requirements,
      nextFollowUpDate,
      assignedTo,
      customFields,
      interestedProduct,
      followUpType,
      isPublic,
    } = body;

    const finalIsPublic = (decodedUser.role === 'owner') ? (isPublic === true) : false;

    if (!firstName) {
      return NextResponse.json(
        { error: 'First name is required.' },
        { status: 400 }
      );
    }

    const leadStatusValue = status || 'New';

    // 1. BUSINESS RULE: Next Follow-up Date Mandatory (For Contacted, Qualified, Attempted)
    const requiredReminderStatuses = ['Contacted', 'Qualified', 'Attempted'];
    if (requiredReminderStatuses.includes(leadStatusValue) && !nextFollowUpDate) {
      return NextResponse.json(
        { error: `Validation Failure: Target Next Follow-Up Schedule is required when status is "${leadStatusValue}".` },
        { status: 400 }
      );
    }

    // 2. BUSINESS RULE: Lost Reason Mandatory
    if (leadStatusValue === 'Lost' && !lostReason) {
      return NextResponse.json(
        { error: 'Validation Failure: Lost Reason is mandatory when lead status is "Lost".' },
        { status: 400 }
      );
    }

    let finalLead = null;

    // 3. DYNAMIC DATABASE DETECTOR
    if (supabase) {
      // Duplicate checks
      if (email && email.trim()) {
        const { data: duplicateEmail } = await supabase
          .from('leads')
          .select('id')
          .eq('email', email.toLowerCase().trim())
          .maybeSingle();

        if (duplicateEmail) {
          return NextResponse.json(
            { error: `Duplicate Check Warning: A lead record with Email "${email.trim()}" already exists.` },
            { status: 400 }
          );
        }
      }

      if (phone && phone.trim()) {
        const { data: duplicatePhone } = await supabase
          .from('leads')
          .select('id')
          .eq('phone', phone.trim())
          .maybeSingle();

        if (duplicatePhone) {
          return NextResponse.json(
            { error: `Duplicate Check Warning: A lead record with Phone "${phone.trim()}" already exists.` },
            { status: 400 }
          );
        }
      }

      let finalAssignee = assignedTo || null;

      if (assignedTo === 'all') {
        finalAssignee = null;
      } else if (body.autoAssign === true && !assignedTo) {
        const { data: activeReps } = await supabase
          .from('users')
          .select('id')
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
      } else if (!finalAssignee) {
        // Default to creator
        finalAssignee = decodedUser.id;
      }

      // Check if assignee exists
      if (finalAssignee) {
        const { data: assigneeExists } = await supabase
          .from('users')
          .select('id')
          .eq('id', finalAssignee)
          .maybeSingle();

        if (!assigneeExists) {
          return NextResponse.json(
            { error: 'Assigned user does not exist.' },
            { status: 400 }
          );
        }
      }

      // Insert Lead
      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert([
          {
            first_name: firstName,
            last_name: lastName || '',
            company: company || '',
            designation: designation || '',
            email: email || '',
            phone: phone || '',
            whatsapp: whatsapp || '',
            website: website || '',
            city: city || '',
            state: state || '',
            country: country || 'India',
            industry: industry || '',
            employee_count: Number(employeeCount) || 0,
            annual_revenue: Number(annualRevenue) || 0,
            priority: priority || 'Warm',
            status: leadStatusValue,
            lost_reason: leadStatusValue === 'Lost' ? lostReason : '',
            source: source || 'Website',
            requirements: requirements || '',
            interested_product: interestedProduct || '',
            follow_up_type: followUpType || 'None',
            next_follow_up_date: nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : null,
            assigned_to: finalAssignee,
            custom_fields: customFields || [],
            custom_data: body.custom_data || {},
            org_id: decodedUser.orgId,
            created_by: decodedUser.id,
            created_by_role: decodedUser.role,
            is_public: finalIsPublic
          }
        ])
        .select('*')
        .single();

      if (insertError) {
        console.error('Supabase lead insert error:', insertError);
        throw insertError;
      }

      // Create initial timeline creation note log
      await supabase
        .from('lead_notes')
        .insert([
          {
            lead_id: newLead.id,
            text: `Lead created by ${decodedUser.name}`,
            created_by: decodedUser.id,
            created_by_name: decodedUser.name
          }
        ]);

      // Fetch freshly joined lead to match response data
      const { data: refreshedLead } = await supabase
        .from('leads')
        .select('*, assignee:users!assigned_to(id, name, email), creator:users!created_by(id, name, email, role), lead_notes(*), lead_attachments(*)')
        .eq('id', newLead.id)
        .single();

      finalLead = mapLeadToFrontend(refreshedLead);

      // Auto-create Task Reminder
      if (newLead.next_follow_up_date) {
        try {
          await supabase
            .from('tasks')
            .insert([
              {
                subject: `Follow-up Call: ${newLead.first_name} (${newLead.company})`,
                due_date: newLead.next_follow_up_date,
                priority: newLead.priority === 'Hot' ? 'High' : (newLead.priority === 'Cold' ? 'Low' : 'Medium'),
                status: 'Pending',
                assigned_to: newLead.assigned_to || decodedUser.id,
                lead_id: newLead.id
              }
            ]);
        } catch (err) {
          console.error('Failed to auto-create follow-up task on Supabase lead save:', err);
        }
      }

    } else {
      // Fallback to MongoDB
      await connectToDatabase();

      if (email && email.trim()) {
        const duplicateEmail = await Lead.findOne({ email: email.toLowerCase().trim() });
        if (duplicateEmail) {
          return NextResponse.json(
            { error: `Duplicate Check Warning: A lead record with Email "${email.trim()}" already exists.` },
            { status: 400 }
          );
        }
      }

      if (phone && phone.trim()) {
        const duplicatePhone = await Lead.findOne({ phone: phone.trim() });
        if (duplicatePhone) {
          return NextResponse.json(
            { error: `Duplicate Check Warning: A lead record with Phone "${phone.trim()}" already exists.` },
            { status: 400 }
          );
        }
      }

      const leadData = {
        firstName,
        lastName: lastName || '',
        company: company || '',
        designation: designation || '',
        email: email || '',
        phone: phone || '',
        whatsapp: whatsapp || '',
        website: website || '',
        city: city || '',
        state: state || '',
        country: country || 'India',
        industry: industry || '',
        employeeCount: Number(employeeCount) || 0,
        annualRevenue: Number(annualRevenue) || 0,
        priority: priority || 'Warm',
        status: leadStatusValue,
        lostReason: leadStatusValue === 'Lost' ? lostReason : '',
        source: source || 'Website',
        requirements: requirements || '',
        interestedProduct: interestedProduct || '',
        followUpType: followUpType || 'None',
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        customFields: customFields || [],
        notes: [],
        createdBy: decodedUser.id,
        createdByRole: decodedUser.role,
        isPublic: finalIsPublic,
      };

      let finalAssignee = assignedTo || null;

      if (assignedTo === 'all') {
        finalAssignee = null;
      } else if (body.autoAssign === true && !assignedTo) {
        const activeReps = await User.find({ role: 'sales_rep', isActive: true }).sort({ createdAt: 1 });
        if (activeReps.length > 0) {
          const lastAssignedLead = await Lead.findOne({
            assignedTo: { $in: activeReps.map(r => r._id) }
          }).sort({ createdAt: -1 });

          if (lastAssignedLead && lastAssignedLead.assignedTo) {
            const lastRepIndex = activeReps.findIndex(r => r._id.toString() === lastAssignedLead.assignedTo.toString());
            const nextRepIndex = (lastRepIndex + 1) % activeReps.length;
            finalAssignee = activeReps[nextRepIndex]._id;
          } else {
            finalAssignee = activeReps[0]._id;
          }
        }
      } else if (!finalAssignee) {
        // Default to creator
        finalAssignee = decodedUser.id;
      }

      if (finalAssignee) {
        const assigneeExists = await User.findById(finalAssignee);
        if (!assigneeExists) {
          return NextResponse.json(
            { error: 'Assigned user does not exist.' },
            { status: 400 }
          );
        }
        leadData.assignedTo = finalAssignee;
      } else {
        leadData.assignedTo = null;
      }

      leadData.notes.push({
        text: `Lead created by ${decodedUser.name}`,
        createdBy: decodedUser.id,
        createdByName: decodedUser.name,
      });

      const newLead = await Lead.create(leadData);
      finalLead = await Lead.findById(newLead._id)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email role');

      if (newLead.nextFollowUpDate) {
        try {
          await Task.create({
            subject: `Follow-up Call: ${newLead.firstName} (${newLead.company})`,
            dueDate: newLead.nextFollowUpDate,
            priority: newLead.priority === 'Hot' ? 'High' : (newLead.priority === 'Cold' ? 'Low' : 'Medium'),
            status: 'Pending',
            assignedTo: newLead.assignedTo || decodedUser.id,
            leadId: newLead._id
          });
        } catch (err) {
          console.error('Failed to auto-create follow-up task on lead save:', err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Standard industrial lead created successfully',
      lead: finalLead,
    }, { status: 201 });
  } catch (error) {
    console.error('Create lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error while creating lead.', details: error.message },
      { status: 500 }
    );
  }
}
