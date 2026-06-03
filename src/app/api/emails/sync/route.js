import connectToDatabase from '@/lib/db';
import Email from '@/lib/models/Email';
import Lead from '@/lib/models/Lead';
import Contact from '@/lib/models/Contact';
import Task from '@/lib/models/Task';
import Notification from '@/lib/models/Notification';
import { supabase } from '@/lib/supabaseClient';
import { createNotification } from '@/lib/notifications';
import { NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

// Smart helper to clean reply body and extract only the new reply message, stripping trailing quote history
function cleanReplyBody(text) {
  if (!text) return '';
  // Split by common reply separators to isolate the main response
  const separators = [
    /\n\s*On\s+.*wrote:\s*\n/i,
    /\n\s*-----Original Message-----/i,
    /\n\s*From:.*Sent:.*To:/i,
    /\n\s*_{32,}\s*\n/
  ];
  let cleaned = text;
  for (const sep of separators) {
    const parts = cleaned.split(sep);
    if (parts.length > 0) {
      cleaned = parts[0];
    }
  }
  return cleaned.trim();
}

export async function GET(req) {
  try {
    // 1. Verify that Mailbox credentials are configured in local environment
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const imapHost = process.env.IMAP_HOST || 'imap.gmail.com';
    const imapPort = parseInt(process.env.IMAP_PORT || '993', 10);
    const imapSecure = process.env.IMAP_SECURE !== 'false';

    if (!smtpUser || !smtpPass) {
      return NextResponse.json(
        { error: 'Mailbox synchronization credentials (SMTP_USER/SMTP_PASS) are not set in .env.local.' },
        { status: 500 }
      );
    }

    if (supabase) {
      // 3. Find all sent proposal emails that are currently pending a client reply
      const { data: unrepliedEmails, error: fetchError } = await supabase
        .from('emails')
        .select('*, leads!lead_id(*), contacts!contact_id(*)')
        .eq('replied', false);

      if (fetchError) {
        console.error('Supabase unreplied emails fetch error:', fetchError);
        throw fetchError;
      }

      if (!unrepliedEmails || unrepliedEmails.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No pending unreplied emails found in CRM database to sync.',
          syncedCount: 0
        });
      }

      // 4. Compile a map of recipient emails to matching Database proposal email logs
      const emailMap = new Map();
      for (const email of unrepliedEmails) {
        let clientEmail = '';
        if (email.leads && email.leads.email) {
          clientEmail = email.leads.email.toLowerCase().trim();
        } else if (email.contacts && email.contacts.email) {
          clientEmail = email.contacts.email.toLowerCase().trim();
        }

        if (clientEmail) {
          if (!emailMap.has(clientEmail)) {
            emailMap.set(clientEmail, []);
          }
          emailMap.get(clientEmail).push(email);
        }
      }

      if (emailMap.size === 0) {
        return NextResponse.json({
          success: true,
          message: 'No valid recipient email addresses mapped for unreplied CRM logs.',
          syncedCount: 0
        });
      }

      // 5. Initialize the modern promise-based ImapFlow client
      const client = new ImapFlow({
        host: imapHost,
        port: imapPort,
        secure: imapSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        logger: false, // Prevents console log flooding
      });

      // 6. Securely connect to the IMAP server
      await client.connect();

      let syncedCount = 0;
      const syncedDetails = [];

      // 7. Lock and search the INBOX mailbox folder
      const lock = await client.getMailboxLock('INBOX');
      try {
        // Loop over every unique client sender email address mapped
        for (const [clientEmail, dbEmails] of emailMap.entries()) {
          // Search for all emails inside Gmail Inbox originating from this client's email address
          const uids = await client.search({ from: clientEmail });

          if (!uids || uids.length === 0) {
            continue; // No emails found in Inbox from this address
          }

          // Grab the latest received message UID to verify reply
          const latestUid = uids[uids.length - 1];

          // Fetch the raw source stream and headers envelope details of this message
          const msg = await client.fetchOne(latestUid, { source: true, envelope: true });
          if (!msg || !msg.source) {
            continue;
          }

          // Parse the full raw MIME stream using mailparser simpleParser
          const parsed = await simpleParser(msg.source);
          const incomingEmailDate = msg.envelope?.date || parsed.date || new Date();
          const incomingEmailBody = cleanReplyBody(parsed.text || parsed.textAsHtml || '');

          // Match against database logs that were sent before this incoming email date
          for (const dbEmail of dbEmails) {
            const sentDate = new Date(dbEmail.created_at);

            // If the incoming reply was sent AFTER the proposal email was dispatched in CRM (allowing 5s cushion)
            if (incomingEmailDate.getTime() > sentDate.getTime() - 5000) {
              
              // Mark the email log as replied in Supabase
              const { error: updateError } = await supabase
                .from('emails')
                .update({
                  replied: true,
                  replied_at: incomingEmailDate.toISOString(),
                  reply_body: incomingEmailBody || 'Client responded via email. Please check your Inbox.'
                })
                .eq('id', dbEmail.id);

              if (updateError) {
                console.error('Supabase update email replied status error:', updateError);
                throw updateError;
              }

              // Trigger standard automated follow-up workflows
              if (dbEmail.lead_id) {
                const { data: lead } = await supabase
                  .from('leads')
                  .select('*')
                  .eq('id', dbEmail.lead_id)
                  .maybeSingle();

                if (lead) {
                  // Boost lead score by +30
                  const updatedScore = (lead.score || 0) + 30;

                  await supabase
                    .from('leads')
                    .update({ score: updatedScore })
                    .eq('id', lead.id);

                  // Push activity note on Lead's history timeline
                  const noteText = `💬 Received Email Reply (Subject: "${dbEmail.subject}"): "${incomingEmailBody.slice(0, 150)}${incomingEmailBody.length > 150 ? '...' : ''}"`;
                  await supabase.from('lead_notes').insert([{
                    lead_id: lead.id,
                    text: noteText,
                    created_by: dbEmail.sent_by,
                    created_by_name: 'Email Reply Sync Engine'
                  }]);

                  // Auto-create High-Priority task due in 24 hours
                  const taskDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                  const assignedRep = lead.assigned_to || dbEmail.sent_by;

                  await supabase.from('tasks').insert([{
                    subject: `Email Sync Auto-followup: Response from ${lead.first_name} ${lead.last_name || ''}`,
                    due_date: taskDueDate.toISOString(),
                    priority: 'High',
                    status: 'Pending',
                    notes: `Automated Sync Task: Client responded to proposal: "${dbEmail.subject}".\n\nReply:\n"${incomingEmailBody}"\n\nReview this in Email Hub and complete requirements.`,
                    assigned_to: assignedRep,
                    lead_id: lead.id,
                    org_id: dbEmail.org_id
                  }]);

                  // Generate system notification banner for Assigned Rep
                  await createNotification(
                    assignedRep,
                    'Lead',
                    '💬 Client Replied to Proposal!',
                    `Lead ${lead.first_name} (${lead.company || ''}) replied via Email: "${incomingEmailBody.slice(0, 60)}${incomingEmailBody.length > 60 ? '...' : ''}" - Lead Score boosted by +30 (Score: ${updatedScore})!`,
                    '/dashboard/tasks',
                    null
                  );
                }
              } else if (dbEmail.contact_id) {
                const { data: contact } = await supabase
                  .from('contacts')
                  .select('*')
                  .eq('id', dbEmail.contact_id)
                  .maybeSingle();

                if (contact) {
                  // Create Auto-Task for Contact
                  const taskDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                  const assignedRep = contact.assigned_to || dbEmail.sent_by;

                  await supabase.from('tasks').insert([{
                    subject: `Email Sync Auto-followup: Response from Contact ${contact.first_name}`,
                    due_date: taskDueDate.toISOString(),
                    priority: 'High',
                    status: 'Pending',
                    notes: `Automated Sync Task: Contact responded to proposal: "${dbEmail.subject}".\n\nReply:\n"${incomingEmailBody}"\n\nReview this and contact client.`,
                    assigned_to: assignedRep,
                    contact_id: contact.id,
                    org_id: dbEmail.org_id
                  }]);

                  // Create Notification
                  await createNotification(
                    assignedRep,
                    'System',
                    '💬 Contact Replied!',
                    `Contact ${contact.first_name} (${contact.company || ''}) replied via Email: "${incomingEmailBody.slice(0, 60)}${incomingEmailBody.length > 60 ? '...' : ''}" - High-priority follow-up task assigned.`,
                    '/dashboard/tasks',
                    null
                  );
                }
              }

              syncedCount++;
              syncedDetails.push({
                emailId: dbEmail.id,
                subject: dbEmail.subject,
                client: clientEmail,
                replyExcerpt: incomingEmailBody.slice(0, 50) + (incomingEmailBody.length > 50 ? '...' : '')
              });
            }
          }
        }
      } finally {
        // Ensure the lock is released even if errors occur during message scans
        lock.release();
      }

      // 8. Gracefully close connection to the IMAP server
      await client.logout();

      return NextResponse.json({
        success: true,
        message: syncedCount > 0 
          ? `Successfully synchronized ${syncedCount} real email response(s) from your mail inbox!` 
          : 'All CRM emails are up-to-date. No new client responses detected in mail inbox.',
        syncedCount,
        syncedDetails
      });

    } else {
      await connectToDatabase();

      // 3. Find all sent proposal emails that are currently pending a client reply
      const unrepliedEmails = await Email.find({ replied: false })
        .populate('leadId')
        .populate('contactId');

      if (unrepliedEmails.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No pending unreplied emails found in CRM database to sync.',
          syncedCount: 0
        });
      }

      // 4. Compile a map of recipient emails to matching Database proposal email logs
      const emailMap = new Map();
      for (const email of unrepliedEmails) {
        let clientEmail = '';
        if (email.leadId && email.leadId.email) {
          clientEmail = email.leadId.email.toLowerCase().trim();
        } else if (email.contactId && email.contactId.email) {
          clientEmail = email.contactId.email.toLowerCase().trim();
        }

        if (clientEmail) {
          if (!emailMap.has(clientEmail)) {
            emailMap.set(clientEmail, []);
          }
          emailMap.get(clientEmail).push(email);
        }
      }

      if (emailMap.size === 0) {
        return NextResponse.json({
          success: true,
          message: 'No valid recipient email addresses mapped for unreplied CRM logs.',
          syncedCount: 0
        });
      }

      // 5. Initialize the modern promise-based ImapFlow client
      const client = new ImapFlow({
        host: imapHost,
        port: imapPort,
        secure: imapSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        logger: false, // Prevents console log flooding
      });

      // 6. Securely connect to the IMAP server
      await client.connect();

      let syncedCount = 0;
      const syncedDetails = [];

      // 7. Lock and search the INBOX mailbox folder
      const lock = await client.getMailboxLock('INBOX');
      try {
        // Loop over every unique client sender email address mapped
        for (const [clientEmail, dbEmails] of emailMap.entries()) {
          // Search for all emails inside Inbox originating from this client's email address
          const uids = await client.search({ from: clientEmail });

          if (!uids || uids.length === 0) {
            continue; // No emails found in Inbox from this address
          }

          // Grab the latest received message UID to verify reply
          const latestUid = uids[uids.length - 1];

          // Fetch the raw source stream and headers envelope details of this message
          const msg = await client.fetchOne(latestUid, { source: true, envelope: true });
          if (!msg || !msg.source) {
            continue;
          }

          // Parse the full raw MIME stream using mailparser simpleParser
          const parsed = await simpleParser(msg.source);
          const incomingEmailDate = msg.envelope?.date || parsed.date || new Date();
          const incomingEmailBody = cleanReplyBody(parsed.text || parsed.textAsHtml || '');

          // Match against database logs that were sent before this incoming email date
          for (const dbEmail of dbEmails) {
            const sentDate = new Date(dbEmail.createdAt);

            // If the incoming reply was sent AFTER the proposal email was dispatched in CRM (allowing 5s cushion)
            if (incomingEmailDate.getTime() > sentDate.getTime() - 5000) {
              
              // Mark the email log as replied in MongoDB
              dbEmail.replied = true;
              dbEmail.repliedAt = incomingEmailDate;
              dbEmail.replyBody = incomingEmailBody || 'Client responded via email. Please check your Inbox.';
              await dbEmail.save();

              // Trigger standard automated follow-up workflows
              if (dbEmail.leadId) {
                const lead = await Lead.findById(dbEmail.leadId._id);
                if (lead) {
                  // Boost lead score by +30
                  lead.score = (lead.score || 0) + 30;

                  // Push activity note on Lead's history timeline
                  lead.notes.push({
                    text: `💬 Received Email Reply (Subject: "${dbEmail.subject}"): "${incomingEmailBody.slice(0, 150)}${incomingEmailBody.length > 150 ? '...' : ''}"`,
                    createdBy: dbEmail.sentBy,
                    createdByName: 'Email Reply Sync Engine'
                  });

                  await lead.save();

                  // Auto-create High-Priority task due in 24 hours
                  const taskDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                  const assignedRep = lead.assignedTo || dbEmail.sentBy;

                  await Task.create({
                    subject: `Email Sync Auto-followup: Response from ${lead.firstName} ${lead.lastName || ''}`,
                    dueDate: taskDueDate,
                    priority: 'High',
                    status: 'Pending',
                    notes: `Automated Sync Task: Client responded to proposal: "${dbEmail.subject}".\n\nReply:\n"${incomingEmailBody}"\n\nReview this in Email Hub and complete requirements.`,
                    assignedTo: assignedRep,
                    leadId: lead._id
                  });

                  // Generate system notification banner for Assigned Rep
                  await Notification.create({
                    recipientId: assignedRep,
                    senderId: null,
                    type: 'Lead',
                    title: '💬 Client Replied to Proposal!',
                    message: `Lead ${lead.firstName} (${lead.company}) replied via Email: "${incomingEmailBody.slice(0, 60)}${incomingEmailBody.length > 60 ? '...' : ''}" - Lead Score boosted by +30 (Score: ${lead.score})!`,
                    link: '/dashboard/tasks'
                  });
                }
              } else if (dbEmail.contactId) {
                const contact = await Contact.findById(dbEmail.contactId._id);
                if (contact) {
                  // Push activity note on Contact's timeline
                  contact.notes.push({
                    text: `💬 Received Email Reply (Subject: "${dbEmail.subject}"): "${incomingEmailBody.slice(0, 150)}${incomingEmailBody.length > 150 ? '...' : ''}"`,
                    createdBy: dbEmail.sentBy,
                    createdByName: 'Email Reply Sync Engine'
                  });
                  await contact.save();

                  // Create Auto-Task for Contact
                  const taskDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                  const assignedRep = contact.assignedTo || dbEmail.sentBy;

                  await Task.create({
                    subject: `Email Sync Auto-followup: Response from Contact ${contact.firstName}`,
                    dueDate: taskDueDate,
                    priority: 'High',
                    status: 'Pending',
                    notes: `Automated Sync Task: Contact responded to proposal: "${dbEmail.subject}".\n\nReply:\n"${incomingEmailBody}"\n\nReview this and contact client.`,
                    assignedTo: assignedRep,
                    contactId: contact._id
                  });

                  // Create Notification
                  await Notification.create({
                    recipientId: assignedRep,
                    senderId: null,
                    type: 'System',
                    title: '💬 Contact Replied!',
                    message: `Contact ${contact.firstName} (${contact.company}) replied via Email: "${incomingEmailBody.slice(0, 60)}${incomingEmailBody.length > 60 ? '...' : ''}" - High-priority follow-up task assigned.`,
                    link: '/dashboard/tasks'
                  });
                }
              }

              syncedCount++;
              syncedDetails.push({
                emailId: dbEmail._id,
                subject: dbEmail.subject,
                client: clientEmail,
                replyExcerpt: incomingEmailBody.slice(0, 50) + (incomingEmailBody.length > 50 ? '...' : '')
              });
            }
          }
        }
      } finally {
        // Ensure the lock is released even if errors occur during message scans
        lock.release();
      }

      // 8. Gracefully close connection to the IMAP server
      await client.logout();

      return NextResponse.json({
        success: true,
        message: syncedCount > 0 
          ? `Successfully synchronized ${syncedCount} real email response(s) from your mail inbox!` 
          : 'All CRM emails are up-to-date. No new client responses detected in mail inbox.',
        syncedCount,
        syncedDetails
      });
    }
  } catch (error) {
    console.error('IMAP mail synchronization error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to synchronize emails via IMAP.', 
        details: error.message || 'Verification of network ports or App Password failed.' 
      },
      { status: 500 }
    );
  }
}
