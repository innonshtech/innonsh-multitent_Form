'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2, 
  LogOut, 
  Mail, 
  User, 
  Check, 
  Ban, 
  LayoutDashboard,
  CreditCard,
  Boxes,
  Ticket,
  Users,
  Settings,
  ChevronRight,
  TrendingUp,
  Tag,
  CircleDot,
  Plus,
  Trash2,
  Edit,
  X
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const router = useRouter();
  
  // Navigation active state: 'overview', 'organizations', 'billing', 'sectors', 'tickets', 'requests'
  const [activeTab, setActiveTab] = useState('overview');

  // Loaded Datasets
  const [organizations, setOrganizations] = useState([]);
  const [billingPlans, setBillingPlans] = useState([]);
  const [sectorsConfig, setSectorsConfig] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [moduleRequests, setModuleRequests] = useState([]);

  // Sectors CRUD States
  const [sectorsModalOpen, setSectorsModalOpen] = useState(false);
  const [editingSector, setEditingSector] = useState(null);
  const [sectorId, setSectorId] = useState('');
  const [sectorName, setSectorName] = useState('');
  const [sectorLeadTerm, setSectorLeadTerm] = useState('');
  const [sectorProductTerm, setSectorProductTerm] = useState('');
  const [sectorDealTerm, setSectorDealTerm] = useState('');
  const [sectorStages, setSectorStages] = useState([]);
  const [newStageInput, setNewStageInput] = useState('');

  // UI States
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); 
  const [toastText, setToastText] = useState('');

  // Modules Management States
  const [selectedOrgForModules, setSelectedOrgForModules] = useState(null);
  const [modulesModalOpen, setModulesModalOpen] = useState(false);
  const [checkedModules, setCheckedModules] = useState([]);
  const [expandedSectorId, setExpandedSectorId] = useState(null);
  const [selectedSectorId, setSelectedSectorId] = useState(null);

  const fetchModuleRequests = async () => {
    try {
      const res = await fetch('/api/superadmin/module-requests');
      if (res.ok) {
        const data = await res.json();
        setModuleRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Fetch superadmin module requests failed:', err);
    }
  };

  const handleRequestAction = async (requestId, action, notes = '') => {
    if (!confirm(`Are you sure you want to ${action === 'Approve' ? 'approve' : 'decline'} this module activation request?`)) return;
    setActionLoading(requestId);
    try {
      const res = await fetch('/api/superadmin/module-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, notes })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(action === 'Approve' ? '🟢 Module request approved & activated successfully!' : '🔴 Module request declined.');
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to process request.');
      }
    } catch (err) {
      console.error('Process request failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const availableModulesList = [
    { key: 'leads', name: 'Leads', desc: 'Manage prospect pipelines and follow-ups' },
    { key: 'deals', name: 'Deals Pipeline', desc: 'Kanban drag-and-drop opportunity board' },
    { key: 'contacts', name: 'Contacts Index', desc: 'Permanent customer contacts registry' },
    { key: 'tasks', name: 'Tasks & Reminders', desc: 'To-do checklists and rep reminders' },
    { key: 'emails', name: 'Email Hub', desc: 'Integrated email sync and inbox logs' },
    { key: 'calls', name: 'Call Tracking', desc: 'Log and track customer phone contacts' },
    { key: 'meetings', name: 'Meeting Schedules', desc: 'Organize dynamic sync calendars' },
    { key: 'products', name: 'Product Index', desc: 'Manage catalog item prices and rates' },
    { key: 'quotations', name: 'Quotations & Proposals', desc: 'Server-side financial calculator for billing quotes' },
    { key: 'invoices', name: 'Invoices Hub', desc: 'Generate customer commercial invoices' },
    { key: 'reports', name: 'Sales Reports', desc: 'View tabular summaries of rep operations' },
    { key: 'analytics', name: 'Sales Analytics', desc: 'Graphical breakdown of CRM achievements' },
    { key: 'users', name: 'Employee Directory', desc: 'Control team logins and approval directory' },
    { key: 'roles', name: 'Roles & Permissions', desc: 'Privilege gates and dynamic auth controls' },
    { key: 'teams', name: 'Sales Teams', desc: 'Manage regional sales teams and leaders' },
    { key: 'real-estate', name: 'Real Estate Suite', desc: 'Properties inventory, matching engines, site visits scheduler, holds and milestones builder' },
  ];

  const handleOpenModulesModal = (org) => {
    setSelectedOrgForModules(org);
    setCheckedModules(org.enabled_modules || ['leads', 'deals', 'contacts', 'tasks']);
    setModulesModalOpen(true);
  };

  const handleToggleModuleCheckbox = (moduleKey) => {
    setCheckedModules(prev => 
      prev.includes(moduleKey) 
        ? prev.filter(k => k !== moduleKey) 
        : [...prev, moduleKey]
    );
  };

  const handleSaveModules = async () => {
    if (!selectedOrgForModules) return;
    setActionLoading(selectedOrgForModules.id);
    try {
      const res = await fetch(`/api/superadmin/organizations/${selectedOrgForModules.id}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabledModules: checkedModules })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`⚡ Modules updated successfully for "${selectedOrgForModules.name}"!`);
        setModulesModalOpen(false);
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to update modules.');
      }
    } catch (err) {
      console.error('Save modules failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const showToast = (text) => {
    setToastText(text);
    setTimeout(() => setToastText(''), 3000);
  };

  // Sectors CRUD Handlers
  const openAddSectorModal = () => {
    setEditingSector(null);
    setSectorId('');
    setSectorName('');
    setSectorLeadTerm('Lead');
    setSectorProductTerm('Product');
    setSectorDealTerm('Deal');
    setSectorStages(['Lead Capture', 'Demo Call', 'Negotiation', 'Won', 'Lost']);
    setNewStageInput('');
    setSectorsModalOpen(true);
  };

  const openEditSectorModal = (sector) => {
    setEditingSector(sector);
    setSectorId(sector.id);
    setSectorName(sector.name);
    setSectorLeadTerm(sector.lead_term);
    setSectorProductTerm(sector.product_term);
    setSectorDealTerm(sector.deal_term);
    setSectorStages(sector.pipeline_stages || []);
    setNewStageInput('');
    setSectorsModalOpen(true);
  };

  const handleAddStage = () => {
    if (!newStageInput.trim()) return;
    if (sectorStages.includes(newStageInput.trim())) return;
    setSectorStages([...sectorStages, newStageInput.trim()]);
    setNewStageInput('');
  };

  const handleRemoveStage = (stageToRemove) => {
    setSectorStages(sectorStages.filter(s => s !== stageToRemove));
  };

  const handleSaveSector = async (e) => {
    e.preventDefault();
    if (!sectorId || !sectorName || !sectorLeadTerm || !sectorProductTerm || !sectorDealTerm) {
      alert('Please fill in all required fields.');
      return;
    }
    setActionLoading(sectorId);
    try {
      const isEdit = !!editingSector;
      const url = '/api/superadmin/sectors';
      const method = isEdit ? 'PUT' : 'POST';
      const body = {
        id: sectorId,
        name: sectorName,
        lead_term: sectorLeadTerm,
        product_term: sectorProductTerm,
        deal_term: sectorDealTerm,
        pipeline_stages: sectorStages
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        showToast(isEdit ? '🟢 Sector updated successfully!' : '🟢 Sector created successfully!');
        setSectorsModalOpen(false);
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to save sector.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving sector.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSector = async (id) => {
    if (!confirm(`Are you sure you want to delete the sector "${id}"? This might affect organizations using this sector.`)) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/superadmin/sectors?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        showToast('🔴 Sector deleted successfully.');
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to delete sector.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting sector.');
    } finally {
      setActionLoading(null);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // 1. Verify current session
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.user && meData.user.isSuperAdmin) {
          setCurrentUser(meData.user);
          
          // 2. Fetch full dashboard data
          const dataRes = await fetch('/api/superadmin/dashboard-data');
          if (dataRes.ok) {
            const dashboardData = await dataRes.json();
            setOrganizations(dashboardData.organizations || []);
            setBillingPlans(dashboardData.billingPlans || []);
            setSectorsConfig(dashboardData.sectorsConfig || []);
            setSupportTickets(dashboardData.supportTickets || []);
            setSubscriptions(dashboardData.subscriptions || []);
          }

          // 3. Fetch module requests
          await fetchModuleRequests();
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    } catch (err) {
      console.error('Superadmin bootstrap failed:', err);
      router.push('/login');
    } finally {
      setAuthChecking(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStatusUpdate = async (orgId, status) => {
    if (!confirm(`Are you sure you want to change this company's status to ${status}?`)) return;
    
    setActionLoading(orgId);
    try {
      const res = await fetch('/api/superadmin/organizations/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, status })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`🎉 Organization status updated to "${status}" successfully!`);
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to update organization status.');
      }
    } catch (err) {
      console.error('Status update request failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseTicket = async (ticketId) => {
    if (!confirm('Mark this support ticket as resolved and close it?')) return;
    
    setActionLoading(ticketId);
    try {
      const res = await fetch('/api/superadmin/tickets/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status: 'Closed' })
      });
      if (res.ok) {
        showToast('🟢 Ticket successfully resolved and closed.');
        fetchDashboardData();
      } else {
        alert('Failed to update ticket status.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Stats Counters
  const totalOrgs = organizations.length;
  const pendingOrgs = organizations.filter(o => o.approval_status === 'Pending').length;
  const approvedOrgs = organizations.filter(o => o.approval_status === 'Approved').length;
  const activeTickets = supportTickets.filter(t => t.status === 'Open').length;
  const pendingRequests = moduleRequests.filter(r => r.status === 'Pending').length;

  // Calculate platform monthly recurring revenue (MRR) dynamically
  const totalMRR = subscriptions.reduce((sum, sub) => {
    if (sub.status === 'active' || sub.status === 'trial') {
      const plan = billingPlans.find(p => p.id === sub.plan_id);
      return sum + (plan ? Number(plan.price) : 0);
    }
    return sum;
  }, 0);

  const sidebarItems = [
    { id: 'overview', label: 'Platform Overview', icon: LayoutDashboard },
    { id: 'organizations', label: 'Tenant Companies', icon: Building2, count: pendingOrgs },
    { id: 'requests', label: 'Module Requests', icon: Boxes, count: pendingRequests },
    { id: 'billing', label: 'SaaS Billing & Plans', icon: CreditCard },
    { id: 'sectors', label: 'CRM Sectors Config', icon: Boxes },
    { id: 'tickets', label: 'Customer Tickets', icon: Ticket, count: activeTickets },
  ];

  if (authChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
        <p className="text-sm text-slate-400 font-bold tracking-wider">Verifying Super Admin Authorization...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex relative overflow-hidden">
      {/* Decorative Blur Glows */}
      <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none"></div>

      {/* --- TOAST --- */}
      {toastText && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl text-white flex items-center gap-2.5 text-xs font-black animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
          <span>{toastText}</span>
        </div>
      )}

      {/* ========================================================
          1. LEFT SIDEBAR PANEL (GLASSMORPHIC & MODERN)
          ======================================================== */}
      <aside className="w-80 shrink-0 bg-slate-900/40 border-r border-slate-900 backdrop-blur-xl flex flex-col justify-between p-6 z-25 relative">
        <div className="space-y-8">
          {/* CRM Brand Header */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500 font-bold text-white text-lg shadow-lg shadow-emerald-500/25 flex items-center justify-center">
              I
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white leading-none">Innonsh SaaS</h2>
              <span className="text-[9px] text-emerald-400 font-mono tracking-wider font-extrabold uppercase mt-1 block">SUPER ADMIN</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isSectorsActive = activeTab === 'sectors' || activeTab === 'sector-companies';
              const isActive = item.id === 'sectors' ? isSectorsActive : activeTab === item.id;
              
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => {
                      if (item.id === 'sectors') {
                        setActiveTab('sectors');
                        setSelectedSectorId(null);
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                      isActive 
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-slate-950' : 'text-slate-450'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.count > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                        isActive ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-200 border border-slate-700'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>

                  {/* Submenu for CRM Sectors */}
                  {item.id === 'sectors' && isSectorsActive && sectorsConfig.length > 0 && (
                    <div className="pl-6 space-y-1.5 mt-1.5 border-l border-slate-800 ml-6">
                      {sectorsConfig.map((sect) => {
                        const isSectSelected = activeTab === 'sector-companies' && selectedSectorId === sect.id;
                        return (
                          <button
                            key={sect.id}
                            onClick={() => {
                              setActiveTab('sector-companies');
                              setSelectedSectorId(sect.id);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-extrabold transition-all duration-150 cursor-pointer block truncate ${
                              isSectSelected
                                ? 'text-emerald-400 bg-emerald-950/20 font-black'
                                : 'text-slate-500 hover:text-slate-350 hover:bg-slate-900/40'
                            }`}
                          >
                            • {sect.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer Profile & Logout Card */}
        <div className="pt-6 border-t border-slate-800/80 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center font-mono font-black text-xs text-slate-200 uppercase border border-slate-700">
              {currentUser?.name.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-200 truncate leading-none">{currentUser?.name}</p>
              <span className="text-[9px] text-slate-500 font-mono truncate block mt-1">{currentUser?.email}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800/80 text-slate-300 hover:text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ========================================================
          2. MAIN CONTENT AREA (DYNAMIC TAB SWITCHING)
          ======================================================== */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto z-10 relative">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header Row */}
          <div className="pb-6 border-b border-slate-800/80">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              {activeTab === 'overview' && 'Platform Command Center'}
              {activeTab === 'organizations' && 'Organization Approval Desk'}
              {activeTab === 'requests' && 'Module Activation Requests'}
              {activeTab === 'billing' && 'SaaS Subscription Packages'}
              {activeTab === 'sectors' && 'CRM Terminology Adaptors'}
              {activeTab === 'tickets' && 'Customer Care Support Center'}
              {activeTab === 'sector-companies' && 'Sector Companies Directory'}
            </h1>
            <p className="text-xs text-slate-450 mt-1.5 font-medium leading-relaxed">
              {activeTab === 'overview' && 'Real-time overview of monthly recurring revenue, platform metrics, and recent activities.'}
              {activeTab === 'organizations' && 'Review and moderate pending tenant companies who wish to join the SaaS platform.'}
              {activeTab === 'requests' && 'Moderate and approve license requests for locked modules from tenant organizations.'}
              {activeTab === 'billing' && 'Active price packages and platform quotas configured in the systems database.'}
              {activeTab === 'sectors' && 'Adaptive vertical layouts customized for different industrial sectors (e.g. Software, Real Estate).'}
              {activeTab === 'tickets' && 'Resolve platform difficulties and assist CRM administrators with their help desk tickets.'}
              {activeTab === 'sector-companies' && 'Manage module licenses and access status for all companies in this CRM sector.'}
            </p>
          </div>

          {/* ========================================================
              TAB A: PLATFORM OVERVIEW (DASHBOARD)
              ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Core Platform Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/40 border border-slate-800/85 rounded-2xl p-5 backdrop-blur-xl">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Tenant Companies</p>
                  <p className="text-3xl font-black text-white mt-2.5">{totalOrgs}</p>
                </div>
                <div className="bg-emerald-950/15 border border-emerald-900/30 rounded-2xl p-5 backdrop-blur-xl">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest font-mono">SaaS Monthly Revenue</p>
                  <p className="text-3xl font-black text-emerald-400 mt-2.5">₹{totalMRR.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-amber-950/15 border border-amber-900/30 rounded-2xl p-5 backdrop-blur-xl">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest font-mono">Pending Approvals</p>
                  <p className="text-3xl font-black text-amber-400 mt-2.5">{pendingOrgs}</p>
                </div>
                <div className="bg-indigo-950/15 border border-indigo-900/30 rounded-2xl p-5 backdrop-blur-xl">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest font-mono">Open Tickets</p>
                  <p className="text-3xl font-black text-indigo-400 mt-2.5">{activeTickets}</p>
                </div>
              </div>

              {/* Two Column Layout for Recent Activities */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column 1: Pending Activations */}
                <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-850">
                    <Clock className="h-4 w-4 text-amber-500" />
                    Pending Company Registrations
                  </h3>
                  
                  {organizations.filter(o => o.approval_status === 'Pending').length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 font-bold italic">
                      No pending registration requests.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {organizations.filter(o => o.approval_status === 'Pending').slice(0, 3).map((org) => (
                        <div key={org.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-200 text-xs truncate leading-none">{org.name}</h4>
                            <span className="text-[9px] text-slate-500 font-mono block mt-1.5">{org.ownerEmail}</span>
                          </div>
                          <button
                            onClick={() => setActiveTab('organizations')}
                            className="p-1 px-2.5 rounded bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 text-[9px] font-black cursor-pointer transition flex items-center gap-1"
                          >
                            Review
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Column 2: Open Support Tickets */}
                <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-850">
                    <Ticket className="h-4 w-4 text-indigo-500" />
                    Recent Open Tickets
                  </h3>

                  {supportTickets.filter(t => t.status === 'Open').length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 font-bold italic">
                      No open customer care tickets.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {supportTickets.filter(t => t.status === 'Open').slice(0, 3).map((ticket) => (
                        <div key={ticket.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-200 text-xs truncate leading-none">{ticket.title}</h4>
                            <span className="text-[9px] text-slate-500 block mt-1.5 truncate max-w-[200px]">{ticket.message}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono ${
                            ticket.priority === 'High' ? 'bg-rose-950 text-rose-400 border border-rose-900/40' :
                            ticket.priority === 'Medium' ? 'bg-amber-950 text-amber-400 border border-amber-900/40' :
                            'bg-blue-950 text-blue-400 border border-blue-900/40'
                          }`}>
                            {ticket.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB B: TENANT COMPANIES (ORGANIZATIONS)
              ======================================================= */}
          {activeTab === 'organizations' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Moderation section */}
              {pendingOrgs > 0 && (
                <div className="bg-amber-950/5 border border-amber-900/20 rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-500 animate-pulse shrink-0" />
                    Pending Approvals ({pendingOrgs})
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {organizations.filter(o => o.approval_status === 'Pending').map((org) => (
                      <div 
                        key={org.id}
                        className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col gap-4 shadow-xl hover:border-amber-700/30 transition duration-300"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-amber-950 text-amber-400 font-mono font-black text-sm flex items-center justify-center shrink-0 uppercase border border-amber-900/30">
                            {org.name.slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-slate-100 text-sm truncate block leading-none">{org.name}</h4>
                            <span className="text-[10px] text-slate-400 font-mono truncate block mt-2 flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-slate-500" /> {org.ownerName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono truncate block mt-1 flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5 text-slate-500" /> {org.ownerEmail}
                            </span>
                            <span className="text-[10px] text-amber-400 font-mono truncate block mt-1 flex items-center gap-1 font-semibold">
                              <Building2 className="h-3.5 w-3.5 text-amber-500" /> Sector: {org.sector || 'SOFTWARE_SERVICES'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                          <button
                            disabled={actionLoading !== null}
                            onClick={() => handleStatusUpdate(org.id, 'Approved')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition cursor-pointer disabled:opacity-50"
                          >
                            {actionLoading === org.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            disabled={actionLoading !== null}
                            onClick={() => handleStatusUpdate(org.id, 'Suspended')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 text-xs font-black transition cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Directory Table */}
              <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    <p className="text-xs text-slate-400 font-bold">Compiling tenant database...</p>
                  </div>
                ) : organizations.length === 0 ? (
                  <div className="py-20 text-center text-slate-500 font-bold text-sm italic">
                    No registered organizations found.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-850">
                    <table className="min-w-full divide-y divide-slate-850 bg-slate-950/40">
                      <thead className="bg-slate-900/60 font-mono text-[10px] font-black uppercase text-slate-450 tracking-wider">
                        <tr>
                          <th scope="col" className="px-6 py-4 text-left">Company details</th>
                          <th scope="col" className="px-6 py-4 text-left">Primary Owner</th>
                          <th scope="col" className="px-6 py-4 text-left">Email Address</th>
                          <th scope="col" className="px-6 py-4 text-center">Status</th>
                          <th scope="col" className="px-6 py-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-xs font-semibold text-slate-350">
                        {organizations.map((org) => (
                          <tr key={org.id} className="hover:bg-slate-900/10 transition-colors duration-150">
                            {/* Name */}
                            <td className="px-6 py-4.5 flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase font-mono border ${
                                org.approval_status === 'Approved' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' :
                                org.approval_status === 'Pending' ? 'bg-amber-950/40 text-amber-400 border-amber-900/30' :
                                'bg-rose-950/40 text-rose-400 border-rose-900/30'
                              }`}>
                                {org.name.slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-slate-200 truncate leading-none">{org.name}</p>
                                <span className="text-[9px] text-slate-500 block mt-1.5 font-mono uppercase tracking-wider">Registered: {org.created_at ? new Date(org.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'N/A'} • Sector: {org.sector || 'SOFTWARE_SERVICES'}</span>
                              </div>
                            </td>

                            {/* Owner */}
                            <td className="px-6 py-4.5 text-slate-200">
                              <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-slate-450" /> {org.ownerName}</span>
                            </td>

                            {/* Email */}
                            <td className="px-6 py-4.5 font-mono text-[11px] text-slate-400">
                              <a href={`mailto:${org.ownerEmail}`} className="hover:underline flex items-center gap-1">
                                <Mail className="h-3 w-3 shrink-0" />
                                {org.ownerEmail}
                              </a>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4.5 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                org.approval_status === 'Approved' ? 'bg-emerald-950 text-emerald-400 border-emerald-900/40' :
                                org.approval_status === 'Pending' ? 'bg-amber-950 text-amber-400 border-amber-900/40' :
                                'bg-rose-950 text-rose-400 border-rose-900/40'
                              }`}>
                                {org.approval_status === 'Approved' && <ShieldCheck className="h-3 w-3" />}
                                {org.approval_status === 'Pending' && <Clock className="h-3 w-3 animate-pulse" />}
                                {org.approval_status === 'Suspended' && <Ban className="h-3 w-3" />}
                                {org.approval_status}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {org.approval_status !== 'Approved' && (
                                  <button
                                    disabled={actionLoading !== null}
                                    onClick={() => handleStatusUpdate(org.id, 'Approved')}
                                    className="p-1 px-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] cursor-pointer flex items-center gap-1 transition disabled:opacity-50"
                                  >
                                    <Check className="h-3 w-3" />
                                    Approve
                                  </button>
                                )}
                                {org.approval_status === 'Approved' && (
                                  <button
                                    disabled={actionLoading !== null}
                                    onClick={() => handleStatusUpdate(org.id, 'Suspended')}
                                    className="p-1 px-2.5 rounded bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-900 text-slate-400 hover:text-rose-400 font-bold text-[10px] cursor-pointer flex items-center gap-1 transition disabled:opacity-50"
                                  >
                                    <Ban className="h-3 w-3" />
                                    Suspend
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB F: MODULE ACTIVATION REQUESTS
              ======================================================== */}
          {activeTab === 'requests' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl">
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-850">
                  <Boxes className="h-4.5 w-4.5 text-indigo-400" />
                  Module Activation Requests ({moduleRequests.length})
                </h3>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    <p className="text-xs text-slate-400 font-bold">Compiling requests database...</p>
                  </div>
                ) : moduleRequests.length === 0 ? (
                  <div className="py-20 text-center text-slate-500 font-bold text-sm italic">
                    No module activation requests recorded.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-850 mt-4">
                    <table className="min-w-full divide-y divide-slate-850 bg-slate-950/40">
                      <thead className="bg-slate-900/60 font-mono text-[10px] font-black uppercase text-slate-450 tracking-wider">
                        <tr>
                          <th scope="col" className="px-6 py-4 text-left">Company</th>
                          <th scope="col" className="px-6 py-4 text-left">Requested Module</th>
                          <th scope="col" className="px-6 py-4 text-left">Requested By</th>
                          <th scope="col" className="px-6 py-4 text-center">Status</th>
                          <th scope="col" className="px-6 py-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-xs font-semibold text-slate-350">
                        {moduleRequests.map((req) => {
                          const getModuleDisplayName = (slug) => {
                            switch (slug) {
                              case 'leads': return 'Leads';
                              case 'contacts': return 'Contacts Directory';
                              case 'deals': return 'Deals Pipeline';
                              case 'emails': return 'Email Hub';
                              case 'tasks': return 'Tasks Manager & Reminders';
                              case 'calls': return 'Call Logs & Record Suite';
                              case 'meetings': return 'Meetings & Calendar Scheduler';
                              case 'products': return 'Products Catalogue';
                              case 'quotations': return 'Quotations Builder';
                              case 'invoices': return 'Invoices & Billing Hub';
                              case 'reports': return 'Sales Reports Builder';
                              case 'analytics': return 'BI Analytics & Forecasting';
                              case 'users': return 'Users & Employee Directory';
                              case 'roles': return 'Roles & Permission Gates';
                              case 'teams': return 'Teams & Department Manager';
                              default: return slug.charAt(0).toUpperCase() + slug.slice(1);
                            }
                          };
                          return (
                            <tr key={req.id} className="hover:bg-slate-900/10 transition-colors duration-150">
                              {/* Company */}
                              <td className="px-6 py-4.5 font-extrabold text-slate-200">
                                {req.organizations?.name || 'Unknown Company'}
                              </td>

                              {/* Requested Module */}
                              <td className="px-6 py-4.5 text-indigo-400 font-extrabold flex items-center gap-1">
                                🔒 {getModuleDisplayName(req.module_name)}
                              </td>

                              {/* Requested By */}
                              <td className="px-6 py-4.5 text-slate-400">
                                <p className="text-slate-200 leading-none">{req.users?.name || 'Unknown'}</p>
                                <span className="text-[9px] text-slate-500 font-mono block mt-1">{req.users?.email || ''}</span>
                              </td>

                              {/* Status */}
                              <td className="px-6 py-4.5 text-center">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                  req.status === 'Approved' ? 'bg-emerald-955 text-emerald-400 border-emerald-900/40' :
                                  req.status === 'Pending' ? 'bg-amber-955 text-amber-400 border-amber-900/40' :
                                  'bg-rose-955 text-rose-400 border-rose-900/40'
                                }`}>
                                  {req.status}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="px-6 py-4.5 text-center">
                                {req.status === 'Pending' ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      disabled={actionLoading !== null}
                                      onClick={() => handleRequestAction(req.id, 'Approve')}
                                      className="p-1 px-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] cursor-pointer flex items-center gap-1 transition disabled:opacity-50 font-sans"
                                    >
                                      <Check className="h-3 w-3" />
                                      Approve
                                    </button>
                                    <button
                                      disabled={actionLoading !== null}
                                      onClick={() => {
                                        const reason = prompt('Please enter decline reason (notes):');
                                        if (reason !== null) handleRequestAction(req.id, 'Decline', reason);
                                      }}
                                      className="p-1 px-2.5 rounded bg-slate-900 hover:bg-rose-955 border border-slate-800 hover:border-rose-900 text-slate-400 hover:text-rose-400 font-bold text-[10px] cursor-pointer flex items-center gap-1 transition disabled:opacity-50 font-sans"
                                    >
                                      <XCircle className="h-3 w-3" />
                                      Decline
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-500 font-mono italic">
                                    Processed {new Date(req.updated_at).toLocaleDateString('en-IN', { dateStyle: 'short' })}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB C: BILLING & PLANS
              ======================================================= */}
          {activeTab === 'billing' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {billingPlans.map((plan) => (
                  <div key={plan.id} className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-750 transition duration-300 relative overflow-hidden">
                    {/* Currency Banner */}
                    <div className="absolute top-4 right-4 text-[10px] font-black font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {plan.currency || 'INR'}
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-extrabold text-sm text-slate-200">{plan.name}</h4>
                      <p className="text-2xl font-black text-white mt-1">₹{Number(plan.price).toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-slate-500 font-semibold tracking-wide">PER MONTH • BASE LICENSE</p>
                    </div>

                    <div className="space-y-3.5 my-6 pt-5 border-t border-slate-850 text-[11px] font-bold text-slate-450 leading-none">
                      <div className="flex justify-between">
                        <span>Max System Users</span>
                        <span className="text-white">{plan.max_users === 9999 ? 'Unlimited' : plan.max_users}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Monthly Leads</span>
                        <span className="text-white">{plan.max_leads === 999999 ? 'Unlimited' : plan.max_leads.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="p-2 rounded bg-slate-950 border border-slate-850/80 text-center text-[10px] font-black text-emerald-400 font-mono tracking-wider">
                      ACTIVE TIER
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB D: SECTORS CONFIG
              ======================================================= */}
          {activeTab === 'sectors' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Available Sectors: {sectorsConfig.length}</span>
                <button
                  onClick={openAddSectorModal}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-lg transition duration-200 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Add New Sector
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {sectorsConfig.map((sector) => (
                  <div key={sector.id} className="p-6 bg-slate-900/30 border border-slate-800 rounded-2xl flex flex-col justify-between hover:border-slate-700/60 transition duration-300 relative group">
                    <div className="space-y-4">
                      {/* Name & ID & Actions */}
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-200">{sector.name}</h4>
                          <span className="text-[9px] font-mono text-slate-500 font-bold block mt-1 tracking-wider uppercase">SECTOR_KEY: {sector.id}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => openEditSectorModal(sector)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white transition cursor-pointer"
                            title="Edit Sector"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSector(sector.id)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-rose-950 text-slate-450 hover:text-rose-450 transition cursor-pointer"
                            title="Delete Sector"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Config Parameters Table */}
                      <table className="w-full text-[11px] font-bold text-slate-400 leading-normal border-collapse mt-2">
                        <tbody>
                          <tr className="border-b border-slate-850/50">
                            <td className="py-2 text-slate-500">Lead terminology:</td>
                            <td className="py-2 text-right text-white font-extrabold">{sector.lead_term}</td>
                          </tr>
                          <tr className="border-b border-slate-850/50">
                            <td className="py-2 text-slate-500">Product terminology:</td>
                            <td className="py-2 text-right text-white font-extrabold">{sector.product_term}</td>
                          </tr>
                          <tr className="border-b border-slate-850/50">
                            <td className="py-2 text-slate-500">Deal terminology:</td>
                            <td className="py-2 text-right text-white font-extrabold">{sector.deal_term}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Pipeline Stages */}
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block font-mono">Custom Pipeline Stages</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(sector.pipeline_stages || []).map((stage, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-950 border border-slate-850 rounded text-[9px] font-semibold text-slate-400">
                              <CircleDot className="h-2 w-2 text-indigo-500 shrink-0" />
                              {stage}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Assigned Companies Collapsible Section */}
                      <div className="space-y-2 pt-4 border-t border-slate-800/80">
                        {(() => {
                          const sectorOrgs = organizations.filter(org => org.sector === sector.id || (sector.id === 'SOFTWARE_SERVICES' && !org.sector));
                          const isExpanded = expandedSectorId === sector.id;
                          return (
                            <>
                              <button
                                type="button"
                                onClick={() => setExpandedSectorId(isExpanded ? null : sector.id)}
                                className="w-full flex items-center justify-between py-1 px-2.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-900 text-[10px] font-black text-slate-400 cursor-pointer transition uppercase font-mono tracking-wider"
                              >
                                <span>Assigned Companies ({sectorOrgs.length})</span>
                                <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-indigo-450' : 'text-slate-500'}`} />
                              </button>

                              {isExpanded && (
                                <div className="space-y-2 mt-2 max-h-72 overflow-y-auto pr-1 animate-in fade-in duration-200">
                                  {sectorOrgs.length === 0 ? (
                                    <p className="text-[10px] text-slate-500 italic pl-1 font-medium">No companies registered in this sector.</p>
                                  ) : (
                                    sectorOrgs.map((org) => (
                                      <div key={org.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-850/60 text-xs gap-3">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                                            org.approval_status === 'Approved' ? 'bg-emerald-500' :
                                            org.approval_status === 'Pending' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
                                          }`} />
                                          <div className="min-w-0">
                                            <span className="font-extrabold text-slate-200 block truncate leading-none">{org.name}</span>
                                            <span className="text-[9px] font-mono text-slate-500 font-bold block mt-1">{org.ownerEmail}</span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenModulesModal(org)}
                                            className="py-1 px-3 rounded-lg bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/30 text-indigo-400 hover:text-white font-extrabold text-[9px] cursor-pointer flex items-center gap-1.5 transition"
                                          >
                                            <Boxes className="h-3.5 w-3.5" />
                                            Configure Modules
                                          </button>
                                          
                                          <button
                                            disabled={actionLoading !== null}
                                            onClick={() => handleStatusUpdate(org.id, org.approval_status === 'Approved' ? 'Suspended' : 'Approved')}
                                            className={`py-1 px-3 rounded-lg text-[9px] font-black cursor-pointer transition flex items-center gap-1.5 ${
                                              org.approval_status === 'Approved' 
                                                ? 'bg-rose-950/50 hover:bg-rose-900 border border-rose-900/30 text-rose-450 hover:text-white' 
                                                : 'bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-900/30 text-emerald-400 hover:text-white'
                                            }`}
                                          >
                                            {actionLoading === org.id ? (
                                              <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : org.approval_status === 'Approved' ? (
                                              'Deny Access'
                                            ) : (
                                              'Allow Access'
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB G: SECTOR SPECIFIC COMPANIES LIST
              ======================================================= */}
          {activeTab === 'sector-companies' && selectedSectorId && (() => {
            const currentSector = sectorsConfig.find(s => s.id === selectedSectorId);
            const sectorOrgs = organizations.filter(org => org.sector === selectedSectorId || (selectedSectorId === 'SOFTWARE_SERVICES' && !org.sector));
            const approvedCount = sectorOrgs.filter(o => o.approval_status === 'Approved').length;
            const pendingCount = sectorOrgs.filter(o => o.approval_status === 'Pending').length;
            const suspendedCount = sectorOrgs.filter(o => o.approval_status === 'Suspended').length;

            return (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Sector Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      <Building2 className="h-6 w-6 text-emerald-400" />
                      {currentSector ? currentSector.name : 'Sector'} Companies
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 font-semibold leading-relaxed">
                      Manage module licenses and access status for all companies in the <span className="text-emerald-400 font-bold">{currentSector ? currentSector.name : ''}</span> sector.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('sectors')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-black rounded-xl transition duration-200 cursor-pointer"
                  >
                    Manage Sector Configuration
                  </button>
                </div>

                {/* Sector Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-900/30 border border-slate-850 rounded-2xl flex flex-col justify-between">
                    <span className="text-[10px] text-slate-500 font-mono font-black uppercase tracking-wider">Total Companies</span>
                    <h3 className="text-xl font-black text-slate-100 mt-2">{sectorOrgs.length}</h3>
                  </div>
                  <div className="p-4 bg-slate-900/30 border border-slate-850 rounded-2xl flex flex-col justify-between">
                    <span className="text-[10px] text-emerald-500 font-mono font-black uppercase tracking-wider">Active Access</span>
                    <h3 className="text-xl font-black text-emerald-400 mt-2">{approvedCount}</h3>
                  </div>
                  <div className="p-4 bg-slate-900/30 border border-slate-850 rounded-2xl flex flex-col justify-between">
                    <span className="text-[10px] text-amber-500 font-mono font-black uppercase tracking-wider">Pending Review</span>
                    <h3 className="text-xl font-black text-amber-400 mt-2">{pendingCount}</h3>
                  </div>
                  <div className="p-4 bg-slate-900/30 border border-slate-850 rounded-2xl flex flex-col justify-between">
                    <span className="text-[10px] text-rose-500 font-mono font-black uppercase tracking-wider">Denied Access</span>
                    <h3 className="text-xl font-black text-rose-400 mt-2">{suspendedCount}</h3>
                  </div>
                </div>

                {/* Companies Directory list */}
                <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl">
                  {sectorOrgs.length === 0 ? (
                    <div className="py-20 text-center text-slate-500 font-bold text-sm italic">
                      No companies are registered in this sector.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-850">
                      <table className="min-w-full divide-y divide-slate-850 bg-slate-950/40">
                        <thead className="bg-slate-900/60 font-mono text-[10px] font-black uppercase text-slate-450 tracking-wider">
                          <tr>
                            <th scope="col" className="px-6 py-4 text-left">Company details</th>
                            <th scope="col" className="px-6 py-4 text-left">Primary Owner</th>
                            <th scope="col" className="px-6 py-4 text-left">Email Address</th>
                            <th scope="col" className="px-6 py-4 text-center">Status</th>
                            <th scope="col" className="px-6 py-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 text-xs font-semibold text-slate-350">
                          {sectorOrgs.map((org) => (
                            <tr key={org.id} className="hover:bg-slate-900/10 transition-colors duration-150">
                              {/* Name */}
                              <td className="px-6 py-4.5 flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase font-mono border ${
                                  org.approval_status === 'Approved' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' :
                                  org.approval_status === 'Pending' ? 'bg-amber-950/40 text-amber-400 border-amber-900/30' :
                                  'bg-rose-950/40 text-rose-400 border-rose-900/30'
                                }`}>
                                  {org.name.slice(0, 2)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-extrabold text-slate-200 truncate leading-none">{org.name}</p>
                                  <span className="text-[9px] text-slate-500 block mt-1.5 font-mono uppercase tracking-wider">Registered: {new Date(org.created_at || Date.now()).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                                </div>
                              </td>

                              {/* Owner */}
                              <td className="px-6 py-4.5 text-slate-200">
                                <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-slate-450" /> {org.ownerName}</span>
                              </td>

                              {/* Email */}
                              <td className="px-6 py-4.5 font-mono text-[11px] text-slate-400">
                                <a href={`mailto:${org.ownerEmail}`} className="hover:underline flex items-center gap-1">
                                  <Mail className="h-3 w-3 shrink-0" />
                                  {org.ownerEmail}
                                </a>
                              </td>

                              {/* Status */}
                              <td className="px-6 py-4.5 text-center">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                  org.approval_status === 'Approved' ? 'bg-emerald-950 text-emerald-400 border-emerald-900/40' :
                                  org.approval_status === 'Pending' ? 'bg-amber-950 text-amber-400 border-amber-900/40' :
                                  'bg-rose-950 text-rose-400 border-rose-900/40'
                                }`}>
                                  {org.approval_status === 'Approved' && <ShieldCheck className="h-3 w-3" />}
                                  {org.approval_status === 'Pending' && <Clock className="h-3 w-3 animate-pulse" />}
                                  {org.approval_status === 'Suspended' && <Ban className="h-3 w-3" />}
                                  {org.approval_status}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="px-6 py-4.5 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenModulesModal(org)}
                                    className="p-1 px-2.5 rounded bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/30 text-indigo-400 hover:text-white font-extrabold text-[10px] cursor-pointer flex items-center gap-1 transition"
                                  >
                                    <Boxes className="h-3 w-3" />
                                    Modules
                                  </button>
                                  {org.approval_status !== 'Approved' && (
                                    <button
                                      disabled={actionLoading !== null}
                                      onClick={() => handleStatusUpdate(org.id, 'Approved')}
                                      className="p-1 px-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] cursor-pointer flex items-center gap-1 transition disabled:opacity-50"
                                    >
                                      <Check className="h-3 w-3" />
                                      Approve
                                    </button>
                                  )}
                                  {org.approval_status === 'Approved' && (
                                    <button
                                      disabled={actionLoading !== null}
                                      onClick={() => handleStatusUpdate(org.id, 'Suspended')}
                                      className="p-1 px-2.5 rounded bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-900 text-slate-400 hover:text-rose-400 font-bold text-[10px] cursor-pointer flex items-center gap-1 transition disabled:opacity-50"
                                    >
                                      <Ban className="h-3 w-3" />
                                      Suspend
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ========================================================
              TAB E: TICKETS
              ======================================================= */}
          {activeTab === 'tickets' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {supportTickets.length === 0 ? (
                <div className="py-20 text-center text-slate-500 font-bold text-sm italic border border-slate-800 rounded-2xl bg-slate-900/10">
                  No support tickets registered in the database outbox.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="p-6 bg-slate-900/30 border border-slate-800 rounded-2xl flex flex-col justify-between hover:border-slate-700/60 transition duration-300 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="font-extrabold text-sm text-slate-200">{ticket.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono ${
                            ticket.priority === 'High' ? 'bg-rose-950 text-rose-400 border border-rose-900/40' :
                            ticket.priority === 'Medium' ? 'bg-amber-950 text-amber-400 border border-amber-900/40' :
                            'bg-blue-950 text-blue-400 border border-blue-900/40'
                          }`}>
                            {ticket.priority} Priority
                          </span>
                        </div>

                        <p className="text-[11px] font-bold text-slate-400 leading-relaxed font-sans">{ticket.message}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-850 flex items-center justify-between gap-3 text-[10px] font-bold text-slate-500 leading-none">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                          ticket.status === 'Open' ? 'bg-amber-950 text-amber-400 border-amber-900/40' :
                          'bg-emerald-950 text-emerald-400 border-emerald-900/40'
                        }`}>
                          {ticket.status === 'Open' ? <Clock className="h-3 w-3 animate-pulse" /> : <ShieldCheck className="h-3 w-3" />}
                          {ticket.status}
                        </span>

                        {ticket.status === 'Open' && (
                          <button
                            disabled={actionLoading !== null}
                            onClick={() => handleCloseTicket(ticket.id)}
                            className="p-1 px-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[9px] cursor-pointer flex items-center gap-1 transition disabled:opacity-50"
                          >
                            <Check className="h-3 w-3" />
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ========================================================
          3. MODULES MANAGEMENT MODAL (GLASSMORPHIC DIALOG)
          ======================================================== */}
      {modulesModalOpen && selectedOrgForModules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500/10 blur-[60px] pointer-events-none"></div>

            <div className="flex justify-between items-start pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Boxes className="h-4.5 w-4.5 text-indigo-400" />
                  Manage Licensed Modules
                </h3>
                <p className="text-[10px] text-slate-500 font-bold block mt-1">
                  Enable or disable active CRM features for <span className="text-slate-350">{selectedOrgForModules.name}</span>.
                </p>
              </div>
              <button 
                onClick={() => setModulesModalOpen(false)}
                className="text-slate-550 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer transition border-0 bg-transparent"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Modules Checkbox Grid */}
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {availableModulesList.map((m) => {
                const isChecked = checkedModules.includes(m.key);
                return (
                  <button
                    key={m.key}
                    onClick={() => handleToggleModuleCheckbox(m.key)}
                    className={`w-full text-left p-3.5 rounded-xl border flex items-start gap-3.5 transition-all duration-200 cursor-pointer ${
                      isChecked 
                        ? 'bg-indigo-950/20 border-indigo-500/40 hover:border-indigo-500/60'
                        : 'bg-slate-950/20 border-slate-800 hover:border-slate-700/60'
                    }`}
                  >
                    <div className={`mt-0.5 h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                      isChecked ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-slate-750 bg-slate-950'
                    }`}>
                      {isChecked && <Check className="h-3 w-3" />}
                    </div>
                    <div>
                      <span className={`text-xs font-black block leading-none ${isChecked ? 'text-indigo-400' : 'text-slate-300'}`}>
                        {m.name}
                      </span>
                      <span className="text-[9px] text-slate-500 font-semibold block mt-1">
                        {m.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-slate-850">
              <button
                onClick={() => setModulesModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading !== null}
                onClick={handleSaveModules}
                className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-500/10 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading === selectedOrgForModules?.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Save Modules
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          4. SECTOR CREATE/EDIT MODAL
          ======================================================== */}
      {sectorsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <form 
            onSubmit={handleSaveSector}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-emerald-500/5 blur-[60px] pointer-events-none"></div>

            <div className="flex justify-between items-start pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Boxes className="h-4.5 w-4.5 text-emerald-400" />
                  {editingSector ? 'Edit Sector Configuration' : 'Add New CRM Sector'}
                </h3>
                <p className="text-[10px] text-slate-500 font-bold block mt-1">
                  Define dynamic terminology labels and pipeline stages for this sector.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setSectorsModalOpen(false)}
                className="text-slate-500 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer transition border-0 bg-transparent"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="max-h-[400px] overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Sector ID (Unique Key) *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingSector}
                    placeholder="e.g. REAL_ESTATE"
                    value={sectorId}
                    onChange={(e) => setSectorId(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Sector Display Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Real Estate"
                    value={sectorName}
                    onChange={(e) => setSectorName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Lead Term *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Property Lead"
                    value={sectorLeadTerm}
                    onChange={(e) => setSectorLeadTerm(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Product Term *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Property"
                    value={sectorProductTerm}
                    onChange={(e) => setSectorProductTerm(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Deal Term *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Booking / Offer"
                    value={sectorDealTerm}
                    onChange={(e) => setSectorDealTerm(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Pipeline Stages Builder */}
              <div className="space-y-2 border-t border-slate-800/80 pt-3">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Pipeline Stages Builder</label>
                
                {/* Stage Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter stage name..."
                    value={newStageInput}
                    onChange={(e) => setNewStageInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStage(); } }}
                  />
                  <button
                    type="button"
                    onClick={handleAddStage}
                    className="px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {/* Display Current Stages */}
                <div className="flex flex-wrap gap-1.5 mt-2 bg-slate-950/40 p-3 rounded-2xl border border-slate-850">
                  {sectorStages.length === 0 ? (
                    <span className="text-[10px] text-slate-650 italic">No stages added. Every pipeline requires at least one stage.</span>
                  ) : (
                    sectorStages.map((stage, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-semibold text-slate-350">
                        <span>{stage}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveStage(stage)}
                          className="p-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-white transition cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-850">
              <button
                type="button"
                onClick={() => setSectorsModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading !== null}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading === sectorId ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Save Sector
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
