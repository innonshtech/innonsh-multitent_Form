'use client';

import { useEffect, useState } from 'react';
import { 
  Loader2, 
  Search, 
  Plus, 
  Building2, 
  Globe, 
  Briefcase, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Trash2, 
  X, 
  Edit2, 
  Info,
  CheckCircle,
  PlusCircle,
  ChevronRight,
  ShieldCheck,
  Calendar,
  DollarSign
} from 'lucide-react';

export default function ClientOrganizationsPage() {
  const [orgs, setOrgs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [salesReps, setSalesReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [repFilter, setRepFilter] = useState('');

  // Selection & Details Slide-over
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [assignedTo, setAssignedTo] = useState('');
  const [formError, setFormError] = useState('');

  // Toast Helper
  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage({ text: '', type: '' });
    }, 4000);
  };

  // Fetch initial data & URL query search parameter
  useEffect(() => {
    async function initPage() {
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
        }
      } catch (err) {
        console.error('Init client organizations page failed:', err);
      }
    }
    initPage();

    // Parse URL search parameters on mount
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get('search');
      if (searchParam) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSearch(decodeURIComponent(searchParam));
      }
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const orgQueryParams = new URLSearchParams();
      if (search) orgQueryParams.append('search', search);
      if (repFilter) orgQueryParams.append('assignedTo', repFilter);

      const [orgsRes, contactsRes, dealsRes] = await Promise.all([
        fetch(`/api/client-organizations?${orgQueryParams.toString()}`),
        fetch('/api/contacts'),
        fetch('/api/deals')
      ]);

      if (orgsRes.ok) {
        const data = await orgsRes.json();
        setOrgs(data.organizations || []);
      }
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setContacts(data.contacts || []);
      }
      if (dealsRes.ok) {
        const data = await dealsRes.json();
        setDeals(data.deals || []);
      }
    } catch (err) {
      console.error('Fetch data failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [search, repFilter]);

  // Handle select organization
  const handleSelectOrg = async (orgId) => {
    try {
      const res = await fetch(`/api/client-organizations/${orgId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedOrg(data.organization);
      } else {
        const localOrg = orgs.find(o => o._id === orgId);
        if (localOrg) setSelectedOrg(localOrg);
      }
    } catch (err) {
      const localOrg = orgs.find(o => o._id === orgId);
      if (localOrg) setSelectedOrg(localOrg);
    }
  };

  // Submit manual organization create
  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setActionLoading(true);

    const orgData = {
      name: name.trim(),
      website: website.trim(),
      industry: industry.trim(),
      phone: phone.trim(),
      email: email.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      assignedTo: assignedTo || undefined
    };

    try {
      const res = await fetch('/api/client-organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgData),
      });

      const data = await res.json();

      if (res.ok) {
        setAddModalOpen(false);
        resetForm();
        fetchData();
        showToast('🎉 Client Organization created successfully!');
      } else {
        setFormError(data.error || 'Failed to create organization.');
      }
    } catch (err) {
      setFormError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit organization update
  const handleUpdateOrg = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setActionLoading(true);

    const orgData = {
      name: name.trim(),
      website: website.trim(),
      industry: industry.trim(),
      phone: phone.trim(),
      email: email.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      assignedTo: assignedTo || undefined
    };

    try {
      const res = await fetch(`/api/client-organizations/${selectedOrg._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgData),
      });

      const data = await res.json();

      if (res.ok) {
        setEditModalOpen(false);
        setSelectedOrg(data.organization);
        fetchData();
        showToast('🔄 Organization profile updated successfully!');
      } else {
        setFormError(data.error || 'Failed to update organization.');
      }
    } catch (err) {
      setFormError('Connection issue. Try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete organization record
  const handleDeleteOrg = async (orgId) => {
    if (!window.confirm('Are you absolutely sure you want to permanently delete this client organization? Converted contacts and deals will be unlinked.')) return;

    try {
      const res = await fetch(`/api/client-organizations/${orgId}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        setSelectedOrg(null);
        fetchData();
        showToast('🗑️ Client Organization deleted successfully.');
      } else {
        alert(data.error || 'Failed to delete organization.');
      }
    } catch (err) {
      console.error('Delete organization error:', err);
    }
  };

  const resetForm = () => {
    setName('');
    setWebsite('');
    setIndustry('');
    setPhone('');
    setEmail('');
    setCity('');
    setState('');
    setCountry('India');
    setAssignedTo('');
    setFormError('');
  };

  const populateEditForm = (org) => {
    setName(org.name);
    setWebsite(org.website || '');
    setIndustry(org.industry || '');
    setPhone(org.phone || '');
    setEmail(org.email || '');
    setCity(org.city || '');
    setState(org.state || '');
    setCountry(org.country || 'India');
    setAssignedTo(org.assignedTo?._id || org.assignedTo || '');
    setFormError('');
    setEditModalOpen(true);
  };

  // Filter contacts and deals for the selected organization
  const linkedContacts = selectedOrg ? contacts.filter(c => c.organizationId === selectedOrg._id || c.company === selectedOrg.name) : [];
  const linkedDeals = selectedOrg ? deals.filter(d => d.organizationId === selectedOrg._id || d.company === selectedOrg.name) : [];

  return (
    <div className="space-y-6 relative h-full font-sans">
      
      {/* Toast Notification */}
      {toastMessage.text && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3.5 rounded-xl border shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top duration-300 bg-emerald-50 border-emerald-250 text-emerald-800`}>
          <Info className="h-4.5 w-4.5" />
          <span className="text-xs font-black tracking-wide">{toastMessage.text}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Building2 className="h-7 w-7 text-emerald-500" />
            Client Organizations Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Manage your corporate accounts, link related customer contacts, and track active deals.
          </p>
        </div>
        <div className="shrink-0 flex items-center">
          <button
            onClick={() => { resetForm(); setAddModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-md shadow-emerald-500/10 active:scale-[0.98] transition cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5 stroke-[3]" />
            Add Organization
          </button>
        </div>
      </div>

      {/* Live Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by name, website, phone, industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 transition"
          />
        </div>

        {/* Assigned Rep Filter */}
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

      {/* Organizations Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p className="text-xs text-slate-400 font-bold">Scanning corporate directory...</p>
          </div>
        ) : orgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6 bg-slate-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 mb-4 shadow-sm">
              <Building2 className="h-6 w-6 text-slate-450" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No organizations registered</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1 font-medium">
              Create one manually or convert a qualified lead to automatically register a corporate company account.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Company Name</th>
                  <th className="px-6 py-4">Website</th>
                  <th className="px-6 py-4">Industry / Domain</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">HQ Location</th>
                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orgs.map((org) => (
                  <tr
                    key={org._id}
                    onClick={() => handleSelectOrg(org._id)}
                    className="hover:bg-slate-50/50 transition-all duration-150 cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs bg-emerald-50 border border-emerald-100 text-emerald-700 shadow-sm uppercase">
                          {org.name[0]}
                        </div>
                        <span className="font-bold text-slate-800 group-hover:text-emerald-600 transition block">
                          {org.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {org.website ? (
                        <a 
                          href={org.website.startsWith('http') ? org.website : `https://${org.website}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 hover:text-emerald-600 hover:underline"
                        >
                          <Globe className="h-3 w-3 text-slate-400" />
                          <span>{org.website}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">No website</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-medium text-slate-655">
                        <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                        <span>{org.industry || 'Not Configured'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      {org.email && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span>{org.email}</span>
                        </div>
                      )}
                      {org.phone && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{org.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>{org.city ? `${org.city}, ${org.state || ''}` : 'India'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-655">
                      {org.assignedTo ? org.assignedTo.name.split(' ')[0] : 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {currentUser?.role !== 'sales_rep' && (
                          <button
                            onClick={() => handleDeleteOrg(org._id)}
                            className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-100 transition cursor-pointer"
                            title="Delete Organization"
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

      {/* Dynamic Slide Drawer for Organization Profile */}
      {selectedOrg && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex-1" onClick={() => setSelectedOrg(null)}></div>
          
          <div className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 font-extrabold text-lg shadow-sm">
                  {selectedOrg.name[0]}
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 leading-tight">
                    {selectedOrg.name}
                  </h2>
                  {selectedOrg.website && (
                    <a href={selectedOrg.website.startsWith('http') ? selectedOrg.website : `https://${selectedOrg.website}`} target="_blank" rel="noreferrer" className="text-xs text-slate-400 mt-0.5 font-bold hover:text-emerald-600 flex items-center gap-1.5">
                      <Globe className="h-3 w-3" /> {selectedOrg.website}
                    </a>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => populateEditForm(selectedOrg)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-655 hover:text-slate-800 transition"
                  title="Edit Organization Profile"
                >
                  <Edit2 className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => setSelectedOrg(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
              
              {/* Organization Bio Details */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Industry Vertical</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold mt-0.5">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{selectedOrg.industry || 'No industry set'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Account Manager</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold mt-0.5">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{selectedOrg.assignedTo?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Email Address</span>
                    {selectedOrg.email ? (
                      <a href={`mailto:${selectedOrg.email}`} className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold hover:text-emerald-600 transition">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{selectedOrg.email}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-500">No email set</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Corporate Hotline</span>
                    {selectedOrg.phone ? (
                      <a href={`tel:${selectedOrg.phone}`} className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold hover:text-emerald-600 transition">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{selectedOrg.phone}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-500">No phone set</span>
                    )}
                  </div>
                  <div className="space-y-1 col-span-2 border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">HQ Address</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{selectedOrg.city ? `${selectedOrg.city}, ${selectedOrg.state || ''}, ${selectedOrg.country || 'India'}` : 'India'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Linked Contacts Stack */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
                  Linked Contacts ({linkedContacts.length})
                </h3>
                
                {linkedContacts.length === 0 ? (
                  <div className="p-4 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-450 italic">
                    No contacts mapped to this organization.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {linkedContacts.map(contact => (
                      <div key={contact._id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{contact.firstName} {contact.lastName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase">{contact.designation || 'Client Contact'}</p>
                        </div>
                        {contact.phone && (
                          <a href={`tel:${contact.phone}`} className="p-1.5 bg-slate-550/10 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg transition">
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Sales Deals Stack */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="h-4.5 w-4.5 text-indigo-500" />
                  Active Pipelines Deals ({linkedDeals.length})
                </h3>
                
                {linkedDeals.length === 0 ? (
                  <div className="p-4 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-450 italic">
                    No sales deals associated with this organization.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {linkedDeals.map(deal => (
                      <div key={deal._id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                        <div className="max-w-[70%]">
                          <p className="text-xs font-bold text-slate-800 truncate">{deal.title}</p>
                          <span className="inline-block px-2 py-0.5 mt-1 text-[8px] font-black rounded-full bg-indigo-50 text-indigo-700 uppercase border border-indigo-100">{deal.stage}</span>
                        </div>
                        <p className="text-xs font-black text-indigo-700 font-mono">₹{deal.value.toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Add manual organization modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <PlusCircle className="h-5 w-5 text-emerald-500" />
                Register New Client Organization
              </h2>
              <button onClick={() => setAddModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-850">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="p-6 space-y-4.5 bg-white">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-600 font-bold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Organization / Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Innonsh Technology Solutions"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Website Domain</label>
                  <input
                    type="text"
                    placeholder="E.g. www.innonsh.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Industry Vertical</label>
                  <input
                    type="text"
                    placeholder="E.g. IT Services / Healthcare"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Corporate Email</label>
                  <input
                    type="email"
                    placeholder="office@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">HQ Hotline</label>
                  <input
                    type="text"
                    placeholder="E.g. +91 9988776655"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">City</label>
                  <input
                    type="text"
                    placeholder="E.g. Pune"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">State</label>
                  <input
                    type="text"
                    placeholder="E.g. Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Country</label>
                  <input
                    type="text"
                    placeholder="India"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
              </div>

              {/* Admin features: Assigned Rep */}
              {(currentUser?.role === 'owner' || currentUser?.role === 'sales_admin') && (
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Account Manager Assignment</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  >
                    <option value="">Leave Unassigned (Shared Pool)</option>
                    {salesReps.map((rep) => (
                      <option key={rep._id} value={rep._id}>{rep.name} ({rep.role})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-350 text-slate-655 text-xs font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-500 hover:bg-emerald-450 text-white text-xs font-bold rounded-lg transition shadow-md shadow-emerald-500/10"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit organization modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Edit2 className="h-4.5 w-4.5 text-emerald-500" />
                Edit Organization Details
              </h2>
              <button onClick={() => setEditModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-850">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateOrg} className="p-6 space-y-4.5 bg-white">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-600 font-bold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Organization / Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Innonsh Technology Solutions"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Website Domain</label>
                  <input
                    type="text"
                    placeholder="E.g. www.innonsh.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Industry Vertical</label>
                  <input
                    type="text"
                    placeholder="E.g. IT Services / Healthcare"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Corporate Email</label>
                  <input
                    type="email"
                    placeholder="office@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">HQ Hotline</label>
                  <input
                    type="text"
                    placeholder="E.g. +91 9988776655"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">City</label>
                  <input
                    type="text"
                    placeholder="E.g. Pune"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">State</label>
                  <input
                    type="text"
                    placeholder="E.g. Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Country</label>
                  <input
                    type="text"
                    placeholder="India"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
              </div>

              {/* Admin features: Assigned Rep */}
              {(currentUser?.role === 'owner' || currentUser?.role === 'sales_admin') && (
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Account Manager Assignment</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  >
                    <option value="">Leave Unassigned (Shared Pool)</option>
                    {salesReps.map((rep) => (
                      <option key={rep._id} value={rep._id}>{rep.name} ({rep.role})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-350 text-slate-655 text-xs font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-500 hover:bg-emerald-450 text-white text-xs font-bold rounded-lg transition shadow-md shadow-emerald-500/10"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Update Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
