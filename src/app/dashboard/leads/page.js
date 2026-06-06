'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  Search, 
  Plus, 
  Filter, 
  User, 
  Users,
  Building, 
  Mail, 
  Phone, 
  Clock, 
  Trash2, 
  Briefcase, 
  X, 
  MessageSquare, 
  Calendar, 
  ChevronRight, 
  Sparkles, 
  PlusCircle, 
  CheckCircle,
  FileText,
  MessageCircle,
  MapPin,
  Globe,
  BriefcaseIcon,
  DollarSign,
  AlertTriangle,
  Download,
  Upload,
  ChevronLeft,
  Info,
  Paperclip,
  File,
  Edit,
  Tag,
  Hash
} from 'lucide-react';

// Helper to safely parse Postgres date strings in strict browsers (like Safari)
const safeNewDate = (dateVal) => {
  if (!dateVal) return new Date();
  let dateStr = String(dateVal);
  if (dateStr.includes(' ') && !dateStr.includes('T')) {
    dateStr = dateStr.replace(' ', 'T');
  }
  return new Date(dateStr);
};

// Helper to convert local datetime-local value (YYYY-MM-DDTHH:MM) to UTC ISO string before saving to database
const localToUTCISO = (localTimeStr) => {
  if (!localTimeStr) return null;
  const date = new Date(localTimeStr);
  return isNaN(date.getTime()) ? null : date.toISOString();
};

const getCustomFieldIcon = (iconName) => {
  switch (iconName) {
    case 'user': return User;
    case 'building': return Building;
    case 'phone': return Phone;
    case 'mail': return Mail;
    case 'globe': return Globe;
    case 'calendar': return Calendar;
    case 'dollarsign': return DollarSign;
    case 'briefcase': return Briefcase;
    case 'info': return Info;
    case 'tag': return Tag;
    case 'hash': return Hash;
    case 'messagecircle': return MessageCircle;
    default: return null;
  }
};

