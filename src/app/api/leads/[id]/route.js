import connectToDatabase from '@/lib/db';
import Lead from '@/lib/models/Lead';
import User from '@/lib/models/User';
import Task from '@/lib/models/Task';
import { supabase } from '@/lib/supabaseClient';
import { mapLeadToFrontend } from '@/lib/dbMapper';
import { getUserFromRequest, checkLeadVisibility, checkLeadEditPermission } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET /api/leads/[id] - Fetch single lead details with validation
export async function GET(req, { params }) {
  try {
    const decodedUser = getUserFromRequest(req);
    const { id } = await params;

    if (!decodedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let rolesPermissions = {};
    if (supabase && decodedUser.orgId) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('roles_permissions')
        .eq('id', decodedUser.orgId)
        .maybeSingle();
      if (orgData && orgData.roles_permissions) {
        rolesPermissions = orgData.roles_permissions;
      }
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('leads')
        .select('*, assignee:users!assigned_to(id, name, email), creator:users!created_by(id, name, email, role), lead_notes(*), lead_attachments(*)')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Supabase fetch single lead error:', error);
        throw error;
      }

      if (!data) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
      }

      // SECURITY CHECK: Role-based visibility rules
      if (!checkLeadVisibility(data, decodedUser, rolesPermissions)) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have permission to view this lead.' },
          { status: 403 }
        );
      }

      return NextResponse.json({ success: true, lead: mapLeadToFrontend(data) });
    } else {
      await connectToDatabase();

      const lead = await Lead.findById(id)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email role');

      if (!lead) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
      }

      // SECURITY CHECK: Role-based visibility rules
      if (!checkLeadVisibility(lead, decodedUser)) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have permission to view this lead.' },
          { status: 403 }
        );
      }

      return NextResponse.json({ success: true, lead });
    }
  } catch (error) {
    console.error('Fetch single lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching lead.' },
      { status: 500 }
    );
  }
}

