'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, ArrowLeft, Zap, Plus, Trash2, Edit2, Check, X,
  ChevronDown, Settings2, Lightbulb, CheckCircle, RefreshCw, Globe,
  User, Building, Phone, Mail, Calendar, DollarSign, Briefcase, Info, Hash, MessageCircle, Tag
} from 'lucide-react';

const FIELD_TYPES = [
  { value: 'text',     label: 'Short Text',    emoji: '📝' },
  { value: 'textarea', label: 'Long Text',      emoji: '📄' },
  { value: 'number',   label: 'Number',         emoji: '🔢' },
  { value: 'date',     label: 'Date',           emoji: '📅' },
  { value: 'dropdown', label: 'Dropdown',       emoji: '📋' },
  { value: 'boolean',  label: 'Yes / No',       emoji: '✅' },
];

const MODULES = [
  { key: 'leads',    label: 'Leads' },
  { key: 'contacts', label: 'Contacts Index' },
  { key: 'deals',    label: 'Deals Pipeline' },
];

const FIELD_ICONS = [
  { value: 'tag', label: 'Tag (Default)', icon: Tag },
  { value: 'user', label: 'User Profile', icon: User },
  { value: 'building', label: 'Company/Building', icon: Building },
  { value: 'phone', label: 'Phone/Call', icon: Phone },
  { value: 'mail', label: 'Email', icon: Mail },
  { value: 'globe', label: 'Website/Globe', icon: Globe },
  { value: 'calendar', label: 'Date/Calendar', icon: Calendar },
  { value: 'dollarsign', label: 'Money/Dollar', icon: DollarSign },
  { value: 'briefcase', label: 'Job/Briefcase', icon: Briefcase },
  { value: 'info', label: 'Info/Detail', icon: Info },
  { value: 'hash', label: 'Hash/Number', icon: Hash },
  { value: 'messagecircle', label: 'Chat/WhatsApp', icon: MessageCircle }
];

const STANDARD_FIELDS_BY_MODULE = {
  leads: [
    { key: 'source',            label: 'Lead Source',      desc: 'Origin of lead (e.g. Website, Cold Call, Referral)', category: 'Marketing' },
    { key: 'annualRevenue',     label: 'Annual Revenue',   desc: 'Estimated yearly income of company/client', category: 'Financials' },
    { key: 'website',           label: 'Company Website',  desc: 'Official website url of company/client', category: 'Contact Info' },
    { key: 'whatsapp',          label: 'WhatsApp Outreach', desc: 'Active WhatsApp number for single-click chat logs', category: 'Contact Info' },
    { key: 'employeeCount',     label: 'Employee Count',   desc: 'Total manpower size of corporate prospect', category: 'Company Profile' },
    { key: 'designation',       label: 'Job Designation',  desc: 'Specific role of lead contact (e.g. Director, Manager)', category: 'Profile' },
    { key: 'industry',          label: 'Industry Sector',  desc: 'Vertical sector (e.g. Automotive, Real Estate)', category: 'Company Profile' },
  ],
  contacts: [
    { key: 'designation',       label: 'Job Designation',  desc: 'Specific role of contact (e.g. Director, Manager)', category: 'Profile' },
    { key: 'whatsapp',          label: 'WhatsApp Outreach', desc: 'Active WhatsApp number for single-click chat logs', category: 'Contact Info' },
    { key: 'city',              label: 'City Location',    desc: 'Metropolitan city location of the contact', category: 'Location' },
    { key: 'state',             label: 'State/Province',   desc: 'State/Region classification of the contact', category: 'Location' },
    { key: 'country',           label: 'Country Region',   desc: 'Sovereign nation location of the contact', category: 'Location' },
  ],
  deals: [
    { key: 'closingDate',       label: 'Estimated Closing Date', desc: 'Expected closure date of this sales deal card', category: 'Timeline' },
    { key: 'contactEmail',      label: 'Contact Email',     desc: 'Associated email ID of contact for instant updates', category: 'Contact Info' },
    { key: 'contactPhone',      label: 'Contact Phone',     desc: 'Associated phone number of contact for instant calls', category: 'Contact Info' },
  ]
};


