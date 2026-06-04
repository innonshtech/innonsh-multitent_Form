'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserCog, 
  Settings2, 
  Sparkles, 
  Lock, 
  ChevronRight, 
  Loader2, 
  Settings,
  Link
} from 'lucide-react';

export default function SettingsDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('Failed to load user in settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-xs text-slate-400 font-bold">Loading settings control desk...</p>
      </div>
    );
  }

  const isOwner = user?.role === 'owner';

  const settingsCards = [
    {
      title: 'Profile & Preferences',
      description: 'Update your display name, change password, customize glassmorphism styling, and mute/unmute notification sounds.',
      href: '/dashboard/profile',
      icon: UserCog,
      iconColor: 'text-emerald-500 bg-emerald-50 border-emerald-100',
      active: true,
    },
    {
      title: 'Custom Fields Control',
      description: 'Define custom inputs and properties for your Leads, Contacts, and Deals directories to match your business workflow.',
      href: '/dashboard/settings/custom-fields',
      icon: Settings2,
      iconColor: isOwner ? 'text-indigo-500 bg-indigo-50 border-indigo-100' : 'text-slate-400 bg-slate-50 border-slate-200',
      active: isOwner,
      ownerOnly: true,
    },
    {
      title: 'CRM Add-on Modules',
      description: 'Activate, lock, or request advanced CRM features and vertical modules like Real Estate or Tickets.',
      href: '/dashboard/settings/modules',
      icon: Sparkles,
      iconColor: isOwner ? 'text-amber-500 bg-amber-50 border-amber-100' : 'text-slate-400 bg-slate-50 border-slate-200',
      active: isOwner,
      ownerOnly: true,
    },
    {
      title: 'Meta Lead Integration',
      description: 'Connect Facebook and Instagram page forms to automatically sync leads to your CRM in real time.',
      href: '/dashboard/settings/meta',
      icon: Link,
      iconColor: isOwner ? 'text-blue-500 bg-blue-50 border-blue-100' : 'text-slate-400 bg-slate-50 border-slate-200',
      active: isOwner,
      ownerOnly: true,
    }
  ];

  return (
    <div className="space-y-6 relative h-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Settings className="h-7 w-7 text-emerald-500" />
          CRM Settings Control Center
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Manage your personal account profile or configure organization-wide database and module settings.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {settingsCards.map((card, idx) => {
          const Icon = card.icon;
          const showLocked = card.ownerOnly && !isOwner;

          return (
            <div 
              key={idx}
              onClick={() => {
                if (card.active) {
                  router.push(card.href);
                }
              }}
              className={`bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all duration-200 relative overflow-hidden group ${
                card.active 
                  ? 'border-slate-200 hover:border-emerald-300 hover:shadow-md cursor-pointer' 
                  : 'border-slate-200/60 opacity-75'
              }`}
            >
              {/* Blur background hover effect */}
              {card.active && (
                <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-emerald-500/5 blur-[35px] pointer-events-none group-hover:scale-125 transition-transform duration-300"></div>
              )}

              <div className="space-y-4">
                {/* Icon row */}
                <div className="flex items-center justify-between">
                  <div className={`h-11 w-11 rounded-xl border flex items-center justify-center ${card.iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {showLocked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-[8px] font-black uppercase text-rose-600">
                      <Lock className="h-2.5 w-2.5" />
                      Owner Only
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <h3 className={`text-sm font-bold ${showLocked ? 'text-slate-500' : 'text-slate-800'}`}>
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {card.description}
                  </p>
                </div>
              </div>

              {/* Action link indicator */}
              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-emerald-600 transition-colors">
                <span>
                  {showLocked ? 'Feature Locked' : 'Configure Settings'}
                </span>
                {card.active && (
                  <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