// PUT /api/leads/[id] - Update lead details with assignment rules, duplicate checks and auto-auditing
export async function PUT(req, { params }) {
  try {
    const decodedUser = getUserFromRequest(req);
    const { id } = await params;

    if (!decodedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let rolesPermissions = {};
    if (supabase && decodedUser.orgId) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('roles_permissions')
        .eq('id', decodedUser.orgId)
        .maybeSingle();
      if (orgData && orgData.roles_permissions) {
        rolesPermissions = orgData.roles_permissions;
      }
    }

    if (supabase) {
      const { data: existingLead, error: fetchError } = await supabase
        .from('leads')
        .select('*, assignee:users!assigned_to(id, name, email), creator:users!created_by(id, name, email, role)')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        console.error('Supabase PUT fetch lead error:', fetchError);
        throw fetchError;
      }

      if (!existingLead) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
      }

      // SECURITY CHECK: Role-based edit permission check
      if (!checkLeadEditPermission(existingLead, decodedUser, rolesPermissions)) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have permission to edit this lead.' },
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
        whatsappContacted,
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
        interestedProduct,
        followUpType,
        nextFollowUpDate,
        assignedTo,
        customFields,
        isPublic,
      } = body;

      // Apply basic validations
      if (firstName !== undefined && !firstName) {
        return NextResponse.json({ error: 'First name cannot be empty.' }, { status: 400 });
      }
      if (company !== undefined && !company) {
        return NextResponse.json({ error: 'Company name cannot be empty.' }, { status: 400 });
      }

      // 1. BUSINESS RULE: Duplicate Check on updates
      if (email !== undefined && email.trim() && email.toLowerCase().trim() !== existingLead.email) {
        const { data: duplicateEmail } = await supabase
          .from('leads')
          .select('id')
          .eq('email', email.toLowerCase().trim())
          .neq('id', id)
          .maybeSingle();

        if (duplicateEmail) {
          return NextResponse.json(
            { error: `Duplicate Check Warning: Another lead record with Email "${email.trim()}" already exists.` },
            { status: 400 }
          );
        }
      }

      if (phone !== undefined && phone.trim() && phone.trim() !== existingLead.phone) {
        const { data: duplicatePhone } = await supabase
          .from('leads')
          .select('id')
          .eq('phone', phone.trim())
          .neq('id', id)
          .maybeSingle();

        if (duplicatePhone) {
          return NextResponse.json(
            { error: `Duplicate Check Warning: Another lead record with Phone "${phone.trim()}" already exists.` },
            { status: 400 }
          );
        }
      }

      // Target status to evaluate for validations
      const targetStatus = status !== undefined ? status : existingLead.status;
      const targetFollowUpDate = nextFollowUpDate !== undefined ? nextFollowUpDate : existingLead.next_follow_up_date;

      // 2. BUSINESS RULE: Next Follow-up Date Mandatory (For Contacted, Qualified, Attempted)
      const requiredReminderStatuses = ['Contacted', 'Qualified', 'Attempted'];
      if (requiredReminderStatuses.includes(targetStatus) && !targetFollowUpDate) {
        return NextResponse.json(
          { error: `Validation Failure: Target Next Follow-Up Schedule is required when status is "${targetStatus}".` },
          { status: 400 }
        );
      }

      // 3. BUSINESS RULE: Lost Reason Mandatory
      const targetLostReason = lostReason !== undefined ? lostReason : existingLead.lost_reason;
      if (targetStatus === 'Lost' && !targetLostReason) {
        return NextResponse.json(
          { error: 'Validation Failure: Lost Reason is mandatory when lead status is "Lost".' },
          { status: 400 }
        );
      }

      // 4. BUSINESS RULE: Re-assignment check
      let finalAssignee = existingLead.assigned_to;
      if (assignedTo !== undefined) {
        // Sales representatives are allowed to assign leads under updated rules

        if (assignedTo === 'all') {
          finalAssignee = null;
        } else if (assignedTo) {
          const { data: assigneeExists } = await supabase
            .from('users')
            .select('id')
            .eq('id', assignedTo)
            .maybeSingle();

          if (!assigneeExists) {
            return NextResponse.json({ error: 'Assigned user does not exist.' }, { status: 400 });
          }
          finalAssignee = assignedTo;
        } else {
          finalAssignee = null;
        }
      }

      // 5. BUSINESS RULE: Automated State Change Log (Audit note)
      if (status !== undefined && status !== existingLead.status) {
        await supabase.from('lead_notes').insert([
          {
            lead_id: id,
            text: `System Status update: Lead status changed from "${existingLead.status}" to "${status}" by ${decodedUser.name}`,
            created_by: decodedUser.id,
            created_by_name: decodedUser.name,
          }
        ]);
      }

      // 6. BUSINESS RULE: Auto Audit Log for WhatsApp Click Tracking
      if (whatsappContacted === true && existingLead.whatsapp_contacted !== true) {
        await supabase.from('lead_notes').insert([
          {
            lead_id: id,
            text: `Outreach initiated via WhatsApp by ${decodedUser.name}`,
            created_by: decodedUser.id,
            created_by_name: decodedUser.name,
          }
        ]);
      }

      // Prepare updates
      const updates = {};
      if (firstName !== undefined) updates.first_name = firstName;
      if (lastName !== undefined) updates.last_name = lastName;
      if (company !== undefined) updates.company = company;
      if (designation !== undefined) updates.designation = designation;
      if (email !== undefined) updates.email = email.toLowerCase().trim();
      if (phone !== undefined) updates.phone = phone.trim();
      if (whatsapp !== undefined) updates.whatsapp = whatsapp.trim();
      if (whatsappContacted !== undefined) updates.whatsapp_contacted = whatsappContacted;
      if (website !== undefined) updates.website = website.trim();
      if (city !== undefined) updates.city = city;
      if (state !== undefined) updates.state = state;
      if (country !== undefined) updates.country = country;
      if (industry !== undefined) updates.industry = industry;
      if (employeeCount !== undefined) updates.employee_count = Number(employeeCount) || 0;
      if (annualRevenue !== undefined) updates.annual_revenue = Number(annualRevenue) || 0;
      if (priority !== undefined) updates.priority = priority;
      if (requirements !== undefined) updates.requirements = requirements;
      if (interestedProduct !== undefined) updates.interested_product = interestedProduct;
      if (followUpType !== undefined) updates.follow_up_type = followUpType;
      if (customFields !== undefined) updates.custom_fields = customFields;
      if (body.custom_data !== undefined) updates.custom_data = body.custom_data;
      if (nextFollowUpDate !== undefined) {
        updates.next_follow_up_date = nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : null;
      }
      updates.status = targetStatus;
      updates.lost_reason = targetStatus === 'Lost' ? targetLostReason : '';
      updates.assigned_to = finalAssignee;

      if (isPublic !== undefined) {
        if (decodedUser.role === 'owner') {
          updates.is_public = isPublic === true;
        }
      }

      const { data: updatedLead, error: updateError } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (updateError) {
        console.error('Supabase update lead error:', updateError);
        throw updateError;
      }

      // AUTO-TASK REMINDER SYNC FOR UPDATES
      if (nextFollowUpDate !== undefined && nextFollowUpDate) {
        try {
          const { data: existingTask } = await supabase
            .from('tasks')
            .select('id')
            .eq('lead_id', id)
            .eq('status', 'Pending')
            .maybeSingle();

          if (existingTask) {
            await supabase
              .from('tasks')
              .update({
                due_date: new Date(nextFollowUpDate).toISOString(),
                subject: `Follow-up Call: ${firstName || existingLead.first_name} (${company || existingLead.company})`,
                priority: (priority || existingLead.priority) === 'Hot' ? 'High' : ((priority || existingLead.priority) === 'Cold' ? 'Low' : 'Medium'),
                assigned_to: finalAssignee || decodedUser.id
              })
              .eq('id', existingTask.id);
          } else {
            await supabase
              .from('tasks')
              .insert([
                {
                  subject: `Follow-up Call: ${firstName || existingLead.first_name} (${company || existingLead.company})`,
                  due_date: new Date(nextFollowUpDate).toISOString(),
                  priority: (priority || existingLead.priority) === 'Hot' ? 'High' : ((priority || existingLead.priority) === 'Cold' ? 'Low' : 'Medium'),
                  status: 'Pending',
                  assigned_to: finalAssignee || decodedUser.id,
                  lead_id: id,
                  org_id: decodedUser.orgId
                }
              ]);
          }
        } catch (err) {
          console.error('Failed to sync follow-up task on lead edit:', err);
        }
      }

      // Also sync assignee for all other pending tasks if the lead's assignee changed
      if (assignedTo !== undefined) {
        try {
          await supabase
            .from('tasks')
            .update({ assigned_to: finalAssignee || decodedUser.id })
            .eq('lead_id', id)
            .eq('status', 'Pending');
        } catch (err) {
          console.error('Failed to sync tasks assignee on lead edit:', err);
        }
      }

      // Fetch populated fresh document to return to client
      const { data: refreshedLead, error: refreshError } = await supabase
        .from('leads')
        .select('*, assignee:users!assigned_to(id, name, email), creator:users!created_by(id, name, email, role), lead_notes(*), lead_attachments(*)')
        .eq('id', id)
        .single();

      if (refreshError) {
        console.error('Supabase refresh lead error:', refreshError);
        throw refreshError;
      }

      return NextResponse.json({
        success: true,
        message: 'Lead updated successfully',
        lead: mapLeadToFrontend(refreshedLead),
      });

    } else {
      await connectToDatabase();

      const lead = await Lead.findById(id).populate('createdBy', 'name email role');

      if (!lead) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
      }

      // SECURITY CHECK: Role-based edit permission check
      if (!checkLeadEditPermission(lead, decodedUser)) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have permission to edit this lead.' },
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
        whatsappContacted,
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
        interestedProduct,
        followUpType,
        nextFollowUpDate,
        assignedTo,
        customFields,
        isPublic,
      } = body;

      // Apply basic validations
      if (firstName !== undefined && !firstName) {
        return NextResponse.json({ error: 'First name cannot be empty.' }, { status: 400 });
      }
      if (company !== undefined && !company) {
        return NextResponse.json({ error: 'Company name cannot be empty.' }, { status: 400 });
      }

      // 1. BUSINESS RULE: Duplicate Check on updates
      if (email !== undefined && email.trim() && email.toLowerCase().trim() !== lead.email) {
        const duplicateEmail = await Lead.findOne({ email: email.toLowerCase().trim(), _id: { $ne: id } });
        if (duplicateEmail) {
          return NextResponse.json(
            { error: `Duplicate Check Warning: Another lead record with Email "${email.trim()}" already exists.` },
            { status: 400 }
          );
        }
      }

      if (phone !== undefined && phone.trim() && phone.trim() !== lead.phone) {
        const duplicatePhone = await Lead.findOne({ phone: phone.trim(), _id: { $ne: id } });
        if (duplicatePhone) {
          return NextResponse.json(
            { error: `Duplicate Check Warning: Another lead record with Phone "${phone.trim()}" already exists.` },
            { status: 400 }
          );
        }
      }

      // Target status to evaluate for validations
      const targetStatus = status !== undefined ? status : lead.status;
      const targetFollowUpDate = nextFollowUpDate !== undefined ? nextFollowUpDate : lead.nextFollowUpDate;

      // 2. BUSINESS RULE: Next Follow-up Date Mandatory (For Contacted, Qualified, Attempted)
      const requiredReminderStatuses = ['Contacted', 'Qualified', 'Attempted'];
      if (requiredReminderStatuses.includes(targetStatus) && !targetFollowUpDate) {
        return NextResponse.json(
          { error: `Validation Failure: Target Next Follow-Up Schedule is required when status is "${targetStatus}".` },
          { status: 400 }
        );
      }

      // 3. BUSINESS RULE: Lost Reason Mandatory
      const targetLostReason = lostReason !== undefined ? lostReason : lead.lostReason;
      if (targetStatus === 'Lost' && !targetLostReason) {
        return NextResponse.json(
          { error: 'Validation Failure: Lost Reason is mandatory when lead status is "Lost".' },
          { status: 400 }
        );
      }

      // 4. BUSINESS RULE: Automated State Change Log (Audit note)
      if (status !== undefined && status !== lead.status) {
        lead.notes.push({
          text: `System Status update: Lead status changed from "${lead.status}" to "${status}" by ${decodedUser.name}`,
          createdBy: decodedUser.id,
          createdByName: decodedUser.name,
        });
        lead.status = status;
      }

      // 5. BUSINESS RULE: Auto Audit Log for WhatsApp Click Tracking
      if (whatsappContacted === true && lead.whatsappContacted !== true) {
        lead.notes.push({
          text: `Outreach initiated via WhatsApp by ${decodedUser.name}`,
          createdBy: decodedUser.id,
          createdByName: decodedUser.name,
        });
        lead.whatsappContacted = true;
      }

      // Apply rest of updates
      if (firstName !== undefined) lead.firstName = firstName;
      if (lastName !== undefined) lead.lastName = lastName;
      if (company !== undefined) lead.company = company;
      if (designation !== undefined) lead.designation = designation;
      if (email !== undefined) lead.email = email.toLowerCase().trim();
      if (phone !== undefined) lead.phone = phone.trim();
      if (whatsapp !== undefined) lead.whatsapp = whatsapp.trim();
      if (website !== undefined) lead.website = website.trim();
      if (city !== undefined) lead.city = city;
      if (state !== undefined) lead.state = state;
      if (country !== undefined) lead.country = country;
      if (industry !== undefined) lead.industry = industry;
      if (employeeCount !== undefined) lead.employeeCount = Number(employeeCount) || 0;
      if (annualRevenue !== undefined) lead.annualRevenue = Number(annualRevenue) || 0;
      if (priority !== undefined) lead.priority = priority;
      if (requirements !== undefined) lead.requirements = requirements;
      if (interestedProduct !== undefined) lead.interestedProduct = interestedProduct;
      if (followUpType !== undefined) lead.followUpType = followUpType;
      if (customFields !== undefined) lead.customFields = customFields;

      if (nextFollowUpDate !== undefined) {
        lead.nextFollowUpDate = nextFollowUpDate ? new Date(nextFollowUpDate) : null;
      }

      if (targetStatus === 'Lost') {
        lead.lostReason = targetLostReason;
      } else {
        lead.lostReason = '';
      }

      // SECURITY CHECK ON RE-ASSIGNMENT:
      if (assignedTo !== undefined) {
        // Sales representatives are allowed to assign leads under updated rules

        if (assignedTo === 'all') {
          lead.assignedTo = null;
        } else if (assignedTo) {
          const assigneeExists = await User.findById(assignedTo);
          if (!assigneeExists) {
            return NextResponse.json({ error: 'Assigned user does not exist.' }, { status: 400 });
          }
          lead.assignedTo = assignedTo;
        } else {
          lead.assignedTo = null;
        }
      }

      if (isPublic !== undefined) {
        if (decodedUser.role === 'owner') {
          lead.isPublic = isPublic === true;
        }
      }

      await lead.save();

      // AUTO-TASK REMINDER SYNC FOR UPDATES
      if (nextFollowUpDate !== undefined && nextFollowUpDate) {
        try {
          const existingTask = await Task.findOne({ leadId: lead._id, status: 'Pending' });
          if (existingTask) {
            existingTask.dueDate = new Date(nextFollowUpDate);
            existingTask.subject = `Follow-up Call: ${lead.firstName} (${lead.company})`;
            existingTask.priority = lead.priority === 'Hot' ? 'High' : (lead.priority === 'Cold' ? 'Low' : 'Medium');
            existingTask.assignedTo = lead.assignedTo || decodedUser.id;
            await existingTask.save();
          } else {
            await Task.create({
              subject: `Follow-up Call: ${lead.firstName} (${lead.company})`,
              dueDate: new Date(nextFollowUpDate),
              priority: lead.priority === 'Hot' ? 'High' : (lead.priority === 'Cold' ? 'Low' : 'Medium'),
              status: 'Pending',
              assignedTo: lead.assignedTo || decodedUser.id,
              leadId: lead._id
            });
          }
        } catch (err) {
          console.error('Failed to sync follow-up task on lead edit:', err);
        }
      }

      // Also sync assignee for all other pending tasks if the lead's assignee changed
      if (assignedTo !== undefined) {
        try {
          await Task.updateMany(
            { leadId: lead._id, status: 'Pending' },
            { assignedTo: lead.assignedTo || decodedUser.id }
          );
        } catch (err) {
          console.error('Failed to sync tasks assignee on lead edit:', err);
        }
      }
      
      const updatedLead = await Lead.findById(id)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email role');

      return NextResponse.json({
        success: true,
        message: 'Lead updated successfully',
        lead: updatedLead,
      });
    }
  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error while updating lead.', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/leads/[id] - Only Owners and Sales Managers can delete