export default function CustomFieldsPage() {
  const router = useRouter();

  // Auth & loading
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Tab switching
  const [activeTab, setActiveTab] = useState('custom'); // 'custom' | 'standard'

  // Module switcher
  const [activeModule, setActiveModule] = useState('leads');

  // Existing defined fields
  const [fields, setFields] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);

  // Sector suggestions
  const [sector, setSector]             = useState('');
  const [allSectors, setAllSectors]     = useState([]);
  const [suggestions, setSuggestions]   = useState([]);
  const [addedKeys, setAddedKeys]       = useState([]);
  const [sectorEdit, setSectorEdit]     = useState(false);
  const [sectorInput, setSectorInput]   = useState('');
  const [sectorSaving, setSectorSaving] = useState(false);

  // Add custom field form
  const [showAddForm, setShowAddForm]   = useState(false);
  const [newLabel, setNewLabel]         = useState('');
  const [newKey, setNewKey]             = useState('');
  const [newType, setNewType]           = useState('text');
  const [newOptions, setNewOptions]     = useState('');
  const [newRequired, setNewRequired]   = useState(false);
  const [newPlaceholder, setNewPlaceholder] = useState('');
  const [newIconName, setNewIconName]   = useState('tag');
  const [addLoading, setAddLoading]     = useState(false);
  const [addError, setAddError]         = useState('');

  // Edit field inline
  const [editingId, setEditingId]       = useState(null);
  const [editLabel, setEditLabel]       = useState('');
  const [editOptions, setEditOptions]   = useState('');
  const [editRequired, setEditRequired] = useState(false);
  const [editPlaceholder, setEditPlaceholder] = useState('');
  const [editIconName, setEditIconName]   = useState('tag');
  const [editLoading, setEditLoading]   = useState(false);

  // Quick-add suggestion loading
  const [suggLoading, setSuggLoading]   = useState(null);

  // Standard fields visibility states
  const [hiddenFields, setHiddenFields] = useState([]);

  // Toast
  const [toast, setToast] = useState('');
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  // ── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function bootstrap() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) { router.push('/login'); return; }
        const { user: u } = await res.json();
        if (!u || u.isSuperAdmin) { router.push('/dashboard'); return; }
        if (u.role !== 'owner') { router.push('/dashboard'); return; }
        setUser(u);
      } catch { router.push('/login'); }
      finally { setLoading(false); }
    }
    bootstrap();
  }, [router]);

  // ── Fetch fields + suggestions whenever module changes ───────────────────
  const fetchAll = useCallback(async (mod) => {
    setFieldsLoading(true);
    try {
      const [fieldsRes, suggRes, stdRes] = await Promise.all([
        fetch(`/api/tenant/custom-fields?module=${mod}`),
        fetch(`/api/tenant/sector-suggestions?module=${mod}`),
        fetch(`/api/tenant/standard-fields`),
      ]);
      if (fieldsRes.ok) {
        const d = await fieldsRes.json();
        setFields(d.fields || []);
      }
      if (suggRes.ok) {
        const d = await suggRes.json();
        setSector(d.sector || '');
        setSectorInput(d.sector || '');
        setAllSectors(d.allSectors || []);
        setSuggestions(d.suggestions || []);
        setAddedKeys(d.addedKeys || []);
      }
      if (stdRes.ok) {
        const d = await stdRes.json();
        setHiddenFields(d.hiddenFields || []);
      }
    } catch (err) { console.error('fetchAll error:', err); }
    finally { setFieldsLoading(false); }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) fetchAll(activeModule);
  }, [user, activeModule, fetchAll]);

  // ── Toggle Standard Field Visibility ─────────────────────────────────────
  const handleToggleStandardField = async (fieldKey) => {
    const fullKey = `${activeModule}:${fieldKey}`;
    const isCurrentlyHidden = hiddenFields.includes(fullKey) || (activeModule === 'leads' && hiddenFields.includes(fieldKey));
    
    let updatedHidden;
    if (isCurrentlyHidden) {
      updatedHidden = hiddenFields.filter((k) => k !== fullKey && k !== fieldKey);
    } else {
      updatedHidden = [...hiddenFields, fullKey];
    }

    // Optimistic Update
    setHiddenFields(updatedHidden);

    try {
      const res = await fetch('/api/tenant/standard-fields', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hiddenFields: updatedHidden }),
      });
      if (!res.ok) {
        setHiddenFields(hiddenFields); // Rollback
        showToast('⚠️ Failed to save standard field preference.');
      } else {
        showToast('✅ Standard field visibility updated!');
      }
    } catch (err) {
      setHiddenFields(hiddenFields); // Rollback
      showToast('⚠️ Network error saving preference.');
    }
  };

  // ── Save sector ──────────────────────────────────────────────────────────
  const handleSaveSector = async () => {
    if (!sectorInput.trim()) return;
    setSectorSaving(true);
    try {
      const res = await fetch('/api/tenant/sector-suggestions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector: sectorInput.trim() }),
      });
      const d = await res.json();
      if (res.ok) {
        setSector(d.sector);
        setSuggestions(d.suggestions);
        setSectorEdit(false);
        showToast('✅ Industry sector updated! New suggestions are ready.');
      } else {
        showToast(`⚠️ ${d.error}`);
      }
    } finally { setSectorSaving(false); }
  };

  // ── Quick-add suggestion ─────────────────────────────────────────────────
  const handleQuickAdd = async (suggestion) => {
    setSuggLoading(suggestion.field_key);
    try {
      const res = await fetch('/api/tenant/custom-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: activeModule,
          field_key: suggestion.field_key,
          field_label: suggestion.field_label,
          field_type: suggestion.field_type,
          options: suggestion.options,
          is_required: false,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setFields((prev) => [...prev, d.field]);
        setAddedKeys((prev) => [...prev, suggestion.field_key]);
        showToast(`✅ "${suggestion.field_label}" added to ${activeModule} form!`);
      } else {
        showToast(`⚠️ ${d.error}`);
      }
    } finally { setSuggLoading(null); }
  };

  // ── Add custom field ─────────────────────────────────────────────────────
  const handleAddField = async (e) => {
    e.preventDefault();
    setAddError('');
    if (!newLabel.trim()) { setAddError('Field label is required.'); return; }
    
    let key = newKey.trim() || newLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (!key.startsWith('cf_')) {
      key = 'cf_' + key;
    }

    setAddLoading(true);
    try {
      const optionsArr = newType === 'dropdown'
        ? newOptions.split(',').map((o) => o.trim()).filter(Boolean)
        : [];
      const res = await fetch('/api/tenant/custom-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: activeModule,
          field_key: key,
          field_label: newLabel.trim(),
          field_type: newType,
          options: optionsArr,
          is_required: newRequired,
          placeholder: newPlaceholder.trim(),
          icon_name: newIconName,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setFields((prev) => [...prev, d.field]);
        setAddedKeys((prev) => [...prev, key]);
        setShowAddForm(false);
        setNewLabel(''); setNewKey(''); setNewType('text');
        setNewOptions(''); setNewRequired(false);
        setNewPlaceholder('');
        setNewIconName('tag');
        showToast(`✅ Custom field "${d.field.field_label}" added!`);
      } else {
        setAddError(d.error || 'Failed to add field.');
      }
    } finally { setAddLoading(false); }
  };

  // ── Edit field ───────────────────────────────────────────────────────────
  const openEdit = (field) => {
    setEditingId(field.id);
    setEditLabel(field.field_label);
    setEditOptions((field.options || []).join(', '));
    setEditRequired(field.is_required);
    setEditPlaceholder(field.placeholder || '');
    setEditIconName(field.icon_name || 'tag');
  };

  const handleSaveEdit = async (id) => {
    setEditLoading(true);
    try {
      const optionsArr = editOptions
        ? editOptions.split(',').map((o) => o.trim()).filter(Boolean)
        : undefined;
      const res = await fetch('/api/tenant/custom-fields', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, field_label: editLabel, options: optionsArr, is_required: editRequired, placeholder: editPlaceholder.trim(), icon_name: editIconName }),
      });
      const d = await res.json();
      if (res.ok) {
        setFields((prev) => prev.map((f) => f.id === id ? d.field : f));
        setEditingId(null);
        showToast('✅ Field updated!');
      } else {
        showToast(`⚠️ ${d.error}`);
      }
    } finally { setEditLoading(false); }
  };

  // ── Delete field ─────────────────────────────────────────────────────────
  const handleDelete = async (id, label) => {
    if (!confirm(`Delete custom field "${label}"? Existing lead data with this field will be preserved but won't be shown.`)) return;
    try {
      const res = await fetch(`/api/tenant/custom-fields?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFields((prev) => prev.filter((f) => f.id !== id));
        const deletedField = fields.find((f) => f.id === id);
        if (deletedField) setAddedKeys((prev) => prev.filter((k) => k !== deletedField.field_key));
        showToast('🗑️ Field deleted.');
      }
    } catch (err) { console.error(err); }
  };

  // Auto-generate field key from label
  const handleLabelChange = (val) => {
    setNewLabel(val);
    const sanitized = val.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    setNewKey(sanitized ? 'cf_' + sanitized : '');
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  );

  const unaddedSuggestions = suggestions.filter((s) => !addedKeys.includes(s.field_key));

  return (
    <div className="font-sans max-w-4xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-5 py-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl text-white flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-700 transition mb-4 cursor-pointer">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div className="flex items-center gap-2.5 mb-1.5">
          <Settings2 className="h-5 w-5 text-indigo-500" />
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Custom Fields Manager</h1>
        </div>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-lg">
          Define extra fields for your CRM forms. Choose from industry suggestions or add your own.
          These appear in the Lead / Contact / Deal forms for all your team members.
        </p>
      </div>

      {/* Industry Sector Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4.5 w-4.5 text-indigo-500" />
            <div>
              <p className="text-xs font-black text-slate-800">Your Industry Sector</p>
              <p className="text-[10px] text-slate-400 font-medium">Used to show relevant field suggestions below</p>
            </div>
          </div>

          {sectorEdit ? (
            <div className="flex items-center gap-2">
              <select
                value={sectorInput}
                onChange={(e) => setSectorInput(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">-- Select your sector --</option>
                {allSectors.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button onClick={handleSaveSector} disabled={sectorSaving} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-black rounded-lg cursor-pointer disabled:opacity-60">
                {sectorSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Save
              </button>
              <button onClick={() => setSectorEdit(false)} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {sector ? (
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-black rounded-full">{sector}</span>
              ) : (
                <span className="text-xs text-slate-400 italic">Not set</span>
              )}
              <button onClick={() => setSectorEdit(true)} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-400 rounded-lg cursor-pointer transition">
                <Edit2 className="h-3 w-3" />
                {sector ? 'Change' : 'Set Sector'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Module Switcher */}
      <div className="flex gap-2 mb-6">
        {MODULES.map((m) => (
          <button
            key={m.key}
            onClick={() => setActiveModule(m.key)}
            className={`px-4 py-2 rounded-xl text-[11px] font-black border transition cursor-pointer ${
              activeModule === m.key
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Tabs Switcher: Custom Fields vs Standard Fields Layout */}
      <div className="flex border-b border-slate-200 mb-6 gap-6">
        <button
          onClick={() => setActiveTab('custom')}
          className={`pb-3 text-xs font-black transition relative cursor-pointer ${
            activeTab === 'custom' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Custom Fields
        </button>
        <button
          onClick={() => setActiveTab('standard')}
          className={`pb-3 text-xs font-black transition relative cursor-pointer ${
            activeTab === 'standard' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Standard Fields Layout
        </button>
      </div>

      {fieldsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'custom' ? (
            <>

          {/* ── SECTOR SUGGESTIONS ─────────────────────────────────────── */}
          {unaddedSuggestions.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-4.5 w-4.5 text-amber-500" />
                <div>
                  <p className="text-xs font-black text-amber-900">
                    Suggested Fields for <span className="text-amber-600">{sector}</span>
                  </p>
                  <p className="text-[10px] text-amber-700 font-medium">Click any field to instantly add it to your {activeModule} form</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {unaddedSuggestions.map((s) => {
                  const isLoading = suggLoading === s.field_key;
                  return (
                    <button
                      key={s.field_key}
                      onClick={() => handleQuickAdd(s)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 hover:border-amber-500 hover:bg-amber-100 rounded-xl text-[11px] font-bold text-amber-800 transition cursor-pointer disabled:opacity-60"
                    >
                      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                      {s.field_label}
                      <span className="text-[9px] text-amber-500 font-mono uppercase">{s.field_type}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── DEFINED FIELDS TABLE ───────────────────────────────────── */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <p className="text-xs font-black text-slate-800">
                  Active Custom Fields — {MODULES.find(m => m.key === activeModule)?.label}
                  <span className="ml-2 text-[10px] text-slate-400 font-medium">({fields.length} defined)</span>
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">These appear in the form below the standard fields</p>
              </div>
              <button
                onClick={() => { setShowAddForm(true); setAddError(''); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-black rounded-xl cursor-pointer transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Custom Field
              </button>
            </div>

            {/* Add form */}
            {showAddForm && (
              <form onSubmit={handleAddField} className="p-5 bg-indigo-50 border-b border-indigo-100 space-y-4">
                <p className="text-[11px] font-black text-indigo-800 uppercase tracking-wider">New Custom Field</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 mb-1 uppercase tracking-wider">Field Label *</label>
                    <input
                      value={newLabel}
                      onChange={(e) => handleLabelChange(e.target.value)}
                      placeholder="e.g. Vehicle Type"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 mb-1 uppercase tracking-wider">Field Key (auto)</label>
                    <input
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))}
                      placeholder="vehicle_type"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 mb-1 uppercase tracking-wider">Field Type *</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 mb-1 uppercase tracking-wider">Placeholder Text</label>
                    <input
                      value={newPlaceholder}
                      onChange={(e) => setNewPlaceholder(e.target.value)}
                      placeholder="e.g. Enter vehicle model..."
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 mb-1 uppercase tracking-wider">Field Icon</label>
                    <select
                      value={newIconName}
                      onChange={(e) => setNewIconName(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      {FIELD_ICONS.map((i) => (
                        <option key={i.value} value={i.value}>{i.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRequired}
                      onChange={(e) => setNewRequired(e.target.checked)}
                      className="w-3.5 h-3.5 accent-indigo-500"
                    />
                    <span className="text-[11px] font-bold text-slate-600">Required field</span>
                  </label>
                </div>

                {newType === 'dropdown' && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 mb-1 uppercase tracking-wider">
                      Dropdown Options <span className="text-slate-400 normal-case font-medium">(comma separated)</span>
                    </label>
                    <input
                      value={newOptions}
                      onChange={(e) => setNewOptions(e.target.value)}
                      placeholder="SUV, Sedan, Hatchback, Electric"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                )}

                {addError && <p className="text-[11px] text-rose-600 font-bold">{addError}</p>}

                <div className="flex items-center gap-2 pt-1">
                  <button type="submit" disabled={addLoading} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-black rounded-xl cursor-pointer disabled:opacity-60 transition">
                    {addLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Add Field
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-[11px] font-bold rounded-xl cursor-pointer hover:border-slate-400 transition">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Fields list */}
            {fields.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs font-semibold italic">
                No custom fields defined yet. Add suggestions above or click &quot;Add Custom Field&quot;.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {fields.map((field) => {
                  const typeInfo = FIELD_TYPES.find((t) => t.value === field.field_type);
                  const isEditing = editingId === field.id;

                  return (
                    <div key={field.id} className="px-5 py-4 hover:bg-slate-50 transition">
                      {isEditing ? (
                        // ── Inline edit mode ───────────────────────────
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[9px] font-black text-slate-500 mb-1 uppercase tracking-wider">Label</label>
                              <input
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-black text-slate-500 mb-1 uppercase tracking-wider">Placeholder</label>
                              <input
                                value={editPlaceholder}
                                onChange={(e) => setEditPlaceholder(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-black text-slate-500 mb-1 uppercase tracking-wider">Field Icon</label>
                              <select
                                value={editIconName}
                                onChange={(e) => setEditIconName(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              >
                                {FIELD_ICONS.map((i) => (
                                  <option key={i.value} value={i.value}>{i.label}</option>
                                ))}
                              </select>
                            </div>
                            {field.field_type === 'dropdown' && (
                              <div className="col-span-2 md:col-span-3">
                                <label className="block text-[9px] font-black text-slate-500 mb-1 uppercase tracking-wider">Options (comma sep.)</label>
                                <input
                                  value={editOptions}
                                  onChange={(e) => setEditOptions(e.target.value)}
                                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                              </div>
                            )}
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editRequired}
                              onChange={(e) => setEditRequired(e.target.checked)}
                              className="w-3.5 h-3.5 accent-indigo-500"
                            />
                            <span className="text-[11px] font-bold text-slate-600">Required field</span>
                          </label>
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveEdit(field.id)} disabled={editLoading} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black rounded-lg cursor-pointer disabled:opacity-60">
                              {editLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
                            </button>
                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg cursor-pointer">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // ── View mode ──────────────────────────────────
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="text-lg shrink-0">{typeInfo?.emoji || '📝'}</div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xs font-extrabold text-slate-800">{field.field_label}</p>
                                {field.is_required && (
                                  <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 text-[8px] font-black rounded uppercase">Required</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{field.field_key}</span>
                                <span className="text-[10px] text-slate-500 font-medium">{typeInfo?.label || field.field_type}</span>
                                {field.field_type === 'dropdown' && field.options?.length > 0 && (
                                  <span className="text-[9px] text-slate-400 italic">
                                    Options: {field.options.join(' · ')}
                                  </span>
                                )}
                                {field.placeholder && (
                                  <span className="text-[9px] text-slate-500 italic bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                                    Placeholder: &quot;{field.placeholder}&quot;
                                  </span>
                                )}
                                {field.icon_name && (
                                  <span className="text-[9px] text-slate-550 italic bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded uppercase font-mono tracking-wider font-semibold">
                                    Icon: {field.icon_name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => openEdit(field)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDelete(field.id, field.field_label)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] text-slate-500 font-medium leading-relaxed">
            💡 <strong className="text-slate-700">How this works:</strong> Custom fields appear at the bottom of your{' '}
            {MODULES.find(m => m.key === activeModule)?.label} create/edit form. All team members will see them.
            Data is saved securely and appears in lead detail views.
          </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <p className="text-xs font-black text-slate-800">
                    Standard Fields Layout Control — {MODULES.find(m => m.key === activeModule)?.label}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    Toggle which standard built-in fields are visible in this module&apos;s forms and detail drawers. Hidden fields will not be shown to team members.
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {(STANDARD_FIELDS_BY_MODULE[activeModule] || []).map((field) => {
                    const isHidden = hiddenFields.includes(`${activeModule}:${field.key}`) || (activeModule === 'leads' && hiddenFields.includes(field.key));
                    return (
                      <div key={field.key} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-slate-800">{field.label}</span>
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 text-[8px] font-black rounded uppercase font-mono">{field.category}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">{field.desc}</p>
                        </div>

                        <div className="shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleStandardField(field.key)}
                            className={`w-10 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${
                              !isHidden ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                          >
                            <div
                              className={`bg-white w-5 h-5 rounded-full shadow transform transition-transform duration-300 ${
                                !isHidden ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-4 text-[11px] text-indigo-700 font-medium leading-relaxed">
                💡 <strong>Dynamic Forms:</strong> Standard fields are enabled by default. Toggling them off will immediately clean up the forms and detail drawers for your entire sales force. No data is deleted from database; fields are only hidden from presentation views.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
