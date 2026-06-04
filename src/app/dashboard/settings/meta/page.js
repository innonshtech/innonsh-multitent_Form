'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  Copy,
  Check,
  Trash2,
  Info,
  Globe,
  Key,
  Link,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

export default function MetaIntegrationPage() {
  const router = useRouter();

  // Auth & Page loading states
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form states
  const [pageId, setPageId] = useState('');
  const [pageName, setPageName] = useState('');
  const [pageAccessToken, setPageAccessToken] = useState('');
  const [formId, setFormId] = useState('');
  const [hasExistingConfig, setHasExistingConfig] = useState(false);

  // Copy states
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Feedback states
  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  // Webhook details (determined dynamically on the client)
  const [webhookUrl, setWebhookUrl] = useState('');
  const [verifyToken, setVerifyToken] = useState('meta_verify_token_123');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/webhooks/meta`);
    }
  }, []);

  // 1. Bootstrap: Auth validation & fetch settings
  useEffect(() => {
    async function bootstrap() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const { user: u } = await res.json();
        if (!u || u.isSuperAdmin || u.role !== 'owner') {
          router.push('/dashboard');
          return;
        }
        setUser(u);

        // Fetch existing meta integration settings
        const settingsRes = await fetch('/api/settings/meta');
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          if (data.verifyToken) {
            setVerifyToken(data.verifyToken);
          }
          if (data.config) {
            setPageId(data.config.page_id || '');
            setPageName(data.config.page_name || '');
            setPageAccessToken(data.config.page_access_token || '');
            setFormId(data.config.form_id || '');
            setHasExistingConfig(data.rawConfigExists);
          }
        }
      } catch (err) {
        console.error('Bootstrap integration error:', err);
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, [router]);

  // 2. Save settings handler
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!pageId.trim()) {
      setErrorMsg('Facebook Page ID is required.');
      return;
    }
    if (!pageAccessToken.trim()) {
      setErrorMsg('Page Access Token is required.');
      return;
    }

    setSaveLoading(true);
    try {
      const res = await fetch('/api/settings/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: pageId.trim(),
          pageName: pageName.trim(),
          pageAccessToken: pageAccessToken.trim(),
          formId: formId.trim() || null
        })
      });

      const data = await res.json();
      if (res.ok) {
        setHasExistingConfig(true);
        if (data.config) {
          setPageAccessToken(data.config.page_access_token);
        }
        showToast('✅ Meta integration settings saved successfully!');
      } else {
        setErrorMsg(data.error || 'Failed to save settings.');
      }
    } catch (err) {
      setErrorMsg('Network error saving settings. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  // 3. Delete settings handler
  const handleDeleteSettings = async () => {
    if (!confirm('Are you sure you want to disconnect and delete your Meta Integration? Leads will stop syncing in real time.')) {
      return;
    }

    setDeleteLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/settings/meta', {
        method: 'DELETE'
      });

      if (res.ok) {
        setPageId('');
        setPageName('');
        setPageAccessToken('');
        setFormId('');
        setHasExistingConfig(false);
        showToast('🗑️ Meta Integration disconnected and settings removed.');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to remove settings.');
      }
    } catch (err) {
      setErrorMsg('Network error deleting settings.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Copy helpers
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(verifyToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="font-sans max-w-5xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-5 py-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl text-white flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/dashboard/settings')}
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-700 transition mb-4 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Settings
        </button>
        <div className="flex items-center gap-2.5 mb-1.5">
          <Link className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Meta Lead Ads Integration</h1>
        </div>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-2xl">
          Integrate Instagram and Facebook Lead Forms directly with your multi-tenant CRM. 
          When leads fill out forms in your ads, they will instantly appear in your Leads directory.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 relative">
            {/* Ambient Background decoration */}
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-blue-500/5 blur-[45px] pointer-events-none"></div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Key className="h-4.5 w-4.5 text-blue-500" />
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Meta Credentials</h2>
              </div>
              
              {hasExistingConfig ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-600">
                  <Check className="h-3 w-3" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-500">
                  Disconnected
                </span>
              )}
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Page Name */}
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    Facebook Page Name
                    <HelpCircle className="h-3 w-3 text-slate-400 cursor-help" title="Just a friendly label to identify your page" />
                  </label>
                  <input
                    type="text"
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value)}
                    placeholder="e.g. Innonsh Technology Solutions"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Page ID */}
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1.5 uppercase tracking-wider">
                    Facebook Page ID *
                  </label>
                  <input
                    type="text"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    placeholder="e.g. 102938475610293"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>
              </div>

              {/* Page Access Token */}
              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                  Page Access Token *
                  <HelpCircle className="h-3 w-3 text-slate-400 cursor-help" title="Never share this token. It must have pages_show_list, pages_read_engagement, and leads_retrieval permissions." />
                </label>
                <input
                  type="password"
                  value={pageAccessToken}
                  onChange={(e) => setPageAccessToken(e.target.value)}
                  placeholder="Paste your Meta Page Access Token"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Note: A permanent System User Token generated via Business Manager is recommended so it never expires.
                </p>
              </div>

              {/* Form ID (Optional) */}
              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                  Filter by Specific Form ID <span className="text-slate-450 font-medium normal-case">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  placeholder="e.g. 9876543210987 (Leave blank to sync ALL forms on this Page)"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Leave this blank if you want all lead ads forms associated with this page to sync to your CRM.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black rounded-xl cursor-pointer disabled:opacity-60 transition"
                >
                  {saveLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Save Configuration
                </button>

                {hasExistingConfig && (
                  <button
                    type="button"
                    onClick={handleDeleteSettings}
                    disabled={deleteLoading}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-[11px] font-black rounded-xl cursor-pointer disabled:opacity-60 transition"
                  >
                    {deleteLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Disconnect Integration
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Webhook Setup Guide */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 text-slate-300 relative overflow-hidden">
            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 to-indigo-500"></div>

            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4.5 w-4.5 text-blue-400" />
              <h2 className="text-xs font-black uppercase text-white tracking-wider">Webhook Configuration</h2>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-400 mb-5">
              Copy these values and paste them into your **Meta Developer Portal &gt; Webhooks** setup screen under the <strong>Leadgen</strong> topic.
            </p>

            {/* URL Display */}
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-wider">Callback URL</label>
                <div className="flex">
                  <input
                    type="text"
                    value={webhookUrl || 'Loading endpoint URL...'}
                    readOnly
                    className="w-full bg-slate-950 border border-slate-800 rounded-l-xl px-3 py-2 text-[10px] font-mono text-slate-300 focus:outline-none"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-r-xl border-y border-r border-slate-800 cursor-pointer transition flex items-center justify-center shrink-0"
                    title="Copy URL"
                  >
                    {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Verify Token Display */}
              <div>
                <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-wider">Verify Token</label>
                <div className="flex">
                  <input
                    type="text"
                    value={verifyToken}
                    readOnly
                    className="w-full bg-slate-950 border border-slate-800 rounded-l-xl px-3 py-2 text-[10px] font-mono text-slate-300 focus:outline-none"
                  />
                  <button
                    onClick={handleCopyToken}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-r-xl border-y border-r border-slate-800 cursor-pointer transition flex items-center justify-center shrink-0"
                    title="Copy Verify Token"
                  >
                    {copiedToken ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-4 space-y-3.5">
              <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-blue-400" /> Setup Checklist
              </h3>
              
              <ul className="text-[10px] space-y-2 text-slate-400 list-decimal pl-4 leading-relaxed font-semibold">
                <li>Create a **Meta Developer App** (type Business).</li>
                <li>Add the **Webhooks** product to your Meta app.</li>
                <li>Select **Page** object webhooks, subscribe to **leadgen** field.</li>
                <li>Enter the Callback URL and Verify Token above.</li>
                <li>Use Meta's **Lead Ads Testing Tool** to send a mock form submission and verify instantly!</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
