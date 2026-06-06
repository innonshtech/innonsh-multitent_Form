'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Loader2, 
  Search, 
  Plus, 
  User, 
  Building, 
  Mail, 
  Phone, 
  Trash2, 
  X, 
  MessageCircle, 
  MapPin, 
  Globe, 
  Briefcase,
  CheckCircle,
  PlusCircle,
  Edit2,
  Info,
  Calendar,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Building2,
  Tag,
  Hash,
  DollarSign
} from 'lucide-react';

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

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [clientOrganizations, setClientOrganizations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [salesReps, setSalesReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [repFilter, setRepFilter] = useState('');

  // Selection & Details Slide-over
  const [selectedContact, setSelectedContact] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [assignedTo, setAssignedTo] = useState('');
  const [status, setStatus] = useState('Active');
  
  const [formError, setFormError] = useState('');

  // Org-wide customizations and standard field visibility
  const [orgCustomFieldDefs, setOrgCustomFieldDefs] = useState([]);
  const [hiddenStandardFields, setHiddenStandardFields] = useState([]);
  const [customFieldsData, setCustomFieldsData] = useState({});
  const [sector, setSector] = useState('');

  // Toast Helper
  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage({ text: '', type: '' });
    }, 4000);
  };

  const fetchClientOrganizations = async () => {
    try {
      const res = await fetch('/api/client-organizations');
      if (res.ok) {
        const data = await res.json();
        setClientOrganizations(data.organizations || []);
      }
    } catch (err) {
      console.error('Fetch client orgs failed:', err);
    }
  };

  // Fetch current user and session details
  useEffect(() => {
    async function initContactsPage() {
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData.user);

          if (userData.user.role === 'owner' || userData.user.role === 'sales_admin') {
            const repsRes = await fetch('/api/users');
            if (repsRes.ok) {
              const repsData = await repsRes.json();
              setSalesReps(repsData.users || []);
            }
          }

          // Fetch custom fields schema + standard visibility
          const [cfRes, sfRes, suggRes] = await Promise.all([
            fetch('/api/tenant/custom-fields?module=contacts'),
            fetch('/api/tenant/standard-fields'),
            fetch('/api/tenant/sector-suggestions?module=contacts')
          ]);
          if (cfRes.ok) {
            const cfData = await cfRes.json();
            setOrgCustomFieldDefs(cfData.fields || []);
          }
          if (sfRes.ok) {
            const sfData = await sfRes.json();
            setHiddenStandardFields(sfData.hiddenFields || []);
          }
          if (suggRes.ok) {
            const suggData = await suggRes.json();
            setSector(suggData.sector || 'General');
          }
          fetchClientOrganizations();
        }
      } catch (err) {
        console.error('Contacts page init failed:', err);
      }
    }
    initContactsPage();
  }, []);

  // Fetch contacts with filters
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (statusFilter) queryParams.append('status', statusFilter);
      if (repFilter) queryParams.append('assignedTo', repFilter);

      const res = await fetch(`/api/contacts?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
      fetchClientOrganizations();
    } catch (err) {
      console.error('Fetch contacts failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchContacts();
  }, [search, statusFilter, repFilter]);

  // Handle contact select
  const handleSelectContact = async (contactId) => {
    try {
      const res = await fetch(`/api/contacts/${contactId}`);
      if (res.ok) {
        const data = await res.json();
        // Since we retrieve the selected item
        setSelectedContact(data.contact);
      } else {
        // Direct local search mapping fallback
        const localItem = contacts.find(c => c._id === contactId);
        if (localItem) setSelectedContact(localItem);
      }
    } catch (err) {
      const localItem = contacts.find(c => c._id === contactId);
      if (localItem) setSelectedContact(localItem);
    }
  };

  // Create manual contact submit
  const handleCreateContact = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setActionLoading(true);

    const contactData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      company: company.trim(),
      designation: designation.trim(),
      email: email.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      assignedTo: assignedTo || undefined,
      status,
      customData: customFieldsData
    };

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      });

      const data = await res.json();

      if (res.ok) {
        setAddModalOpen(false);
        resetForm();
        fetchContacts();
        showToast('🎉 Permanent customer contact record created!');
      } else {
        setFormError(data.error || 'Failed to create customer record.');
      }
    } catch (err) {
      setFormError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Contact profile submit
  const handleUpdateContact = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setActionLoading(true);

    const contactData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      company: company.trim(),
      designation: designation.trim(),
      email: email.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      assignedTo: assignedTo || undefined,
      status,
      customData: customFieldsData
    };

    try {
      const res = await fetch(`/api/contacts/${selectedContact._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      });

      const data = await res.json();

      if (res.ok) {
        setEditModalOpen(false);
        setSelectedContact(data.contact);
        fetchContacts();
        showToast('🔄 Customer profile updated successfully!');
      } else {
        setFormError(data.error || 'Failed to update contact details.');
      }
    } catch (err) {
      setFormError('Connection issue. Try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Contact record
  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you absolutely sure you want to permanently delete this qualified customer contact? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/contacts/${contactId}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        setSelectedContact(null);
        fetchContacts();
        showToast('🗑️ Permanent Customer Contact deleted successfully.');
      } else {
        alert(data.error || 'Failed to delete contact.');
      }
    } catch (err) {
      console.error('Delete contact profile error:', err);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setCompany('');
    setDesignation('');
    setEmail('');
    setPhone('');
    setWhatsapp('');
    setCity('');
    setState('');
    setCountry('India');
    setAssignedTo('');
    setStatus('Active');
    setFormError('');
    setCustomFieldsData({});
  };

  const populateEditForm = (contact) => {
    setFirstName(contact.firstName);
    setLastName(contact.lastName || '');
    setCompany(contact.company || '');
    setDesignation(contact.designation || '');
    setEmail(contact.email || '');
    setPhone(contact.phone || '');
    setWhatsapp(contact.whatsapp || '');
    setCity(contact.city || '');
    setState(contact.state || '');
    setCountry(contact.country || 'India');
    setAssignedTo(contact.assignedTo?._id || contact.assignedTo || '');
    setStatus(contact.status || 'Active');
    setFormError('');
    setCustomFieldsData(contact.customData || {});
    setEditModalOpen(true);
  };

  // WhatsApp chat trigger
  const triggerWhatsApp = (contact) => {
    if (!contact.whatsapp) return;
    const cleanNum = contact.whatsapp.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNum.startsWith('91') ? cleanNum : '91' + cleanNum}`, '_blank');
  };

  // Analytical Metrics Box helpers
  const totalContacts = contacts.length;
  const directCallLines = contacts.filter(c => c.phone).length;
  const whatsappActiveCount = contacts.filter(c => c.whatsapp).length;
  const uniqueCompanies = new Set(contacts.map(c => c.company).filter(Boolean)).size;

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

      {/* --- HEADER PANELS --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-emerald-500" />
            {currentUser?.role === 'sales_rep' ? 'My Qualified Contacts' : 'Customer Contacts Directory'}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Permanent, converted corporate accounts. Standardized profiles sync directly from Qualified Deals.
          </p>
        </div>
        <div className="shrink-0 flex items-center">
          <button
            onClick={() => { resetForm(); setAddModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-md shadow-emerald-500/10 active:scale-[0.98] transition cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5 stroke-[3]" />
            Add Customer Contact
          </button>
        </div>
      </div>

      {/* --- ANALYTICAL SUMMARY CARD GRID --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-350">
        {/* Total Customers */}
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Total Converted Clients</span>
            <span className="text-2xl font-black text-slate-800 block mt-1">{totalContacts}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
            <User className="h-5 w-5" />
          </div>
        </div>

        {/* Direct Call Lines */}
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Direct Call Lines</span>
            <span className="text-2xl font-black text-emerald-600 block mt-1">{directCallLines}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
            <Phone className="h-5 w-5" />
          </div>
        </div>

        {/* WhatsApp outreach lines */}
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">WhatsApp Outreach Pool</span>
            <span className="text-2xl font-black text-indigo-650 block mt-1">{whatsappActiveCount}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
            <MessageCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Unique Accounts */}
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Active Corporate Companies</span>
            <span className="text-2xl font-black text-amber-600 block mt-1">{uniqueCompanies}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
            <Building2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* --- LIVE SEARCH & RBAC FILTERS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by name, organization, email..."
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
            className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-655 transition"
          >
            <option value="">All Contact Statuses</option>
            <option value="Active">🟢 Active Customers</option>
            <option value="Inactive">🔴 Inactive Accounts</option>
          </select>
        </div>

        {/* Admin attribution filters */}
        {(currentUser?.role === 'owner' || currentUser?.role === 'sales_admin') ? (
          <div>
            <select
              value={repFilter}
              onChange={(e) => setRepFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-655 transition"
            >
              <option value="">All Sales Rep Accounts</option>
              {salesReps.map((rep) => (
                <option key={rep._id} value={rep._id}>{rep.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-400 uppercase tracking-widest font-mono font-black">
            Secure Rep Session
          </div>
        )}
      </div>

      {/* --- CONTACTS TABLE GRID --- */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p className="text-xs text-slate-400 font-bold">Scanning secure Customer Database...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6 bg-slate-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 mb-4 shadow-sm">
              <User className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No customer contacts registered</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1 font-medium">
              Permanent contacts are generated automatically once a raw Lead is converted to a qualified deal.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Organization</th>
                  <th className="px-6 py-4">Contact Channels</th>
                  <th className="px-6 py-4">Zonal Location</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contacts.map((contact) => (
                  <tr
                    key={contact._id}
                    onClick={() => handleSelectContact(contact._id)}
                    className="hover:bg-slate-50/50 transition-all duration-150 cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm uppercase">
                          {contact.firstName[0]}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 group-hover:text-emerald-600 transition block">
                            {contact.firstName} {contact.lastName}
                          </span>
                          {contact.designation && <span className="block text-[9px] text-slate-400 font-bold uppercase">{contact.designation}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700" onClick={(e) => { if (contact.organization) e.stopPropagation(); }}>
                      {contact.organization ? (
                        <Link 
                          href={`/dashboard/client-organizations?search=${encodeURIComponent(contact.organization.name)}`}
                          className="text-emerald-600 font-extrabold hover:text-emerald-500 hover:underline"
                        >
                          🏢 {contact.organization.name}
                        </Link>
                      ) : (
                        contact.company || <span className="text-slate-400 italic">Individual Account</span>
                      )}
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      {contact.email && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span>{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>{contact.city ? `${contact.city}, ${contact.state || ''}` : 'India'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 text-[8px] font-black rounded-full uppercase border ${
                        contact.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-655">
                      {contact.assignedTo ? contact.assignedTo.name.split(' ')[0] : 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {contact.whatsapp && (
                          <button
                            onClick={() => triggerWhatsApp(contact)}
                            className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 border border-transparent hover:border-emerald-100 transition cursor-pointer"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="h-4.5 w-4.5" />
                          </button>
                        )}
                        {currentUser?.role !== 'sales_rep' && (
                          <button
                            onClick={() => handleDeleteContact(contact._id)}
                            className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-100 transition cursor-pointer"
                            title="Delete Customer Profile"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        )}
                        <ChevronRight className="h-4.5 w-4.5 text-slate-450 group-hover:translate-x-0.5 transition" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- DYNAMIC SLIDE DRAWER --- */}
      {selectedContact && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex-1" onClick={() => setSelectedContact(null)}></div>
          
          <div className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 font-extrabold text-lg shadow-sm">
                  {selectedContact.firstName[0]}
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 leading-tight">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </h2>
                  <div className="text-xs text-slate-400 mt-0.5 font-bold">
                    {selectedContact.organization ? (
                      <Link 
                        href={`/dashboard/client-organizations?search=${encodeURIComponent(selectedContact.organization.name)}`}
                        className="text-emerald-600 font-extrabold hover:text-emerald-500 hover:underline"
                      >
                        🏢 {selectedContact.organization.name}
                      </Link>
                    ) : (selectedContact.company || 'Individual Client')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => populateEditForm(selectedContact)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-655 hover:text-slate-800 transition"
                  title="Edit Profile"
                >
                  <Edit2 className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
              
              {/* Account Status Box */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Account Relations Status</span>
                  <span className={`inline-block px-2.5 py-0.5 text-[9px] font-extrabold rounded-full uppercase mt-1.5 ${
                    selectedContact.status === 'Active' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'bg-rose-50 text-rose-700'
                  }`}>
                    {selectedContact.status} Customers
                  </span>
                </div>
                {selectedContact.whatsapp && !hiddenStandardFields.includes('contacts:whatsapp') && (
                  <button
                    onClick={() => triggerWhatsApp(selectedContact)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-450 text-white text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </button>
                )}
              </div>

              {/* Contact Profile details */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Email Address</span>
                    <a href={`mailto:${selectedContact.email}`} className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold hover:text-emerald-600 transition">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{selectedContact.email || 'No email set'}</span>
                    </a>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Direct Line / Phone</span>
                    <a href={`tel:${selectedContact.phone}`} className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold hover:text-emerald-600 transition">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{selectedContact.phone || 'No phone set'}</span>
                    </a>
                  </div>
                  {selectedContact.designation && !hiddenStandardFields.includes('contacts:designation') && (
                    <div className="space-y-1 col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Corporate Job Title</span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold mt-0.5">
                        <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{selectedContact.designation}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Location attributes */}
                <div className="border-t border-slate-100 pt-3.5 grid grid-cols-2 gap-4">
                  {!hiddenStandardFields.includes('contacts:city') && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Zonal address</span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{selectedContact.city ? `${selectedContact.city}, ${selectedContact.state || ''}` : 'India'}</span>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Manager attributed</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold mt-0.5">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{selectedContact.assignedTo?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>

                {/* Lead reference info if converted */}
                {selectedContact.leadId && (
                  <div className="border-t border-slate-100 pt-3.5">
                    <div className="p-3 rounded-lg bg-emerald-50/20 border border-emerald-100/40 text-xs text-emerald-800 font-medium">
                      🤝 Converted from dynamic Cold Leads Database pipeline.
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Org Custom Fields Box */}
              {orgCustomFieldDefs.length > 0 && (
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block border-b border-slate-100 pb-1.5">Industry Specifications ({sector})</span>
                  <div className="grid grid-cols-2 gap-4">
                    {orgCustomFieldDefs.map((field) => {
                      const val = selectedContact.customData?.[field.field_key];
                      if (val === undefined || val === '') return null;
                      return (
                        <div key={field.id} className="space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">{field.field_label}</span>
                          <span className="text-xs text-slate-700 font-extrabold block">{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Admin delete card */}
              {currentUser?.role !== 'sales_rep' && (
                <div className="p-4 rounded-xl bg-rose-50/30 border border-rose-100 shadow-sm flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-700">Delete Customer Record?</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-bold">This will permanently purge this customer.</p>
                  </div>
                  <button
                    onClick={() => handleDeleteContact(selectedContact._id)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition"
                  >
                    Delete Profile
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* --- ADD / CREATE MANUAL CONTACT MODAL --- */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl flex flex-col shadow-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <PlusCircle className="h-5 w-5 text-emerald-500" />
                Add New Permanent Customer Contact
              </h2>
              <button 
                onClick={() => setAddModalOpen(false)} 
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-855 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateContact} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white scrollbar-thin">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-600 font-bold animate-in fade-in">
                  {formError}
                </div>
              )}

              {/* Section 1: Identity & Primary Info */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">Primary Details</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. Rajesh"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Last Name</label>
                    <input
                      type="text"
                      placeholder="E.g. Kumar"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
                    />
                  </div>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-${hiddenStandardFields.includes('contacts:designation') ? '1' : '2'} gap-4`}>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Organization Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                        <Building className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        list="organizations-datalist"
                        placeholder="E.g. Innonsh Tech"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
                      />
                    </div>
                    <datalist id="organizations-datalist">
                      {clientOrganizations.map(o => (
                        <option key={o._id || o.id} value={o.name} />
                      ))}
                    </datalist>
                  </div>
                  {!hiddenStandardFields.includes('contacts:designation') && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Designation</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                          <Briefcase className="h-3.5 w-3.5" />
                        </span>
                        <input
                          type="text"
                          placeholder="E.g. CTO / Tech Lead"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Contact Details */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">Communication channels</span>
                <div className={`grid grid-cols-1 md:grid-cols-${hiddenStandardFields.includes('contacts:whatsapp') ? '2' : '3'} gap-4`}>
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
                  {!hiddenStandardFields.includes('contacts:whatsapp') && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">WhatsApp Mobile</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-500 pointer-events-none">
                          <MessageCircle className="h-3.5 w-3.5" />
                        </span>
                        <input
                          type="text"
                          placeholder="99999"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Location Details */}
              {!hiddenStandardFields.includes('contacts:city') && (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">Location details</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">City</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                          <MapPin className="h-3.5 w-3.5" />
                        </span>
                        <input
                          type="text"
                          placeholder="Pune"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">State</label>
                      <input
                        type="text"
                        placeholder="Maharashtra"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Dynamic Custom Fields */}
              {orgCustomFieldDefs.length > 0 && (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">Sector Specific Information ({sector})</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orgCustomFieldDefs.map((field) => {
                      const IconComponent = field.icon_name ? getCustomFieldIcon(field.icon_name) : null;
                      return (
                        <div key={field.id} className="col-span-1">
                          <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1.5">
                            {field.field_label} {field.is_required && '*'}
                          </label>
                          <div className={IconComponent ? "relative" : ""}>
                            {IconComponent && (
                              <span className={`absolute inset-y-0 left-0 flex pl-3 text-slate-455 pointer-events-none ${field.field_type === 'textarea' ? 'items-start pt-2' : 'items-center'}`}>
                                <IconComponent className="h-3.5 w-3.5" />
                              </span>
                            )}
                            {field.field_type === 'dropdown' ? (
                              <select
                                value={customFieldsData[field.field_key] || ''}
                                onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.field_key]: e.target.value }))}
                                required={field.is_required}
                                className={`w-full ${IconComponent ? 'pl-9 pr-3' : 'px-3'} py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition`}
                              >
                                <option value="">{field.placeholder || 'Select option'}</option>
                                {(field.options || []).map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : field.field_type === 'boolean' ? (
                              <select
                                value={customFieldsData[field.field_key] || ''}
                                onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.field_key]: e.target.value }))}
                                required={field.is_required}
                                className={`w-full ${IconComponent ? 'pl-9 pr-3' : 'px-3'} py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition`}
                              >
                                <option value="">Select option</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                              </select>
                            ) : field.field_type === 'textarea' ? (
                              <textarea
                                value={customFieldsData[field.field_key] || ''}
                                onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.field_key]: e.target.value }))}
                                required={field.is_required}
                                placeholder={field.placeholder || ''}
                                className={`w-full ${IconComponent ? 'pl-9 pr-3 pt-2' : 'px-3 py-2'} rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition min-h-[60px]`}
                              />
                            ) : field.field_type === 'number' ? (
                              <input
                                type="text"
                                inputMode="numeric"
                                value={customFieldsData[field.field_key] || ''}
                                onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.field_key]: e.target.value.replace(/\D/g, '') }))}
                                required={field.is_required}
                                placeholder={field.placeholder || ''}
                                className={`w-full ${IconComponent ? 'pl-9 pr-3' : 'px-3'} py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition`}
                              />
                            ) : (
                              <input
                                type={field.field_type === 'date' ? 'date' : 'text'}
                                value={customFieldsData[field.field_key] || ''}
                                onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.field_key]: e.target.value }))}
                                required={field.is_required}
                                placeholder={field.placeholder || ''}
                                className={`w-full ${IconComponent ? 'pl-9 pr-3' : 'px-3'} py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition`}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 5: Assignment & Status */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">CRM Context & Classification</span>
                <div className={`grid grid-cols-1 md:grid-cols-${(currentUser?.role === 'owner' || currentUser?.role === 'sales_admin') ? '2' : '1'} gap-4`}>
                  {(currentUser?.role === 'owner' || currentUser?.role === 'sales_admin') && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Allocate Account Manager</label>
                      <select
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-655 transition"
                      >
                        <option value="">👤 Unassigned (Owner Owned)</option>
                        {salesReps.map((rep) => (
                          <option key={rep._id} value={rep._id}>{rep.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Account Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-655 transition"
                    >
                      <option value="Active">🟢 Active</option>
                      <option value="Inactive">🔴 Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit triggers */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-450 text-white text-xs font-bold rounded-lg shadow-md transition cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : 'Save Customer Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT / UPDATE PROFILE MODAL --- */}
      {editModalOpen && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl flex flex-col shadow-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Edit2 className="h-5 w-5 text-emerald-500" />
                Update Customer Contact Profile
              </h2>
              <button onClick={() => setEditModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-855 focus:outline-none">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateContact} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white scrollbar-thin">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-600 font-bold animate-in fade-in">
                  {formError}
                </div>
              )}

              {/* Section 1: Identity & Primary Info */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">Primary Details</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. Rajesh"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Last Name</label>
                    <input
                      type="text"
                      placeholder="E.g. Kumar"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                    />
                  </div>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-${hiddenStandardFields.includes('contacts:designation') ? '1' : '2'} gap-4`}>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Organization Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                        <Building className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        list="organizations-datalist"
                        placeholder="E.g. Innonsh Tech"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                      />
                    </div>
                    <datalist id="organizations-datalist">
                      {clientOrganizations.map(o => (
                        <option key={o._id || o.id} value={o.name} />
                      ))}
                    </datalist>
                  </div>
                  {!hiddenStandardFields.includes('contacts:designation') && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Designation</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                          <Briefcase className="h-3.5 w-3.5" />
                        </span>
                        <input
                          type="text"
                          placeholder="E.g. CTO / Tech Lead"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Contact Details */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">Communication channels</span>
                <div className={`grid grid-cols-1 md:grid-cols-${hiddenStandardFields.includes('contacts:whatsapp') ? '2' : '3'} gap-4`}>
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
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 placeholder-slate-450 transition"
                      />
                    </div>
                  </div>
                  {!hiddenStandardFields.includes('contacts:whatsapp') && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">WhatsApp Mobile</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-500 pointer-events-none">
                          <MessageCircle className="h-3.5 w-3.5" />
                        </span>
                        <input
                          type="text"
                          placeholder="99999"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Location Details */}
              {!hiddenStandardFields.includes('contacts:city') && (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">Location details</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">City</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                          <MapPin className="h-3.5 w-3.5" />
                        </span>
                        <input
                          type="text"
                          placeholder="Pune"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">State</label>
                      <input
                        type="text"
                        placeholder="Maharashtra"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Dynamic Custom Fields */}
              {orgCustomFieldDefs.length > 0 && (
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">Sector Specific Information ({sector})</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orgCustomFieldDefs.map((field) => {
                      const IconComponent = field.icon_name ? getCustomFieldIcon(field.icon_name) : null;
                      return (
                        <div key={field.id} className="col-span-1">
                          <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1.5">
                            {field.field_label} {field.is_required && '*'}
                          </label>
                          <div className={IconComponent ? "relative" : ""}>
                            {IconComponent && (
                              <span className={`absolute inset-y-0 left-0 flex pl-3 text-slate-455 pointer-events-none ${field.field_type === 'textarea' ? 'items-start pt-2' : 'items-center'}`}>
                                <IconComponent className="h-3.5 w-3.5" />
                              </span>
                            )}
                            {field.field_type === 'dropdown' ? (
                              <select
                                value={customFieldsData[field.field_key] || ''}
                                onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.field_key]: e.target.value }))}
                                required={field.is_required}
                                className={`w-full ${IconComponent ? 'pl-9 pr-3' : 'px-3'} py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition`}
                              >
                                <option value="">{field.placeholder || 'Select option'}</option>
                                {(field.options || []).map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : field.field_type === 'boolean' ? (
                              <select
                                value={customFieldsData[field.field_key] || ''}
                                onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.field_key]: e.target.value }))}
                                required={field.is_required}
                                className={`w-full ${IconComponent ? 'pl-9 pr-3' : 'px-3'} py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition`}
                              >
                                <option value="">Select option</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                              </select>
                            ) : field.field_type === 'textarea' ? (
                              <textarea
                                value={customFieldsData[field.field_key] || ''}
                                onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.field_key]: e.target.value }))}
                                required={field.is_required}
                                placeholder={field.placeholder || ''}
                                className={`w-full ${IconComponent ? 'pl-9 pr-3 pt-2' : 'px-3 py-2'} rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition min-h-[60px]`}
                              />
                            ) : field.field_type === 'number' ? (
                              <input
                                type="text"
                                inputMode="numeric"
                                value={customFieldsData[field.field_key] || ''}
                                onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.field_key]: e.target.value.replace(/\D/g, '') }))}
                                required={field.is_required}
                                placeholder={field.placeholder || ''}
                                className={`w-full ${IconComponent ? 'pl-9 pr-3' : 'px-3'} py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition`}
                              />
                            ) : (
                              <input
                                type={field.field_type === 'date' ? 'date' : 'text'}
                                value={customFieldsData[field.field_key] || ''}
                                onChange={(e) => setCustomFieldsData(prev => ({ ...prev, [field.field_key]: e.target.value }))}
                                required={field.is_required}
                                placeholder={field.placeholder || ''}
                                className={`w-full ${IconComponent ? 'pl-9 pr-3' : 'px-3'} py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition`}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 5: Assignment & Status */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">CRM Context & Classification</span>
                <div className={`grid grid-cols-1 md:grid-cols-${(currentUser?.role === 'owner' || currentUser?.role === 'sales_admin') ? '2' : '1'} gap-4`}>
                  {(currentUser?.role === 'owner' || currentUser?.role === 'sales_admin') && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Allocate Account Manager</label>
                      <select
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-655 transition"
                      >
                        <option value="">👤 Unassigned (Owner Owned)</option>
                        {salesReps.map((rep) => (
                          <option key={rep._id} value={rep._id}>{rep.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Account Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-655 transition"
                    >
                      <option value="Active">🟢 Active</option>
                      <option value="Inactive">🔴 Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit triggers */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-450 text-white text-xs font-bold rounded-lg shadow-md transition cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : 'Save Update Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
