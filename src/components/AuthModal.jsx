import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertTriangle, UserCheck, KeyRound, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function AuthModal() {
  const { currentUser, login } = useApp();
  const [email, setEmail] = useState('commercial.bd@savita.com');
  const [password, setPassword] = useState('QuantiCool2026!');
  const [error, setError] = useState('');

  if (currentUser) return null;

  const predefinedUsers = [
    {
      name: 'Savita Commercial BD Team',
      email: 'commercial.bd@savita.com',
      role: 'Commercial BD & Key Accounts',
      department: 'Specialty Fluids & BESS Thermal Management'
    },
    {
      name: 'Technical Product & Approvals',
      email: 'tech.approvals@savita.com',
      role: 'OEM Qualification & R&D Lab',
      department: 'Specialty Fluids Division'
    },
    {
      name: 'Executive Leadership',
      email: 'management@savita.com',
      role: 'Executive Management Access',
      department: 'Corporate Office'
    }
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your authorized credentials.');
      return;
    }
    const matched = predefinedUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    const userToLogin = matched || {
      name: email.split('@')[0].replace('.', ' ').toUpperCase(),
      email,
      role: 'Authorized Savita BD Representative',
      department: 'Commercial Sales'
    };
    login({
      ...userToLogin,
      authenticatedAt: new Date().toISOString()
    });
  };

  const handleSelectPreset = (user) => {
    login({
      ...user,
      authenticatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-white p-6 text-center border-b border-slate-100 flex flex-col items-center justify-center gap-3">
          <div className="flex items-center justify-center gap-3">
            <img src="/savita_logo.png" alt="SAVITA" className="h-11 w-auto object-contain" />
            <div className="h-8 w-[1px] bg-slate-300"></div>
            <img src="/quanticool_logo.png" alt="QuantiCool" className="h-7 w-auto object-contain" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-[#007A3D]" />
            Restricted Authenticated BD Access Required
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 leading-relaxed">
              <strong className="font-semibold block text-amber-900">Confidential Business Data Protection</strong>
              This database contains personal contact names, mobile numbers, direct emails, and proprietary coolant technical evaluations from Battery Show India & REI 2026. Access is restricted to authorized Savita team members.
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Authorized Corporate Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@savita.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#007A3D] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Access Passcode
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#007A3D] focus:border-transparent"
                required
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 font-medium">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-[#007A3D] hover:bg-[#005f2f] text-white font-semibold text-sm shadow-md shadow-emerald-900/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              Authenticate & Open Portal
            </button>
          </form>

          {/* Quick Demo Access Roles */}
          <div className="pt-2 border-t border-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
              Quick Role Authentication (Select Profile):
            </p>
            <div className="space-y-2">
              {predefinedUsers.map((u) => (
                <button
                  key={u.email}
                  onClick={() => handleSelectPreset(u)}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-[#007A3D] hover:bg-emerald-50/50 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#007A3D] flex items-center justify-center font-bold text-xs group-hover:bg-[#007A3D] group-hover:text-white transition-colors">
                      {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{u.name}</div>
                      <div className="text-[11px] text-slate-500">{u.role}</div>
                    </div>
                  </div>
                  <UserCheck className="w-4 h-4 text-slate-400 group-hover:text-[#007A3D]" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Savita Oil Technologies Ltd. © 2026</span>
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <Building2 className="w-3.5 h-3.5" /> ISO 9001 / IATF 16949 Certified
          </span>
        </div>
      </div>
    </div>
  );
}
