import nodemailer from 'nodemailer';

// Helper to compile transporter dynamically on-demand to support live .env changes without server restarts
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('⚠️ SMTP settings are missing or incomplete in environment variables. Real email sending is currently simulated.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    // Adding standard fallback options for self-signed certificates or local tests
    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Sends a real, trackable proposal email using the configured SMTP server.
 * Injects a hidden tracking pixel GIF and trackable proposal PDF attachment download link.
 * 
 * @param {Object} params
 * @param {string} params.emailId - The database ID of the Email record (used for tracking hooks)
 * @param {string} params.toEmail - Recipient email address (e.g., client's email)
 * @param {string} params.toName - Recipient full name
 * @param {string} params.subject - Email subject line
 * @param {string} params.body - Raw text email body (supports markdown newlines)
 * @param {string} [params.proposalFile] - Attached proposal filename (e.g., Proposal.pdf)
 * @returns {Promise<Object>} - Delivery status and metadata
 */
export async function sendTrackedEmail({ emailId, toEmail, toName, subject, body, proposalFile, cc }) {
  const transporter = getTransporter();
  const appUrl = process.env.APP_URL || 'http://localhost:5000';

  if (!transporter) {
    return {
      success: false,
      simulated: true,
      message: 'SMTP settings are missing. Email simulated and saved in DB only.',
    };
  }

  try {
    // 1. Process email body newlines into HTML paragraphs
    let formattedBody = body
      .split('\n')
      .map(para => para.trim() ? `<p style="margin: 0 0 16px 0; line-height: 1.6; font-size: 14px; color: #334155;">${para}</p>` : '<br />')
      .join('');

    // 2. Wrap attached proposal template tags in trackable download links
    const trackableDownloadUrl = `${appUrl}/api/emails/track/download?id=${emailId}`;
    if (proposalFile) {
      const linkHtml = `<a href="${trackableDownloadUrl}" style="color: #059669; font-weight: bold; text-decoration: underline;" target="_blank" title="Click to download proposal">${proposalFile}</a>`;
      
      // Replace text placeholders with the trackable link
      formattedBody = formattedBody.replace(new RegExp(proposalFile, 'g'), linkHtml);
      formattedBody = formattedBody.replace(/\{\{proposalFile\}\}/g, linkHtml);
    }

    // 3. Compile a highly premium, professional HTML email wrapper matching the CRM brand
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 20px 0;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); border: 1px solid #e2e8f0;">
                
                <!-- Premium Sleek Brand Banner -->
                <tr>
                  <td style="background-color: #0f172a; padding: 24px 30px; text-align: left; border-bottom: 3px solid #10b981;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td>
                          <span style="color: #ffffff; font-size: 18px; font-weight: 800; letter-spacing: -0.5px;">Innonsh CRM Suite</span>
                        </td>
                        <td align="right">
                          <span style="color: #10b981; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Secure Proposal</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Email Core Content Body -->
                <tr>
                  <td style="padding: 35px 30px; background-color: #ffffff;">
                    ${formattedBody}

                    <!-- 4. Proposal Attachment Call-to-Action Card -->
                    ${proposalFile ? `
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 30px; padding: 20px; border-radius: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0;">
                      <tr>
                        <td style="font-family: sans-serif;">
                          <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">SECURED PROPOSAL ATTACHMENT</p>
                          <span style="font-size: 14px; font-weight: bold; color: #1e293b; display: block; margin-bottom: 12px;">📎 ${proposalFile}</span>
                          <a href="${trackableDownloadUrl}" style="display: inline-block; padding: 10px 20px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; text-align: center; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);" target="_blank">
                            Download & Review Proposal PDF
                          </a>
                        </td>
                      </tr>
                    </table>
                    ` : ''}
                  </td>
                </tr>

                <!-- Professional Subtle Footer -->
                <tr>
                  <td style="padding: 24px 30px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                      This email contains secure documents generated automatically by Innonsh CRM Suite.<br />
                      All attachment downloads and message responses are audited and routed directly to your account representative.
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 10px; color: #cbd5e1;">
                      © ${new Date().getFullYear()} Innonsh Technologies Private Limited. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>

        <!-- 5. INVISIBLE 1x1 HIDDEN TRACKING PIXEL FOR EMAIL OPENS -->
        <img src="${appUrl}/api/emails/track/open?id=${emailId}" alt="" width="1" height="1" style="display: none !important; width: 1px !important; height: 1px !important; border: 0 !important; margin: 0 !important; padding: 0 !important;" />
      </body>
      </html>
    `;

    const fromEmail = process.env.SMTP_FROM_EMAIL || `"Innonsh Sales Team" <${process.env.SMTP_USER}>`;

    // 6. Send the compiled HTML mail
    const mailOptions = {
      from: fromEmail,
      to: `"${toName}" <${toEmail}>`,
      cc: cc || undefined,
      subject: subject,
      html: htmlContent,
      // Provide a clean plaintext fallback for older readers
      text: `${body}\n\nReview attachment proposal at: ${trackableDownloadUrl}`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Tracked email successfully dispatched via SMTP! MessageID: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      message: 'Email dispatched successfully via company SMTP.'
    };

  } catch (error) {
    console.error('❌ Failed to dispatch tracked SMTP email:', error);
    return {
      success: false,
      error: error.message,
      message: `Mail server rejected delivery: ${error.message}`
    };
  }
}

/**
 * Reusable generic helper to send beautifully styled emails
 * @param {Object} params
 * @param {string} params.toEmail - Recipient email address
 * @param {string} params.toName - Recipient name
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML content
 * @param {string} params.text - Plain text content
 */
export async function sendEmail({ toEmail, toName, subject, html, text }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(`⚠️ [Simulated Email] To: ${toEmail}, Subject: ${subject}`);
    return {
      success: true,
      simulated: true,
      message: 'SMTP settings missing. Email simulated.'
    };
  }

  try {
    const fromEmail = process.env.SMTP_FROM_EMAIL || `"Innonsh CRM Suite" <${process.env.SMTP_USER}>`;
    const mailOptions = {
      from: fromEmail,
      to: toName ? `"${toName}" <${toEmail}>` : toEmail,
      subject: subject,
      html: html,
      text: text || ''
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email successfully dispatched to ${toEmail}! MessageID: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      message: 'Email dispatched successfully.'
    };
  } catch (error) {
    console.error(`❌ Failed to dispatch email to ${toEmail}:`, error);
    return {
      success: false,
      error: error.message,
      message: `Failed to send email: ${error.message}`
    };
  }
}

