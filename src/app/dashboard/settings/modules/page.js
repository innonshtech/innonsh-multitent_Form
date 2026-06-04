'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserCheck,
  Briefcase,
  Mail,
  CheckSquare,
  PhoneCall,
  Calendar,
  Package,
  FileText,
  Receipt,
  BarChart3,
  PieChart,
  ShieldAlert,
  Lock,
  Network,
  CheckCircle,
  Clock,
  Zap,
  Loader2,
  ArrowLeft,
  Sparkles,
  XCircle,
  RefreshCw,
  Heart,
} from 'lucide-react';

// ─── Full module catalogue (mirrors super-admin list) ────────────────────────
const ALL_MODULES = [
  {
    key: 'leads',
    name: 'Leads',
    desc: 'Manage prospect pipelines and follow-up workflows',
    icon: Users,
    category: 'Core Sales',
    color: 'indigo',
  },
  {
    key: 'contacts',
    name: 'Contacts Index',
    desc: 'Permanent customer contact registry with history logs',
    icon: UserCheck,
    category: 'Core Sales',
    color: 'indigo',
  },
  {
    key: 'deals',
    name: 'Deals Pipeline',
    desc: 'Kanban drag-and-drop opportunity board for sales tracking',
    icon: Briefcase,
    category: 'Core Sales',
    color: 'indigo',
  },
  {
    key: 'emails',
    name: 'Email Hub',
    desc: 'Integrated email sync and threaded inbox logs',
    icon: Mail,
    category: 'Core Sales',
    color: 'indigo',
  },
  {
    key: 'tasks',
    name: 'Tasks & Reminders',
    desc: 'To-do checklists, deadlines and rep reminder system',
    icon: CheckSquare,
    category: 'Activities',
    color: 'emerald',
  },
  {
    key: 'calls',
    name: 'Call Tracking',
    desc: 'Log and track customer phone contacts and call durations',
    icon: PhoneCall,
    category: 'Activities',
    color: 'emerald',
  },
  {
    key: 'meetings',
    name: 'Meeting Schedules',
    desc: 'Organize dynamic sync calendars and video call schedules',
    icon: Calendar,
    category: 'Activities',
    color: 'emerald',
  },
  {
    key: 'products',
    name: 'Product Index',
    desc: 'Manage catalog item prices, SKUs and rate tables',
    icon: Package,
    category: 'Inventory & Billing',
    color: 'amber',
  },
  {
    key: 'quotations',
    name: 'Quotations & Proposals',
    desc: 'Server-side financial calculator for customer billing quotes',
    icon: FileText,
    category: 'Inventory & Billing',
    color: 'amber',
  },
  {
    key: 'invoices',
    name: 'Invoices Hub',
    desc: 'Generate and track commercial customer invoices',
    icon: Receipt,
    category: 'Inventory & Billing',
    color: 'amber',
  },
  {
    key: 'reports',
    name: 'Sales Reports',
    desc: 'Tabular summaries of rep performance and deal outcomes',
    icon: BarChart3,
    category: 'Analytics & BI',
    color: 'violet',
  },
  {
    key: 'analytics',
    name: 'Sales Analytics',
    desc: 'Graphical breakdown of CRM activity with trend forecasting',
    icon: PieChart,
    category: 'Analytics & BI',
    color: 'violet',
  },
  {
    key: 'users',
    name: 'Employee Directory',
    desc: 'Control team logins, approval directory and access levels',
    icon: ShieldAlert,
    category: 'Administration',
    color: 'rose',
  },
  {
    key: 'roles',
    name: 'Roles & Permissions',
    desc: 'Privilege gates, dynamic role-based auth and access control',
    icon: Lock,
    category: 'Administration',
    color: 'rose',
  },
  {
    key: 'teams',
    name: 'Sales Teams',
    desc: 'Manage regional sales teams, leaders and department groups',
    icon: Network,
    category: 'Administration',
    color: 'rose',
  },
];

// ─── Color maps per category color token ─────────────────────────────────────
const COLOR_MAP = {
  indigo: {
    icon: 'text-indigo-500',
    iconBg: 'bg-indigo-50 border-indigo-100',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    tag: 'bg-indigo-500',
  },
  emerald: {
    icon: 'text-emerald-500',
    iconBg: 'bg-emerald-50 border-emerald-100',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    tag: 'bg-emerald-500',
  },
  amber: {
    icon: 'text-amber-500',
    iconBg: 'bg-amber-50 border-amber-100',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    tag: 'bg-amber-500',
  },
  violet: {
    icon: 'text-violet-500',
    iconBg: 'bg-violet-50 border-violet-100',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    tag: 'bg-violet-500',
  },
  rose: {
    icon: 'text-rose-500',
    iconBg: 'bg-rose-50 border-rose-100',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    tag: 'bg-rose-500',
  },
};

