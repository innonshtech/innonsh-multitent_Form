'use client';

import { useEffect, useState } from 'react';
import { 
  Loader2, 
  Briefcase, 
  User, 
  Building, 
  Calendar, 
  Trash2, 
  TrendingUp, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function DealsPage() {
  const [deals, setDeals] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Org-wide customizations and standard field visibility
  const [orgCustomFieldDefs, setOrgCustomFieldDefs] = useState([]);
  const [hiddenStandardFields, setHiddenStandardFields] = useState([]);
  const [sector, setSector] = useState('');

  // Kanban pipeline columns/stages with premium high-contrast colors
  const [stages, setStages] = useState([
    { key: 'Prospecting', label: 'Prospecting', color: 'border-t-blue-500', text: 'text-blue-600', bg: 'bg-slate-100/50' },
    { key: 'Proposal', label: 'Proposal Sent', color: 'border-t-violet-500', text: 'text-violet-600', bg: 'bg-slate-100/50' },
    { key: 'Negotiation', label: 'Negotiation', color: 'border-t-amber-500', text: 'text-amber-600', bg: 'bg-slate-100/50' },
    { key: 'Won', label: 'Closed Won', color: 'border-t-emerald-500', text: 'text-emerald-600', bg: 'bg-slate-100/50' },
    { key: 'Lost', label: 'Closed Lost', color: 'border-t-rose-500', text: 'text-rose-600', bg: 'bg-slate-100/50' },
  ]);

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
    } catch (err) {
      console.error('Fetch deals failed:', err);
    } finally {
      setLoading(false);
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

        {/* Global Pipeline Numbers */}
        <div className="flex gap-4">
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

                          {/* Company Name */}
                          {!hiddenStandardFields.includes('deals:company') && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2 font-bold">
                              <Building className="h-3 w-3 text-slate-300 shrink-0" />
                              <span className="truncate">{deal.company}</span>
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
                            <span className="text-[9px] font-bold text-slate-450 uppercase">Budget</span>
                            <span>₹{deal.value.toLocaleString('en-IN')}</span>
                          </div>

                          {/* Date and Owner footer */}
                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[9px] text-slate-450 font-bold">
                            {!hiddenStandardFields.includes('deals:closingDate') ? (
                              <div className="flex items-center gap-1 text-slate-450">
                                <Calendar className="h-3 w-3 text-slate-300 shrink-0" />
                                <span>{new Date(deal.closingDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                              </div>
                            ) : (
                              <div className="text-[8px] text-slate-300 italic">Timeline hidden</div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <div className="h-4.5 w-4.5 rounded-full bg-slate-100 text-[8px] flex items-center justify-center font-extrabold text-emerald-600 border border-slate-200 shadow-sm">
                                {deal.assignedTo?.name[0] || 'U'}
                              </div>
                              <span className="max-w-[50px] truncate text-[8px] text-slate-500">{deal.assignedTo?.name.split(' ')[0]}</span>
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
    </div>
  );
}
