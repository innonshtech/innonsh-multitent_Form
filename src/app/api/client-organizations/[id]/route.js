import connectToDatabase from '@/lib/db';
import ClientOrganization from '@/lib/models/ClientOrganization';
import Contact from '@/lib/models/Contact';
import Deal from '@/lib/models/Deal';
import { supabase } from '@/lib/supabaseClient';
import { mapClientOrgToFrontend } from '@/lib/dbMapper';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET /api/client-organizations/[id] - Fetch single client organization details
export async function GET(req, { params }) {
  try {
    const decodedUser = getUserFromRequest(req);
    const { id } = await params;

    if (!decodedUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    if (supabase) {
      let query = supabase.from('client_organizations').select('*').eq('id', id);
      if (decodedUser.orgId) {
        query = query.eq('org_id', decodedUser.orgId);
      }
      const { data: org, error } = await query.maybeSingle();

      if (error) {
        console.error('Supabase fetch client organization details error:', error);
        throw error;
      }

      if (!org) {
        return NextResponse.json({ error: 'Client organization not found.' }, { status: 404 });
      }

      // SECURITY CHECK: Sales Rep can strictly only view their own assigned organizations
      if (
        decodedUser.role === 'sales_rep' &&
        org.assigned_to &&
        org.assigned_to !== decodedUser.id
      ) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have permission to view this organization.' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        organization: mapClientOrgToFrontend(org)
      });
    } else {
      await connectToDatabase();
      const org = await ClientOrganization.findById(id).populate('assignedTo', 'name email role');

      if (!org) {
        return NextResponse.json({ error: 'Client organization not found.' }, { status: 404 });
      }

      // SECURITY CHECK
      if (
        decodedUser.role === 'sales_rep' &&
        org.assignedTo &&
        org.assignedTo._id.toString() !== decodedUser.id
      ) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have permission to view this organization.' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        organization: org
      });
    }
  } catch (error) {
    console.error('Fetch client organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching client organization.' },
      { status: 500 }
    );
  }
}

