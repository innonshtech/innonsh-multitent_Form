'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck,
  Briefcase, 
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
  LifeBuoy,
  Network,
  Bell,
  Settings, 
  UserCog,
  LogOut, 
  User as UserIcon,
  Menu,
  X,
  Loader2,
  Mail,
  Sparkles,
  Settings2,
  Building,
  Heart,
  Activity,
  Building2,
  Layers,
  MapPin,
  Search,
  BookOpen,
  CreditCard,
  Handshake,
  FolderOpen,
  KeyRound,
  Ban
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bellDropdownOpen, setBellDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  // Dynamic Module Activation Requests States
  const [moduleRequests, setModuleRequests] = useState([]);
  const [requestingModule, setRequestingModule] = useState(false);

  const fetchModuleRequests = async () => {
    try {
      const res = await fetch('/api/tenant/module-requests');
      if (res.ok) {
        const data = await res.json();
        setModuleRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Fetch tenant module requests failed:', err);
    }
  };

  const handleRequestModule = async (modName) => {
    if (user?.role !== 'owner') {
      alert('Only organization owners can request feature module activations.');
      return;
    }
    setRequestingModule(true);
    try {
      const res = await fetch('/api/tenant/module-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleName: modName })
      });
      const data = await res.json();
      if (res.ok) {
        await fetchModuleRequests();
        alert(`🎉 Activation request submitted successfully! Super Admin has been notified.`);
      } else {
        alert(data.error || 'Failed to submit activation request.');
      }
    } catch (err) {
      console.error('Submit module request error:', err);
      alert('Could not connect to the server.');
    } finally {
      setRequestingModule(false);
    }
  };

  const moduleMapping = {
    '/dashboard/support': 'support',
    '/dashboard/leads': 'leads',
    '/dashboard/contacts': 'contacts',
    '/dashboard/client-organizations': 'contacts',
    '/dashboard/deals': 'deals',
    '/dashboard/emails': 'emails',
    '/dashboard/tasks': 'tasks',
    '/dashboard/calls': 'calls',
    '/dashboard/meetings': 'meetings',
    '/dashboard/products': 'products',
    '/dashboard/quotations': 'quotations',
    '/dashboard/invoices': 'invoices',
    '/dashboard/reports': 'reports',
    '/dashboard/analytics': 'analytics',
    '/dashboard/users': 'users',
    '/dashboard/roles': 'roles',
    '/dashboard/teams': 'teams',
  };

  const activeModuleKey = Object.keys(moduleMapping).find(
    path => pathname === path || pathname.startsWith(path + '/')
  );
  const activeModuleName = activeModuleKey ? moduleMapping[activeModuleKey] : null;

  const isModuleDisabled = activeModuleName && user && !user.isSuperAdmin && user.enabledModules && !user.enabledModules.includes(activeModuleName);

  const getModuleDisplayName = (slug) => {
    const sectorConf = user?.sectorConfig;
    const leadTerm = sectorConf?.leadTerm || 'Lead';
    const productTerm = sectorConf?.productTerm || 'Product';
    const dealTerm = sectorConf?.dealTerm || 'Deal';

    switch (slug) {
      case 'leads': return `${leadTerm}s`;
      case 'contacts': return 'Contacts Directory';
      case 'deals': return `${dealTerm} Pipeline`;
      case 'emails': return 'Email Hub';
      case 'tasks': return 'Tasks Manager & Reminders';
      case 'calls': return 'Call Logs & Record Suite';
      case 'meetings': return 'Meetings & Calendar Scheduler';
      case 'products': return `${productTerm}s Catalogue`;
      case 'quotations': return 'Quotations Builder';
      case 'invoices': return 'Invoices & Billing Hub';
      case 'reports': return 'Sales Reports Builder';
      case 'analytics': return 'BI Analytics & Forecasting';
      case 'users': return 'Users & Employee Directory';
      case 'roles': return 'Roles & Permission Gates';
      case 'teams': return 'Teams & Department Manager';
      case 'support': return 'Customer Support';
      default: return slug.charAt(0).toUpperCase() + slug.slice(1);
    }
  };

  const renderLockedModuleScreen = () => {
    const displayName = getModuleDisplayName(activeModuleName);
    const pendingRequest = moduleRequests.find(r => r.module_name === activeModuleName && r.status === 'Pending');
    const isRequested = !!pendingRequest;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-800 font-sans p-6 select-none">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-indigo-500/5 blur-[50px] pointer-events-none"></div>
          
          {/* Lock Icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-indigo-500 shadow-sm animate-pulse">
            <Lock className="h-6 w-6 text-indigo-650" />
          </div>

          <div className="space-y-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-mono">Subscription Access Lock</span>
            <h2 className="text-base font-black text-slate-800 leading-tight">
              {displayName} Module Locked
            </h2>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed px-2">
              Aapki organization ke paas <b>{displayName}</b> module ka active license nahi hai. 
              Kripya is module ko activate karne ke liye platform Super Admin se sampark karein.
            </p>
          </div>

          {/* REQUEST MODULE BUTTON LOOP */}
          {user && user.role === 'owner' && (
            <div className="pt-4 border-t border-slate-100 flex flex-col items-center w-full">
              {isRequested ? (
                <div className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black rounded-xl select-none animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  ⏳ Request Pending Admin Review
                </div>
              ) : (
                <button
                  onClick={() => handleRequestModule(activeModuleName)}
                  disabled={requestingModule}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-200 disabled:to-slate-300 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-550/15 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {requestingModule ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <span>⚡</span> Request Module Activation
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {user && user.role !== 'owner' && (
            <p className="text-[10px] text-slate-400 font-bold italic pt-2 border-t border-slate-100">
              🔒 Feature activation request can only be submitted by organization owners.
            </p>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => router.back()}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-350 text-slate-700 hover:text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Go Back
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-500/10 transition cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Fetch real-time user notification logs
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Fetch user notifications failed:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'PUT' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Mark bulk read failed:', err);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PUT' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Mark single notice read failed:', err);
    }
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          // Fetch notifications upon successful login verification
          fetchNotifications();
          if (data.user && !data.user.isSuperAdmin) {
            // Fetch dynamic module requests
            try {
              const reqsRes = await fetch('/api/tenant/module-requests');
              if (reqsRes.ok) {
                const reqsData = await reqsRes.json();
                setModuleRequests(reqsData.requests || []);
              }
            } catch (reqsErr) {
              console.error('Fetch tenant module requests failed:', reqsErr);
            }
          }
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('Auth verification error:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();

    // Start 10 seconds dynamic polling loop
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Categorized Sidebar Navigation Items
  const navigationCategories = [
    {
      title: 'Core Sales',
      links: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Leads', href: '/dashboard/leads', icon: Users },
        { name: 'Contacts Directory', href: '/dashboard/contacts', icon: UserCheck },
        { name: 'Client Organizations', href: '/dashboard/client-organizations', icon: Building2 },
        { name: 'Deals Pipeline', href: '/dashboard/deals', icon: Briefcase },
        { name: 'Email Hub', href: '/dashboard/emails', icon: Mail },
      ]
    },
    {
      title: 'Activities',
      links: [
        { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
        { name: 'Calls', href: '/dashboard/calls', icon: PhoneCall },
        { name: 'Meetings', href: '/dashboard/meetings', icon: Calendar },
      ]
    },
    {
      title: 'Customer Support',
      links: [
        { name: 'Support Tickets', href: '/dashboard/support', icon: LifeBuoy },
      ]
    },
    {
      title: 'Inventory & Billing',
      links: [
        { name: 'Products', href: '/dashboard/products', icon: Package },
        { name: 'Quotations', href: '/dashboard/quotations', icon: FileText },
        { name: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
      ]
    },
    {
      title: 'Analytics & BI',
      links: [
        { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
        { name: 'Analytics', href: '/dashboard/analytics', icon: PieChart },
      ]
    },
    {
      title: 'Administration',
      links: [
        { name: 'Users Directory', href: '/dashboard/users', icon: ShieldAlert },
        { name: 'Roles & Permissions', href: '/dashboard/roles', icon: Lock },
        { name: 'Teams', href: '/dashboard/teams', icon: Network },
      ]
    },
    {
      title: 'Preferences',
      links: [
        { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
        { name: 'Profile', href: '/dashboard/profile', icon: UserCog },
        { name: 'CRM Add-ons', href: '/dashboard/settings/modules', icon: Sparkles, ownerOnly: true },
        { name: 'Custom Fields', href: '/dashboard/settings/custom-fields', icon: Settings2, ownerOnly: true },
      ]
    }
  ];

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
          <p className="text-sm font-semibold tracking-wide text-slate-500">Loading your CRM session...</p>
        </div>
      </div>
    );
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'sales_admin':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'owner': return 'Owner';
      case 'sales_admin': return 'Sales Manager';
      case 'sales_rep': return 'Sales Rep';
      default: return role;
    }
  };

  const renderNavLinks = (isMobile = false) => {
    return navigationCategories.map((category) => {
      // Dynamic Modules Gating & Role-Based Access Filters
      const allowedLinks = category.links.filter((link) => {
        // Owner-only links: hide from non-owners
        if (link.ownerOnly && user?.role !== 'owner') return false;

        // 0. Modules Gating Check (Super Admins automatically bypass)
        if (user && !user.isSuperAdmin) {
          const moduleKey = moduleMapping[link.href];
          if (moduleKey && user.enabledModules && !user.enabledModules.includes(moduleKey)) {
            return false; // Module is disabled for this tenant company
          }
        }

        // 1. Owner has access to everything
        if (user?.role === 'owner') return true;

        // 2. Sales Manager (sales_admin) sees specified modules
        if (user?.role === 'sales_admin') {
          const managerAllowed = [
            'Dashboard',
            'Leads',
            'Contacts Directory',
            'Client Organizations',
            'Deals Pipeline',
            'Email Hub',
            'Tasks',
            'Calls',
            'Meetings',
            'Products',
            'Quotations',
            'Reports',
            'Notifications',
            'Settings',
            'Profile',
            'Users Directory',
            'Roles & Permissions',
            'Teams',
            'RE Overview',
            'RE Leads',
            'RE Contacts',
            'Properties',
            'Projects',
            'Unit Inventory',
            'Site Visits',
            'Property Matching',
            'Bookings',
            'Payment Plans',
            'Channel Partners',
            'Blocking',
            'Documents Vault',
            'Possessions',
            'Support Tickets',
          ];
          return managerAllowed.includes(link.name);
        }
 
        // 3. Sales Representative (sales_rep) sees specified modules
        if (user?.role === 'sales_rep') {
          const repAllowed = [
            'Dashboard',
            'Leads',
            'Contacts Directory',
            'Client Organizations',
            'Deals Pipeline',
            'Email Hub',
            'Tasks',
            'Calls',
            'Meetings',
            'Notifications',
            'Profile',
            'RE Overview',
            'RE Leads',
            'RE Contacts',
            'Properties',
            'Projects',
            'Unit Inventory',
            'Site Visits',
            'Property Matching',
            'Bookings',
            'Payment Plans',
            'Channel Partners',
            'Blocking',
            'Documents Vault',
            'Possessions',
            'Support Tickets',
          ];
          return repAllowed.includes(link.name);
        }

        return false;
      });

      // Hide parent category if no links are permitted
      if (allowedLinks.length === 0) return null;

      return (
        <div key={category.title} className="space-y-1.5 pt-4 first:pt-0">
          <span className="px-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
            {category.title}
          </span>
          <div className="space-y-0.5">
            {allowedLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href + '/'));
              
              // Dynamic Display Names translated by Active Sector Config
              let displayName = link.name;
              const sectorConf = user?.sectorConfig;
              
              if (sectorConf) {
                const leadTerm = sectorConf.leadTerm || 'Lead';
                const productTerm = sectorConf.productTerm || 'Product';
                const dealTerm = sectorConf.dealTerm || 'Deal';

                if (link.name === 'Leads') {
                  displayName = user?.role === 'sales_rep' ? `My ${leadTerm}s` : `${leadTerm}s`;
                } else if (link.name === 'Deals Pipeline') {
                  displayName = user?.role === 'sales_rep' ? `My ${dealTerm}s` : `${dealTerm} Pipeline`;
                } else if (link.name === 'Products') {
                  displayName = `${productTerm}s`;
                } else if (link.name === 'Contacts Directory' && user?.role === 'sales_rep') {
                  displayName = 'My Contacts';
                } else if (link.name === 'Client Organizations' && user?.role === 'sales_rep') {
                  displayName = 'My Organizations';
                } else if (link.name === 'Tasks' && user?.role === 'sales_rep') {
                  displayName = 'My Tasks';
                }
              } else {
                if (user?.role === 'sales_rep') {
                  if (link.name === 'Leads') displayName = 'My Leads';
                  if (link.name === 'Contacts Directory') displayName = 'My Contacts';
                  if (link.name === 'Deals Pipeline') displayName = 'My Deals';
                  if (link.name === 'Tasks') displayName = 'My Tasks';
                }
              }
              
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => isMobile && setMobileSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm shadow-emerald-500/5' 
                      : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-emerald-650 font-bold' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className="truncate">{displayName}</span>
                </Link>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-250 shrink-0">
        {/* Logo / Header */}
        <div className="flex items-center gap-2 px-6 py-4.5 border-b border-slate-200 bg-slate-50/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 font-black text-white text-base shadow-md shadow-emerald-500/10">
            I
          </div>
          <span className="text-base font-extrabold text-slate-800 truncate" title={user?.companyName ? `${user.companyName} CRM` : "Innonsh CRM"}>
            {user?.companyName ? user.companyName : "Innonsh"} <span className="text-[10px] text-emerald-500 font-mono ml-0.5">v1.0</span>
          </span>
        </div>

        {/* Navigation Categories Container */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {renderNavLinks()}
        </nav>

        {/* Footer User Info */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white border border-slate-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <UserIcon className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate leading-none">{user?.name}</p>
              <span className={`inline-block px-1.5 py-0.5 mt-1 text-[8px] font-bold uppercase rounded border ${getRoleBadgeColor(user?.role)}`}>
                {getRoleDisplayName(user?.role)}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full mt-3 px-4 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* --- MOBILE SIDEBAR DRAWER --- */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex bg-slate-900/40 backdrop-blur-sm">
          <div className="flex flex-col w-60 bg-white border-r border-slate-250 h-full animate-in slide-in-from-left duration-250">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 font-bold text-white text-sm shadow-sm">
                  I
                </div>
                <span className="text-sm font-bold text-slate-800 truncate">
                  {user?.companyName ? user.companyName : "Innonsh CRM"}
                </span>
              </div>
              <button 
                onClick={() => setMobileSidebarOpen(false)} 
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-4">
              {renderNavLinks(true)}
            </nav>
            <div className="p-4 border-t border-slate-200 shrink-0">
              <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200">
                  <UserIcon className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                  <span className={`inline-block px-1.5 py-0.5 mt-1 text-[8px] font-bold uppercase rounded border ${getRoleBadgeColor(user?.role)}`}>
                    {getRoleDisplayName(user?.role)}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full mt-3 px-4 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileSidebarOpen(false)}></div>
        </div>
      )}

      {/* --- MAIN PAGE CONTENT WRAPPER --- */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Unified Top Desktop & Mobile Header Bar */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0 shadow-sm printable-hidden z-20">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Welcome greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-xs md:text-sm font-bold text-slate-700">
                Welcome back, <strong className="text-slate-900">{user?.name}</strong>
              </span>
              {user?.companyName && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-250 font-mono w-max select-none animate-in fade-in duration-300">
                  🏢 {user.companyName}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* REAL-TIME NOTIFICATIONS BELL CONTAINER */}
            <div className="relative">
              <button 
                onClick={() => { setBellDropdownOpen(!bellDropdownOpen); setProfileDropdownOpen(false); }}
                className="p-1.5 rounded-full hover:bg-slate-105 text-slate-500 hover:text-slate-800 transition relative cursor-pointer"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-4.5 w-4.5 rounded-full bg-rose-500 border-2 border-white text-[8px] font-black text-white flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* BELL DROPDOWN POP-OVER */}
              {bellDropdownOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-3 duration-250 z-50">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Recent Alerts</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-64 divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 italic text-[10px]">
                        No recent alerts logged. Keep up the good work!
                      </div>
                    ) : (
                      notifications.map((notice) => (
                        <div 
                          key={notice._id}
                          onClick={() => { handleMarkSingleRead(notice._id); if (notice.link) router.push(notice.link); setBellDropdownOpen(false); }}
                          className={`p-3 hover:bg-slate-50 transition cursor-pointer text-left flex items-start gap-3 ${
                            !notice.isRead ? 'bg-indigo-50/20' : ''
                          }`}
                        >
                          <div className={`mt-0.5 h-6.5 w-6.5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                            notice.type === 'Invoice' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            notice.type === 'Task' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            notice.type === 'Lead' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            'bg-slate-100 text-slate-750 border'
                          }`}>
                            {notice.type === 'Invoice' ? '🧾' :
                             notice.type === 'Task' ? '🚨' :
                             notice.type === 'Lead' ? '🤝' : '🔔'}
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-slate-800 block truncate">{notice.title}</span>
                            <span className="text-[10px] text-slate-500 block leading-relaxed mt-0.5 whitespace-pre-wrap">{notice.message}</span>
                            <span className="text-[8px] text-slate-400 font-medium block mt-1.5">
                              {new Date(notice.createdAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-center">
                    <Link 
                      href="/dashboard/notifications" 
                      onClick={() => setBellDropdownOpen(false)}
                      className="text-[9px] font-black text-slate-500 hover:text-slate-800 uppercase tracking-widest hover:underline"
                    >
                      View all alerts
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile trigger thumbnail & dropdown */}
            <div className="relative">
              <button 
                onClick={() => { setProfileDropdownOpen(!profileDropdownOpen); setBellDropdownOpen(false); }}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-[10px] font-mono font-black text-slate-600 uppercase hover:scale-[1.03] active:scale-[0.97] transition cursor-pointer"
              >
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-3 duration-250 z-50">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-800 truncate leading-none">{user?.name}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-1.5 font-medium">{user?.email}</p>
                  </div>
                  
                  <div className="py-1">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-655 hover:bg-slate-50 hover:text-slate-900 transition"
                    >
                      <UserCog className="h-4 w-4 text-slate-400" />
                      Profile Settings
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 py-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Inner Layout Body */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
          {isModuleDisabled ? renderLockedModuleScreen() : children}
        </main>
      </div>
    </div>
  );
}