export default function ModuleLicensingPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [moduleRequests, setModuleRequests] = useState([]);
  const [requestingKey, setRequestingKey] = useState(null);
  const [toast, setToast] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  // ── Derived helpers ────────────────────────────────────────────────────────
  const enabledModules = user?.enabledModules || [];

  const getRequestStatus = (key) => {
    const req = moduleRequests.find((r) => r.module_name === key);
    return req ? req.status : null; // 'Pending' | 'Approved' | 'Declined' | null
  };

  const categories = ['All', ...Array.from(new Set(ALL_MODULES.map((m) => m.category)))];

  const visibleModules =
    filterCat === 'All' ? ALL_MODULES : ALL_MODULES.filter((m) => m.category === filterCat);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/tenant/module-requests');
      if (res.ok) {
        const data = await res.json();
        setModuleRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Fetch module requests error:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setTimeout(() => setRefreshing(false), 600);
  };

  useEffect(() => {
    async function bootstrap() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) { router.push('/login'); return; }
        const data = await res.json();
        if (!data.user || data.user.isSuperAdmin) { router.push('/dashboard'); return; }
        setUser(data.user);
        await fetchRequests();
      } catch (err) {
        console.error('Bootstrap error:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, [router]);

  // ── Request submission ─────────────────────────────────────────────────────
  const handleRequestModule = async (moduleKey) => {
    if (user?.role !== 'owner') {
      showToast('⚠️ Only organization owners can request module activations.');
      return;
    }
    setRequestingKey(moduleKey);
    try {
      const res = await fetch('/api/tenant/module-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleName: moduleKey }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchRequests();
        showToast('🎉 Activation request submitted! Super Admin has been notified.');
      } else {
        showToast(`⚠️ ${data.error || 'Failed to submit request.'}`);
      }
    } catch (err) {
      console.error('Request error:', err);
      showToast('⚠️ Could not connect to the server.');
    } finally {
      setRequestingKey(null);
    }
  };

  const showToast = (text) => {
    setToast(text);
    setTimeout(() => setToast(''), 4000);
  };

  // ── Counters ───────────────────────────────────────────────────────────────
  const activeCount  = ALL_MODULES.filter((m) => enabledModules.includes(m.key)).length;
  const pendingCount = moduleRequests.filter((r) => r.status === 'Pending').length;
  const lockedCount  = ALL_MODULES.filter(
    (m) => !enabledModules.includes(m.key) && getRequestStatus(m.key) !== 'Pending'
  ).length;

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-40">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-xs font-semibold text-slate-500">Loading module catalogue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full font-sans select-none relative">

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-5 py-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl text-white flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-700 transition mb-4 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Settings
        </button>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                CRM Add-ons &amp; Licensing
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-lg">
              Manage all feature modules available in your CRM plan. Request activation for locked
              modules — Super Admin will review and enable them for your organization.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-sm transition cursor-pointer shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>
      </div>

      {/* ── Summary stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Active Modules</p>
          <p className="text-3xl font-black text-emerald-600 mt-2">{activeCount}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">of {ALL_MODULES.length} total</p>
        </div>
        <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest font-mono">Pending Requests</p>
          <p className="text-3xl font-black text-amber-500 mt-2">{pendingCount}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">awaiting admin review</p>
        </div>
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest font-mono">Locked Modules</p>
          <p className="text-3xl font-black text-rose-400 mt-2">{lockedCount}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">available to request</p>
        </div>
      </div>

      {/* ── Non-owner notice ───────────────────────────────────────────────── */}
      {user?.role !== 'owner' && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-800">
          <Lock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <span>
            Only <strong>Organization Owners</strong> can submit module activation requests.
            Contact your owner to unlock additional modules.
          </span>
        </div>
      )}

      {/* ── Category filter pills ──────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-black border transition cursor-pointer ${
              filterCat === cat
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Module grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleModules.map((mod) => {
          const isActive   = enabledModules.includes(mod.key);
          const reqStatus  = getRequestStatus(mod.key);
          const isPending  = reqStatus === 'Pending';
          const isDeclined = reqStatus === 'Declined';
          const isLoading  = requestingKey === mod.key;
          const colors     = COLOR_MAP[mod.color] || COLOR_MAP.indigo;
          const Icon       = mod.icon;

          return (
            <div
              key={mod.key}
              className={`relative bg-white rounded-2xl border p-5 shadow-sm transition-all duration-200 flex flex-col gap-4 overflow-hidden group ${
                isActive
                  ? 'border-emerald-200 hover:border-emerald-300 hover:shadow-md'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {/* Active ribbon */}
              {isActive && (
                <div className="absolute top-0 right-0 px-2.5 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-wider rounded-bl-xl rounded-tr-2xl">
                  Active
                </div>
              )}

              {/* Module icon + name */}
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 ${colors.iconBg}`}>
                  <Icon className={`h-5 w-5 ${colors.icon}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight truncate">{mod.name}</h3>
                  <span className={`inline-block px-2 py-0.5 mt-1 text-[8px] font-black uppercase tracking-wider rounded border ${colors.badge}`}>
                    {mod.category}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed flex-1">
                {mod.desc}
              </p>

              {/* Status / Action footer */}
              <div className="pt-3 border-t border-slate-100">
                {isActive ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-black">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Module is active &amp; accessible
                  </div>
                ) : isPending ? (
                  <div className="flex items-center gap-1.5 text-amber-600 text-[11px] font-black animate-pulse">
                    <Clock className="h-3.5 w-3.5" />
                    Request pending admin review
                  </div>
                ) : isDeclined ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-rose-500 text-[11px] font-black">
                      <XCircle className="h-3.5 w-3.5" />
                      Previous request was declined
                    </div>
                    {user?.role === 'owner' && (
                      <button
                        onClick={() => handleRequestModule(mod.key)}
                        disabled={isLoading}
                        className="w-full py-2 text-[11px] font-black bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Re-request Activation
                      </button>
                    )}
                  </div>
                ) : (
                  user?.role === 'owner' ? (
                    <button
                      onClick={() => handleRequestModule(mod.key)}
                      disabled={isLoading}
                      className="w-full py-2.5 text-[11px] font-black bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl shadow-sm shadow-emerald-500/15 transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Zap className="h-3.5 w-3.5" />
                          Request Activation
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
                      <Lock className="h-3.5 w-3.5" />
                      Not activated — contact your owner
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer note ───────────────────────────────────────────────────── */}
      <div className="mt-10 text-center text-[11px] text-slate-400 font-medium">
        Module activations are subject to your current subscription plan and Super Admin approval.
        <br />
        For billing upgrades, contact your account manager.
      </div>
    </div>
  );
}
