'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  Lock, 
  Mail, 
  User, 
  ShieldAlert, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck,
  UserPlus
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  
  // Dynamic Tab State: 'login', 'register', or 'forgot'
  const [activeTab, setActiveTab] = useState('login');
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register Form States
  const [companyName, setCompanyName] = useState('');
  const [name, setName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sector, setSector] = useState('SOFTWARE_SERVICES');
  
  // Forgot Password States
  const [forgotStep, setForgotStep] = useState(1); // 1 = enter email, 2 = enter otp and new password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  // UI States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  // Switch tabs cleanly resetting errors
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
    setRegisteredSuccess(false);
    setCompanyName('');
    setName('');
    setRegisterEmail('');
    setRegisterPassword('');
    setConfirmPassword('');
    setSector('SOFTWARE_SERVICES');
    setForgotStep(1);
    setForgotEmail('');
    setForgotOtp('');
    setForgotPassword('');
    setForgotConfirmPassword('');
  };

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || 'OTP sent successfully!');
        setForgotStep(2);
      } else {
        setError(data.error || 'Failed to send OTP. Please verify your email.');
      }
    } catch (err) {
      console.error('Forgot password submission error:', err);
      setError('Connection failed. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (forgotPassword !== forgotConfirmPassword) {
      return setError('Passwords do not match. Please verify.');
    }

    if (forgotPassword.length < 6) {
      return setError('Security password must be at least 6 characters.');
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          otpCode: forgotOtp,
          newPassword: forgotPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Password reset successfully! Redirecting to Sign In...');
        // Wait 2.5 seconds, then redirect to login tab
        setTimeout(() => {
          setEmail(forgotEmail);
          setPassword('');
          handleTabChange('login');
        }, 2500);
      } else {
        setError(data.error || 'Password reset failed.');
      }
    } catch (err) {
      console.error('Password reset submit error:', err);
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.user && data.user.isSuperAdmin) {
          router.push('/super-admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(data.error || 'Invalid email or password. Please try again.');
      }
    } catch (err) {
      console.error('Login submission error:', err);
      setError('Connection failed. Please check your local server or MongoDB connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!companyName.trim()) {
      return setError('Company Name is required.');
    }

    if (!name.trim()) {
      return setError('Full Name is required.');
    }

    if (registerPassword !== confirmPassword) {
      return setError('Passwords do not match. Please verify.');
    }

    if (registerPassword.length < 6) {
      return setError('Security password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          companyName: companyName.trim(), 
          name: name.trim(), 
          email: registerEmail, 
          password: registerPassword,
          sector: sector
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setRegisteredSuccess(true);
        // Clear fields
        setCompanyName('');
        setName('');
        setRegisterEmail('');
        setRegisterPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Registration request failed.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Connection failed. Please check your database connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedInit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/seed');
      const data = await res.json();
      if (res.ok) {
        setSuccess('Database successfully seeded! Log in using owner@mycompany.com & ownerpassword123.');
        setEmail('owner@mycompany.com');
        setPassword('ownerpassword123');
        setActiveTab('login');
      } else {
        setError(data.error || 'Seed failed.');
      }
    } catch (err) {
      console.error('Seed API error:', err);
      setError('Could not connect to seed API. Make sure your server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 text-slate-800 font-sans relative overflow-hidden">
      {/* Soft visual background gradient glows */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* CRM Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 font-bold text-white text-2xl shadow-lg shadow-emerald-500/20 mb-3 animate-pulse">
            I
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Welcome to Innonsh CRM
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-semibold tracking-wider uppercase">CUSTOM SERVICES & PRODUCTS PORTAL</p>
        </div>

        {/* Master Control Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl shadow-slate-200/60 backdrop-blur-xl relative space-y-6">
          
          {/* DUAL SEGMENTED TAB SWITCHER */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleTabChange('login')}
              className={`flex-grow text-center py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'login'
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200/80 font-bold'
                  : 'text-slate-500 hover:text-slate-700 font-semibold'
              }`}
            >
              <ShieldCheck className={`h-3.5 w-3.5 ${activeTab === 'login' ? 'text-emerald-500' : 'text-slate-400'}`} />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('register')}
              className={`flex-grow text-center py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'register'
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200/80 font-bold'
                  : 'text-slate-500 hover:text-slate-700 font-semibold'
              }`}
            >
              <UserPlus className={`h-3.5 w-3.5 ${activeTab === 'register' ? 'text-emerald-500' : 'text-slate-400'}`} />
              Register
            </button>
          </div>

          {/* Form alert states */}
          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-600 animate-in fade-in slide-in-from-top duration-200">
              <ShieldAlert className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-700 animate-in fade-in slide-in-from-top duration-200">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="font-semibold">{success}</span>
            </div>
          )}

          {/* DYNAMIC CARD VIEW CONTROLLERS */}
          {activeTab === 'login' ? (
            
            // --- TAB 1: SIGN IN VIEW ---
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition text-xs text-slate-850 placeholder-slate-400 font-semibold"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot');
                      setForgotStep(1);
                      setError('');
                      setSuccess('');
                    }}
                    className="text-[10px] font-bold text-emerald-650 hover:text-emerald-500 transition cursor-pointer hover:underline"
                  >
                    FORGOT PASSWORD?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition text-xs text-slate-850 placeholder-slate-400"
                  />
                </div>
              </div>


              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full mt-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold tracking-wide shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/25 active:scale-[0.98] transition disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <>
                    Enter Dashboard
                    <ArrowRight className="h-4 w-4 text-white" />
                  </>
                )}
              </button>
            </form>

          ) : activeTab === 'forgot' ? (
            
            // --- FORGOT PASSWORD VIEW ---
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="mb-2">
                <button
                  type="button"
                  onClick={() => handleTabChange('login')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 transition cursor-pointer"
                >
                  <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                  Back to Sign In
                </button>
              </div>

              {forgotStep === 1 ? (
                // Step 1: Input Email
                <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold text-slate-800 tracking-tight">Forgot Password</h2>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      Enter your registered email address below. We'll send you a 6-digit OTP verification code to securely change your password.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        type="email"
                        required
                        placeholder="name@company.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition text-xs text-slate-850 placeholder-slate-400 font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 w-full mt-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold tracking-wide shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/25 active:scale-[0.98] transition disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <>
                        Send Verification OTP
                        <ArrowRight className="h-4 w-4 text-white" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                // Step 2: Input OTP & New Password
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold text-slate-800 tracking-tight">Verify Security Code</h2>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      We have dispatched a 6-digit OTP code to <span className="font-bold text-slate-700">{forgotEmail}</span>. Please enter it below along with your new password.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Verification Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      pattern="[0-9]{6}"
                      placeholder="Enter 6-digit OTP"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-50/50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-center font-mono text-lg font-bold tracking-[4px] text-slate-800 placeholder-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">New Password</label>
                      <input
                        type="password"
                        required
                        placeholder="Min 6 chars"
                        value={forgotPassword}
                        onChange={(e) => setForgotPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition text-xs text-slate-850 placeholder-slate-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Confirm</label>
                      <input
                        type="password"
                        required
                        placeholder="Repeat password"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition text-xs text-slate-850 placeholder-slate-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 w-full mt-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold tracking-wide shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/25 active:scale-[0.98] transition disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      'Reset Password & Log In'
                    )}
                  </button>
                </form>
              )}
            </div>

          ) : registeredSuccess ? (

            // --- TAB 2 SUCCESS: ACCESS SUBMITTED PANELS ---
            <div className="space-y-5 text-center py-2 animate-in zoom-in-95 duration-200">
              <div className="mx-auto h-11 w-11 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                <CheckCircle2 className="h-5.5 w-5.5 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Company Registered!</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  Your organization registration request is currently **pending approval**.
                </p>
                <div className="text-[9px] text-amber-700 font-bold bg-amber-50 border border-amber-100 p-2.5 rounded leading-relaxed">
                  <span>🔒 Note: You will be able to log in once the Super Admin approves your company registration.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition cursor-pointer"
              >
                Return to Sign In
              </button>
            </div>

          ) : (
            
            // --- TAB 2: REQUEST ACCESS FORM VIEW ---
            <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-in fade-in duration-200" autoComplete="off">
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Company / Organization Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                    <User className="h-4 w-4 text-emerald-500 animate-pulse" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Tata Motors"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    autoComplete="off"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition text-xs text-slate-850 placeholder-slate-400 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">CRM Sector *</label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50/50 border border-slate-200 focus:border-emerald-550 focus:ring-1 focus:ring-emerald-550 focus:outline-none transition text-xs text-slate-850 font-semibold"
                >
                  <option value="SOFTWARE_SERVICES">Software Services</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Owner / Administrator Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Rajesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="off"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition text-xs text-slate-850 placeholder-slate-400 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Owner Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="rajesh@tata.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    autoComplete="new-email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition text-xs text-slate-850 placeholder-slate-400 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 chars"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition text-xs text-slate-850 placeholder-slate-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Confirm</label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition text-xs text-slate-850 placeholder-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full mt-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold tracking-wide shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/25 active:scale-[0.98] transition disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  'Register Company'
                )}
              </button>
            </form>
          )}

        </div>

        {/* First Time Helper Seed Onboarding Box */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400 font-semibold">
            First time running the application?{' '}
            <button
              onClick={handleSeedInit}
              disabled={loading}
              className="text-emerald-600 hover:text-emerald-500 font-bold underline transition cursor-pointer"
            >
              Initialize Database Seeder
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
