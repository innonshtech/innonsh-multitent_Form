'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Loader2, 
  Briefcase, 
  User, 
  Building, 
  Calendar, 
  Trash2, 
  TrendingUp, 
  CheckCircle,
  AlertCircle,
  Plus,
  PlusCircle,
  X,
  Edit2,
  Info,
  Phone,
  Mail,
  Globe,
  DollarSign,
  Building2,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function DealsPage() {
  const [deals, setDeals] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [salesReps, setSalesReps] = useState([]);
  const [clientOrganizations, setClientOrganizations] = useState([]);

  // Org-wide customizations and standard field visibility
  const [orgCustomFieldDefs, setOrgCustomFieldDefs] = useState([]);
  const [hiddenStandardFields, setHiddenStandardFields] = useState([]);
  const [sector, setSector] = useState('');

  // Modals & Drawers state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  // Form states (shared for creation and edit)
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [company, setCompany] = useState('');
  const [stage, setStage] = useState('Prospecting');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [customFieldsData, setCustomFieldsData] = useState({});
  const [formError, setFormError] = useState('');

  // Kanban pipeline columns/stages with premium high-contrast colors
  const [stages, setStages] = useState([
    { key: 'Prospecting', label: 'Prospecting', color: 'border-t-blue-500', text: 'text-blue-600', bg: 'bg-slate-100/50' },
    { key: 'Proposal', label: 'Proposal Sent', color: 'border-t-violet-500', text: 'text-violet-600', bg: 'bg-slate-100/50' },
    { key: 'Negotiation', label: 'Negotiation', color: 'border-t-amber-500', text: 'text-amber-600', bg: 'bg-slate-100/50' },
    { key: 'Won', label: 'Closed Won', color: 'border-t-emerald-500', text: 'text-emerald-600', bg: 'bg-slate-100/50' },
    { key: 'Lost', label: 'Closed Lost', color: 'border-t-rose-500', text: 'text-rose-600', bg: 'bg-slate-100/50' },
  ]);

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

  useEffect(() => {
    async function initDealsPage() {
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const data = await userRes.json();
          setCurrentUser(data.user);

          // Load dynamic pipeline stages based on active sector
          if (data.user?.sectorConfig?.pipelineStages && data.user.sectorConfig.pipelineStages.length > 0) {
            const colors = [
              { border: 'border-t-blue-500', text: 'text-blue-600' },
              { border: 'border-t-violet-500', text: 'text-violet-600' },
              { border: 'border-t-amber-500', text: 'text-amber-600' },
              { border: 'border-t-emerald-500', text: 'text-emerald-600' },
              { border: 'border-t-rose-500', text: 'text-rose-600' },
              { border: 'border-t-indigo-500', text: 'text-indigo-600' }
            ];
            const dynamicStages = data.user.sectorConfig.pipelineStages.map((stageName, index) => {
              const colorSet = colors[index % colors.length];
              return {
                key: stageName,
                label: stageName,
                color: colorSet.border,
                text: colorSet.text,
                bg: 'bg-slate-100/50'
              };
            });
            setStages(dynamicStages);
          }

          if (data.user?.role === 'owner' || data.user?.role === 'sales_admin') {
            const repsRes = await fetch('/api/users');
            if (repsRes.ok) {
              const repsData = await repsRes.json();
              setSalesReps(repsData.users || []);
            }
          }

          // Fetch custom fields schema + standard visibility
          const [cfRes, sfRes, suggRes] = await Promise.all([
            fetch('/api/tenant/custom-fields?module=deals'),
            fetch('/api/tenant/standard-fields'),
            fetch('/api/tenant/sector-suggestions?module=deals')
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

          await fetchClientOrganizations();
        }
      } catch (err) {
        console.error('Init deals page failed:', err);
      }
    }
    initDealsPage();
    fetchDeals();
  }, []);

  // Fetch all deals from the database
  const fetchDeals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/deals');
      if (res.ok) {
        const data = await res.json();
        setDeals(data.deals || []);
      }
      fetchClientOrganizations();
    } catch (err) {
      console.error('Fetch deals failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setValue('');
    setClosingDate('');
    setAssignedTo('');
    setCompany('');
    setStage('Prospecting');
    setContactEmail('');
    setContactPhone('');
    setCustomFieldsData({});
    setFormError('');
  };

  const populateEditForm = (deal) => {
    setTitle(deal.title);
    setValue(String(deal.value));
    if (deal.closingDate) {
      setClosingDate(new Date(deal.closingDate).toISOString().split('T')[0]);
    } else {
      setClosingDate('');
    }
    setAssignedTo(deal.assignedTo?._id || deal.assignedTo || '');
    setCompany(deal.company || '');
    setStage(deal.stage || 'Prospecting');
    setContactEmail(deal.contactEmail || '');
    setContactPhone(deal.contactPhone || '');
    setCustomFieldsData(deal.customData || {});
    setFormError('');
    setEditModalOpen(true);
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);

    const dealData = {
      title: title.trim(),
      value: Number(value),
      closingDate,
      assignedTo: assignedTo || undefined,
      company: company.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      customData: customFieldsData
    };

    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealData),
      });

      const data = await res.json();

      if (res.ok) {
        setAddModalOpen(false);
        resetForm();
        fetchDeals();
        showToast('🎉 Sales deal pipeline card created!');
      } else {
        setFormError(data.error || 'Failed to create sales deal.');
      }
    } catch (err) {
      setFormError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDeal = async (e) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);

    const dealData = {
      title: title.trim(),
      value: Number(value),
      closingDate,
      assignedTo: assignedTo || undefined,
      company: company.trim(),
      stage,
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      customData: customFieldsData
    };

    try {
      const res = await fetch(`/api/deals/${selectedDeal._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealData),
      });

      const data = await res.json();

      if (res.ok) {
        setEditModalOpen(false);
        setSelectedDeal(data.deal);
        fetchDeals();
        showToast('🔄 Deal card updated successfully!');
      } else {
        setFormError(data.error || 'Failed to update deal.');
      }
    } catch (err) {
      setFormError('Connection issue. Try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectDeal = (dealId) => {
    const localDeal = deals.find(d => d._id === dealId);
    if (localDeal) {
      setSelectedDeal(localDeal);
    }
  };


  // --- HTML5 DRAG AND DROP HANDLERS ---
  const handleDragStart = (e, dealId) => {
    e.dataTransfer.setData('text/plain', dealId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain');
    if (!dealId) return;

    const dealToMove = deals.find((d) => d._id === dealId);
    if (!dealToMove || dealToMove.stage === targetStage) return;

    // Optimistic local state update for super smooth UI transition
    const updatedDeals = deals.map((d) => {
      if (d._id === dealId) {
        return { ...d, stage: targetStage };
      }
      return d;
    });
    setDeals(updatedDeals);

    // Save changes to MongoDB in the background
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: targetStage }),
      });

      if (!res.ok) {
        fetchDeals(); // Rollback on failure
        const errData = await res.json();
        alert(errData.error || 'Failed to update deal stage.');
      }
    } catch (err) {
      console.error('Drop stage update failed:', err);
      fetchDeals();
    }
  };

  // Delete Deal Card handler
  const handleDeleteDeal = async (e, dealId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this deal card?')) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/deals/${dealId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDeals();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete deal.');
      }
    } catch (err) {
      console.error('Delete deal failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate sums
  const getStageTotalValue = (stageKey) => {
    return deals
      .filter((d) => d.stage === stageKey)
      .reduce((sum, d) => sum + d.value, 0);
  };

  const getPipelineValuation = () => {
    return deals
      .filter((d) => d.stage !== 'Won' && d.stage !== 'Lost')
      .reduce((sum, d) => sum + d.value, 0);
  };

  const getClosedWonValuation = () => {
    return deals
      .filter((d) => d.stage === 'Won')
      .reduce((sum, d) => sum + d.value, 0);
  };

  return (
    <div className="space-y-6 overflow-hidden flex flex-col h-full bg-slate-50 text-slate-850">
      {/* --- PIPELINE STATS SUMMARY BANNER --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-emerald-500" />
            {currentUser?.sectorConfig?.dealTerm || 'Deal'}s Pipeline
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Drag and drop {currentUser?.sectorConfig?.dealTerm || 'deal'}s between sales stages to update pipeline metrics in real-time.
          </p>
        </div>

        {/* Global Pipeline Numbers and Actions */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => { resetForm(); setAddModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-450 text-white text-xs font-bold shadow-md shadow-emerald-500/10 active:scale-[0.98] transition cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5 stroke-[3]" />
            Add {currentUser?.sectorConfig?.dealTerm || 'Deal'}
          </button>
          
          <div className="px-4 py-3 rounded-xl bg-white border border-slate-200 flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Active Pipeline</p>
              <p className="text-sm font-black text-slate-800 mt-1.5 leading-none">₹{getPipelineValuation().toLocaleString('en-IN')}</p>
            </div>
          </div>
          <div className="px-4 py-3 rounded-xl bg-white border border-slate-200 flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Closed Won</p>
              <p className="text-sm font-black text-slate-800 mt-1.5 leading-none">₹{getClosedWonValuation().toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- KANBAN BOARD CONTAINER --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-xs text-slate-400 font-semibold">Loading pipeline deals...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto min-h-[60vh] pb-4 select-none">
          <div className="flex gap-4 h-full min-w-[1000px]">
            {stages.map((stage) => {
              const stageDeals = deals.filter((d) => d.stage === stage.key);
              const totalValue = getStageTotalValue(stage.key);

              return (
                <div
                  key={stage.key}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.key)}
                  className={`flex flex-col w-[250px] shrink-0 rounded-xl ${stage.bg} border border-slate-200 p-3 h-full min-h-[500px] transition-all`}
                >
                  {/* Column Header */}
                  <div className={`border-t-4 ${stage.color} rounded-t-lg bg-white p-3 border border-slate-200 border-t-0 mb-3 shadow-sm`}>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">{stage.label}</span>
                      <span className="inline-flex items-center justify-center h-4.5 px-1.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 font-mono">
                        {stageDeals.length}
                      </span>
                    </div>
                    {/* Sum budget metric */}
                    <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Valuation</span>
                      <span className={`text-[11px] font-black ${stage.text}`}>
                        ₹{totalValue.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Deals Card Stack */}
                  <div className="flex-1 space-y-3 overflow-y-auto px-0.5 py-1">
                    {stageDeals.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-250 rounded-lg text-slate-400 bg-white/40">
                        <AlertCircle className="h-4.5 w-4.5 stroke-[1.5] text-slate-350" />
                        <span className="text-[9px] mt-1.5 uppercase font-bold text-slate-400">Drop deals here</span>
                      </div>
                    ) : (
                      stageDeals.map((deal) => (
                        <div
                          key={deal._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, deal._id)}
                          onClick={() => handleSelectDeal(deal._id)}
                          className="p-3.5 rounded-xl bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-slate-350 shadow-sm shadow-slate-100 active:scale-[0.98] active:cursor-grabbing hover:cursor-grab transition group relative"
                        >
                          {/* Card Content Header */}
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-bold text-xs text-slate-850 leading-tight block break-words max-w-[85%] group-hover:text-emerald-600 transition">
                              {deal.title}
                            </span>
                            
                            {/* Delete deal */}
                            {currentUser?.role !== 'sales_rep' && (
                              <button
                                onClick={(e) => handleDeleteDeal(e, deal._id)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                title="Delete Deal Card"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Company Name / Organization Link */}
                          {!hiddenStandardFields.includes('deals:company') && (
                            <div 
                              className="flex items-center gap-1 text-[10px] text-slate-400 mt-2 font-bold"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {deal.organization ? (
                                <Link 
                                  href={`/dashboard/client-organizations?search=${encodeURIComponent(deal.organization.name)}`}
                                  className="flex items-center gap-1 text-emerald-600 hover:text-emerald-500 hover:underline transition truncate"
                                >
                                  <Building2 className="h-3 w-3 text-emerald-500 shrink-0" />
                                  <span>{deal.organization.name}</span>
                                </Link>
                              ) : (
                                <div className="flex items-center gap-1 text-slate-450 truncate">
                                  <Building className="h-3 w-3 text-slate-300 shrink-0" />
                                  <span>{deal.company || 'Individual Client'}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Dynamic Org Custom Fields Metadata Tags */}
                          {orgCustomFieldDefs.length > 0 && (
                            <div className="mt-2.5 space-y-1 border-t border-slate-100/60 pt-2 flex flex-col">
                              {orgCustomFieldDefs.map((field) => {
                                const val = deal.customData?.[field.field_key];
                                if (val === undefined || val === '') return null;
                                return (
                                  <div key={field.id} className="flex justify-between items-center text-[9px] text-slate-500 font-medium gap-2">
                                    <span className="text-slate-450 font-bold uppercase truncate">{field.field_label}</span>
                                    <span className="font-extrabold text-slate-700 truncate max-w-[100px]">{val}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Valuation Budget */}
                          <div className="text-[12px] font-black text-slate-850 mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                            <span className="text-[9px] font-bold text-slate-455 uppercase">Budget</span>
                            <span>₹{deal.value.toLocaleString('en-IN')}</span>
                          </div>

                          {/* Date and Owner footer */}
                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[9px] text-slate-450 font-bold">
                            {!hiddenStandardFields.includes('deals:closingDate') ? (
                              <div className="flex items-center gap-1 text-slate-455">
                                <Calendar className="h-3 w-3 text-slate-300 shrink-0" />
                                <span>{deal.closingDate ? new Date(deal.closingDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'No Date'}</span>
                              </div>
                            ) : (
                              <div className="text-[8px] text-slate-300 italic">Timeline hidden</div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <div className="h-4.5 w-4.5 rounded-full bg-slate-100 text-[8px] flex items-center justify-center font-extrabold text-emerald-600 border border-slate-200 shadow-sm">
                                {deal.assignedTo?.name ? deal.assignedTo.name[0] : 'U'}
                              </div>
                              <span className="max-w-[50px] truncate text-[8px] text-slate-500">{deal.assignedTo?.name ? deal.assignedTo.name.split(' ')[0] : 'Unassigned'}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* --- ADD / CREATE MANUAL DEAL MODAL --- */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <PlusCircle className="h-5 w-5 text-emerald-500" />
                Add New Sales Deal Card
              </h2>
              <button onClick={() => setAddModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-850">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateDeal} className="p-6 space-y-4.5 bg-white">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-600 font-bold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deal Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Innonsh Contract Package"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company / Organization *</label>
                  <input
                    type="text"
                    required
                    list="organizations-datalist"
                    placeholder="E.g. Innonsh Tech"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                  <datalist id="organizations-datalist">
                    {clientOrganizations.map(o => (
                      <option key={o._id || o.id} value={o.name} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deal Budget / Value (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="E.g. 500000"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Assigned Rep / Manager</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition bg-white"
                  >
                    <option value="">Leave Unassigned (Shared Pool)</option>
                    {salesReps.map((rep) => (
                      <option key={rep._id || rep.id} value={rep._id || rep.id}>{rep.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contact Email</label>
                  <input
                    type="email"
                    placeholder="office@company.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 9988776655"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                  />
                </div>
              </div>

              {/* Dynamic Org Custom Fields Inputs */}
              {orgCustomFieldDefs.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Additional Metadata ({sector})</span>
                  <div className="grid grid-cols-2 gap-4">
                    {orgCustomFieldDefs.map((field) => (
                      <div key={field.id}>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">{field.field_label}</label>
                        <input
                          type={field.field_type === 'number' ? 'number' : 'text'}
                          placeholder={`Enter ${field.field_label}`}
                          value={customFieldsData[field.field_key] || ''}
                          onChange={(e) => setCustomFieldsData({ ...customFieldsData, [field.field_key]: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 transition"
                        />
                      </div>
                    ))}
                  </div>
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
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DYNAMIC SLIDE DRAWER FOR DEAL DETAILS --- */}
      {selectedDeal && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex-1" onClick={() => setSelectedDeal(null)}></div>
          
          <div className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 font-extrabold text-lg shadow-sm">
                  {selectedDeal.title ? selectedDeal.title[0] : 'D'}
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 leading-tight">
                    {selectedDeal.title}
                  </h2>
                  <div className="text-xs text-slate-400 mt-0.5 font-bold">
                    {selectedDeal.organization ? (
                      <Link href={`/dashboard/client-organizations?search=${encodeURIComponent(selectedDeal.organization.name)}`} className="text-emerald-600 font-extrabold hover:underline">
                        🏢 {selectedDeal.organization.name}
                      </Link>
                    ) : (selectedDeal.company || 'Individual Client')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!editModalOpen && (
                  <button
                    onClick={() => { populateEditForm(selectedDeal); }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-655 hover:text-slate-800 transition"
                    title="Modify Deal details"
                  >
                    <Edit2 className="h-4.5 w-4.5" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedDeal(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-850 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
              
              {/* Stage & Value Stats Banner */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Current Stage</span>
                  <span className="inline-block px-2.5 py-0.5 text-[10px] font-extrabold rounded bg-emerald-50 border border-emerald-100 text-emerald-700 uppercase mt-1">
                    {selectedDeal.stage}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Budget Valuation</span>
                  <span className="text-sm font-black text-slate-800 block mt-0.5">₹{selectedDeal.value.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Deal Details Form or static display */}
              {editModalOpen ? (
                /* Edit Deal Form inside slide over */
                <form onSubmit={handleUpdateDeal} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
                  {formError && (
                    <div className="p-2.5 rounded bg-rose-50 border border-rose-100 text-[11px] text-rose-600 font-bold">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase">Deal Title *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full mt-1 px-2 py-1.5 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded text-xs text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Company Name *</label>
                      <input
                        type="text"
                        required
                        list="organizations-datalist-edit"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full mt-1 px-2 py-1.5 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded text-xs text-slate-800"
                      />
                      <datalist id="organizations-datalist-edit">
                        {clientOrganizations.map(o => (
                          <option key={o._id || o.id} value={o.name} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Budget (₹) *</label>
                      <input
                        type="number"
                        required
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="w-full mt-1 px-2 py-1.5 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Closing Date *</label>
                      <input
                        type="date"
                        required
                        value={closingDate}
                        onChange={(e) => setClosingDate(e.target.value)}
                        className="w-full mt-1 px-2 py-1.5 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Deal Stage</label>
                      <select
                        value={stage}
                        onChange={(e) => setStage(e.target.value)}
                        className="w-full mt-1 px-2 py-1.5 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded text-xs text-slate-800 bg-white"
                      >
                        <option value="Prospecting">Prospecting</option>
                        <option value="Proposal">Proposal Sent</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Won">Closed Won</option>
                        <option value="Lost">Closed Lost</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Assigned Manager</label>
                      <select
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        className="w-full mt-1 px-2 py-1.5 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded text-xs text-slate-800 bg-white"
                      >
                        <option value="">Leave Unassigned</option>
                        {salesReps.map((rep) => (
                          <option key={rep._id || rep.id} value={rep._id || rep.id}>{rep.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Contact Email</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full mt-1 px-2 py-1.5 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Contact Phone</label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full mt-1 px-2 py-1.5 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  {orgCustomFieldDefs.length > 0 && (
                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Custom Fields ({sector})</span>
                      <div className="grid grid-cols-2 gap-2">
                        {orgCustomFieldDefs.map((field) => (
                          <div key={field.id}>
                            <label className="block text-[8px] font-bold text-slate-455 uppercase">{field.field_label}</label>
                            <input
                              type={field.field_type === 'number' ? 'number' : 'text'}
                              value={customFieldsData[field.field_key] || ''}
                              onChange={(e) => setCustomFieldsData({ ...customFieldsData, [field.field_key]: e.target.value })}
                              className="w-full mt-1 px-2 py-1 border border-slate-200 focus:border-emerald-500 focus:outline-none rounded text-xs text-slate-800"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditModalOpen(false)}
                      className="px-3 py-1.5 border border-slate-200 hover:border-slate-350 text-slate-655 text-xs font-bold rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-450 text-white text-xs font-bold rounded shadow-sm"
                    >
                      {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Save Modifications
                    </button>
                  </div>
                </form>
              ) : (
                /* Static Display of Deal Details */
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Account Manager</span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold mt-0.5">
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{selectedDeal.assignedTo?.name || 'Unassigned'}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Target Closing Date</span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold mt-0.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{selectedDeal.closingDate ? new Date(selectedDeal.closingDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No closing date'}</span>
                      </div>
                    </div>

                    {selectedDeal.contactEmail && (
                      <div className="space-y-1 col-span-2 border-t border-slate-100 pt-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Contact Email</span>
                        <a href={`mailto:${selectedDeal.contactEmail}`} className="flex items-center gap-1.5 text-xs text-slate-750 font-semibold hover:text-emerald-650 transition mt-0.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{selectedDeal.contactEmail}</span>
                        </a>
                      </div>
                    )}

                    {selectedDeal.contactPhone && (
                      <div className="space-y-1 col-span-2 border-t border-slate-100 pt-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Contact Phone</span>
                        <a href={`tel:${selectedDeal.contactPhone}`} className="flex items-center gap-1.5 text-xs text-slate-755 font-semibold hover:text-emerald-650 transition mt-0.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{selectedDeal.contactPhone}</span>
                        </a>
                      </div>
                    )}

                    {selectedDeal.leadId && (
                      <div className="space-y-1 col-span-2 border-t border-slate-100 pt-3">
                        <div className="p-2.5 rounded bg-emerald-50/25 border border-emerald-100 text-[10px] text-emerald-800 font-medium leading-relaxed">
                          🤝 Converted from qualified Lead campaign profile.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dynamic Org Custom Fields Box */}
              {!editModalOpen && orgCustomFieldDefs.length > 0 && (
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block border-b border-slate-100 pb-1.5">Industry Specifications ({sector})</span>
                  <div className="grid grid-cols-2 gap-4">
                    {orgCustomFieldDefs.map((field) => {
                      const val = selectedDeal.customData?.[field.field_key];
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

              {/* Delete deal panel */}
              {currentUser?.role !== 'sales_rep' && (
                <div className="p-4 rounded-xl bg-rose-50/30 border border-rose-100 shadow-sm flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-700">Delete Deal Card?</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-bold">This will permanently purge this sales deal card.</p>
                  </div>
                  <button
                    onClick={(e) => {
                      handleDeleteDeal(e, selectedDeal._id);
                      setSelectedDeal(null);
                    }}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition"
                  >
                    Delete Card
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
