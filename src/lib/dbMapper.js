/**
 * Database Mapper Utility
 * This ensures 100% backward compatibility with the React frontend components by
 * translating Supabase/PostgreSQL snake_case results into MongoDB/Mongoose-like document objects.
 */

export function mapUserToFrontend(user) {
  if (!user) return null;
  return {
    _id: user.id,
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    approvalStatus: user.approval_status,
    isActive: user.is_active,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export function mapLeadToFrontend(lead) {
  if (!lead) return null;
  return {
    _id: lead.id,
    id: lead.id,
    firstName: lead.first_name,
    lastName: lead.last_name || '',
    company: lead.company,
    designation: lead.designation || '',
    email: lead.email || '',
    phone: lead.phone || '',
    whatsapp: lead.whatsapp || '',
    whatsappContacted: lead.whatsapp_contacted || false,
    website: lead.website || '',
    city: lead.city || '',
    state: lead.state || '',
    country: lead.country || 'India',
    industry: lead.industry || '',
    employeeCount: lead.employee_count || 0,
    annualRevenue: lead.annual_revenue || 0,
    priority: lead.priority || 'Warm',
    status: lead.status || 'New',
    lostReason: lead.lost_reason || '',
    source: lead.source || 'Website',
    requirements: lead.requirements || '',
    interestedProduct: lead.interested_product || '',
    followUpType: lead.follow_up_type || 'None',
    nextFollowUpDate: lead.next_follow_up_date || null,
    // Relational join users details mapping
    assignedTo: lead.users ? { 
      _id: lead.users.id, 
      id: lead.users.id,
      name: lead.users.name, 
      email: lead.users.email 
    } : null,
    score: lead.score || 0,
    customFields: lead.custom_fields || [],
    customData: lead.custom_data || {},
    // Map joined lead_notes rows to notes array
    notes: lead.lead_notes ? lead.lead_notes.map(n => ({
      _id: n.id,
      id: n.id,
      text: n.text,
      createdBy: n.created_by,
      createdByName: n.created_by_name,
      createdAt: n.created_at,
      updatedAt: n.updated_at
    })) : [],
    // Map joined lead_attachments rows to attachments array
    attachments: lead.lead_attachments ? lead.lead_attachments.map(a => ({
      _id: a.id,
      id: a.id,
      fileName: a.file_name,
      fileData: a.file_data,
      fileType: a.file_type,
      fileSize: a.file_size,
      uploadedBy: a.uploaded_by,
      uploadedAt: a.uploaded_at
    })) : [],
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
  };
}

export function mapNotificationToFrontend(notification) {
  if (!notification) return null;
  return {
    _id: notification.id,
    id: notification.id,
    recipientId: notification.recipient_id,
    senderId: notification.sender_id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    link: notification.link || '',
    isRead: notification.is_read || false,
    createdAt: notification.created_at,
    updatedAt: notification.updated_at,
  };
}

export function mapClientOrgToFrontend(org) {
  if (!org) return null;
  return {
    _id: org.id || org._id,
    id: org.id || org._id,
    orgId: org.org_id || org.orgId,
    name: org.name,
    website: org.website || '',
    industry: org.industry || '',
    phone: org.phone || '',
    email: org.email || '',
    city: org.city || '',
    state: org.state || '',
    country: org.country || 'India',
    assignedTo: org.users ? {
      _id: org.users.id,
      id: org.users.id,
      name: org.users.name,
      email: org.users.email
    } : (org.assignedTo ? {
      _id: org.assignedTo._id || org.assignedTo.id || org.assignedTo,
      id: org.assignedTo._id || org.assignedTo.id || org.assignedTo,
      name: org.assignedTo.name || '',
      email: org.assignedTo.email || ''
    } : null),
    customData: org.custom_data || org.customData || {},
    createdAt: org.created_at || org.createdAt,
    updatedAt: org.updated_at || org.updatedAt,
  };
}

export function mapContactToFrontend(contact) {
  if (!contact) return null;
  return {
    _id: contact.id,
    id: contact.id,
    firstName: contact.first_name,
    lastName: contact.last_name || '',
    company: contact.company || '',
    designation: contact.designation || '',
    email: contact.email || '',
    phone: contact.phone || '',
    whatsapp: contact.whatsapp || '',
    city: contact.city || '',
    state: contact.state || '',
    country: contact.country || 'India',
    assignedTo: contact.users ? {
      _id: contact.users.id,
      id: contact.users.id,
      name: contact.users.name,
      email: contact.users.email
    } : null,
    leadId: contact.lead_id || null,
    organizationId: contact.organization_id || (contact.organizationId?._id || contact.organizationId || null),
    organization: contact.client_organizations 
      ? mapClientOrgToFrontend(contact.client_organizations) 
      : ((contact.organizationId && typeof contact.organizationId === 'object' && contact.organizationId.name)
        ? {
            _id: contact.organizationId._id,
            id: contact.organizationId._id,
            name: contact.organizationId.name,
            website: contact.organizationId.website || '',
            industry: contact.organizationId.industry || '',
            phone: contact.organizationId.phone || '',
            email: contact.organizationId.email || '',
            city: contact.organizationId.city || '',
            state: contact.organizationId.state || '',
            country: contact.organizationId.country || 'India',
            customData: contact.organizationId.customData || {},
          }
        : null),
    status: contact.status || 'Active',
    customData: contact.custom_data || {},
    createdAt: contact.created_at,
    updatedAt: contact.updated_at,
  };
}

export function mapDealToFrontend(deal) {
  if (!deal) return null;
  return {
    _id: deal.id,
    id: deal.id,
    title: deal.title,
    value: Number(deal.value) || 0,
    stage: deal.stage || 'Prospecting',
    closingDate: deal.closing_date,
    leadId: deal.lead_id || null,
    organizationId: deal.organization_id || (deal.organizationId?._id || deal.organizationId || null),
    organization: deal.client_organizations 
      ? mapClientOrgToFrontend(deal.client_organizations) 
      : ((deal.organizationId && typeof deal.organizationId === 'object' && deal.organizationId.name)
        ? {
            _id: deal.organizationId._id,
            id: deal.organizationId._id,
            name: deal.organizationId.name,
            website: deal.organizationId.website || '',
            industry: deal.organizationId.industry || '',
            phone: deal.organizationId.phone || '',
            email: deal.organizationId.email || '',
            city: deal.organizationId.city || '',
            state: deal.organizationId.state || '',
            country: deal.organizationId.country || 'India',
            customData: deal.organizationId.customData || {},
          }
        : null),
    assignedTo: deal.users ? {
      _id: deal.users.id,
      id: deal.users.id,
      name: deal.users.name,
      email: deal.users.email
    } : null,
    company: deal.company,
    contactEmail: deal.contact_email || '',
    contactPhone: deal.contact_phone || '',
    customData: deal.custom_data || {},
    createdAt: deal.created_at,
    updatedAt: deal.updated_at,
  };
}

export function mapTaskToFrontend(task) {
  if (!task) return null;
  return {
    _id: task.id,
    id: task.id,
    subject: task.subject,
    dueDate: task.due_date,
    priority: task.priority || 'Medium',
    status: task.status || 'Pending',
    notes: task.notes || '',
    assignedTo: task.users ? {
      _id: task.users.id,
      id: task.users.id,
      name: task.users.name,
      email: task.users.email,
      role: task.users.role || ''
    } : null,
    leadId: task.leads ? {
      _id: task.leads.id,
      id: task.leads.id,
      firstName: task.leads.first_name,
      lastName: task.leads.last_name || '',
      company: task.leads.company,
      status: task.leads.status
    } : (task.lead_id || null),
    contactId: task.contacts ? {
      _id: task.contacts.id,
      id: task.contacts.id,
      firstName: task.contacts.first_name,
      lastName: task.contacts.last_name || '',
      company: task.contacts.company,
      status: task.contacts.status
    } : (task.contact_id || null),
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  };
}

export function mapCallToFrontend(call) {
  if (!call) return null;
  return {
    _id: call.id,
    id: call.id,
    subject: call.subject,
    callType: call.call_type || 'Outbound',
    callDuration: Number(call.call_duration) || 0,
    callResult: call.call_result || 'Answered',
    callTime: call.call_time,
    notes: call.notes || '',
    assignedTo: call.users ? {
      _id: call.users.id,
      id: call.users.id,
      name: call.users.name,
      email: call.users.email,
      role: call.users.role || ''
    } : null,
    leadId: call.leads ? {
      _id: call.leads.id,
      id: call.leads.id,
      firstName: call.leads.first_name,
      lastName: call.leads.last_name || '',
      company: call.leads.company,
      status: call.leads.status
    } : (call.lead_id || null),
    contactId: call.contacts ? {
      _id: call.contacts.id,
      id: call.contacts.id,
      firstName: call.contacts.first_name,
      lastName: call.contacts.last_name || '',
      company: call.contacts.company,
      status: call.contacts.status
    } : (call.contact_id || null),
    createdAt: call.created_at,
    updatedAt: call.updated_at,
  };
}

export function mapMeetingToFrontend(meeting) {
  if (!meeting) return null;
  return {
    _id: meeting.id,
    id: meeting.id,
    title: meeting.title,
    startTime: meeting.start_time,
    endTime: meeting.end_time,
    locationType: meeting.location_type || 'Online',
    locationDetail: meeting.location_detail || '',
    agenda: meeting.agenda || '',
    status: meeting.status || 'Scheduled',
    assignedTo: meeting.users ? {
      _id: meeting.users.id,
      id: meeting.users.id,
      name: meeting.users.name,
      email: meeting.users.email,
      role: meeting.users.role || ''
    } : null,
    leadId: meeting.leads ? {
      _id: meeting.leads.id,
      id: meeting.leads.id,
      firstName: meeting.leads.first_name,
      lastName: meeting.leads.last_name || '',
      company: meeting.leads.company,
      status: meeting.leads.status
    } : (meeting.lead_id || null),
    contactId: meeting.contacts ? {
      _id: meeting.contacts.id,
      id: meeting.contacts.id,
      firstName: meeting.contacts.first_name,
      lastName: meeting.contacts.last_name || '',
      company: meeting.contacts.company,
      status: meeting.contacts.status
    } : (meeting.contact_id || null),
    createdAt: meeting.created_at,
    updatedAt: meeting.updated_at,
  };
}

export function mapProductToFrontend(product) {
  if (!product) return null;
  return {
    _id: product.id,
    id: product.id,
    name: product.name,
    sku: product.sku,
    price: Number(product.price) || 0,
    category: product.category || 'Software',
    description: product.description || '',
    status: product.status || 'Active',
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

export function mapQuotationToFrontend(quote) {
  if (!quote) return null;
  return {
    _id: quote.id,
    id: quote.id,
    quoteNumber: quote.quote_number,
    title: quote.title,
    contactId: quote.contacts ? {
      _id: quote.contacts.id,
      id: quote.contacts.id,
      firstName: quote.contacts.first_name,
      lastName: quote.contacts.last_name || '',
      company: quote.contacts.company || '',
      email: quote.contacts.email || ''
    } : (quote.contact_id || null),
    leadId: quote.leads ? {
      _id: quote.leads.id,
      id: quote.leads.id,
      firstName: quote.leads.first_name,
      lastName: quote.leads.last_name || '',
      company: quote.leads.company || ''
    } : (quote.lead_id || null),
    dealId: quote.deals ? {
      _id: quote.deals.id,
      id: quote.deals.id,
      title: quote.deals.title,
      value: Number(quote.deals.value) || 0
    } : (quote.deal_id || null),
    quoteDate: quote.quote_date,
    validUntil: quote.valid_until,
    lineItems: (quote.line_items || []).map(li => ({
      _id: li._id || li.id || li.productId,
      productId: li.productId,
      name: li.name,
      price: Number(li.price) || 0,
      quantity: Number(li.quantity) || 1,
      discount: Number(li.discount) || 0,
      total: Number(li.total) || 0
    })),
    subtotal: Number(quote.subtotal) || 0,
    taxRate: Number(quote.tax_rate) || 18,
    taxAmount: Number(quote.tax_amount) || 0,
    grandTotal: Number(quote.grand_total) || 0,
    notes: quote.notes || '',
    status: quote.status || 'Draft',
    assignedTo: quote.users ? {
      _id: quote.users.id,
      id: quote.users.id,
      name: quote.users.name,
      email: quote.users.email
    } : null,
    createdAt: quote.created_at,
    updatedAt: quote.updated_at,
  };
}

export function mapInvoiceToFrontend(invoice) {
  if (!invoice) return null;
  return {
    _id: invoice.id,
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    title: invoice.title,
    quotationId: invoice.quotation_id || null,
    contactId: invoice.contacts ? {
      _id: invoice.contacts.id,
      id: invoice.contacts.id,
      firstName: invoice.contacts.first_name,
      lastName: invoice.contacts.last_name || '',
      company: invoice.contacts.company || '',
      email: invoice.contacts.email || ''
    } : (invoice.contact_id || null),
    leadId: invoice.leads ? {
      _id: invoice.leads.id,
      id: invoice.leads.id,
      firstName: invoice.leads.first_name,
      lastName: invoice.leads.last_name || '',
      company: invoice.leads.company || ''
    } : (invoice.lead_id || null),
    dealId: invoice.deals ? {
      _id: invoice.deals.id,
      id: invoice.deals.id,
      title: invoice.deals.title,
      value: Number(invoice.deals.value) || 0
    } : (invoice.deal_id || null),
    invoiceDate: invoice.invoice_date,
    dueDate: invoice.due_date,
    lineItems: (invoice.line_items || []).map(li => ({
      _id: li._id || li.id || li.productId,
      productId: li.productId,
      name: li.name,
      price: Number(li.price) || 0,
      quantity: Number(li.quantity) || 1,
      discount: Number(li.discount) || 0,
      total: Number(li.total) || 0
    })),
    subtotal: Number(invoice.subtotal) || 0,
    taxRate: Number(invoice.tax_rate) || 18,
    taxAmount: Number(invoice.tax_amount) || 0,
    grandTotal: Number(invoice.grand_total) || 0,
    amountPaid: Number(invoice.amount_paid) || 0,
    balanceDue: Number(invoice.balance_due) || 0,
    status: invoice.status || 'Unpaid',
    payments: (invoice.payments || []).map(p => ({
      _id: p._id || p.id,
      amount: Number(p.amount) || 0,
      paymentDate: p.paymentDate || p.payment_date,
      paymentMethod: p.paymentMethod || p.payment_method,
      transactionRef: p.transactionRef || p.transaction_ref || '',
      notes: p.notes || ''
    })),
    notes: invoice.notes || '',
    assignedTo: invoice.users ? {
      _id: invoice.users.id,
      id: invoice.users.id,
      name: invoice.users.name,
      email: invoice.users.email
    } : null,
    createdAt: invoice.created_at,
    updatedAt: invoice.updated_at,
  };
}

export function mapTeamToFrontend(team) {
  if (!team) return null;
  return {
    _id: team.id,
    id: team.id,
    name: team.name,
    description: team.description || '',
    leader: team.leader_details ? {
      _id: team.leader_details.id,
      id: team.leader_details.id,
      name: team.leader_details.name,
      email: team.leader_details.email
    } : (team.leader || null),
    members: team.members_details ? team.members_details.map(m => ({
      _id: m.id,
      id: m.id,
      name: m.name,
      email: m.email
    })) : (team.members || []),
    region: team.region || 'General',
    targetAmount: Number(team.target_amount) || 0,
    createdAt: team.created_at,
    updatedAt: team.updated_at,
  };
}

export function mapEmailToFrontend(email) {
  if (!email) return null;
  return {
    _id: email.id,
    id: email.id,
    subject: email.subject,
    body: email.body,
    leadId: email.leads ? {
      _id: email.leads.id,
      id: email.leads.id,
      firstName: email.leads.first_name,
      company: email.leads.company
    } : (email.lead_id || null),
    contactId: email.contacts ? {
      _id: email.contacts.id,
      id: email.contacts.id,
      firstName: email.contacts.first_name,
      company: email.contacts.company
    } : (email.contact_id || null),
    sentBy: email.users ? {
      _id: email.users.id,
      id: email.users.id,
      name: email.users.name,
      email: email.users.email
    } : (email.sent_by || null),
    opensCount: email.opens_count || 0,
    openedAt: email.opened_at || [],
    downloadsCount: email.downloads_count || 0,
    downloadedAt: email.downloaded_at || [],
    replied: email.replied || false,
    repliedAt: email.replied_at || null,
    replyBody: email.reply_body || '',
    proposalFile: email.proposal_file || '',
    proposalFileData: email.proposal_file_data || '',
    proposalFileMimeType: email.proposal_file_mime_type || '',
    channel: email.channel || 'email',
    cc: email.cc || '',
    createdAt: email.created_at,
    updatedAt: email.updated_at,
  };
}


export function mapTicketCommentToFrontend(comment) {
  if (!comment) return null;
  return {
    _id: comment.id,
    id: comment.id,
    ticketId: comment.ticket_id,
    senderId: comment.sender_id,
    senderName: comment.sender_name,
    commentText: comment.comment_text,
    isInternal: comment.is_internal || false,
    createdAt: comment.created_at,
  };
}

export function mapTicketToFrontend(ticket) {
  if (!ticket) return null;
  return {
    _id: ticket.id,
    id: ticket.id,
    ticketId: ticket.ticket_id,
    title: ticket.title,
    description: ticket.description,
    ticketType: ticket.ticket_type,
    priority: ticket.priority || 'Medium',
    status: ticket.status || 'New',
    orgId: ticket.org_id,
    contactId: ticket.contacts ? {
      _id: ticket.contacts.id,
      id: ticket.contacts.id,
      firstName: ticket.contacts.first_name,
      lastName: ticket.contacts.last_name || '',
      email: ticket.contacts.email || ''
    } : (ticket.contact_id || null),
    assignedTo: ticket.users ? {
      _id: ticket.users.id,
      id: ticket.users.id,
      name: ticket.users.name,
      email: ticket.users.email,
      role: ticket.users.role || ''
    } : null,
    attachments: ticket.attachments || [],
    comments: ticket.ticket_comments ? ticket.ticket_comments.map(mapTicketCommentToFrontend) : [],
    resolvedAt: ticket.resolved_at || null,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
  };
}