// PUT /api/client-organizations/[id] - Update client organization
export async function PUT(req, { params }) {
  try {
    const decodedUser = getUserFromRequest(req);
    const { id } = await params;

    if (!decodedUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    if (supabase) {
      let query = supabase.from('client_organizations').select('*').eq('id', id);
      if (decodedUser.orgId) {
        query = query.eq('org_id', decodedUser.orgId);
      }
      const { data: org, error: fetchError } = await query.maybeSingle();

      if (fetchError) {
        console.error('Supabase fetch client organization details error:', fetchError);
        throw fetchError;
      }

      if (!org) {
        return NextResponse.json({ error: 'Client organization not found.' }, { status: 404 });
      }

      // SECURITY CHECK: Sales Rep can strictly only modify their own assigned organizations
      if (
        decodedUser.role === 'sales_rep' &&
        org.assigned_to &&
        org.assigned_to !== decodedUser.id
      ) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have permission to modify this organization.' },
          { status: 403 }
        );
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

      // Validate name
      if (name !== undefined && !name.trim()) {
        return NextResponse.json({ error: 'Organization name is a required field.' }, { status: 400 });
      }

      // Duplicate check if name is changed
      if (name !== undefined && name.trim() !== org.name) {
        const companyName = name.trim();
        let nameQuery = supabase.from('client_organizations').select('id').eq('org_id', decodedUser.orgId).ilike('name', companyName).neq('id', id);
        const { data: existingOrg } = await nameQuery.maybeSingle();

        if (existingOrg) {
          return NextResponse.json(
            { error: 'Duplicate Warning: Another organization with this name already exists.' },
            { status: 400 }
          );
        }
      }

      const updates = {};
      if (name !== undefined) updates.name = name.trim();
      if (website !== undefined) updates.website = website.trim();
      if (industry !== undefined) updates.industry = industry.trim();
      if (email !== undefined) updates.email = email.toLowerCase().trim();
      if (phone !== undefined) updates.phone = phone.trim();
      if (city !== undefined) updates.city = city.trim();
      if (state !== undefined) updates.state = state.trim();
      if (country !== undefined) updates.country = country.trim();
      if (customData !== undefined) updates.custom_data = customData;

      // Allow Admin/Manager to change assignee
      if (decodedUser.role !== 'sales_rep' && assignedTo !== undefined) {
        updates.assigned_to = assignedTo || null;
      }

      let updateQuery = supabase.from('client_organizations').update(updates).eq('id', id);
      if (decodedUser.orgId) {
        updateQuery = updateQuery.eq('org_id', decodedUser.orgId);
      }
      const { data: updatedOrg, error: updateError } = await updateQuery
        .select('*, users(id, name, email, role)')
        .single();

      if (updateError) {
        console.error('Supabase update client org error:', updateError);
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        message: 'Client organization details updated successfully.',
        organization: mapClientOrgToFrontend(updatedOrg)
      });

    } else {
      // Fallback to MongoDB
      await connectToDatabase();

      const org = await ClientOrganization.findById(id);

      if (!org) {
        return NextResponse.json({ error: 'Client organization not found.' }, { status: 404 });
      }

      // SECURITY CHECK
      if (
        decodedUser.role === 'sales_rep' &&
        org.assignedTo &&
        org.assignedTo.toString() !== decodedUser.id
      ) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have permission to modify this organization.' },
          { status: 403 }
        );
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

      // Validate name
      if (name !== undefined && !name.trim()) {
        return NextResponse.json({ error: 'Organization name is a required field.' }, { status: 400 });
      }

      // Duplicate check if name is changed
      if (name !== undefined && name.trim() !== org.name) {
        const companyName = name.trim();
        const existingOrg = await ClientOrganization.findOne({
          orgId: decodedUser.orgId,
          name: { $regex: new RegExp(`^${companyName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') },
          _id: { $ne: id }
        });

        if (existingOrg) {
          return NextResponse.json(
            { error: 'Duplicate Warning: Another organization with this name already exists.' },
            { status: 400 }
          );
        }
      }

      // Apply updates
      if (name !== undefined) org.name = name.trim();
      if (website !== undefined) org.website = website.trim();
      if (industry !== undefined) org.industry = industry.trim();
      if (email !== undefined) org.email = email.toLowerCase().trim();
      if (phone !== undefined) org.phone = phone.trim();
      if (city !== undefined) org.city = city.trim();
      if (state !== undefined) org.state = state.trim();
      if (country !== undefined) org.country = country.trim();
      if (customData !== undefined) org.customData = customData;

      // Allow Admin/Manager to change assignee
      if (decodedUser.role !== 'sales_rep' && assignedTo !== undefined) {
        org.assignedTo = assignedTo || null;
      }

      await org.save();

      return NextResponse.json({
        success: true,
        message: 'Client organization details updated successfully.',
        organization: org
      });
    }
  } catch (error) {
    console.error('Update client organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error while updating client organization details.' },
      { status: 500 }
    );
  }
}

// DELETE /api/client-organizations/[id] - Delete client organization (Admins/Owners only)
export async function DELETE(req, { params }) {
  try {
    const decodedUser = getUserFromRequest(req);
    const { id } = await params;

    if (!decodedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (decodedUser.role !== 'owner' && decodedUser.role !== 'sales_admin') {
      return NextResponse.json(
        { error: 'Forbidden. Only Owners or Sales Administrators can delete client organization records.' },
        { status: 403 }
      );
    }

    if (supabase) {
      let query = supabase.from('client_organizations').select('*').eq('id', id);
      if (decodedUser.orgId) {
        query = query.eq('org_id', decodedUser.orgId);
      }
      const { data: org, error: fetchError } = await query.maybeSingle();

      if (fetchError) {
        console.error('Supabase delete fetch error:', fetchError);
        throw fetchError;
      }

      if (!org) {
        return NextResponse.json({ error: 'Client organization not found.' }, { status: 404 });
      }

      // Foreign key constraints specify ON DELETE SET NULL for contacts and deals,
      // so deleting the organization will automatically unlink it.
      let deleteQuery = supabase.from('client_organizations').delete().eq('id', id);
      if (decodedUser.orgId) {
        deleteQuery = deleteQuery.eq('org_id', decodedUser.orgId);
      }
      const { error: deleteError } = await deleteQuery;

      if (deleteError) {
        console.error('Supabase delete client org error:', deleteError);
        throw deleteError;
      }

      return NextResponse.json({
        success: true,
        message: 'Client organization record deleted successfully.'
      });
    } else {
      await connectToDatabase();

      const deletedOrg = await ClientOrganization.findByIdAndDelete(id);

      if (!deletedOrg) {
        return NextResponse.json({ error: 'Client organization not found.' }, { status: 404 });
      }

      // In Mongoose, we must manually update associated contacts and deals to unlink them
      await Contact.updateMany({ organizationId: id }, { $set: { organizationId: null } });
      await Deal.updateMany({ organizationId: id }, { $set: { organizationId: null } });

      return NextResponse.json({
        success: true,
        message: 'Client organization record deleted successfully.'
      });
    }
  } catch (error) {
    console.error('Delete client organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error while deleting client organization.' },
      { status: 500 }
    );
  }
}
