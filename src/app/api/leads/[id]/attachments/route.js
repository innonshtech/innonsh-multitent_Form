import connectToDatabase from '@/lib/db';
import Lead from '@/lib/models/Lead';
import { supabase } from '@/lib/supabaseClient';
import { getUserFromRequest, checkLeadEditPermission } from '@/lib/auth';
import { NextResponse } from 'next/server';

// POST /api/leads/[id]/attachments - Upload a new Base64 attachment
export async function POST(req, { params }) {
  try {
    const decodedUser = getUserFromRequest(req);
    const { id } = await params;

    if (!decodedUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login to upload files.' }, { status: 401 });
    }

    const body = await req.json();
    const { fileName, fileData, fileType, fileSize } = body;

    if (!fileName || !fileData) {
      return NextResponse.json(
        { error: 'Validation Failure: File Name and Base64 File Content are required.' },
        { status: 400 }
      );
    }

    // Max 10MB check to protect Mongo document size / database limits
    if (fileSize > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Please upload files under 10MB to maintain optimal CRM speed.' },
        { status: 400 }
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
        console.error('Supabase fetch lead for attachment error:', fetchError);
        throw fetchError;
      }

      if (!lead) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
      }

      // SECURITY CHECK: Role-based permission check
      if (!checkLeadEditPermission(lead, decodedUser, rolesPermissions)) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have permission to modify this lead.' },
          { status: 403 }
        );
      }

      // 1. Insert attachment to database
      const { error: insertError } = await supabase
        .from('lead_attachments')
        .insert([{
          lead_id: id,
          file_name: fileName,
          file_data: fileData,
          file_type: fileType || '',
          file_size: Number(fileSize) || 0,
          uploaded_by: decodedUser.name
        }]);

      if (insertError) {
        console.error('Supabase insert attachment error:', insertError);
        throw insertError;
      }

      // 2. Automated Activity Log Note
      const { error: noteError } = await supabase
        .from('lead_notes')
        .insert([{
          lead_id: id,
          text: `Proposal document / File "${fileName}" uploaded successfully by ${decodedUser.name}`,
          created_by: decodedUser.id,
          created_by_name: decodedUser.name
        }]);

      if (noteError) {
        console.error('Supabase insert attachment activity note error:', noteError);
      }

      // 3. Fetch all current attachments to return
      const { data: attachments, error: fetchAttachError } = await supabase
        .from('lead_attachments')
        .select('*')
        .eq('lead_id', id);

      if (fetchAttachError) {
        console.error('Supabase fetch lead attachments error:', fetchAttachError);
        throw fetchAttachError;
      }

      const mappedAttachments = (attachments || []).map(a => ({
        _id: a.id,
        id: a.id,
        fileName: a.file_name,
        fileData: a.file_data,
        fileType: a.file_type,
        fileSize: a.file_size,
        uploadedBy: a.uploaded_by,
        uploadedAt: a.uploaded_at
      }));

      return NextResponse.json({
        success: true,
        message: 'Attachment uploaded successfully',
        attachments: mappedAttachments
      }, { status: 201 });

    } else {
      await connectToDatabase();

      const lead = await Lead.findById(id).populate('createdBy', 'name email role');

      if (!lead) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
      }

      // SECURITY CHECK: Role-based permission check
      if (!checkLeadEditPermission(lead, decodedUser)) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have permission to modify this lead.' },
          { status: 403 }
        );
      }

      // 1. Push attachment to schema
      const newAttachment = {
        fileName,
        fileData,
        fileType: fileType || '',
        fileSize: Number(fileSize) || 0,
        uploadedBy: decodedUser.name,
        uploadedAt: new Date()
      };

      lead.attachments.push(newAttachment);

      // 2. Automated Activity Log Note
      lead.notes.push({
        text: `Proposal document / File "${fileName}" uploaded successfully by ${decodedUser.name}`,
        createdBy: decodedUser.id,
        createdByName: decodedUser.name
      });

      await lead.save();

      return NextResponse.json({
        success: true,
        message: 'Attachment uploaded successfully',
        attachments: lead.attachments
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Upload attachment error:', error);
    return NextResponse.json(
      { error: 'Internal server error while uploading attachment.', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/leads/[id]/attachments - Delete an attachment
export async function DELETE(req, { params }) {
  try {
    const decodedUser = getUserFromRequest(req);
    const { id } = await params;

    if (!decodedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get('attachmentId');

    if (!attachmentId) {
      return NextResponse.json({ error: 'Attachment ID is required to remove files.' }, { status: 400 });
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
        console.error('Supabase fetch lead for delete attachment error:', fetchError);
        throw fetchError;
      }

      if (!lead) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
      }

      // SECURITY CHECK: Role-based permission check
      if (!checkLeadEditPermission(lead, decodedUser, rolesPermissions)) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have permission to modify this lead.' },
          { status: 403 }
        );
      }

      // Verify attachment exists
      const { data: attachmentToRemove, error: attachFetchError } = await supabase
        .from('lead_attachments')
        .select('file_name')
        .eq('id', attachmentId)
        .eq('lead_id', id)
        .maybeSingle();

      if (attachFetchError) {
        console.error('Supabase fetch individual attachment error:', attachFetchError);
        throw attachFetchError;
      }

      if (!attachmentToRemove) {
        return NextResponse.json({ error: 'Attachment not found in lead profile.' }, { status: 404 });
      }

      const removedFileName = attachmentToRemove.file_name;

      // Remove item
      const { error: deleteError } = await supabase
        .from('lead_attachments')
        .delete()
        .eq('id', attachmentId);

      if (deleteError) {
        console.error('Supabase delete attachment error:', deleteError);
        throw deleteError;
      }

      // Log deletion
      const { error: noteError } = await supabase
        .from('lead_notes')
        .insert([{
          lead_id: id,
          text: `File attachment "${removedFileName}" deleted by ${decodedUser.name}`,
          created_by: decodedUser.id,
          created_by_name: decodedUser.name
        }]);

      if (noteError) {
        console.error('Supabase insert delete activity note error:', noteError);
      }

      // Fetch remaining attachments
      const { data: attachments, error: fetchAttachError } = await supabase
        .from('lead_attachments')
        .select('*')
        .eq('lead_id', id);

      if (fetchAttachError) {
        console.error('Supabase fetch remaining attachments error:', fetchAttachError);
        throw fetchAttachError;
      }

      const mappedAttachments = (attachments || []).map(a => ({
        _id: a.id,
        id: a.id,
        fileName: a.file_name,
        fileData: a.file_data,
        fileType: a.file_type,
        fileSize: a.file_size,
        uploadedBy: a.uploaded_by,
        uploadedAt: a.uploaded_at
      }));

      return NextResponse.json({
        success: true,
        message: 'Attachment deleted successfully',
        attachments: mappedAttachments
      });

    } else {
      await connectToDatabase();

      const lead = await Lead.findById(id).populate('createdBy', 'name email role');

      if (!lead) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
      }

      // SECURITY CHECK: Role-based permission check
      if (!checkLeadEditPermission(lead, decodedUser)) {
        return NextResponse.json(
          { error: 'Forbidden. You do not have permission to modify this lead.' },
          { status: 403 }
        );
      }

      const attachmentToRemove = lead.attachments.id(attachmentId);
      if (!attachmentToRemove) {
        return NextResponse.json({ error: 'Attachment not found in lead profile.' }, { status: 404 });
      }

      const removedFileName = attachmentToRemove.fileName;

      // Remove item
      lead.attachments.pull(attachmentId);

      // Log deletion
      lead.notes.push({
        text: `File attachment "${removedFileName}" deleted by ${decodedUser.name}`,
        createdBy: decodedUser.id,
        createdByName: decodedUser.name
      });

      await lead.save();

      return NextResponse.json({
        success: true,
        message: 'Attachment deleted successfully',
        attachments: lead.attachments
      });
    }
  } catch (error) {
    console.error('Delete attachment error:', error);
    return NextResponse.json(
      { error: 'Internal server error while removing attachment.' },
      { status: 500 }
    );
  }
}
