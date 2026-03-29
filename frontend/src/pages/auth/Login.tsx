import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Eye, EyeOff, Sparkles, ShieldCheck, Globe } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const { login, isLoggingIn, loginError } = useAuth();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setFormError('Please fill in all fields');
      return;
    }
    setFormError('');
    login({ email, password });
  };

  const errorMessage =
    formError ||
    (loginError as { response?: { data?: { error?: string } } })?.response?.data?.error ||
    '';

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: '#0C0C10', fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(194,113,58,0.18) 0%, transparent 70%)',
        }}
      />

      {/* Left panel */}
      <div
        className="hidden lg:flex w-[480px] flex-col justify-between p-12 flex-shrink-0 relative border-r"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#C2713A', borderRadius: '4px' }}
          >
            <span style={{ color: '#fff', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '11px' }}>CC</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '15px', letterSpacing: '-0.01em' }}>
            CogniClaim
          </span>
        </div>

        <div className="space-y-10">
          <div>
            <h2 style={{ color: 'rgba(255,255,255,0.95)', fontSize: '32px', fontWeight: 600, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
              Intelligent expense<br />management for<br />modern teams.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '16px', lineHeight: 1.7, maxWidth: '320px' }}>
              From submission to approval — automated, audited, and built for the way your business actually works.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Sparkles, text: 'AI receipt extraction via Claude vision' },
              { icon: ShieldCheck, text: 'Configurable multi-level approval workflows' },
              { icon: Globe, text: 'Multi-currency with live exchange rates' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <Icon style={{ color: '#C2713A', width: '15px', height: '15px', flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>Enterprise-grade security · SOC 2 ready</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-8 h-8 flex items-center justify-center" style={{ backgroundColor: '#C2713A', borderRadius: '4px' }}>
              <span style={{ color: '#fff', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '11px' }}>CC</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>CogniClaim</span>
          </div>

          <div>
            <h1 style={{ color: 'rgba(255,255,255,0.95)', fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em' }}>
              Sign in
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '6px' }}>
              Welcome back to your workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div style={{ backgroundColor: 'rgba(185,28,28,0.15)', border: '1px solid rgba(185,28,28,0.3)', color: '#FCA5A5', fontSize: '13px', padding: '12px 16px', borderRadius: '8px' }}>
                {errorMessage}
              </div>
            )}

            <div className="space-y-1">
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500, display: 'block' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                style={{
                  width: '100%', height: '44px', backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                  padding: '0 14px', fontSize: '14px', color: 'rgba(255,255,255,0.9)',
                  outline: 'none', transition: 'border-color 0.15s',
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(194,113,58,0.6)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
            </div>

            <div className="space-y-1">
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500, display: 'block' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  style={{
                    width: '100%', height: '44px', backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                    padding: '0 44px 0 14px', fontSize: '14px', color: 'rgba(255,255,255,0.9)',
                    outline: 'none', transition: 'border-color 0.15s',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(194,113,58,0.6)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-2 transition-all"
              style={{
                height: '46px', backgroundColor: isLoggingIn ? 'rgba(194,113,58,0.6)' : '#C2713A',
                color: '#fff', border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: 600, cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                letterSpacing: '-0.01em', fontFamily: "'DM Sans', sans-serif",
                marginTop: '8px',
              }}
            >
              {isLoggingIn ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
            New to CogniClaim?{' '}
            <Link to="/signup" style={{ color: '#C2713A', fontWeight: 500, textDecoration: 'none' }}>
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
