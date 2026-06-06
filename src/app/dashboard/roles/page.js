'use client';

import { useState, useEffect } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Eye, 
  Edit3, 
  Trash2, 
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Save
} from 'lucide-react';

export default function RolesPermissionsPage() {
  const [selectedRole, setSelectedRole] = useState('sales_rep');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const rolesList = [
    { id: 'owner', name: 'Owner / System Admin', desc: 'Full commercial administrative privileges. Owns global configurations controls, company billing accounts, and rep profiles.', color: 'border-indigo-500 bg-indigo-50 text-indigo-800' },
    { id: 'sales_admin', name: 'Sales Manager', desc: 'Regional/department manager. Allocates incoming pipelines, reviews team scorecards metrics, and approves estimations.', color: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
    { id: 'sales_rep', name: 'Sales Representative', desc: 'Ground outreach agent. Interacts with personal assigned leads, creates product quotations, logs calls, and tracks tasks.', color: 'border-blue-500 bg-blue-50 text-blue-800' }
  ];

  const defaultMatrix = {
    owner: [
      { module: 'Leads Directory', read: 'Global', write: 'Yes', delete: 'Yes' },
      { module: 'Deals Pipeline', read: 'Global', write: 'Yes', delete: 'Yes' },
      { module: 'Products Catalog', read: 'Global', write: 'Yes', delete: 'Yes' },
      { module: 'Quotations Builder', read: 'Global', write: 'Yes', delete: 'Yes' },
      { module: 'Tax Invoices Hub', read: 'Global', write: 'Yes', delete: 'Yes' },
      { module: 'Reports & BI Analytics', read: 'Global', write: 'Yes', delete: 'Yes' },
      { module: 'Users & Team Directory', read: 'Global', write: 'Yes', delete: 'Yes' },
      { module: 'System Configurations', read: 'Global', write: 'Yes', delete: 'Yes' }
    ],
    sales_admin: [
      { module: 'Leads Directory', read: 'Global', write: 'Yes', delete: 'No' },
      { module: 'Deals Pipeline', read: 'Global', write: 'Yes', delete: 'No' },
      { module: 'Products Catalog', read: 'Global', write: 'Yes', delete: 'No' },
      { module: 'Quotations Builder', read: 'Global', write: 'Yes', delete: 'Yes' },
      { module: 'Tax Invoices Hub', read: 'Global', write: 'Yes (Log Payments Only)', delete: 'No' },
      { module: 'Reports & BI Analytics', read: 'Global', write: 'Yes', delete: 'No' },
      { module: 'Users & Team Directory', read: 'Team List only', write: 'No', delete: 'No' },
      { module: 'System Configurations', read: 'No', write: 'No', delete: 'No' }
    ],
    sales_rep: [
      { module: 'Leads Directory', read: 'Assigned Only', write: 'Yes', delete: 'No' },
      { module: 'Deals Pipeline', read: 'Assigned Only', write: 'Yes', delete: 'No' },
      { module: 'Products Catalog', read: 'Global', write: 'No', delete: 'No' },
      { module: 'Quotations Builder', read: 'Assigned Only', write: 'Yes', delete: 'No' },
      { module: 'Tax Invoices Hub', read: 'Assigned Only', write: 'No', delete: 'No' },
      { module: 'Reports & BI Analytics', read: 'Personal Only', write: 'No', delete: 'No' },
      { module: 'Users & Team Directory', read: 'No', write: 'No', delete: 'No' },
      { module: 'System Configurations', read: 'No', write: 'No', delete: 'No' }
    ]
  };

  const [permissionsMatrix, setPermissionsMatrix] = useState(defaultMatrix);

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        }

        const permRes = await fetch('/api/tenant/roles-permissions');
        if (permRes.ok) {
          const permData = await permRes.json();
          if (permData.rolesPermissions && Object.keys(permData.rolesPermissions).length > 0) {
            const merged = { ...defaultMatrix };
            Object.keys(permData.rolesPermissions).forEach(role => {
              if (Array.isArray(permData.rolesPermissions[role])) {
                merged[role] = defaultMatrix[role].map(defPerm => {
                  const savedPerm = permData.rolesPermissions[role].find(p => p.module === defPerm.module);
                  return savedPerm ? savedPerm : defPerm;
                });
              }
            });
            setPermissionsMatrix(merged);
          }
        }
      } catch (err) {
        console.error('Failed to load permissions configuration:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleReadScopeChange = (moduleName, value) => {
    setPermissionsMatrix(prev => {
      const updated = prev[selectedRole].map(p => {
        if (p.module === moduleName) {
          return { ...p, read: value };
        }
        return p;
      });
      return { ...prev, [selectedRole]: updated };
    });
  };

  const handleWriteAccessChange = (moduleName, checked) => {
    setPermissionsMatrix(prev => {
      const updated = prev[selectedRole].map(p => {
        if (p.module === moduleName) {
          return { ...p, write: checked ? 'Yes' : 'No' };
        }
        return p;
      });
      return { ...prev, [selectedRole]: updated };
    });
  };

  const handleDeleteAccessChange = (moduleName, checked) => {
    setPermissionsMatrix(prev => {
      const updated = prev[selectedRole].map(p => {
        if (p.module === moduleName) {
          return { ...p, delete: checked ? 'Yes' : 'No' };
        }
        return p;
      });
      return { ...prev, [selectedRole]: updated };
    });
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await fetch('/api/tenant/roles-permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rolesPermissions: permissionsMatrix })
      });
      if (res.ok) {
        setSuccessMsg('Permissions updated successfully!');
        setTimeout(() => setSuccessMsg(''), 3500);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to save roles permissions.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving permissions.');
    } finally {
      setSaving(false);
    }
  };

  const getRoleDisplayName = (id) => {
    return rolesList.find(r => r.id === id)?.name || id;
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm font-semibold text-slate-500">Loading security gates configuration...</p>
        </div>
      </div>
    );
  }

  const isEditable = user?.role === 'owner';

  return (
    <div className="space-y-6 h-full relative">

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Lock className="h-7 w-7 text-emerald-500" />
            Roles & Permissions Gates
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Inspect and configure access levels, security matrices, and modular gate parameters across CRM operational roles.
          </p>
        </div>
        {isEditable && (
          <button
            onClick={handleSaveChanges}
            disabled={saving}
            className="self-start md:self-auto flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white text-xs font-black rounded-xl shadow-lg transition cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* --- MAIN LAYOUT GAP --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* --- LEFT PANEL: ROLE SELECTOR --- */}
        <div className="space-y-4 lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Operational Security Roles
            </h3>

            <div className="space-y-3">
              {rolesList.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col gap-1 hover:shadow-md ${
                    selectedRole === role.id 
                      ? `${role.color} border-current ring-1 ring-offset-1 ring-emerald-500/20` 
                      : 'border-slate-150 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-black uppercase tracking-wider">{role.name}</span>
                  <span className="text-[10px] text-slate-500 leading-relaxed font-semibold mt-1">{role.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Secure Banner Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4.5 flex gap-3 text-slate-800 shadow-sm animate-in fade-in duration-300">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-amber-850 uppercase tracking-wide">Strict Server-Side ACL Enforcement</h4>
              <p className="text-[10px] text-slate-550 leading-relaxed font-semibold">
                Authorization roles are strictly verified on the Next.js edge and server API endpoints. Local modifications to visual DOM states will not bypass backend access gates.
              </p>
            </div>
          </div>
        </div>

        {/* --- RIGHT PANEL: PERMISSIONS MATRIX --- */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-3 gap-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="h-4.5 w-4.5 text-emerald-500" />
                Access Matrix: <span className="text-indigo-650 font-black">{getRoleDisplayName(selectedRole)}</span>
              </h3>
              
              <div className="flex items-center gap-3">
                {successMsg && (
                  <span className="text-xs font-bold text-emerald-600 animate-pulse">
                    {successMsg}
                  </span>
                )}
                <span className="text-[9px] font-bold text-slate-400 font-mono">
                  {isEditable ? 'Interactive Editing Active' : 'Read-Only Gate Matrix'}
                </span>
              </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider font-mono">
                    <th className="py-3 px-4.5">Target Module</th>
                    <th className="py-3 px-4.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        Read Scope
                      </div>
                    </th>
                    <th className="py-3 px-4.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                        Write Access
                      </div>
                    </th>
                    <th className="py-3 px-4.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                        Delete Access
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-655 bg-white">
                  {(permissionsMatrix[selectedRole] || []).map((perm, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition duration-150">
                      <td className="py-3 px-4.5 font-bold text-slate-800">{perm.module}</td>
                      
                      {/* Read Scope */}
                      <td className="py-3 px-4.5 text-center">
                        {isEditable ? (
                          <select
                            value={perm.read}
                            onChange={(e) => handleReadScopeChange(perm.module, e.target.value)}
                            className="px-2 py-1 text-xs border border-slate-250 rounded-lg bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          >
                            <option value="Global">Global</option>
                            <option value="Assigned Only">Assigned Only</option>
                            <option value="Personal Only">Personal Only</option>
                            <option value="Team List only">Team List only</option>
                            <option value="No">No</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-2.5 py-1 text-[9px] font-black uppercase rounded-full ${
                            perm.read === 'Global' ? 'bg-indigo-50 text-indigo-700 border border-indigo-150' :
                            perm.read === 'Assigned Only' ? 'bg-blue-50 text-blue-700 border border-blue-150' :
                            perm.read === 'Personal Only' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' :
                            'bg-rose-50 text-rose-700 border border-rose-150'
                          }`}>
                            {perm.read}
                          </span>
                        )}
                      </td>

                      {/* Write Scope */}
                      <td className="py-3 px-4.5 text-center font-bold">
                        {isEditable ? (
                          <input
                            type="checkbox"
                            checked={perm.write.startsWith('Yes')}
                            onChange={(e) => handleWriteAccessChange(perm.module, e.target.checked)}
                            className="h-4.5 w-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        ) : (
                          perm.write.startsWith('Yes') ? (
                            <div className="flex items-center justify-center gap-1 text-emerald-600">
                              <CheckCircle2 className="h-4 w-4 shrink-0" />
                              <span className="text-[10px]">{perm.write}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1 text-slate-400">
                              <XCircle className="h-4 w-4 shrink-0" />
                              <span className="text-[10px]">{perm.write}</span>
                            </div>
                          )
                        )}
                      </td>

                      {/* Delete Scope */}
                      <td className="py-3 px-4.5 text-center font-bold">
                        {isEditable ? (
                          <input
                            type="checkbox"
                            checked={perm.delete === 'Yes'}
                            onChange={(e) => handleDeleteAccessChange(perm.module, e.target.checked)}
                            className="h-4.5 w-4.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                          />
                        ) : (
                          perm.delete === 'Yes' ? (
                            <div className="flex items-center justify-center gap-1 text-rose-600">
                              <CheckCircle2 className="h-4 w-4 shrink-0" />
                              <span className="text-[10px]">Yes</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1 text-slate-400">
                              <XCircle className="h-4 w-4 shrink-0" />
                              <span className="text-[10px]">Restricted</span>
                            </div>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Summary Tip */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs font-semibold leading-relaxed text-slate-500 flex gap-2.5 items-start">
              <HelpCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>Roles configuration guidelines:</strong> Custom settings are applied in real-time on all API endpoints. Toggling read/write scopes restricts or opens data queries dynamically for the selected CRM role across the team workspace.
              </span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
