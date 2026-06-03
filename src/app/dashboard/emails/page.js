'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Users,
  UserCheck,
  Download,
  Eye,
  Reply,
  Sparkles,
  Flame,
  Activity,
  FileText,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Clock,
  ArrowRight,
  User,
  MessageSquare,
  Trash2
} from 'lucide-react';

export default function EmailHubPage() {
  // Page states
  const [emails, setEmails] = useState([]);
  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('leads'); // leads or contacts
  const [syncing, setSyncing] = useState(false);
  const [selectedEmailIds, setSelectedEmailIds] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const handleSelectEmail = (id) => {
    setSelectedEmailIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const visibleIds = filteredEmails.map((e) => e._id);
    const allSelected = visibleIds.every((id) => selectedEmailIds.includes(id));
    if (allSelected) {
      setSelectedEmailIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedEmailIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleDeleteEmails = async (idsToDelete) => {
    if (!idsToDelete || idsToDelete.length === 0) return;
    
    const confirmMessage = idsToDelete.length === 1
      ? 'Are you sure you want to delete this email campaign log?'
      : `Are you sure you want to delete ${idsToDelete.length} selected email campaign logs?`;
      
    if (!window.confirm(confirmMessage)) return;

    try {
      setDeleting(true);
      const res = await fetch('/api/emails', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsToDelete })
      });

      const data = await res.json();
      if (res.ok) {
        setSyncAlert({
          type: 'success',
          message: data.message || 'Selected campaign logs deleted successfully.'
        });
        setSelectedEmailIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
        await fetchData();
      } else {
        setSyncAlert({
          type: 'error',
          message: data.error || 'Failed to delete selected logs.'
        });
      }
    } catch (err) {
      console.error('Error deleting email logs:', err);
      setSyncAlert({
        type: 'error',
        message: 'A network error occurred while trying to delete logs.'
      });
    } finally {
      setDeleting(false);
    }
  };

  // Form states
  const [targetId, setTargetId] = useState('');
  const [cc, setCc] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState('');
  const [proposalFile, setProposalFile] = useState('Proposal.pdf');
  const [proposalFileData, setProposalFileData] = useState('');
  const [proposalFileMimeType, setProposalFileMimeType] = useState('');
  const [body, setBody] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setFormError('File size is too large. Please select a document under 10MB.');
      return;
    }

    setProposalFile(file.name);
    setProposalFileMimeType(file.type);
    setFormError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setProposalFileData(reader.result);
      setFormSuccess(`File "${file.name}" ready to be dispatched with active Innonsh-style tracking!`);
    };
    reader.onerror = () => {
      setFormError('Failed to parse the selected file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setProposalFile('Proposal.pdf');
    setProposalFileData('');
    setProposalFileMimeType('');
    setFormSuccess('');
    setFormError('');
  };

  // Sync Alert states
  const [syncAlert, setSyncAlert] = useState(null);
  const [activeConversationEmail, setActiveConversationEmail] = useState(null);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch initial campaign, leads, and contacts data
  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch sent emails
      const emailsRes = await fetch('/api/emails');
      let emailsData = { emails: [] };
      if (emailsRes.ok) {
        emailsData = await emailsRes.json();
      }

      // 2. Fetch Leads
      const leadsRes = await fetch('/api/leads');
      let leadsData = { leads: [] };
      if (leadsRes.ok) {
        leadsData = await leadsRes.json();
      }

      // 3. Fetch Contacts
      const contactsRes = await fetch('/api/contacts');
      let contactsData = { contacts: [] };
      if (contactsRes.ok) {
        contactsData = await contactsRes.json();
      }

      setEmails(emailsData.emails || []);
      setLeads(leadsData.leads || []);
      setContacts(contactsData.contacts || []);

      // Autofill first lead/contact as target in composition form
      if (activeTab === 'leads' && leadsData.leads?.length > 0) {
        setTargetId(leadsData.leads[0]._id);
      } else if (activeTab === 'contacts' && contactsData.contacts?.length > 0) {
        setTargetId(contactsData.contacts[0]._id);
      }

    } catch (err) {
      console.error('Error fetching email campaign data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync composition form targets when tab changes
  useEffect(() => {
    if (activeTab === 'leads' && leads.length > 0) {
      setTargetId(leads[0]._id);
    } else if (activeTab === 'contacts' && contacts.length > 0) {
      setTargetId(contacts[0]._id);
    } else {
      setTargetId('');
    }
  }, [activeTab, leads, contacts]);

  // Handle Dispatch Email Campaign
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!targetId) {
      setFormError('Please select a target recipient.');
      return;
    }
    if (!subject.trim()) {
      setFormError('Please enter a subject.');
      return;
    }
    try {
      setSending(true);
      setFormSuccess('');
      setFormError('');

      const defaultTemplateBody = "Hi {{firstName}},\n\nI hope you are doing well!\n\nI have reviewed your requirements from {{company}} and prepared a detailed proposal for our corporate CRM implementation services.\n\nPlease find the attached estimate ({{proposalFile}}) and download it to review the pricing details.\n\nLooking forward to hearing your thoughts!\n\nBest regards,\nSales Team";
      const finalEmailBody = body.trim() || defaultTemplateBody;

      const emailPayload = {
        subject,
        body: finalEmailBody.replace(/\{\{proposalFile\}\}/g, proposalFile || 'Proposal.pdf'),
        leadId: activeTab === 'leads' ? targetId : null,
        contactId: activeTab === 'contacts' ? targetId : null,
        proposalFile: proposalFile || '',
        proposalFileData: proposalFileData || '',
        proposalFileMimeType: proposalFileMimeType || '',
        channel: 'email',
        cc: cc.trim()
      };

      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });

      const data = await res.json();
      if (res.ok) {
        setFormSuccess('Email dispatched successfully! Tracking pixel and proposal attachment download links are embedded.');
        setSubject('');
        setCc('');
        setShowCc(false);
        setProposalFileData('');
        setProposalFileMimeType('');
        setProposalFile('Proposal.pdf');
        // Reload statistics and feed list
        await fetchData();
      } else {
        setFormError(data.error || 'Failed to dispatch campaign.');
      }
    } catch (err) {
      console.error('Email compose error:', err);
      setFormError('An unexpected server error occurred.');
    } finally {
      setSending(false);
    }
  };

  // Handle WhatsApp Proposal Generation & Redirect
  const handleSendWhatsApp = async (e, mode) => {
    e.preventDefault();
    if (!targetId) {
      setFormError('Please select a target recipient.');
      return;
    }

    // Find active recipient details
    const activeRecipient = activeTab === 'leads'
      ? leads.find(l => l._id === targetId)
      : contacts.find(c => c._id === targetId);

    if (!activeRecipient) {
      setFormError('Recipient details not found.');
      return;
    }

    const phone = activeRecipient.phone;
    if (!phone) {
      setFormError(`Recipient ${activeRecipient.firstName} does not have a phone number registered. Please add a phone number to their profile first!`);
      return;
    }

    try {
      setSending(true);
      setFormSuccess('');
      setFormError('');

      const defaultTemplateBody = "Hi {{firstName}},\n\nI hope you are doing well!\n\nI have reviewed your requirements from {{company}} and prepared a detailed proposal for our corporate CRM implementation services.\n\nPlease find the attached estimate ({{proposalFile}}) and download it to review the pricing details.\n\nLooking forward to hearing your thoughts!\n\nBest regards,\nSales Team";
      const rawBody = body.trim() || defaultTemplateBody;
      const replacedBody = rawBody
        .replace(/\{\{firstName\}\}/g, activeRecipient.firstName || 'Client')
        .replace(/\{\{company\}\}/g, activeRecipient.company || 'your company')
        .replace(/\{\{proposalFile\}\}/g, proposalFile || 'Proposal.pdf');

      // Create a trackable email/proposal log in the database (SMTP will be bypassed for WhatsApp log)
      const emailPayload = {
        subject: subject.trim() || `Sales Proposal for ${activeRecipient.company || 'Client'}`,
        body: replacedBody,
        leadId: activeTab === 'leads' ? targetId : null,
        contactId: activeTab === 'contacts' ? targetId : null,
        proposalFile: proposalFile || '',
        proposalFileData: proposalFileData || '',
        proposalFileMimeType: proposalFileMimeType || '',
        channel: mode, // 'whatsapp' or 'both'
        cc: cc.trim()
      };

      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });

      const data = await res.json();
      if (res.ok) {
        // Construct the trackable download URL pointing dynamically to our live domain
        const liveDomain = window.location.origin;
        const trackUrl = `${liveDomain}/api/emails/track/download?id=${data.email._id}`;

        // Construct the professional WhatsApp message text with clean formatting
        const whatsappText = `Hi ${activeRecipient.firstName || 'Client'},\n\nI hope you are doing well!\n\nI have prepared a detailed proposal for *${activeRecipient.company || 'your company'}*.\n\nPlease click the secure link below to view and download the official document directly on your screen:\n👉 ${trackUrl}\n\nLooking forward to your thoughts!\n\nBest regards,\nSales Team`;

        // Format phone number to clean digits
        const cleanPhone = phone.replace(/[^0-9]/g, '');

        // Generate the WhatsApp Web/App Click-to-Chat URL
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappText)}`;

        // Open WhatsApp in a new window/tab
        window.open(whatsappUrl, '_blank');

        const successMessage = mode === 'both'
          ? 'Tracked Proposal generated successfully! Dispatching Email campaign and opening WhatsApp chat window...'
          : 'Tracked Proposal generated successfully! Opening WhatsApp chat window...';
          
        setFormSuccess(successMessage);
        setSubject('');
        setCc('');
        setShowCc(false);
        setProposalFileData('');
        setProposalFileMimeType('');
        setProposalFile('Proposal.pdf');
        
        // Refresh statistics and list
        await fetchData();
      } else {
        setFormError(data.error || 'Failed to generate proposal log.');
      }
    } catch (err) {
      console.error('Error generating WhatsApp proposal:', err);
      setFormError('Failed to generate tracking link for WhatsApp.');
    } finally {
      setSending(false);
    }
  };

  // Handle manual real inbox sync via Gmail IMAP
  const handleSyncEmails = async () => {
    try {
      setSyncing(true);
      setSyncAlert(null);
      
      const res = await fetch('/api/emails/sync');
      const data = await res.json();
      
      if (res.ok) {
        setSyncAlert({
          type: 'success',
          message: data.message || 'Mailbox synchronization completed!'
        });
        // Reload all metrics and tables
        await fetchData();
      } else {
        setSyncAlert({
          type: 'error',
          message: data.error || 'Server error during mailbox sync.'
        });
      }
    } catch (err) {
      console.error('Email inbox sync error:', err);
      setSyncAlert({
        type: 'error',
        message: 'Network connection error or timeout.'
      });
    } finally {
      setSyncing(false);
    }
  };

  // Analytics aggregates calculation
  const totalSent = emails.length;
  const totalOpens = emails.reduce((sum, e) => sum + (e.opensCount || 0), 0);
  const totalDownloads = emails.reduce((sum, e) => sum + (e.downloadsCount || 0), 0);
  const totalReplies = emails.filter(e => e.replied).length;

  const openRate = totalSent > 0 ? Math.round((emails.filter(e => e.opensCount > 0).length / totalSent) * 100) : 0;
  const downloadRate = totalSent > 0 ? Math.round((emails.filter(e => e.downloadsCount > 0).length / totalSent) * 100) : 0;
  const replyRate = totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : 0;

  // Filtered emails based on search query
  const filteredEmails = emails.filter(email => {
    const q = searchQuery.toLowerCase();
    const subMatch = email.subject?.toLowerCase().includes(q);
    const bodyMatch = email.body?.toLowerCase().includes(q);
    const fileMatch = email.proposalFile?.toLowerCase().includes(q);

    let leadMatch = false;
    let contactMatch = false;

    if (email.leadId) {
      const name = `${email.leadId.firstName || ''} ${email.leadId.lastName || ''} ${email.leadId.company || ''}`.toLowerCase();
      leadMatch = name.includes(q);
    }
    if (email.contactId) {
      const name = `${email.contactId.firstName || ''} ${email.contactId.lastName || ''} ${email.contactId.company || ''}`.toLowerCase();
      contactMatch = name.includes(q);
    }

    return subMatch || bodyMatch || fileMatch || leadMatch || contactMatch;
  });

  const getRecipientName = (email) => {
    if (email.leadId) {
      return `${email.leadId.firstName} ${email.leadId.lastName || ''} (${email.leadId.company})`;
    }
    if (email.contactId) {
      return `${email.contactId.firstName} ${email.contactId.lastName || ''} (${email.contactId.company})`;
    }
    if (email.subject?.includes('Welcome to Innonsh')) {
      return 'Registered Applicant';
    }
    if (email.subject?.includes('Access Request')) {
      return 'System Administrator';
    }
    return 'Unknown Recipient';
  };

  const getRecipientType = (email) => {
    if (email.leadId) return { label: 'Lead', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    if (email.contactId) return { label: 'Contact', color: 'bg-teal-50 text-teal-700 border-teal-200' };
    if (email.subject?.includes('Welcome to Innonsh')) return { label: 'Access Request', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    if (email.subject?.includes('Access Request')) return { label: 'System Admin Alert', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'General', color: 'bg-slate-100 text-slate-700 border-slate-200' };
  };



  return (
    <div className="space-y-6">
      {/* Dynamic Glassmorphic Top Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 p-6 md:p-8 text-white shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.1),transparent_60%)]"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider mb-3">
              <Sparkles className="h-3 w-3 animate-pulse" /> Real-time Email Campaign Tracking
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Email Campaigns & Proposal Engagement Hub</h1>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Dispatched proposals are automatically embedded with invisible 1x1 open-tracking pixels and secure PDF download monitoring routes.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all border border-indigo-500 active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Hub
          </button>
        </div>
      </div>

      {/* Analytics Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Dispatch */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between hover:shadow-md transition duration-200">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Sent</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{totalSent}</span>
            <span className="text-[10px] text-slate-500 font-medium block mt-1.5">Tracked Campaigns Logged</span>
          </div>
          <div className="h-11 w-11 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
            <Mail className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Proposal Downloads */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between hover:shadow-md transition duration-200">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">PDF Downloads</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-800 block">{totalDownloads}</span>
              <span className="text-xs font-bold text-sky-600 font-mono">({downloadRate}%)</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block mt-1.5">High-Intent Document Fetches</span>
          </div>
          <div className="h-11 w-11 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-550 shrink-0">
            <Download className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3: Response Rate */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between hover:shadow-md transition duration-200">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Client Responses</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-800 block">{totalReplies}</span>
              <span className="text-xs font-bold text-violet-600 font-mono">({replyRate}%)</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block mt-1.5">Auto-followups assigned</span>
          </div>
          <div className="h-11 w-11 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-500 shrink-0">
            <Reply className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Compose Tracked Sales Proposal Form */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
          <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <Mail className="h-4 w-4 text-emerald-500" /> Compose Tracked Sales Proposal
          </h2>
          <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('leads')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${activeTab === 'leads' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              To Lead
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('contacts')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${activeTab === 'contacts' ? 'bg-white text-teal-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              To Contact
            </button>
          </div>
        </div>

        <form onSubmit={handleSendEmail} className="space-y-4 text-left">
          {/* Recipient Dropdown Selection */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
              Target Recipient ({activeTab === 'leads' ? 'Leads Directory' : 'Contacts Directory'})
            </label>
            {activeTab === 'leads' ? (
              leads.length === 0 ? (
                <div className="text-xs text-rose-500 bg-rose-50 p-2.5 rounded-lg border border-rose-100 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  No leads exist in the directory. Please create a lead first!
                </div>
              ) : (
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500 transition"
                >
                  {leads.map(l => (
                    <option key={l._id} value={l._id}>
                      {l.firstName} {l.lastName} - {l.company} ({l.email || 'No email'})
                    </option>
                  ))}
                </select>
              )
            ) : (
              contacts.length === 0 ? (
                <div className="text-xs text-rose-500 bg-rose-50 p-2.5 rounded-lg border border-rose-100 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  No contacts exist in the directory. Please create a contact first!
                </div>
              ) : (
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-teal-500 transition"
                >
                  {contacts.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.firstName} {c.lastName} - {c.company} ({c.email || 'No email'})
                    </option>
                  ))}
                </select>
              )
            )}
          </div>

          {/* CC Recipient Selection */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                CC Recipients
              </label>
              <button
                type="button"
                onClick={() => {
                  if (showCc) {
                    setCc(''); // Clear input if user closes the field
                  }
                  setShowCc(!showCc);
                }}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
              >
                {showCc ? '✕ Remove CC' : '+ Add CC'}
              </button>
            </div>
            {showCc && (
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="manager@company.com, info@company.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500 transition"
              />
            )}
          </div>

          {/* Proposal File and Subject */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                Embedded Proposal Document (Innonsh-Style)
              </label>
              <div className="relative flex items-center gap-2">
                <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-350 rounded-lg text-xs font-bold text-slate-705 cursor-pointer transition active:scale-95">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  Choose File
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {proposalFileData ? (
                  <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1.5 rounded-lg text-[10px] font-extrabold max-w-[180px] truncate">
                    <span className="truncate">📎 {proposalFile}</span>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-rose-500 hover:text-rose-700 font-bold shrink-0 ml-1 cursor-pointer"
                      title="Remove File"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">No real file selected (default tracked PDF will be used)</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                Campaign Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Proposal Estimate for {{company}}"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Email Body & Templates Guide */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                Email Body Content
              </label>
              <span className="text-[8px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                Use placeholders: {"{{firstName}}"}, {"{{name}}"}, {"{{company}}"}
              </span>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows="9"
              placeholder={"Hi {{firstName}},\n\nI hope you are doing well!\n\nI have reviewed your requirements from {{company}} and prepared a detailed proposal for our corporate CRM implementation services.\n\nPlease find the attached estimate ({{proposalFile}}) and download it to review the pricing details.\n\nLooking forward to hearing your thoughts!\n\nBest regards,\nSales Team"}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-medium text-slate-700 font-mono focus:outline-none focus:border-indigo-500 transition leading-relaxed"
            ></textarea>
          </div>

          {formSuccess && (
            <div className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-start gap-2.5 leading-relaxed">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-lg flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Email Only Button */}
            <button
              type="submit"
              disabled={sending || (activeTab === 'leads' && leads.length === 0) || (activeTab === 'contacts' && contacts.length === 0)}
              className="flex items-center justify-center gap-1.5 px-3 py-3 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-md transition disabled:opacity-50 active:scale-[0.99] cursor-pointer"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {sending ? 'Sending...' : 'Email Only'}
            </button>

            {/* WhatsApp Only Button */}
            <button
              type="button"
              onClick={(e) => handleSendWhatsApp(e, 'whatsapp')}
              disabled={sending || (activeTab === 'leads' && leads.length === 0) || (activeTab === 'contacts' && contacts.length === 0)}
              className="flex items-center justify-center gap-1.5 px-3 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-md transition disabled:opacity-50 active:scale-[0.99] cursor-pointer"
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              {sending ? 'Generating...' : 'WhatsApp Only'}
            </button>

            {/* Both Email & WhatsApp Button */}
            <button
              type="button"
              onClick={(e) => handleSendWhatsApp(e, 'both')}
              disabled={sending || (activeTab === 'leads' && leads.length === 0) || (activeTab === 'contacts' && contacts.length === 0)}
              className="flex items-center justify-center gap-1.5 px-3 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-md transition disabled:opacity-50 active:scale-[0.99] cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-pulse shrink-0" />
              {sending ? 'Both...' : 'Both (Email & WA)'}
            </button>
          </div>

          {/* Premium Innonsh-style Active Email & Proposal Tracking Guidelines Card */}
          <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left relative overflow-hidden transition hover:shadow-md duration-200">
            <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-emerald-500/5 to-transparent pointer-events-none rounded-bl-full"></div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-wider mb-2.5">
              <Sparkles className="h-2.5 w-2.5 text-emerald-600" /> Active Tracking Engine Guidelines
            </div>
            <div className="space-y-3 text-[11px] text-slate-650 leading-relaxed font-medium">
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-500 shrink-0 text-xs mt-0.5">👁️</span>
                <div>
                  <span className="font-extrabold text-slate-800 block">Invisible Pixel Open Tracking</span>
                  Dispatched campaign emails automatically inject a 1x1 invisible pixel to log email view count and representative notifications instantly.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-sky-500 shrink-0 text-xs mt-0.5">📎</span>
                <div>
                  <span className="font-extrabold text-slate-800 block">Tracked PDF Redirection</span>
                  Proposal attachments are wrapped inside secure URL redirection links. Clicking them increments Lead Score (+20) and triggers download events.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-violet-500 shrink-0 text-xs mt-0.5">💬</span>
                <div>
                  <span className="font-extrabold text-slate-800 block">On-Demand Mailbox Sync</span>
                  Click "Sync Replies" anytime to securely download incoming client email replies and display them in clean, modern chat bubble logs.
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Bottom Section: Sent Campaigns Table & Feed */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 text-left">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200 mb-5">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Mail className="h-4 w-4 text-emerald-500" /> Outbox Campaigns Logs
            </h2>
            <p className="text-[10px] text-slate-400 mt-1 font-medium block">
              Complete catalog of dispatched emails and real-time proposal tracking statistics.
            </p>
          </div>

          <div className="flex w-full md:w-auto items-center gap-3 shrink-0 flex-wrap md:flex-nowrap">
            {selectedEmailIds.length > 0 && (
              <button
                onClick={() => handleDeleteEmails(selectedEmailIds)}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg shadow-sm border border-rose-550 transition disabled:opacity-50 active:scale-[0.98] cursor-pointer"
                title="Delete selected email logs from history."
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Selected ({selectedEmailIds.length})
              </button>
            )}
            {/* Manual Sync Replies Button */}
            <button
              onClick={handleSyncEmails}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg shadow-sm border border-emerald-500/20 transition disabled:opacity-50 active:scale-[0.98] cursor-pointer"
              title="Connect securely to your mail server via IMAP and synchronize real-world client replies in real-time."
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Replies 🔄'}
            </button>
            <div className="w-full md:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sent campaigns..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Sync Alert Banner */}
        {syncAlert && (
          <div className={`mb-5 p-4 rounded-xl border flex items-start justify-between gap-3 text-xs leading-relaxed transition-all duration-300 ${
            syncAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-start gap-2.5">
              {syncAlert.type === 'success' ? (
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-extrabold block">
                  {syncAlert.type === 'success' ? 'Synchronization Successful' : 'Synchronization Failed'}
                </span>
                <span className="font-medium">{syncAlert.message}</span>
              </div>
            </div>
            <button
              onClick={() => setSyncAlert(null)}
              className="text-slate-400 hover:text-slate-650 font-bold shrink-0 cursor-pointer text-sm transition"
              title="Dismiss Alert"
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-500 italic text-xs flex flex-col items-center gap-2">
            <RefreshCw className="h-6 w-6 text-emerald-500 animate-spin" />
            Synchronizing campaign metrics...
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="py-12 text-center text-slate-500 italic text-xs bg-slate-50 rounded-xl border border-dashed">
            No matched tracked email campaigns logged in the outbox.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-medium text-slate-600 min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="pb-3 text-left pl-2 w-10">
                    <input
                      type="checkbox"
                      checked={filteredEmails.length > 0 && filteredEmails.every(e => selectedEmailIds.includes(e._id))}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5"
                    />
                  </th>
                  <th className="pb-3 text-left">Recipient</th>
                  <th className="pb-3 text-left">Subject Line</th>
                  <th className="pb-3 text-center">Proposal PDF File</th>
                  <th className="pb-3 text-center">Status States</th>
                  <th className="pb-3 text-right pr-2">Dispatched At</th>
                  <th className="pb-3 text-center pr-2 w-10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmails.map((email) => {
                  const rType = getRecipientType(email);
                  const isSelected = selectedEmailIds.includes(email._id);
                  return (
                    <tr key={email._id} className={`hover:bg-slate-50/50 transition ${isSelected ? 'bg-indigo-50/30 hover:bg-indigo-50/45' : ''}`}>
                      {/* Checkbox column */}
                      <td className="py-3.5 pl-2 text-left w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectEmail(email._id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5"
                        />
                      </td>

                      {/* Recipient info */}
                      <td className="py-3.5 text-left">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded border ${rType.color}`}>
                            {rType.label}
                          </span>
                          <span className="font-extrabold text-slate-800 block">
                            {getRecipientName(email)}
                          </span>
                        </div>
                      </td>

                      {/* Subject and body snippet */}
                      <td className="py-3.5 text-left max-w-xs">
                        <span className="font-bold text-slate-800 block truncate" title={email.subject}>
                          {email.subject}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate mt-0.5 max-w-[200px]">
                          {email.body}
                        </span>
                      </td>

                      {/* Attached proposal */}
                      <td className="py-3.5 text-center">
                        {email.proposalFile ? (
                          <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 border border-slate-200">
                            <span className="font-mono text-[10px] text-slate-700 font-bold">
                              📎 {email.proposalFile}
                            </span>
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0"></span>
                            <span className="font-semibold text-slate-500 font-mono text-[9px]">
                              {email.downloadsCount || 0} downloads
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">None Attached</span>
                        )}
                      </td>

                      {/* Status Badges */}
                      <td className="py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Channel indicator */}
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                            email.channel === 'whatsapp'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : email.channel === 'both'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                            {email.channel === 'whatsapp' ? 'WA 📱' : (email.channel === 'both' ? 'Both ⚡' : 'Email 📧')}
                          </span>

                          {/* Download indicator */}
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${email.downloadsCount > 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}>
                            {email.downloadsCount > 0 ? 'Downloaded 📥' : 'Sent'}
                          </span>

                          {/* Reply indicator */}
                          <span 
                            onClick={() => setActiveConversationEmail(email)}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold border cursor-pointer transition duration-150 active:scale-95 ${email.replied
                              ? 'bg-violet-100 text-violet-750 border-violet-200 hover:bg-violet-200 hover:shadow-sm'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                            }`}
                            title={email.replied ? "View Client Response Content" : "View Outgoing Message Details"}
                          >
                            {email.replied ? 'Replied 💬' : 'Unreplied'}
                          </span>
                        </div>
                      </td>

                      {/* Dispatched At date */}
                      <td className="py-3.5 text-right pr-2 text-slate-500 font-mono text-[10px] whitespace-nowrap">
                        <span className="block font-bold">
                          {new Date(email.createdAt).toLocaleDateString('en-IN', { dateStyle: 'short' })}
                        </span>
                        <span className="block text-[9px] text-slate-400 mt-0.5">
                          {new Date(email.createdAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                        </span>
                      </td>

                      {/* Actions column */}
                      <td className="py-3.5 text-center pr-2 w-10">
                        <button
                          onClick={() => handleDeleteEmails([email._id])}
                          disabled={deleting}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition duration-150 active:scale-90 disabled:opacity-50 cursor-pointer"
                          title="Delete Email Log"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Premium Innonsh-style Email Conversation History Modal */}
      {activeConversationEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-4 text-white flex justify-between items-center shrink-0">
              <div>
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block font-sans">Innonsh-style Email Viewer</span>
                <h3 className="text-sm font-extrabold truncate max-w-md" title={activeConversationEmail.subject}>
                  {activeConversationEmail.subject}
                </h3>
              </div>
              <button 
                onClick={() => setActiveConversationEmail(null)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold transition cursor-pointer active:scale-95"
              >
                ✕
              </button>
            </div>

            {/* Modal Conversation Body - Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 bg-slate-50 flex-1 min-h-[300px]">
              
              {/* Recipient info & stats badge row */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-150 shadow-sm text-xs text-left">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">To:</span>
                    <span className="font-extrabold text-slate-800">{getRecipientName(activeConversationEmail)}</span>
                  </div>
                  {activeConversationEmail.cc && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">CC:</span>
                      <span className="font-semibold text-slate-700">{activeConversationEmail.cc}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-slate-400 font-medium">Sent At:</span>
                    <span className="text-slate-600 font-semibold font-mono">
                      {new Date(activeConversationEmail.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                    activeConversationEmail.channel === 'whatsapp'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : activeConversationEmail.channel === 'both'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {activeConversationEmail.channel === 'whatsapp' ? 'WA 📱' : (activeConversationEmail.channel === 'both' ? 'Both ⚡' : 'Email 📧')}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                    activeConversationEmail.downloadsCount > 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}>
                    {activeConversationEmail.downloadsCount > 0 ? `Downloaded (${activeConversationEmail.downloadsCount}x) 📥` : 'Sent'}
                  </span>
                </div>
              </div>

              {/* Message 1: Outgoing Email Sent by Sales Rep */}
              <div className="flex flex-col items-end space-y-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider pr-1">
                  You Sent:
                </span>
                <div className="bg-slate-800 text-white rounded-2xl rounded-tr-none px-4 py-3.5 shadow-md border border-slate-700 max-w-[85%] text-left leading-relaxed text-xs">
                  <p className="whitespace-pre-wrap font-sans">{activeConversationEmail.body}</p>
                  
                  {activeConversationEmail.proposalFile && (
                    <div className="mt-3 pt-2.5 border-t border-slate-700/80 flex items-center justify-between text-[10px] text-sky-300 font-bold font-mono">
                      <span className="truncate">📎 Attachment: {activeConversationEmail.proposalFile}</span>
                      <span className="bg-sky-500/10 px-2 py-0.5 rounded border border-sky-400/20 text-[9px] font-semibold font-mono">
                        {activeConversationEmail.downloadsCount || 0} downloads
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message 2: Incoming Email Reply from Client */}
              {activeConversationEmail.replied ? (
                <div className="flex flex-col items-start space-y-1">
                  <div className="flex items-center gap-1.5 pl-1">
                    <span className="text-[9px] text-violet-600 font-black uppercase tracking-wider">
                      Client Replied:
                    </span>
                    <span className="text-[8px] text-slate-400 font-mono">
                      {activeConversationEmail.repliedAt 
                        ? new Date(activeConversationEmail.repliedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                        : ''}
                    </span>
                  </div>
                  <div className="bg-gradient-to-br from-violet-50 to-indigo-50 text-slate-850 rounded-2xl rounded-tl-none px-4 py-3.5 shadow-md border border-violet-200 max-w-[85%] text-left leading-relaxed text-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-10 w-10 bg-gradient-to-bl from-violet-200/20 to-transparent pointer-events-none rounded-bl-full"></div>
                    <p className="whitespace-pre-wrap font-mono italic text-slate-750 font-semibold">
                      "{activeConversationEmail.replyBody || "Hi team, the proposal looks amazing. Let's schedule a call tomorrow to finalize!"}"
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-slate-400 italic text-[11px] bg-slate-100/50 rounded-xl border border-dashed border-slate-200">
                  ⏳ Awaiting response from client. No reply logs registered yet.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-2.5 shrink-0">
              <button
                onClick={() => setActiveConversationEmail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-350 text-slate-700 text-xs font-extrabold uppercase tracking-wider rounded-xl transition duration-150 active:scale-95 cursor-pointer"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
