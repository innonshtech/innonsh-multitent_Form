import connectToDatabase from '@/lib/db';
import Contact from '@/lib/models/Contact';
import ClientOrganization from '@/lib/models/ClientOrganization';
import { supabase } from '@/lib/supabaseClient';
import { mapContactToFrontend } from '@/lib/dbMapper';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

// PUT /api/contacts/[id] - Update Contact profile details
export async function PUT(req, { params }) {
  try {
    const decodedUser = getUserFromRequest(req);
    const { id } = await params;

    if (!decodedUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    // 1. DYNAMIC DATABASE DETECTOR
    if (supabase) {
      // Query Supabase
      let query = supabase.from('contacts').select('*, client_organizations(*)').eq('id', id);
      if (decodedUser.orgId) {
        query = query.eq('org_id', decodedUser.orgId);
      }
      const { data: contact, error: fetchError } = await query.maybeSingle();

      if (fetchError) {
        console.error('Supabase fetch contact details error:', fetchError);
        throw fetchError;
      }

      if (!contact) {
        return NextResponse.json({ error: 'Customer contact profile not found.' }, { status: 404 });
      }

      // SECURITY CHECK: Sales Rep can strictly only modify their own assigned contacts
      if (
        decodedUser.role === 'sales_rep' &&
        (!contact.assigned_to || contact.assigned_to !== decodedUser.id)
      ) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have permission to modify this contact.' },
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

      // Validate firstName
      if (firstName !== undefined && !firstName.trim()) {
        return NextResponse.json({ error: 'First Name is a required field.' }, { status: 400 });
      }

      // Strict Email Collision check during update
      if (email !== undefined && email.trim() !== '') {
        const cleanEmail = email.toLowerCase().trim();
        let emailQuery = supabase.from('contacts').select('id').eq('email', cleanEmail).neq('id', id);
        if (decodedUser.orgId) {
          emailQuery = emailQuery.eq('org_id', decodedUser.orgId);
        }
        const { data: existingEmail } = await emailQuery.maybeSingle();

        if (existingEmail) {
          return NextResponse.json(
            { error: 'Duplicate Warning: Another customer contact already has this Email address.' },
            { status: 400 }
          );
        }
      }

      // Strict Phone Collision check during update
      if (phone !== undefined && phone.trim() !== '') {
        const cleanPhone = phone.trim();
        let phoneQuery = supabase.from('contacts').select('id').eq('phone', cleanPhone).neq('id', id);
        if (decodedUser.orgId) {
          phoneQuery = phoneQuery.eq('org_id', decodedUser.orgId);
        }
        const { data: existingPhone } = await phoneQuery.maybeSingle();

        if (existingPhone) {
          return NextResponse.json(
            { error: 'Duplicate Warning: Another customer contact already has this Phone number.' },
            { status: 400 }
          );
        }
      }

      const updates = {};
      if (firstName !== undefined) updates.first_name = firstName.trim();
      if (lastName !== undefined) updates.last_name = lastName.trim();
      if (company !== undefined) updates.company = company.trim();
      if (designation !== undefined) updates.designation = designation.trim();
      if (email !== undefined) updates.email = email.toLowerCase().trim();
      if (phone !== undefined) updates.phone = phone.trim();
      if (whatsapp !== undefined) updates.whatsapp = whatsapp.trim();
      if (city !== undefined) updates.city = city.trim();
      if (state !== undefined) updates.state = state.trim();
      if (country !== undefined) updates.country = country.trim();
      if (status !== undefined) updates.status = status;
      if (customData !== undefined) updates.custom_data = customData;

      // Allow Admin/Manager to change assignee
      if (decodedUser.role !== 'sales_rep' && assignedTo !== undefined) {
        updates.assigned_to = assignedTo || null;
      }

      // Find or create Client Organization in Supabase if company name changed
      let finalOrgId = organizationId;
      if (finalOrgId === undefined && company !== undefined && company.trim() !== (contact.company || '')) {
        if (company.trim() === '') {
          finalOrgId = null;
        } else {
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
                  city: city !== undefined ? city.trim() : (contact.city || ''),
                  state: state !== undefined ? state.trim() : (contact.state || ''),
                  country: country !== undefined ? country.trim() : (contact.country || 'India'),
                  assigned_to: updates.assigned_to !== undefined ? updates.assigned_to : contact.assigned_to,
                  custom_data: {}
                }
              ])
              .select('id')
              .single();
            if (newOrg) finalOrgId = newOrg.id;
          }
        }
      }
      if (finalOrgId !== undefined) {
        updates.organization_id = finalOrgId;
      }

      let updateQuery = supabase.from('contacts').update(updates).eq('id', id);
      if (decodedUser.orgId) {
        updateQuery = updateQuery.eq('org_id', decodedUser.orgId);
      }
      const { data: updatedContact, error: updateError } = await updateQuery
        .select('*, users(id, name, email, role), client_organizations(*)')
        .single();

      if (updateError) {
        console.error('Supabase update contact details error:', updateError);
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        message: 'Customer Contact details updated successfully.',
        contact: mapContactToFrontend(updatedContact)
      });

    } else {
      // Fallback to MongoDB
      await connectToDatabase();

      const contact = await Contact.findById(id);

      if (!contact) {
        return NextResponse.json({ error: 'Customer contact profile not found.' }, { status: 404 });
      }

      // SECURITY CHECK: Sales Rep can strictly only modify their own assigned contacts
      if (
        decodedUser.role === 'sales_rep' &&
        (!contact.assignedTo || contact.assignedTo.toString() !== decodedUser.id)
      ) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have permission to modify this contact.' },
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
        status
      } = body;

      // Validate firstName
      if (firstName !== undefined && !firstName.trim()) {
        return NextResponse.json({ error: 'First Name is a required field.' }, { status: 400 });
      }

      // Strict Email Collision check during update
      if (email !== undefined && email.trim() !== '') {
        const existingEmail = await Contact.findOne({
          email: email.toLowerCase().trim(),
          _id: { $ne: id } // Exclude current contact
        });
        if (existingEmail) {
          return NextResponse.json(
            { error: 'Duplicate Warning: Another customer contact already has this Email address.' },
            { status: 400 }
          );
        }
      }

      // Strict Phone Collision check during update
      if (phone !== undefined && phone.trim() !== '') {
        const existingPhone = await Contact.findOne({
          phone: phone.trim(),
          _id: { $ne: id }
        });
        if (existingPhone) {
          return NextResponse.json(
            { error: 'Duplicate Warning: Another customer contact already has this Phone number.' },
            { status: 400 }
          );
        }
      }

      // Apply updates
      if (firstName !== undefined) contact.firstName = firstName.trim();
      if (lastName !== undefined) contact.lastName = lastName.trim();
      if (company !== undefined) contact.company = company.trim();
      if (designation !== undefined) contact.designation = designation.trim();
      if (email !== undefined) contact.email = email.toLowerCase().trim();
      if (phone !== undefined) contact.phone = phone.trim();
      if (whatsapp !== undefined) contact.whatsapp = whatsapp.trim();
      if (city !== undefined) contact.city = city.trim();
      if (state !== undefined) contact.state = state.trim();
      if (country !== undefined) contact.country = country.trim();
      if (status !== undefined) contact.status = status;

      // Allow Admin/Manager to change assignee
      if (decodedUser.role !== 'sales_rep' && assignedTo !== undefined) {
        contact.assignedTo = assignedTo || null;
      }

      // Find or create Client Organization in Mongoose if company name changed
      let finalOrgId = organizationId;
      if (finalOrgId === undefined && company !== undefined && company.trim() !== (contact.company || '')) {
        if (company.trim() === '') {
          finalOrgId = null;
        } else {
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
              city: city !== undefined ? city.trim() : (contact.city || ''),
              state: state !== undefined ? state.trim() : (contact.state || ''),
              country: country !== undefined ? country.trim() : (contact.country || 'India'),
              assignedTo: contact.assignedTo,
              customData: {}
            });
            finalOrgId = newOrg._id;
          }
        }
      }
      if (finalOrgId !== undefined) {
        contact.organizationId = finalOrgId;
      }

      await contact.save();

      const populatedContact = await Contact.findById(contact._id)
        .populate('organizationId')
        .populate('assignedTo', 'name email role');

      return NextResponse.json({
        success: true,
        message: 'Customer Contact details updated successfully.',
        contact: populatedContact
      });
    }
  } catch (error) {
    console.error('Update contact details error:', error);
    return NextResponse.json(
      { error: 'Internal server error while updating contact details.' },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[id] - Permanently delete customer contact profile (Role bounded: Admins/Owners only)
export async function DELETE(req, { params }) {
  try {
    const decodedUser = getUserFromRequest(req);
    const { id } = await params;

    if (!decodedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admins/Owners only are authorized to permanently purge contact databases
    if (decodedUser.role !== 'owner' && decodedUser.role !== 'sales_admin') {
      return NextResponse.json(
        { error: 'Forbidden. Only Owners or Sales Administrators can delete permanent customer records.' },
        { status: 403 }
      );
    }

    if (supabase) {
      let query = supabase.from('contacts').select('*').eq('id', id);
      if (decodedUser.orgId) {
        query = query.eq('org_id', decodedUser.orgId);
      }
      const { data: contact, error: fetchError } = await query.maybeSingle();

      if (fetchError) {
        console.error('Supabase delete fetch error:', fetchError);
        throw fetchError;
      }

      if (!contact) {
        return NextResponse.json({ error: 'Customer contact profile not found.' }, { status: 404 });
      }

      let deleteQuery = supabase.from('contacts').delete().eq('id', id);
      if (decodedUser.orgId) {
        deleteQuery = deleteQuery.eq('org_id', decodedUser.orgId);
      }
      const { error: deleteError } = await deleteQuery;

      if (deleteError) {
        console.error('Supabase delete contact error:', deleteError);
        throw deleteError;
      }

      return NextResponse.json({
        success: true,
        message: 'Permanent customer contact record deleted successfully.'
      });

    } else {
      await connectToDatabase();

      const deletedContact = await Contact.findByIdAndDelete(id);

      if (!deletedContact) {
        return NextResponse.json({ error: 'Customer contact profile not found.' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Permanent customer contact record deleted successfully.'
      });
    }
  } catch (error) {
    console.error('Delete contact profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error while deleting contact profile.' },
      { status: 500 }
    );
  }
}

