import connectToDatabase from '@/lib/db';
import Email from '@/lib/models/Email';
import Lead from '@/lib/models/Lead';
import Contact from '@/lib/models/Contact';
import { supabase } from '@/lib/supabaseClient';
import { mapEmailToFrontend } from '@/lib/dbMapper';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { sendTrackedEmail } from '@/lib/mailer';

// GET /api/emails - List emails with filters based on role
export async function GET(req) {
  try {
    const decodedUser = getUserFromRequest(req);

    if (!decodedUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const leadId = searchParams.get('leadId') || '';
    const contactId = searchParams.get('contactId') || '';

    if (supabase) {
      let queryBuilder = supabase
        .from('emails')
        .select(`
          *,
          users!sent_by(id, name, email),
          leads!lead_id(id, first_name, last_name, company),
          contacts!contact_id(id, first_name, last_name, company)
        `);

      // Role-based access control
      if (decodedUser.role === 'sales_rep') {
        queryBuilder = queryBuilder.eq('sent_by', decodedUser.id);
      }

      if (leadId) {
        queryBuilder = queryBuilder.eq('lead_id', leadId);
      }
      if (contactId) {
        queryBuilder = queryBuilder.eq('contact_id', contactId);
      }

      if (search) {
        queryBuilder = queryBuilder.ilike('subject', `%${search}%`);
      }

      const { data, error } = await queryBuilder.order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch emails error:', error);
        throw error;
      }

      const emails = (data || []).map(mapEmailToFrontend);

      return NextResponse.json({
        success: true,
        emails
      });
    } else {
      await connectToDatabase();

      let query = {};

      // Role-based access control
      if (decodedUser.role === 'sales_rep') {
        query.sentBy = decodedUser.id;
      }

      if (leadId) query.leadId = leadId;
      if (contactId) query.contactId = contactId;

      if (search) {
        query.subject = new RegExp(search, 'i');
      }

      const emails = await Email.find(query)
        .populate('sentBy', 'name email role')
        .populate('leadId', 'firstName lastName company status')
        .populate('contactId', 'firstName lastName company status')
        .sort({ createdAt: -1 });

      return NextResponse.json({
        success: true,
        emails
      });
    }
  } catch (error) {
    console.error('Fetch emails error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching emails.' },
      { status: 500 }
    );
  }
}