export async function DELETE(req, { params }) {
  try {
    const decodedUser = getUserFromRequest(req);
    const { id } = await params;

    if (!decodedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY CHECK: Sales representatives cannot delete leads
    if (decodedUser.role === 'sales_rep') {
      return NextResponse.json(
        { error: 'Forbidden. Sales representatives cannot delete leads. Please contact your manager.' },
        { status: 403 }
      );
    }

    let rolesPermissions = {};
    if (supabase && decodedUser.orgId) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('roles_permissions')
        .eq('id', decodedUser.orgId)
        .maybeSingle();
      if (orgData && orgData.roles_permissions) {
        rolesPermissions = orgData.roles_permissions;
      }
    }

    if (supabase) {
      const { data: lead, error: fetchError } = await supabase
        .from('leads')
        .select('id, assigned_to, created_by, created_by_role, is_public')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        console.error('Supabase fetch lead before delete error:', fetchError);
        throw fetchError;
      }

      if (!lead) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
      }

      // SECURITY CHECK: Role-based delete permission check (e.g. owner cannot delete another owner's lead they can't see)
      if (!checkLeadEditPermission(lead, decodedUser, rolesPermissions)) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have permission to delete this lead.' },
          { status: 403 }
        );
      }

      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Supabase delete lead error:', deleteError);
        throw deleteError;
      }

      return NextResponse.json({
        success: true,
        message: 'Lead deleted successfully',
      });

    } else {
      await connectToDatabase();

      const lead = await Lead.findById(id).populate('createdBy', 'name email role');
      if (!lead) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
      }

      // SECURITY CHECK: Role-based delete permission check
      if (!checkLeadEditPermission(lead, decodedUser)) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have permission to delete this lead.' },
          { status: 403 }
        );
      }

      await Lead.findByIdAndDelete(id);

      return NextResponse.json({
        success: true,
        message: 'Lead deleted successfully',
      });
    }
  } catch (error) {
    console.error('Delete lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error while deleting lead.' },
      { status: 500 }
    );
  }
}