export default function LeadsPage() {
  const router = useRouter();
  // Page core states
  const [leads, setLeads] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [salesReps, setSalesReps] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [repFilter, setRepFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Selected lead for detail slide-over
  const [selectedLead, setSelectedLead] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editLostReason, setEditLostReason] = useState('');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const attachmentInputRef = useRef(null);

  // Advanced Create Lead Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [industry, setIndustry] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [priority, setPriority] = useState('Warm');
  const [leadStatus, setLeadStatus] = useState('New');
  const [lostReason, setLostReason] = useState('');
  const [leadSource, setLeadSource] = useState('Website');
  const [requirements, setRequirements] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [autoAssign, setAutoAssign] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [interestedProduct, setInterestedProduct] = useState('');
  const [followUpType, setFollowUpType] = useState('None');
  const [customFields, setCustomFields] = useState([]);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  // Org-level defined custom field definitions (from Custom Fields Manager)
  const [orgCustomFieldDefs, setOrgCustomFieldDefs] = useState([]);
  const [orgCustomFieldValues, setOrgCustomFieldValues] = useState({});
  const [hiddenStandardFields, setHiddenStandardFields] = useState([]);

  // Edit Lead Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLeadFirstName, setEditLeadFirstName] = useState('');
  const [editLeadLastName, setEditLeadLastName] = useState('');
  const [editLeadCompany, setEditLeadCompany] = useState('');
  const [editLeadDesignation, setEditLeadDesignation] = useState('');
  const [editLeadEmail, setEditLeadEmail] = useState('');
  const [editLeadPhone, setEditLeadPhone] = useState('');
  const [editLeadWhatsapp, setEditLeadWhatsapp] = useState('');
  const [editLeadWebsite, setEditLeadWebsite] = useState('');
  const [editLeadCity, setEditLeadCity] = useState('');
  const [editLeadState, setEditLeadState] = useState('');
  const [editLeadCountry, setEditLeadCountry] = useState('India');
  const [editLeadIndustry, setEditLeadIndustry] = useState('');
  const [editLeadEmployeeCount, setEditLeadEmployeeCount] = useState('');
  const [editLeadAnnualRevenue, setEditLeadAnnualRevenue] = useState('');
  const [editLeadPriority, setEditLeadPriority] = useState('Warm');
  const [editLeadStatus, setEditLeadStatus] = useState('New');
  const [editLeadLostReason, setEditLeadLostReason] = useState('');
  const [editLeadSource, setEditLeadSource] = useState('Website');
  const [editLeadRequirements, setEditLeadRequirements] = useState('');
  const [editLeadInterestedProduct, setEditLeadInterestedProduct] = useState('');
  const [editLeadFollowUpType, setEditLeadFollowUpType] = useState('None');
  const [editLeadNextFollowUpDate, setEditLeadNextFollowUpDate] = useState('');
  const [editLeadAssignedTo, setEditLeadAssignedTo] = useState('');
  const [editLeadCustomFields, setEditLeadCustomFields] = useState([]);
  const [editLeadCustomData, setEditLeadCustomData] = useState({});
  const [editLeadIsPublic, setEditLeadIsPublic] = useState(false);

  // Convert Deal Form state
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [closingDate, setClosingDate] = useState('');

  // Form error states
  const [formError, setFormError] = useState('');

  // Toast helper
  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage({ text: '', type: '' });
    }, 4000);
  };

  // Fetch current session and lists
  useEffect(() => {
    async function initPage() {
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData.user);

          // Fetch dynamic active products catalog list
          const productsRes = await fetch('/api/products?status=Active');
          if (productsRes.ok) {
            const productsData = await productsRes.json();
            setProducts(productsData.products || []);
          }

          if (userData.user.role === 'owner' || userData.user.role === 'sales_admin') {
            const repsRes = await fetch('/api/users');
            if (repsRes.ok) {
              const repsData = await repsRes.json();
              setSalesReps(repsData.users || []);
            }
          }

          // Fetch org-level custom field definitions & standard visibility settings
          try {
            const [cfRes, stdRes] = await Promise.all([
              fetch('/api/tenant/custom-fields?module=leads'),
              fetch('/api/tenant/standard-fields'),
            ]);
            if (cfRes.ok) {
              const cfData = await cfRes.json();
              setOrgCustomFieldDefs(cfData.fields || []);
            }
            if (stdRes.ok) {
              const stdData = await stdRes.json();
              setHiddenStandardFields(stdData.hiddenFields || []);
            }
          } catch (cfErr) {
            console.error('Fetch custom field/standard layout error:', cfErr);
          }
        }
      } catch (err) {
        console.error('Page init error:', err);
      }
    }
    initPage();
  }, []);

  // Fetch leads with advanced filters applied
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (statusFilter) queryParams.append('status', statusFilter);
      if (sourceFilter) queryParams.append('source', sourceFilter);
      if (priorityFilter) queryParams.append('priority', priorityFilter);
      if (repFilter) queryParams.append('assignedTo', repFilter);
      if (sortBy) queryParams.append('sortBy', sortBy);

      const res = await fetch(`/api/leads?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setCurrentPage(1); // Reset to page 1 on new filter results
      }
    } catch (err) {
      console.error('Fetch leads failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLeads();
  }, [search, statusFilter, sourceFilter, priorityFilter, repFilter, sortBy]);

  // Handle lead select and fetch details
  const handleSelectLead = async (leadId) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedLead(data.lead);
        setEditStatus(data.lead.status);
        setEditLostReason(data.lead.lostReason || '');
        setIsEditingStatus(false);
      }
    } catch (err) {
      console.error('Fetch lead detail failed:', err);
    }
  };

  // Add Dynamic Custom Field
  const handleAddCustomField = () => {
    if (!newFieldLabel.trim() || !newFieldValue.trim()) return;
    setCustomFields([
      ...customFields,
      { label: newFieldLabel.trim(), value: newFieldValue.trim() }
    ]);
    setNewFieldLabel('');
    setNewFieldValue('');
  };

  const handleRemoveCustomField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  // Handle Create Lead submit with all new parameters
  const handleCreateLead = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setActionLoading(true);

    const leadData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      company: company.trim(),
      designation: designation.trim(),
      email: email.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      website: website.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      industry: industry.trim(),
      employeeCount: Number(employeeCount) || 0,
      annualRevenue: Number(annualRevenue) || 0,
      priority,
      status: leadStatus,
      lostReason: leadStatus === 'Lost' ? lostReason : '',
      source: leadSource,
      requirements: requirements.trim(),
      interestedProduct,
      followUpType,
      nextFollowUpDate: localToUTCISO(nextFollowUpDate),
      customFields,
      autoAssign,
      custom_data: orgCustomFieldValues,
      isPublic: currentUser?.role === 'owner' ? isPublic : false,
    };

    if (assignedTo) {
      leadData.assignedTo = assignedTo;
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });

      const data = await res.json();

      if (res.ok) {
        setAddModalOpen(false);
        resetAddForm();
        fetchLeads();
        showToast('🎉 Lead created successfully in database!');
      } else {
        setFormError(data.error || 'Failed to create lead.');
      }
    } catch (err) {
      setFormError('Connection issue. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const resetAddForm = () => {
    setFirstName('');
    setLastName('');
    setCompany('');
    setDesignation('');
    setEmail('');
    setPhone('');
    setWhatsapp('');
    setWebsite('');
    setCity('');
    setState('');
    setCountry('India');
    setIndustry('');
    setEmployeeCount('');
    setAnnualRevenue('');
    setPriority('Warm');
    setLeadStatus('New');
    setLostReason('');
    setLeadSource('Website');
    setRequirements('');
    setNextFollowUpDate('');
    setAssignedTo('');
    setAutoAssign(false);
    setInterestedProduct('');
    setFollowUpType('None');
    setCustomFields([]);
    setOrgCustomFieldValues({});
    setIsPublic(false);
    setFormError('');
  };

  // Log follow-up note submit
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedLead) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/leads/${selectedLead._id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newNoteText }),
      });

      if (res.ok) {
        setNewNoteText('');
        handleSelectLead(selectedLead._id);
        fetchLeads();
        showToast('📝 Note logged successfully!');
      }
    } catch (err) {
      console.error('Add note failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Quick Status Update inside profile Drawer
  const handleUpdateStatus = async () => {
    if (!selectedLead) return;
    setActionLoading(true);
    setFormError('');

    try {
      const res = await fetch(`/api/leads/${selectedLead._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          lostReason: editStatus === 'Lost' ? editLostReason : '',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsEditingStatus(false);
        handleSelectLead(selectedLead._id);
        fetchLeads();
        showToast('🔄 Status updated with audit log note!');
      } else {
        setFormError(data.error || 'Failed to update status.');
      }
    } catch (err) {
      setFormError('Network error updating status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Convert Lead to Deal submit
  const handleConvertLead = async (e) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);

    try {
      const res = await fetch(`/api/leads/${selectedLead._id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealTitle: dealTitle.trim(),
          dealValue: Number(dealValue),
          closingDate,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setConvertModalOpen(false);
        setSelectedLead(null);
        fetchLeads();
        showToast('🎉 SUCCESS! Lead converted to dynamic Deal Card!');
        router.push('/dashboard/deals');
      } else {
        setFormError(data.error || 'Failed to convert lead.');
      }
    } catch (err) {
      setFormError('Connection issue. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenConvert = () => {
    if (!selectedLead) return;
    setDealTitle(`${selectedLead.company} - Contract Package`);
    setDealValue(selectedLead.annualRevenue ? String(selectedLead.annualRevenue) : '500000');
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    setClosingDate(thirtyDaysLater.toISOString().split('T')[0]);
    setFormError('');
    setConvertModalOpen(true);
  };

  const handleOpenEditModal = (lead) => {
    setEditLeadFirstName(lead.firstName || '');
    setEditLeadLastName(lead.lastName || '');
    setEditLeadCompany(lead.company || '');
    setEditLeadDesignation(lead.designation || '');
    setEditLeadEmail(lead.email || '');
    setEditLeadPhone(lead.phone || '');
    setEditLeadWhatsapp(lead.whatsapp || '');
    setEditLeadWebsite(lead.website || '');
    setEditLeadCity(lead.city || '');
    setEditLeadState(lead.state || '');
    setEditLeadCountry(lead.country || 'India');
    setEditLeadIndustry(lead.industry || '');
    setEditLeadEmployeeCount(lead.employeeCount ? String(lead.employeeCount) : '');
    setEditLeadAnnualRevenue(lead.annualRevenue ? String(lead.annualRevenue) : '');
    setEditLeadPriority(lead.priority || 'Warm');
    setEditLeadStatus(lead.status || 'New');
    setEditLeadLostReason(lead.lostReason || '');
    setEditLeadSource(lead.source || 'Website');
    setEditLeadRequirements(lead.requirements || '');
    setEditLeadInterestedProduct(lead.interestedProduct || '');
    setEditLeadFollowUpType(lead.followUpType || 'None');
    setEditLeadCustomFields(lead.customFields || []);
    setEditLeadCustomData(lead.customData || {});
    setFormError('');

    // Format nextFollowUpDate beautifully for datetime-local input YYYY-MM-DDTHH:MM
    if (lead.nextFollowUpDate) {
      try {
        const dateObj = safeNewDate(lead.nextFollowUpDate);
        // Correct time offset adjustment for local time
        const offset = dateObj.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(dateObj.getTime() - offset)).toISOString().slice(0, 16);
        setEditLeadNextFollowUpDate(localISOTime);
      } catch (err) {
        setEditLeadNextFollowUpDate('');
      }
    } else {
      setEditLeadNextFollowUpDate('');
    }

    if (lead.assignedTo) {
      setEditLeadAssignedTo(lead.assignedTo._id || lead.assignedTo);
    } else {
      setEditLeadAssignedTo('all');
    }

    setEditLeadIsPublic(lead.isPublic || false);
    setEditModalOpen(true);
  };

  const handleEditLead = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedEditEmail = editLeadEmail.trim();
    if (trimmedEditEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEditEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setActionLoading(true);

    const leadData = {
      firstName: editLeadFirstName.trim(),
      lastName: editLeadLastName.trim(),
      company: editLeadCompany.trim(),
      designation: editLeadDesignation.trim(),
      email: editLeadEmail.trim(),
      phone: editLeadPhone.trim(),
      whatsapp: editLeadWhatsapp.trim(),
      website: editLeadWebsite.trim(),
      city: editLeadCity.trim(),
      state: editLeadState.trim(),
      country: editLeadCountry.trim(),
      industry: editLeadIndustry.trim(),
      employeeCount: Number(editLeadEmployeeCount) || 0,
      annualRevenue: Number(editLeadAnnualRevenue) || 0,
      priority: editLeadPriority,
      status: editLeadStatus,
      lostReason: editLeadStatus === 'Lost' ? editLeadLostReason : '',
      source: editLeadSource,
      requirements: editLeadRequirements.trim(),
      interestedProduct: editLeadInterestedProduct,
      followUpType: editLeadFollowUpType,
      nextFollowUpDate: localToUTCISO(editLeadNextFollowUpDate),
      customFields: editLeadCustomFields,
      custom_data: editLeadCustomData,
      isPublic: currentUser?.role === 'owner' ? editLeadIsPublic : undefined,
    };

    if (editLeadAssignedTo) {
      leadData.assignedTo = editLeadAssignedTo;
    } else {
      leadData.assignedTo = null; // Clear assignment
    }

    try {
      const res = await fetch(`/api/leads/${selectedLead._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });

      const data = await res.json();

      if (res.ok) {
        setEditModalOpen(false);
        handleSelectLead(selectedLead._id); // Refresh timeline details
        fetchLeads(); // Refresh global list
        showToast('🎉 Lead details updated successfully!');
      } else {
        setFormError(data.error || 'Failed to update lead details.');
      }
    } catch (err) {
      setFormError('Connection issue. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Lead submit
  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this lead? This action is permanent.')) return;

    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedLead(null);
        fetchLeads();
        showToast('🗑️ Lead permanently deleted from pool.');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete lead.');
      }
    } catch (err) {
      console.error('Delete lead error:', err);
    }
  };

  // --- DYNAMIC UPLOAD ATTACHMENT ACTION ---
  const handleUploadAttachment = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedLead) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('⚠️ Proposal File size too large (Max 10MB limit).', 'error');
      return;
    }

    setActionLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result;

      try {
        const res = await fetch(`/api/leads/${selectedLead._id}/attachments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64Data,
            fileType: file.type,
            fileSize: file.size,
          })
        });

        const data = await res.json();
        if (res.ok) {
          handleSelectLead(selectedLead._id);
          fetchLeads();
          showToast('📁 Attachment uploaded & timeline note logged successfully!');
        } else {
          showToast(data.error || 'Failed to upload attachment.', 'error');
        }
      } catch (err) {
        showToast('Network error uploading attachment.', 'error');
      } finally {
        setActionLoading(false);
      }
    };
    reader.readAsDataURL(file); // Encode file to Base64
    e.target.value = ''; // Reset input selection
  };

  // --- DYNAMIC DOWNLOAD ATTACHMENT ACTION ---
  const handleDownloadAttachment = (attachment) => {
    try {
      const link = document.createElement('a');
      link.href = attachment.fileData; // Base64 data URL
      link.download = attachment.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('📥 File downloaded successfully!');
    } catch (err) {
      showToast('Failed to download file.', 'error');
    }
  };

  // --- DYNAMIC REMOVE ATTACHMENT ACTION ---
  const handleRemoveAttachment = async (attachmentId) => {
    if (!window.confirm('Remove this file attachment? This action will generate deletion logs.')) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/leads/${selectedLead._id}/attachments?attachmentId=${attachmentId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (res.ok) {
        handleSelectLead(selectedLead._id);
        fetchLeads();
        showToast('🗑️ File attachment removed.');
      } else {
        showToast(data.error || 'Failed to delete attachment.', 'error');
      }
    } catch (err) {
      showToast('Network error removing attachment.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // CSS status badge helpers
  const getStatusBadge = (status) => {
    switch (status) {
      case 'New':
        return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'Contacted':
        return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'Qualified':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'Lost':
        return 'bg-rose-50 text-rose-700 border border-rose-100';
      case 'Attempted':
        return 'bg-violet-50 text-violet-700 border border-violet-100';
      case 'Future':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      case 'Converted':
        return 'bg-teal-50 text-teal-700 border border-teal-100';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  // CSS Priority Badge helper
  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'Hot':
        return 'bg-rose-50 text-rose-700 border border-rose-100 shadow-sm';
      case 'Warm':
        return 'bg-amber-50 text-amber-700 border border-amber-100';
      default:
        return 'bg-blue-50 text-blue-700 border border-blue-100';
    }
  };

  // dynamic Follow-Up reminders parser
  const getFollowUpStatus = (lead) => {
    if (!lead.nextFollowUpDate || lead.status === 'Qualified' || lead.status === 'Lost') return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const followUp = safeNewDate(lead.nextFollowUpDate);
    followUp.setHours(0, 0, 0, 0);
    
    if (followUp < today) {
      return { label: 'Overdue Follow-up', style: 'bg-rose-100 text-rose-800 border-rose-250 animate-pulse' };
    } else if (followUp.getTime() === today.getTime()) {
      return { label: 'Call Scheduled Today', style: 'bg-emerald-100 text-emerald-800 border-emerald-250 font-bold' };
    }
    return null;
  };

  // Inactive Lead Checker (7 days inactivity)
  const isInactiveLead = (lead) => {
    if (lead.status === 'Qualified' || lead.status === 'Lost') return false;
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const lastUpdate = safeNewDate(lead.updatedAt).getTime();
    // eslint-disable-next-line react-hooks/purity
    return (Date.now() - lastUpdate) > sevenDaysInMs;
  };

  // Trigger Dynamic WhatsApp & Track outreach success
  const triggerWhatsApp = async (lead) => {
    if (!lead.whatsapp) return;
    
    // 1. Open WhatsApp tab
    const cleanNum = lead.whatsapp.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNum.startsWith('91') ? cleanNum : '91' + cleanNum}`, '_blank');

    // 2. Call API to set contacted boolean and log automatic note
    try {
      await fetch(`/api/leads/${lead._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappContacted: true })
      });
      fetchLeads();
      if (selectedLead && selectedLead._id === lead._id) {
        handleSelectLead(lead._id);
      }
      showToast('💬 WhatsApp outreach recorded on timeline.');
    } catch (err) {
      console.error('WhatsApp track failure:', err);
    }
  };

  // CSV EXPORT MODULE
  const exportToCSV = () => {
    if (leads.length === 0) return;
    
    // Define headers
    const headers = [
      'First Name', 'Last Name', 'Company', 'Designation', 'Email', 
      'Phone', 'WhatsApp', 'WhatsApp Contacted', 'City', 'State', 
      'Priority', 'Status', 'Lost Reason', 'Source', 'Revenue', 
      'Next Follow-Up Date', 'Created At'
    ];

    // Map rows
    const rows = leads.map(l => [
      `"${l.firstName}"`,
      `"${l.lastName || ''}"`,
      `"${l.company}"`,
      `"${l.designation || ''}"`,
      `"${l.email || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.whatsapp || ''}"`,
      l.whatsappContacted ? 'Yes' : 'No',
      `"${l.city || ''}"`,
      `"${l.state || ''}"`,
      l.priority || 'Warm',
      l.status,
      `"${l.lostReason || ''}"`,
      l.source,
      l.annualRevenue || 0,
      l.nextFollowUpDate ? safeNewDate(l.nextFollowUpDate).toLocaleString() : 'Not Scheduled',
      safeNewDate(l.createdAt).toLocaleDateString()
    ]);

    // Build CSV content
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Download trigger
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Innonsh_Leads_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 Leads exported to Excel/CSV successfully!');
  };

  // CSV IMPORT MODULE (Bulk Campaign Loader)
  const handleCSVImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setActionLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      if (lines.length <= 1) {
        showToast('⚠️ CSV file is empty or missing headers.', 'error');
        setActionLoading(false);
        return;
      }

      // Parse headers to match columns
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      let successCount = 0;
      let errorCount = 0;
      let lastError = '';

      // Loop through rows
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
        if (columns.length < 2) continue;

        // Build lead body mapping standard fields
        const leadBody = {
          firstName: columns[0] || 'Unknown',
          lastName: columns[1] || '',
          company: columns[2] || 'Offline Campaign',
          designation: columns[3] || '',
          email: columns[4] || '',
          phone: columns[5] || '',
          whatsapp: columns[6] || '',
          city: columns[7] || '',
          state: columns[8] || '',
          priority: columns[9] || 'Warm',
          status: 'New',
          source: 'Other',
          requirements: 'Uploaded via Bulk Import CSV Campaign.'
        };

        try {
          const res = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadBody),
          });
          
          if (res.ok) successCount++;
          else {
            const errData = await res.json();
            errorCount++;
            lastError = errData.error;
          }
        } catch (err) {
          errorCount++;
        }
      }

      setActionLoading(false);
      fetchLeads();
      if (errorCount === 0) {
        showToast(`🎉 Bulk Upload Complete! Imported ${successCount} Leads successfully.`);
      } else {
        showToast(`Uploaded ${successCount} leads. ${errorCount} warnings (e.g. Duplicates ignored).`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input selection
  };

  // --- DYNAMIC CALCULATED SUMMARY METRICS (Dashboard top widget helper) ---
  const totalLeadsCount = leads.length;
  const qualifiedDealsCount = leads.filter(l => l.status === 'Qualified').length;
  const lostLeadsCount = leads.filter(l => l.status === 'Lost').length;
  const hotLeadsCount = leads.filter(l => l.priority === 'Hot').length;

  // Pagination Indexing
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeads = leads.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(leads.length / itemsPerPage);

  return (
    <div className="space-y-6 relative h-full">
      
      {/* --- FLOATING TOAST NOTIFICATION --- */}
      {toastMessage.text && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3.5 rounded-xl border shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top duration-300 ${
          toastMessage.type === 'error' 
            ? 'bg-rose-50 border-rose-200 text-rose-800' 
            : 'bg-emerald-50 border-emerald-250 text-emerald-800'
        }`}>
          <Info className="h-4.5 w-4.5" />
          <span className="text-xs font-black tracking-wide">{toastMessage.text}</span>
        </div>
      )}

      {/* --- DASHBOARD HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7 text-emerald-500" />
            {currentUser?.role === 'sales_rep' ? `My ${currentUser?.sectorConfig?.leadTerm || 'Lead'}s` : `Corporate ${currentUser?.sectorConfig?.leadTerm || 'Lead'}s`}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Standard enterprise rules: strict duplicate filters, follow-up calendar alerts, and automated audit tracking.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* CSV Import */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleCSVImport} 
            accept=".csv" 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg transition active:scale-95 cursor-pointer shadow-sm"
            title="Import Leads in bulk from CSV/Excel"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import CSV
          </button>

          {/* CSV Export */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg transition active:scale-95 cursor-pointer shadow-sm"
            title="Export leads to CSV/Excel report"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>

          {/* Create Lead */}
          <button
            onClick={() => { resetAddForm(); setAddModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-md shadow-emerald-500/10 active:scale-[0.98] transition cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5 stroke-[3]" />
            Create Leads
          </button>
        </div>
      </div>

      {/* --- LIVE METRICS SUMMARY PANEL --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-350">
        {/* Total Leads */}
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Total {currentUser?.sectorConfig?.leadTerm || 'Lead'}s Pool</span>
            <span className="text-2xl font-black text-slate-800 block mt-1">{totalLeadsCount}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Converted Deals */}
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Converted (Deals)</span>
            <span className="text-2xl font-black text-emerald-600 block mt-1">{qualifiedDealsCount}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Lost Leads */}
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Lost Opportunities</span>
            <span className="text-2xl font-black text-rose-600 block mt-1">{lostLeadsCount}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        {/* Hot Leads */}
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Hot Opportunities</span>
            <span className="text-2xl font-black text-amber-600 block mt-1">{hotLeadsCount}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* --- FILTER & SEARCH BAR --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Name, Organization, Phone, City..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-600 transition"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Attempted">Attempted Contact</option>
            <option value="Qualified">Qualified</option>
            <option value="Lost">Lost</option>
            <option value="Future">Contact in Future</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-600 transition"
          >
            <option value="">All Priorities</option>
            <option value="Hot">🔥 Hot Priority</option>
            <option value="Warm">⭐ Warm Priority</option>
            <option value="Cold">❄️ Cold Priority</option>
          </select>
        </div>

        {/* Source Filter */}
        <div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-600 transition"
          >
            <option value="">All Sources</option>
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="Cold Call">Cold Call</option>
            <option value="Social Media">Social Media</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Google Search">Google Search</option>
            <option value="Event">Event/Exhibition</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Assignee Filter */}
        {(currentUser?.role === 'owner' || currentUser?.role === 'sales_admin') ? (
          <div>
            <select
              value={repFilter}
              onChange={(e) => setRepFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-600 transition"
            >
              <option value="">All Sales Reps & Pool</option>
              <option value="all">🌐 Shared Pool (All Reps)</option>
              {salesReps
                .filter((rep) => rep.role !== 'owner')
                .map((rep) => (
                  <option key={rep._id} value={rep._id}>
                    {rep.name} ({rep.role === 'sales_admin' ? 'Manager' : 'Rep'})
                  </option>
                ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200 text-[10px] text-slate-400 font-bold tracking-wider uppercase font-mono">
            Isolated Session
          </div>
        )}

        {/* Sorting Order */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-650 font-bold transition cursor-pointer"
          >
            <option value="newest">🆕 Sort: Newest Created</option>
            <option value="latest_communication">💬 Sort: Latest Follow-up</option>
          </select>
        </div>
      </div>

      {/* --- LEADS DATA TABLE --- */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p className="text-xs text-slate-400 font-semibold">Searching directories...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6 bg-slate-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 mb-4 shadow-sm">
              <Users className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No {currentUser?.sectorConfig?.leadTerm || 'Lead'}s found</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1 font-medium">
              Try adjusting filters or importing a CSV campaign to load data.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">{currentUser?.sectorConfig?.leadTerm || 'Lead'} Name</th>
                  <th className="px-6 py-4">Organization & Designation</th>
                  <th className="px-6 py-4">Priority & Warning</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">WhatsApp Log</th>
                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4">Latest Communication</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentLeads.map((lead) => {
                  const followUpAlert = getFollowUpStatus(lead);
                  const isSlipping = isInactiveLead(lead);
                  const latestNote = lead.notes && lead.notes.length > 0
                    ? [...lead.notes].sort((a, b) => (safeNewDate(b.createdAt || 0).getTime() || 0) - (safeNewDate(a.createdAt || 0).getTime() || 0))[0]
                    : null;

                  return (
                    <tr 
                      key={lead._id}
                      onClick={() => handleSelectLead(lead._id)}
                      className={`hover:bg-slate-50/50 transition-all duration-150 cursor-pointer group ${
                        isSlipping ? 'border-l-4 border-l-amber-500/80 bg-amber-50/5' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs border shadow-sm ${
                            isSlipping 
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {lead.firstName[0]}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 group-hover:text-emerald-600 transition flex items-center gap-1.5">
                              {lead.firstName} {lead.lastName}
                              {isSlipping && (
                                <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" title="Slipping Opportunity: No activity in 7+ days!" />
                              )}
                            </span>
                            <span className="block text-[9px] text-slate-400 mt-0.5 font-semibold">{lead.email || 'No email'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-700">{lead.company}</p>
                        {lead.designation && <span className="text-[10px] text-slate-400 font-semibold">{lead.designation}</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <span className={`inline-block w-fit px-2 py-0.5 text-[8px] font-extrabold rounded uppercase ${getPriorityBadge(lead.priority)}`}>
                            {lead.priority || 'Warm'}
                          </span>
                          
                          {/* Follow-up reminder labels */}
                          {followUpAlert && (
                            <span className={`inline-block w-fit px-2 py-0.5 text-[8px] font-bold rounded border ${followUpAlert.style}`}>
                              {followUpAlert.label}
                            </span>
                          )}

                          {/* Inactive alert */}
                          {isSlipping && (
                            <span className="inline-block w-fit px-1.5 py-0.5 text-[8px] font-extrabold rounded bg-amber-50 text-amber-700 border border-amber-100">
                              ⏳ 7d+ Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-0.5 text-[9px] font-extrabold rounded-full uppercase ${getStatusBadge(lead.status)}`}>
                          {lead.status}
                        </span>
                        {lead.status === 'Lost' && lead.lostReason && (
                          <span className="block text-[9px] text-rose-500 font-bold mt-1">Reason: {lead.lostReason}</span>
                        )}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        {lead.whatsapp ? (
                          <button
                            onClick={() => triggerWhatsApp(lead)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[10px] font-bold transition shadow-sm ${
                              lead.whatsappContacted 
                                ? 'bg-emerald-500 hover:bg-emerald-650 text-white border-emerald-600' 
                                : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-150 text-emerald-700'
                            }`}
                            title={lead.whatsappContacted ? "Outreach initiated (Double Tick)" : "Click to chat on WhatsApp"}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            {lead.whatsappContacted ? '✓✓ Contacted' : 'Chat'}
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">No WhatsApp</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {lead.assignedTo ? (
                          <div className="flex items-center gap-1 text-slate-700 font-medium">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span>{lead.assignedTo.name.split(' ')[0]}</span>
                          </div>
                        ) : (
                          <span className="text-slate-450 italic font-semibold">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          {latestNote ? (
                            <>
                              <span className="font-bold text-slate-700 truncate max-w-[180px]" title={latestNote.text}>
                                {latestNote.text}
                              </span>
                              <span className="text-[9px] text-slate-400 font-semibold">
                                {latestNote.createdAt ? safeNewDate(latestNote.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }) : 'No timestamp'}
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-400 italic">No communication logged</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {currentUser?.role !== 'sales_rep' && (
                            <button
                              onClick={() => handleDeleteLead(lead._id)}
                              className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-100 transition cursor-pointer"
                              title="Delete Lead"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          )}
                          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-650 group-hover:translate-x-0.5 transition" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* --- DYNAMIC PAGINATION FOOTER --- */}
        {leads.length > itemsPerPage && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-700">{indexOfFirstItem + 1}</strong> to{' '}
              <strong className="text-slate-700">{Math.min(indexOfLastItem, leads.length)}</strong> of{' '}
              <strong className="text-slate-700">{leads.length}</strong> {currentUser?.sectorConfig?.leadTerm || 'Lead'}s
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-bold text-slate-700">Page {currentPage} of {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- VISUAL TIMELINE SIDE-DRAWER --- */}
      {selectedLead && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex-1" onClick={() => setSelectedLead(null)}></div>

          <div className="w-full max-w-lg bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 font-extrabold text-lg shadow-sm">
                  {selectedLead.firstName[0]}
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 leading-tight">
                    {selectedLead.firstName} {selectedLead.lastName}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-bold">
                    {selectedLead.company} {selectedLead.designation && !hiddenStandardFields.includes('designation') ? `• ${selectedLead.designation}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(selectedLead)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-sm active:scale-95 transition cursor-pointer shrink-0"
                >
                  <Edit className="h-3.5 w-3.5 text-white" />
                  Edit details
                </button>
                {selectedLead.status !== 'Qualified' ? (
                  <button
                    onClick={handleOpenConvert}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold shadow-sm active:scale-95 transition cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                    Convert to Deal
                  </button>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-extrabold rounded-lg bg-teal-50 border border-teal-100 text-teal-600 uppercase">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Converted
                  </span>
                )}
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
              
              {/* Inactivity Alarm Alert */}
              {isInactiveLead(selectedLead) && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 shadow-sm text-xs animate-in slide-in-from-top">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-800">Slipping Lead opportunity warning!</p>
                    <p className="text-[10px] text-amber-600 mt-0.5 font-medium leading-relaxed">
                      No interaction logs or status updates have been recorded for this lead in over 7 days. Please follow-up immediately.
                    </p>
                  </div>
                </div>
              )}

              {/* Status Flow Control Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Lifecycle status flow</span>
                  
                  {!isEditingStatus ? (
                    <button
                      onClick={() => setIsEditingStatus(true)}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-500 uppercase cursor-pointer"
                    >
                      Change Status
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleUpdateStatus}
                        disabled={actionLoading}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-500 uppercase cursor-pointer"
                      >
                        Save
                      </button>
                      <span className="text-slate-350">|</span>
                      <button
                        onClick={() => setIsEditingStatus(false)}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-655 uppercase cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {!isEditingStatus ? (
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-3 py-1 text-xs font-black rounded-full uppercase ${getStatusBadge(selectedLead.status)}`}>
                      {selectedLead.status}
                    </span>
                    {selectedLead.status === 'Lost' && selectedLead.lostReason && (
                      <span className="text-xs text-rose-600 font-extrabold bg-rose-50 px-2.5 py-1 rounded border border-rose-100">
                        Reason: {selectedLead.lostReason}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    {formError && <p className="text-[10px] text-rose-600 font-bold">{formError}</p>}
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Select Stage</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded bg-white border border-slate-200 focus:outline-none text-xs text-slate-700"
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Attempted">Attempted Contact</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Converted">Converted</option>
                        <option value="Lost">Lost</option>
                        <option value="Future">Contact in Future</option>
                      </select>
                    </div>

                    {editStatus === 'Lost' && (
                      <div className="animate-in fade-in">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Lost Reason *</label>
                        <select
                          value={editLostReason}
                          onChange={(e) => setEditLostReason(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded bg-white border border-slate-200 focus:outline-none text-xs text-slate-700"
                        >
                          <option value="">-- Choose Reason --</option>
                          <option value="Budget issue">Budget issue</option>
                          <option value="No response">No response</option>
                          <option value="Competitor">Competitor</option>
                          <option value="Not interested">Not interested</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* WhatsApp Outreach Bar */}
              {selectedLead.whatsapp && !hiddenStandardFields.includes('whatsapp') && (
                <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between shadow-sm animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Quick WhatsApp Message</p>
                      <p className="text-[10px] text-slate-500 font-semibold">{selectedLead.whatsapp}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => triggerWhatsApp(selectedLead)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-sm transition"
                  >
                    Outreach Chat
                  </button>
                </div>
              )}

              {/* Profile Details Grid */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Email Address</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{selectedLead.email || '—'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Phone / Mobile</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{selectedLead.phone || '—'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Lead Rating Priority</span>
                    <span className={`inline-block px-2.5 py-0.5 text-[9px] font-extrabold rounded uppercase ${getPriorityBadge(selectedLead.priority)}`}>
                      {selectedLead.priority || 'Warm'}
                    </span>
                  </div>
                  {!hiddenStandardFields.includes('source') && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Lead Source</span>
                      <span className="text-xs text-slate-700 font-semibold block mt-1">{selectedLead.source}</span>
                    </div>
                  )}
                </div>

                {/* Zonal localization box */}
                <div className="border-t border-slate-100 pt-3.5 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Location Zonal Zone</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{selectedLead.city ? `${selectedLead.city}, ${selectedLead.state || ''}` : 'No address set'}</span>
                    </div>
                  </div>
                  {!hiddenStandardFields.includes('website') && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Website URL</span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                        <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{selectedLead.website || 'No website link'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Interest & Followup Type Display Card */}
                {(selectedLead.interestedProduct || (selectedLead.followUpType && selectedLead.followUpType !== 'None')) && (
                  <div className="border-t border-slate-100 pt-3.5 grid grid-cols-2 gap-4">
                    {selectedLead.interestedProduct && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Interested Product</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 uppercase tracking-wide mt-1">
                          📦 {selectedLead.interestedProduct}
                        </span>
                      </div>
                    )}
                    {selectedLead.followUpType && selectedLead.followUpType !== 'None' && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Follow-up Type</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-100 uppercase tracking-wide mt-1">
                          {selectedLead.followUpType === 'Call' ? '📞 Call' :
                           selectedLead.followUpType === 'Meeting' ? '🤝 Meeting' :
                           selectedLead.followUpType === 'Demo' ? '💻 Demo' :
                           selectedLead.followUpType === 'WhatsApp' ? '💬 WhatsApp' :
                           selectedLead.followUpType === 'Email' ? '📧 Email' : selectedLead.followUpType}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Business sizing */}
                {((selectedLead.industry && !hiddenStandardFields.includes('industry')) || 
                  (selectedLead.annualRevenue > 0 && !hiddenStandardFields.includes('annualRevenue')) || 
                  (selectedLead.employeeCount > 0 && !hiddenStandardFields.includes('employeeCount'))) && (
                  <div className="border-t border-slate-100 pt-3.5 grid grid-cols-2 gap-4">
                    {!hiddenStandardFields.includes('industry') && selectedLead.industry && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Industry Sector</span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                          <BriefcaseIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{selectedLead.industry}</span>
                        </div>
                      </div>
                    )}
                    {!hiddenStandardFields.includes('annualRevenue') && selectedLead.annualRevenue > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Est. Revenue / Budget</span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                          <DollarSign className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>₹{selectedLead.annualRevenue.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    )}
                    {!hiddenStandardFields.includes('employeeCount') && selectedLead.employeeCount > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Employee Count</span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                          <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{selectedLead.employeeCount} Employees</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Next Follow-up target */}
                {selectedLead.nextFollowUpDate && (
                  <div className="border-t border-slate-100 pt-3.5">
                    <div className="space-y-1 bg-amber-50/20 p-2.5 rounded-lg border border-amber-100/60">
                      <span className="text-[10px] font-bold text-amber-600 uppercase block">Target Next Follow-Up Schedule</span>
                      <div className="flex items-center gap-1.5 text-xs text-amber-800 font-extrabold mt-1">
                        <Calendar className="h-4 w-4 text-amber-500" />
                        <span>{safeNewDate(selectedLead.nextFollowUpDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Requirements Specifications box */}
              {selectedLead.requirements && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-emerald-500" />
                    Requirements Specification
                  </h3>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-655 font-semibold leading-relaxed whitespace-pre-line">
                      {selectedLead.requirements}
                    </p>
                  </div>
                </div>
              )}

              {/* Dynamic Custom Fields Panel */}
              {selectedLead.customFields && selectedLead.customFields.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-emerald-500" />
                    Custom Business Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                    {selectedLead.customFields.map((field) => (
                      <div key={field._id} className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase truncate block">{field.label}</span>
                        <span className="text-xs font-extrabold text-slate-800">{field.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Org-level Custom Fields */}
              {orgCustomFieldDefs.length > 0 && selectedLead.customData && Object.keys(selectedLead.customData).length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    Custom Organization Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                    {orgCustomFieldDefs.map((fieldDef) => {
                      const value = selectedLead.customData[fieldDef.field_key];
                      if (value === undefined || value === null || value === '') return null;
                      return (
                        <div key={fieldDef.id} className="space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase truncate block">{fieldDef.field_label}</span>
                          <span className="text-xs font-extrabold text-slate-800">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --- PREMIUM FILE ATTACHMENTS BLOCK --- */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="h-4 w-4 text-emerald-500" />
                    Corporate File Attachments
                  </h3>
                  <button
                    onClick={() => attachmentInputRef.current.click()}
                    disabled={actionLoading}
                    className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-500 uppercase cursor-pointer"
                  >
                    {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    Attach Document
                  </button>
                  <input
                    type="file"
                    ref={attachmentInputRef}
                    onChange={handleUploadAttachment}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
                  />
                </div>

                {/* Attachments List */}
                {(!selectedLead.attachments || selectedLead.attachments.length === 0) ? (
                  <p className="text-xs text-slate-400 italic pl-1 font-semibold">No files attached yet. (Support: PDF Proposals, specifications, RFQs).</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {selectedLead.attachments.map((file) => (
                      <div 
                        key={file._id}
                        className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-3 text-xs group"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <File className="h-4.5 w-4.5" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-bold text-slate-850 truncate" title={file.fileName}>{file.fileName}</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase">
                              {(file.fileSize / 1024).toFixed(1)} KB • {file.uploadedBy.split(' ')[0]}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleDownloadAttachment(file)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-transparent hover:border-slate-100 transition cursor-pointer"
                            title="Download File Attachment"
                          >
                            <Download className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveAttachment(file._id)}
                            className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-100 transition cursor-pointer"
                            title="Remove Attachment"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Follow-up Note Form */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-emerald-500" />
                  Log Client Interaction
                </h3>
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Write a comment or log a follow-up call..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 shadow-sm transition"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : 'Log'}
                  </button>
                </form>
              </div>

              {/* Follow-up History Timeline */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  Interaction History
                </h3>
                {selectedLead.notes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic pl-1 font-semibold">No activities logged yet. Write a follow-up above to start tracking client history.</p>
                ) : (
                  <div className="relative border-l border-slate-200 ml-3 pl-5 space-y-5 py-1">
                    {selectedLead.notes.map((note) => (
                      <div key={note._id} className="relative group">
                        <div className="absolute -left-[26px] top-1.5 h-3.5 w-3.5 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center group-hover:scale-110 transition shadow-sm"></div>
                        
                        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
                          <p className="text-xs text-slate-700 font-bold leading-relaxed">{note.text}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1.5 border-t border-slate-100 font-semibold">
                            <span className="text-slate-500">{note.createdByName}</span>
                            <span>•</span>
                            <span>{safeNewDate(note.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE LEAD MODAL --- */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl flex flex-col shadow-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <PlusCircle className="h-5 w-5 text-emerald-500" />
                Create New Lead Record (Standard CRM Edition)
              </h2>
              <button 
                onClick={() => setAddModalOpen(false)} 
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-855 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateLead} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white scrollbar-thin">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-600 font-bold animate-in fade-in">
                  {formError}
                </div>
              )}

              {/* Section 1: Identity & Primary Info */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">Primary Details</span>
                <div className={`grid grid-cols-1 md:grid-cols-${hiddenStandardFields.includes('designation') ? '2' : '3'} gap-4`}>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. Vaibhav"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Last Name</label>
                    <input
                      type="text"
                      placeholder="E.g. Sharma"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
                    />
                  </div>
                  {!hiddenStandardFields.includes('designation') && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Job Title / Designation</label>
                      <input
                        type="text"
                        placeholder="E.g. CEO / Purchase Manager"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
                      />
                    </div>
                  )}
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-${hiddenStandardFields.includes('website') ? '1' : '2'} gap-4`}>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Organization Name *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                        <Building className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="E.g. Innonsh Tech Solutions"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
                      />
                    </div>
                  </div>
                  {!hiddenStandardFields.includes('website') && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Website URL</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                          <Globe className="h-3.5 w-3.5" />
                        </span>
                        <input
                          type="text"
                          placeholder="https://clientwebsite.com"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Org-Defined Custom Fields (Create Modal) */}
              {orgCustomFieldDefs.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono">Custom details</span>
                    {currentUser?.role === 'owner' && (
                      <a href="/dashboard/settings/custom-fields" target="_blank" className="text-[9px] text-emerald-600 hover:underline font-bold">⚙️ Manage Fields →</a>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orgCustomFieldDefs.map((fieldDef) => {
                      const IconComponent = fieldDef.icon_name ? getCustomFieldIcon(fieldDef.icon_name) : null;
                      return (
                        <div key={fieldDef.id}>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            {fieldDef.field_label}
                            {fieldDef.is_required && <span className="text-rose-500 ml-1">*</span>}
                          </label>
                          <div className={IconComponent ? "relative" : ""}>
                            {IconComponent && (
                              <span className={`absolute inset-y-0 left-0 flex pl-3 text-slate-400 pointer-events-none ${fieldDef.field_type === 'textarea' ? 'items-start pt-3' : 'items-center'}`}>
                                <IconComponent className="h-3.5 w-3.5" />
                              </span>
                            )}
                            {fieldDef.field_type === 'text' && (
                              <input
                                type="text"
                                placeholder={fieldDef.placeholder || ''}
                                value={orgCustomFieldValues[fieldDef.field_key] || ''}
                                onChange={(e) => setOrgCustomFieldValues(prev => ({ ...prev, [fieldDef.field_key]: e.target.value }))}
                                className={`w-full ${IconComponent ? 'pl-9 pr-3' : 'px-3'} py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition`}
                              />
                            )}
                            {fieldDef.field_type === 'number' && (
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder={fieldDef.placeholder || ''}
                                value={orgCustomFieldValues[fieldDef.field_key] || ''}
                                onChange={(e) => setOrgCustomFieldValues(prev => ({ ...prev, [fieldDef.field_key]: e.target.value.replace(/\D/g, '') }))}
                                className={`w-full ${IconComponent ? 'pl-9 pr-3' : 'px-3'} py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition`}
                              />
                            )}
                            {fieldDef.field_type === 'date' && (
                              <input
                                type="date"
                                placeholder={fieldDef.placeholder || ''}
                                value={orgCustomFieldValues[fieldDef.field_key] || ''}
                                onChange={(e) => setOrgCustomFieldValues(prev => ({ ...prev, [fieldDef.field_key]: e.target.value }))}
                                className={`w-full ${IconComponent ? 'pl-9 pr-3' : 'px-3'} py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition`}
                              />
                            )}
                            {fieldDef.field_type === 'textarea' && (
                              <textarea
                                rows={2}
                                placeholder={fieldDef.placeholder || ''}
                                value={orgCustomFieldValues[fieldDef.field_key] || ''}
                                onChange={(e) => setOrgCustomFieldValues(prev => ({ ...prev, [fieldDef.field_key]: e.target.value }))}
                                className={`w-full ${IconComponent ? 'pl-9 pr-3 pt-2' : 'px-3 py-2'} rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition resize-none`}
                              />
                            )}
                            {fieldDef.field_type === 'dropdown' && (
                              <select
                                value={orgCustomFieldValues[fieldDef.field_key] || ''}
                                onChange={(e) => setOrgCustomFieldValues(prev => ({ ...prev, [fieldDef.field_key]: e.target.value }))}
                                className={`w-full ${IconComponent ? 'pl-9 pr-3' : 'px-3'} py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition cursor-pointer`}
                              >
                                <option value="">{fieldDef.placeholder || '-- Select --'}</option>
                                {(fieldDef.options || []).map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            )}
                            {fieldDef.field_type === 'boolean' && (
                              <div className="flex gap-4 pt-2.5">
                                {['Yes', 'No'].map((opt) => (
                                  <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`cf_${fieldDef.field_key}`}
                                      value={opt}
                                      checked={orgCustomFieldValues[fieldDef.field_key] === opt}
                                      onChange={() => setOrgCustomFieldValues(prev => ({ ...prev, [fieldDef.field_key]: opt }))}
                                      className="accent-emerald-500 cursor-pointer"
                                    />
                                    <span className="text-xs font-bold text-slate-655">{opt}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 2: Contact Details */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">Communication channels</span>
                <div className={`grid grid-cols-1 md:grid-cols-${hiddenStandardFields.includes('whatsapp') ? '2' : '3'} gap-4`}>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                        <Mail className="h-3.5 w-3.5" />
                      </span>
                      <input
                        type="email"
                        placeholder="client@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                        <Phone className="h-3.5 w-3.5" />
                      </span>
                      <input
                        type="text"
                        placeholder="+91 99999 88888"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
                      />
                    </div>
                  </div>
                  {!hiddenStandardFields.includes('whatsapp') && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">WhatsApp Mobile (outreach)</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-500 pointer-events-none">
                          <MessageCircle className="h-3.5 w-3.5" />
                        </span>
                        <input
                          type="text"
                          placeholder="E.g. 9876543210"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-855 placeholder-slate-400 transition"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Zonal Address */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">Location details</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">City</label>
                    <input
                      type="text"
                      placeholder="E.g. Pune"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">State</label>
                    <input
                      type="text"
                      placeholder="E.g. Maharashtra"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Country</label>
                    <input
                      type="text"
                      placeholder="India"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Classification & Priority */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">CRM Context & Classification</span>
                <div className={`grid grid-cols-1 md:grid-cols-${hiddenStandardFields.includes('source') ? '2' : '3'} gap-4`}>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Lead Priority Tag</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-600 transition"
                    >
                      <option value="Hot">🔥 Hot Priority</option>
                      <option value="Warm">⭐ Warm Priority</option>
                      <option value="Cold">❄️ Cold Priority</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Lead Status</label>
                    <select
                      value={leadStatus}
                      onChange={(e) => setLeadStatus(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-600 transition"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Attempted">Attempted Contact</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Lost">Lost</option>
                      <option value="Future">Contact in Future</option>
                    </select>
                  </div>
                  {!hiddenStandardFields.includes('source') && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Lead Source</label>
                      <select
                        value={leadSource}
                        onChange={(e) => setLeadSource(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-600 transition"
                      >
                        <option value="Website">Website</option>
                        <option value="Referral">Referral</option>
                        <option value="Cold Call">Cold Call</option>
                        <option value="Social Media">Social Media</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Google Search">Google Search</option>
                        <option value="Event">Event/Exhibition</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  )}
                </div>

                {leadStatus === 'Lost' && (
                  <div className="animate-in fade-in">
                    <label className="block text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1.5">Lost Reason *</label>
                    <select
                      value={lostReason}
                      required={leadStatus === 'Lost'}
                      onChange={(e) => setLostReason(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-rose-250 focus:outline-none text-xs text-slate-700 transition"
                    >
                      <option value="">-- Choose Reason --</option>
                      <option value="Budget issue">Budget issue</option>
                      <option value="No response">No response</option>
                      <option value="Competitor">Competitor</option>
                      <option value="Not interested">Not interested</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Interested Product / Service ⭐</label>
                    <select
                      value={interestedProduct}
                      onChange={(e) => setInterestedProduct(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-700 transition"
                    >
                      <option value="">-- Choose Product/Service --</option>
                      {products.map((prod) => (
                        <option key={prod._id} value={prod.name}>
                          📦 {prod.name} (₹{prod.price.toLocaleString('en-IN')})
                        </option>
                      ))}
                      <option value="Other">Other Services</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Follow-up Communication Type ⭐</label>
                    <select
                      value={followUpType}
                      onChange={(e) => setFollowUpType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-700 transition"
                    >
                      <option value="None">None (No reminder scheduling)</option>
                      <option value="Call">📞 Follow-up Call</option>
                      <option value="Meeting">🤝 Physical/Online Meeting</option>
                      <option value="Demo">💻 Product Demo Session</option>
                      <option value="WhatsApp">💬 WhatsApp Outreach</option>
                      <option value="Email">📧 Email Campaign</option>
                    </select>
                  </div>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-${3 - [hiddenStandardFields.includes('industry'), hiddenStandardFields.includes('annualRevenue')].filter(Boolean).length} gap-4`}>
                  {!hiddenStandardFields.includes('industry') && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Industry Segment</label>
                      <input
                        type="text"
                        placeholder="E.g. Manufacturing / SaaS"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                      />
                    </div>
                  )}
                  {!hiddenStandardFields.includes('annualRevenue') && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Estimated Revenue (₹)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="E.g. 500000"
                        value={annualRevenue}
                        onChange={(e) => setAnnualRevenue(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Next Follow-Up Schedule</label>
                    <input
                      type="datetime-local"
                      value={nextFollowUpDate}
                      onChange={(e) => setNextFollowUpDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-650 transition"
                    />
                  </div>
                </div>

                {((currentUser?.role === 'owner' || currentUser?.role === 'sales_admin') || !hiddenStandardFields.includes('employeeCount')) && (
                  <div className={`grid grid-cols-1 md:grid-cols-${(currentUser?.role === 'owner' || currentUser?.role === 'sales_admin') && !hiddenStandardFields.includes('employeeCount') ? '2' : '1'} gap-4`}>
                    {(currentUser?.role === 'owner' || currentUser?.role === 'sales_admin') && (
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Allocate Lead To</label>
                        <div className="flex flex-col gap-2">
                          <select
                            value={assignedTo}
                            disabled={autoAssign}
                            onChange={(e) => setAssignedTo(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-600 transition disabled:opacity-50"
                          >
                            <option value="">👤 Assign to Me (Default)</option>
                            <option value="all">🌐 Assign to All Sales Representatives (Shared Pool)</option>
                            {salesReps
                              .filter((rep) => rep.role !== 'owner')
                              .map((rep) => (
                                <option key={rep._id} value={rep._id}>
                                  {rep.name} ({rep.role === 'sales_admin' ? 'Manager' : 'Rep'})
                                </option>
                              ))}
                          </select>
                          <div className="flex flex-wrap gap-2">
                            <label className="flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 px-3.5 py-2.5 rounded-lg cursor-pointer hover:bg-indigo-100 transition select-none w-fit">
                              <input
                                type="checkbox"
                                checked={autoAssign}
                                onChange={(e) => {
                                  setAutoAssign(e.target.checked);
                                  if (e.target.checked) setAssignedTo('');
                                }}
                                className="rounded text-indigo-650 cursor-pointer"
                              />
                              <span>🤖 Auto Distribute (Round-Robin)</span>
                            </label>
                            {currentUser?.role === 'owner' && (
                              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-lg cursor-pointer hover:bg-slate-100 transition select-none w-fit">
                                <input
                                  type="checkbox"
                                  checked={isPublic}
                                  onChange={(e) => setIsPublic(e.target.checked)}
                                  className="rounded text-slate-600 cursor-pointer"
                                />
                                <span>🌐 Public Lead (Share with team)</span>
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {!hiddenStandardFields.includes('employeeCount') && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Total Employee Count</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="E.g. 150"
                          value={employeeCount}
                          onChange={(e) => setEmployeeCount(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 5: Requirements */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">Client Requirements Summary</span>
                <div>
                  <textarea
                    rows="3"
                    placeholder="Provide a detailed brief of the client's needs, estimated deliverables, or specific project modules..."
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
                  ></textarea>
                </div>
              </div>



              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold hover:bg-slate-100 border border-transparent rounded-lg text-slate-500 hover:text-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/25 transition cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : 'Save Lead Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT LEAD DETAILS MODAL --- */}
      {editModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                <Edit className="h-4.5 w-4.5 text-emerald-600" />
                Modify Lead Profile: {selectedLead.firstName} {selectedLead.lastName || ''}
              </h2>
              <button 
                type="button"
                onClick={() => setEditModalOpen(false)} 
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scroll Container */}
            <form onSubmit={handleEditLead} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto bg-white">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-600 font-bold animate-in fade-in">
                  {formError}
                </div>
              )}

              {/* Section 1: Basic Bio */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">Primary Business Contact</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. Rajesh"
                      value={editLeadFirstName}
                      onChange={(e) => setEditLeadFirstName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Last Name</label>
                    <input
                      type="text"
                      placeholder="E.g. Sharma"
                      value={editLeadLastName}
                      onChange={(e) => setEditLeadLastName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Organization Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. Innonsh Tech"
                      value={editLeadCompany}
                      onChange={(e) => setEditLeadCompany(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                    />
                  </div>
                </div>

                {(!hiddenStandardFields.includes('designation') || !hiddenStandardFields.includes('website')) && (
                  <div className={`grid grid-cols-1 md:grid-cols-${2 - [hiddenStandardFields.includes('designation'), hiddenStandardFields.includes('website')].filter(Boolean).length} gap-4`}>
                    {!hiddenStandardFields.includes('designation') && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Job Title / Designation</label>
                        <input
                          type="text"
                          placeholder="E.g. Purchasing Manager / Founder"
                          value={editLeadDesignation}
                          onChange={(e) => setEditLeadDesignation(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                        />
                      </div>
                    )}
                    {!hiddenStandardFields.includes('website') && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Corporate Website</label>
                        <input
                          type="url"
                          placeholder="E.g. https://example.com"
                          value={editLeadWebsite}
                          onChange={(e) => setEditLeadWebsite(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Org-Defined Custom Fields (Edit Mode) */}
              {orgCustomFieldDefs.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono">Custom details</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orgCustomFieldDefs.map((fieldDef) => {
                      const IconComponent = fieldDef.icon_name ? getCustomFieldIcon(fieldDef.icon_name) : null;
                      return (
                        <div key={fieldDef.id}>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            {fieldDef.field_label}
                            {fieldDef.is_required && <span className="text-rose-500 ml-1">*</span>}
                          </label>
                          <div className={IconComponent ? "relative" : ""}>
                            {IconComponent && (
                              <span className={`absolute inset-y-0 left-0 flex pl-3 text-slate-400 pointer-events-none ${fieldDef.field_type === 'textarea' ? 'items-start pt-3' : 'items-center'}`}>
                                <IconComponent className="h-3.5 w-3.5" />
                              </span>
                            )}
                            {fieldDef.field_type === 'text' && (
                              <input
                                type="text"
                                placeholder={fieldDef.placeholder || ''}
                                value={editLeadCustomData[fieldDef.field_key] || ''}
                                onChange={(e) => setEditLeadCustomData(prev => ({ ...prev, [fieldDef.field_key]: e.target.value }))}
                                className={`w-full ${IconComponent ? 'pl-9 pr-3' : 'px-3'} py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition`}
                              />
                            )}
                            {fieldDef.field_type === 'number' && (
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder={fieldDef.placeholder || ''}
                                value={editLeadCustomData[fieldDef.field_key] || ''}
                                onChange={(e) => setEditLeadCustomData(prev => ({ ...prev, [fieldDef.field_key]: e.target.value.replace(/\D/g, '') }))}
                                className={`w-full ${IconComponent ? 'pl-9 pr-3' : 'px-3'} py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition`}
                              />
                            )}
                            {fieldDef.field_type === 'date' && (
                              <input
                                type="date"
                                placeholder={fieldDef.placeholder || ''}
                                value={editLeadCustomData[fieldDef.field_key] || ''}
                                onChange={(e) => setEditLeadCustomData(prev => ({ ...prev, [fieldDef.field_key]: e.target.value }))}
                                className={`w-full ${IconComponent ? 'pl-9 pr-3' : 'px-3'} py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition`}
                              />
                            )}
                            {fieldDef.field_type === 'textarea' && (
                              <textarea
                                rows={2}
                                placeholder={fieldDef.placeholder || ''}
                                value={editLeadCustomData[fieldDef.field_key] || ''}
                                onChange={(e) => setEditLeadCustomData(prev => ({ ...prev, [fieldDef.field_key]: e.target.value }))}
                                className={`w-full ${IconComponent ? 'pl-9 pr-3 pt-2' : 'px-3 py-2'} rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition resize-none`}
                              />
                            )}
                            {fieldDef.field_type === 'dropdown' && (
                              <select
                                value={editLeadCustomData[fieldDef.field_key] || ''}
                                onChange={(e) => setEditLeadCustomData(prev => ({ ...prev, [fieldDef.field_key]: e.target.value }))}
                                className={`w-full ${IconComponent ? 'pl-9 pr-3' : 'px-3'} py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition cursor-pointer`}
                              >
                                <option value="">{fieldDef.placeholder || '-- Select --'}</option>
                                {(fieldDef.options || []).map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            )}
                            {fieldDef.field_type === 'boolean' && (
                              <div className="flex gap-4 pt-2.5">
                                {['Yes', 'No'].map((opt) => (
                                  <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`edit_cf_${fieldDef.field_key}`}
                                      value={opt}
                                      checked={editLeadCustomData[fieldDef.field_key] === opt}
                                      onChange={() => setEditLeadCustomData(prev => ({ ...prev, [fieldDef.field_key]: opt }))}
                                      className="accent-emerald-500 cursor-pointer"
                                    />
                                    <span className="text-xs font-bold text-slate-655">{opt}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 2: Contact Channels */}
              <div className="space-y-4 pt-2">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">Communication channels</span>
                <div className={`grid grid-cols-1 md:grid-cols-${hiddenStandardFields.includes('whatsapp') ? '2' : '3'} gap-4`}>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input
                      type="email"
                      placeholder="E.g. client@company.com"
                      value={editLeadEmail}
                      onChange={(e) => setEditLeadEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="E.g. +91 9876543210"
                      value={editLeadPhone}
                      onChange={(e) => setEditLeadPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                    />
                  </div>
                  {!hiddenStandardFields.includes('whatsapp') && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">WhatsApp Contact Number</label>
                      <input
                        type="tel"
                        placeholder="E.g. +91 9876543210"
                        value={editLeadWhatsapp}
                        onChange={(e) => setEditLeadWhatsapp(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Localization */}
              <div className="space-y-4 pt-2">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">Geographic Localization</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">City</label>
                    <input
                      type="text"
                      placeholder="E.g. Pune"
                      value={editLeadCity}
                      onChange={(e) => setEditLeadCity(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">State</label>
                    <input
                      type="text"
                      placeholder="E.g. Maharashtra"
                      value={editLeadState}
                      onChange={(e) => setEditLeadState(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Country</label>
                    <input
                      type="text"
                      placeholder="E.g. India"
                      value={editLeadCountry}
                      onChange={(e) => setEditLeadCountry(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: CRM Details */}
              <div className="space-y-4 pt-2">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">CRM Context & Classification</span>
                
                <div className={`grid grid-cols-1 md:grid-cols-${hiddenStandardFields.includes('source') ? '2' : '3'} gap-4`}>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Lead Priority Tag</label>
                    <select
                      value={editLeadPriority}
                      onChange={(e) => setEditLeadPriority(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-700 transition"
                    >
                      <option value="Hot">🔥 Hot Priority</option>
                      <option value="Warm">⭐ Warm Priority</option>
                      <option value="Cold">❄️ Cold Priority</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Lead Status</label>
                    <select
                      value={editLeadStatus}
                      onChange={(e) => setEditLeadStatus(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-700 transition"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Attempted">Attempted Contact</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Lost">Lost</option>
                      <option value="Future">Contact in Future</option>
                    </select>
                  </div>
                  {!hiddenStandardFields.includes('source') && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Lead Source</label>
                      <select
                        value={editLeadSource}
                        onChange={(e) => setEditLeadSource(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-655 transition"
                      >
                        <option value="Website">Website</option>
                        <option value="Referral">Referral</option>
                        <option value="Cold Call">Cold Call</option>
                        <option value="Social Media">Social Media</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Google Search">Google Search</option>
                        <option value="Event">Event/Exhibition</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  )}
                </div>

                {editLeadStatus === 'Lost' && (
                  <div className="animate-in fade-in">
                    <label className="block text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1.5">Lost Reason *</label>
                    <select
                      value={editLeadLostReason}
                      required={editLeadStatus === 'Lost'}
                      onChange={(e) => setEditLeadLostReason(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-rose-250 focus:outline-none text-xs text-slate-700 transition"
                    >
                      <option value="">-- Choose Reason --</option>
                      <option value="Budget issue">Budget issue</option>
                      <option value="No response">No response</option>
                      <option value="Competitor">Competitor</option>
                      <option value="Not interested">Not interested</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                )}

                {/* Products & Follow up Types Dynamic Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Interested Product / Service ⭐</label>
                    <select
                      value={editLeadInterestedProduct}
                      onChange={(e) => setEditLeadInterestedProduct(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-700 transition"
                    >
                      <option value="">-- Choose Product/Service --</option>
                      {products.map((prod) => (
                        <option key={prod._id} value={prod.name}>
                          📦 {prod.name} (₹{prod.price.toLocaleString('en-IN')})
                        </option>
                      ))}
                      <option value="Other">Other Services</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Follow-up Communication Type ⭐</label>
                    <select
                      value={editLeadFollowUpType}
                      onChange={(e) => setEditLeadFollowUpType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-700 transition"
                    >
                      <option value="None">None (No reminder scheduling)</option>
                      <option value="Call">📞 Follow-up Call</option>
                      <option value="Meeting">🤝 Physical/Online Meeting</option>
                      <option value="Demo">💻 Product Demo Session</option>
                      <option value="WhatsApp">💬 WhatsApp Outreach</option>
                      <option value="Email">📧 Email Campaign</option>
                    </select>
                  </div>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-${3 - [hiddenStandardFields.includes('industry'), hiddenStandardFields.includes('annualRevenue')].filter(Boolean).length} gap-4`}>
                  {!hiddenStandardFields.includes('industry') && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Industry Segment</label>
                      <input
                        type="text"
                        placeholder="E.g. Manufacturing / SaaS"
                        value={editLeadIndustry}
                        onChange={(e) => setEditLeadIndustry(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                      />
                    </div>
                  )}
                  {!hiddenStandardFields.includes('annualRevenue') && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Estimated Revenue (₹)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="E.g. 500000"
                        value={editLeadAnnualRevenue}
                        onChange={(e) => setEditLeadAnnualRevenue(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Next Follow-Up Schedule</label>
                    <input
                      type="datetime-local"
                      value={editLeadNextFollowUpDate}
                      onChange={(e) => setEditLeadNextFollowUpDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-655 transition"
                    />
                  </div>
                </div>

                {((currentUser?.role === 'owner' || currentUser?.role === 'sales_admin') || !hiddenStandardFields.includes('employeeCount')) && (
                  <div className={`grid grid-cols-1 md:grid-cols-${(currentUser?.role === 'owner' || currentUser?.role === 'sales_admin') && !hiddenStandardFields.includes('employeeCount') ? '2' : '1'} gap-4`}>
                    {(currentUser?.role === 'owner' || currentUser?.role === 'sales_admin') && (
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Allocate Lead To</label>
                        <div className="flex flex-col gap-2">
                          <select
                            value={editLeadAssignedTo}
                            onChange={(e) => setEditLeadAssignedTo(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-600 transition"
                          >
                            <option value="all">🌐 Assign to All Sales Representatives (Shared Pool)</option>
                            {salesReps
                              .filter((rep) => rep.role !== 'owner')
                              .map((rep) => (
                                <option key={rep._id} value={rep._id}>
                                  {rep.name} ({rep.role === 'sales_admin' ? 'Manager' : 'Rep'})
                                </option>
                              ))}
                          </select>
                          {currentUser?.role === 'owner' && (
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-lg cursor-pointer hover:bg-slate-100 transition select-none w-fit">
                              <input
                                type="checkbox"
                                checked={editLeadIsPublic}
                                onChange={(e) => setEditLeadIsPublic(e.target.checked)}
                                className="rounded text-slate-600 cursor-pointer"
                              />
                              <span>🌐 Public Lead (Share with team)</span>
                            </label>
                          )}
                        </div>
                      </div>
                    )}
                    {!hiddenStandardFields.includes('employeeCount') && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Total Employee Count</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="E.g. 150"
                          value={editLeadEmployeeCount}
                          onChange={(e) => setEditLeadEmployeeCount(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 5: Requirements */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">Client Requirements Summary</span>
                <div>
                  <textarea
                    rows="3"
                    placeholder="Provide a detailed brief of the client's needs, estimated deliverables..."
                    value={editLeadRequirements}
                    onChange={(e) => setEditLeadRequirements(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
                  ></textarea>
                </div>
              </div>



              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold hover:bg-slate-100 border border-transparent rounded-lg text-slate-500 hover:text-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/25 transition cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : 'Save Modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONVERT LEAD TO DEAL MODAL --- */}
      {convertModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-6 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Briefcase className="h-5 w-5 text-amber-500" />
                Convert Lead to Active Deal
              </h2>
              <button 
                onClick={() => setConvertModalOpen(false)} 
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-850"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConvertLead} className="p-6 space-y-5 bg-white">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-600 font-bold">
                  {formError}
                </div>
              )}

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1 shadow-sm">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] font-mono">Converting Client:</p>
                <p className="text-slate-800 font-black text-xs">{selectedLead.firstName} {selectedLead.lastName} ({selectedLead.company})</p>
                <p className="text-slate-500 text-[10px] pt-1 font-medium leading-relaxed">This will automatically mark the Lead as &quot;Qualified&quot; and generate a Sales pipeline card.</p>
              </div>

              {/* Deal Title */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. CRM Customization Deal"
                  value={dealTitle}
                  onChange={(e) => setDealTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                />
              </div>

              {/* Budget Value */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deal Budget / Value (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="E.g. 500000"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                />
              </div>

              {/* Closing Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Target Closing Date *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <Calendar className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="date"
                    required
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-655 transition"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setConvertModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold hover:bg-slate-100 border border-transparent rounded-lg text-slate-500 hover:text-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-lg shadow-md shadow-amber-500/10 hover:shadow-amber-500/25 transition cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : 'Convert & Open Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