// POST /api/emails - Compose and "send" tracked email
export async function POST(req) {
  try {
    const decodedUser = getUserFromRequest(req);

    if (!decodedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      subject,
      body: emailBody,
      leadId,
      contactId,
      proposalFile,
      proposalFileData,
      proposalFileMimeType,
      channel = 'email',
      cc = ''
    } = body;

    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: 'Email subject is required.' }, { status: 400 });
    }
    if (!emailBody || !emailBody.trim()) {
      return NextResponse.json({ error: 'Email body is required.' }, { status: 400 });
    }

    let finalSubject = subject.trim();
    let finalBody = emailBody;

    let recipientEmail = '';
    let recipientName = 'Client';

    if (supabase) {
      // Resolve template placeholder tags if linked to Lead/Contact
      if (leadId) {
        const { data: lead } = await supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .maybeSingle();

        if (lead) {
          recipientEmail = lead.email || '';
          recipientName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Client';
          const fullName = recipientName;
          finalSubject = finalSubject
            .replace(/\{\{firstName\}\}/g, lead.first_name || '')
            .replace(/\{\{name\}\}/g, fullName)
            .replace(/\{\{company\}\}/g, lead.company || '');
          finalBody = finalBody
            .replace(/\{\{firstName\}\}/g, lead.first_name || '')
            .replace(/\{\{name\}\}/g, fullName)
            .replace(/\{\{company\}\}/g, lead.company || '');
        }
      } else if (contactId) {
        const { data: contact } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', contactId)
          .maybeSingle();

        if (contact) {
          recipientEmail = contact.email || '';
          recipientName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Client';
          const fullName = recipientName;
          finalSubject = finalSubject
            .replace(/\{\{firstName\}\}/g, contact.first_name || '')
            .replace(/\{\{name\}\}/g, fullName)
            .replace(/\{\{company\}\}/g, contact.company || '');
          finalBody = finalBody
            .replace(/\{\{firstName\}\}/g, contact.first_name || '')
            .replace(/\{\{name\}\}/g, fullName)
            .replace(/\{\{company\}\}/g, contact.company || '');
        }
      }

      const emailData = {
        subject: finalSubject,
        body: finalBody,
        lead_id: leadId || null,
        contact_id: contactId || null,
        sent_by: decodedUser.id,
        proposal_file: proposalFile || '',
        proposal_file_data: proposalFileData || '',
        proposal_file_mime_type: proposalFileMimeType || '',
        channel,
        opens_count: 0,
        opened_at: [],
        downloads_count: 0,
        downloaded_at: [],
        replied: false,
        reply_body: '',
        cc: cc || ''
      };

      const { data: newEmail, error: insertError } = await supabase
        .from('emails')
        .insert([emailData])
        .select(`
          *,
          users!sent_by(id, name, email),
          leads!lead_id(id, first_name, last_name, company),
          contacts!contact_id(id, first_name, last_name, company)
        `)
        .single();

      if (insertError) {
        console.error('Supabase email insert error:', insertError);
        throw insertError;
      }

      const channelLabel = channel === 'whatsapp' ? 'WhatsApp' : (channel === 'both' ? 'Email & WhatsApp' : 'Email');

      // Automatically log this on the Lead's timeline notes
      if (leadId) {
        try {
          const noteText = `📧 Sent Tracked ${channelLabel}: "${newEmail.subject}" ${proposalFile ? `with Attachment [${proposalFile}]` : ''}`;
          await supabase.from('lead_notes').insert([{
            lead_id: leadId,
            text: noteText,
            created_by: decodedUser.id,
            created_by_name: decodedUser.name
          }]);
        } catch (err) {
          console.error('Failed to log email on lead timeline:', err);
        }
      }

      // Dispatch the actual email via SMTP transporter if recipientEmail is present AND channel is NOT whatsapp
      let mailDeliveryResult = null;
      if (recipientEmail && channel !== 'whatsapp') {
        try {
          mailDeliveryResult = await sendTrackedEmail({
            emailId: newEmail.id,
            toEmail: recipientEmail,
            toName: recipientName,
            subject: newEmail.subject,
            body: newEmail.body,
            proposalFile: newEmail.proposal_file,
            cc: newEmail.cc
          });
        } catch (mailErr) {
          console.error('SMTP real delivery exception caught in route:', mailErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: channel === 'whatsapp'
          ? 'WhatsApp proposal logged and tracked successfully!'
          : (mailDeliveryResult?.success 
            ? 'Email campaign dispatched and tracked successfully!' 
            : (mailDeliveryResult?.simulated 
              ? 'Email dispatched successfully! (Simulated - SMTP settings missing).' 
              : `Email saved, but real SMTP delivery failed: ${mailDeliveryResult?.error || 'Unknown SMTP error'}`)),
        email: mapEmailToFrontend(newEmail),
        mailDelivery: mailDeliveryResult
      }, { status: 201 });

    } else {
      await connectToDatabase();

      // Resolve template placeholder tags if linked to Lead/Contact
      if (leadId) {
        const lead = await Lead.findById(leadId);
        if (lead) {
          recipientEmail = lead.email || '';
          recipientName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Client';
          const fullName = recipientName;
          finalSubject = finalSubject
            .replace(/\{\{firstName\}\}/g, lead.firstName || '')
            .replace(/\{\{name\}\}/g, fullName)
            .replace(/\{\{company\}\}/g, lead.company || '');
          finalBody = finalBody
            .replace(/\{\{firstName\}\}/g, lead.firstName || '')
            .replace(/\{\{name\}\}/g, fullName)
            .replace(/\{\{company\}\}/g, lead.company || '');
        }
      } else if (contactId) {
        const contact = await Contact.findById(contactId);
        if (contact) {
          recipientEmail = contact.email || '';
          recipientName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Client';
          const fullName = recipientName;
          finalSubject = finalSubject
            .replace(/\{\{firstName\}\}/g, contact.firstName || '')
            .replace(/\{\{name\}\}/g, fullName)
            .replace(/\{\{company\}\}/g, contact.company || '');
          finalBody = finalBody
            .replace(/\{\{firstName\}\}/g, contact.firstName || '')
            .replace(/\{\{name\}\}/g, fullName)
            .replace(/\{\{company\}\}/g, contact.company || '');
        }
      }

      const email = await Email.create({
        subject: finalSubject,
        body: finalBody,
        leadId: leadId || null,
        contactId: contactId || null,
        sentBy: decodedUser.id,
        proposalFile: proposalFile || '',
        proposalFileData: proposalFileData || '',
        proposalFileMimeType: proposalFileMimeType || '',
        channel,
        cc: cc || ''
      });

      const channelLabel = channel === 'whatsapp' ? 'WhatsApp' : (channel === 'both' ? 'Email & WhatsApp' : 'Email');

      // Automatically log this on the Lead's or Contact's timeline notes
      if (leadId) {
        try {
          const lead = await Lead.findById(leadId);
          if (lead) {
            lead.notes.push({
              text: `📧 Sent Tracked ${channelLabel}: "${email.subject}" ${proposalFile ? `with Attachment [${proposalFile}]` : ''}`,
              createdBy: decodedUser.id,
              createdByName: decodedUser.name
            });
            await lead.save();
          }
        } catch (err) {
          console.error('Failed to log email on lead timeline:', err);
        }
      } else if (contactId) {
        try {
          const contact = await Contact.findById(contactId);
          if (contact) {
            contact.notes.push({
              text: `📧 Sent Tracked ${channelLabel}: "${email.subject}" ${proposalFile ? `with Attachment [${proposalFile}]` : ''}`,
              createdBy: decodedUser.id,
              createdByName: decodedUser.name
            });
            await contact.save();
          }
        } catch (err) {
          console.error('Failed to log email on contact timeline:', err);
        }
      }

      // Dispatch the actual email via SMTP transporter if recipientEmail is present AND channel is NOT whatsapp
      let mailDeliveryResult = null;
      if (recipientEmail && channel !== 'whatsapp') {
        try {
          mailDeliveryResult = await sendTrackedEmail({
            emailId: email._id,
            toEmail: recipientEmail,
            toName: recipientName,
            subject: email.subject,
            body: email.body,
            proposalFile: email.proposalFile,
            cc: email.cc
          });
        } catch (mailErr) {
          console.error('SMTP real delivery exception caught in route:', mailErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: channel === 'whatsapp'
          ? 'WhatsApp proposal logged and tracked successfully!'
          : (mailDeliveryResult?.success 
            ? 'Email campaign dispatched and tracked successfully!' 
            : (mailDeliveryResult?.simulated 
              ? 'Email dispatched successfully! (Simulated - SMTP settings missing).' 
              : `Email saved, but real SMTP delivery failed: ${mailDeliveryResult?.error || 'Unknown SMTP error'}`)),
        email,
        mailDelivery: mailDeliveryResult
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Send email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error while sending email.', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/emails - Delete selected email logs
export async function DELETE(req) {
  try {
    const decodedUser = getUserFromRequest(req);

    if (!decodedUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Please select valid email logs to delete.' }, { status: 400 });
    }

    if (supabase) {
      let queryBuilder = supabase
        .from('emails')
        .delete()
        .in('id', ids);

      // Role-based access control: sales reps can only delete their own logs
      if (decodedUser.role === 'sales_rep') {
        queryBuilder = queryBuilder.eq('sent_by', decodedUser.id);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('Supabase delete emails error:', error);
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: 'Selected email campaign logs deleted successfully.'
      });
    } else {
      await connectToDatabase();

      let query = { _id: { $in: ids } };

      // Role-based access control: sales reps can only delete their own logs
      if (decodedUser.role === 'sales_rep') {
        query.sentBy = decodedUser.id;
      }

      const result = await Email.deleteMany(query);

      return NextResponse.json({
        success: true,
        message: `Selected email campaign logs deleted successfully. Total removed: ${result.deletedCount}`
      });
    }
  } catch (error) {
    console.error('Delete emails API error:', error);
    return NextResponse.json(
      { error: 'Internal server error while deleting email campaign logs.', details: error.message },
      { status: 500 }
    );
  }
}
