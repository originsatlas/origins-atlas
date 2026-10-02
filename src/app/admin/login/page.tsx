'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid email or password');
        setLoading(false);
        return;
      }

      // Successful login
      router.push(nextUrl);
      router.refresh();
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@originsatlas.com');
    setPassword('OriginsAtlas2026!');
    setError(null);
  };

  return (
    <div className="admin-login-wrapper">
      {/* Background Ambience Orbs */}
      <div className="admin-login-orb-1" />
      <div className="admin-login-orb-2" />

      <div className="admin-login-card">
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link href="/" style={{ display: 'inline-block', marginBottom: '16px' }}>
            <Image
              src="/brand/logo-luxury-dark.png"
              alt="Origins Atlas"
              width={200}
              height={100}
              style={{ height: 'auto', maxHeight: '56px', width: 'auto', margin: '0 auto' }}
              priority
            />
          </Link>
          <div className="admin-login-tagline">
            COMMUNITIES <span style={{ color: 'var(--gold-500)', margin: '0 4px' }}>■</span> HOMES{' '}
            <span style={{ color: 'var(--gold-500)', margin: '0 4px' }}>■</span> PROPERTY INTELLIGENCE
          </div>
          <h1 className="admin-login-title">
            Admin Portal
          </h1>
          <p className="admin-login-subtitle">
            Enter administrator credentials to manage canonical properties and price histories.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="admin-login-error" role="alert">
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label className="form-label" htmlFor="admin-email" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-email"
                type="email"
                required
                className="form-input"
                style={{
                  background: 'rgba(7, 29, 58, 0.65)',
                  borderColor: 'rgba(218, 166, 69, 0.25)',
                  color: 'white',
                  paddingLeft: '40px',
                }}
                placeholder="admin@originsatlas.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  opacity: 0.6,
                  fontSize: '15px',
                }}
              >
                ✉️
              </span>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" htmlFor="admin-password" style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 0 }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gold-400)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input"
                style={{
                  background: 'rgba(7, 29, 58, 0.65)',
                  borderColor: 'rgba(218, 166, 69, 0.25)',
                  color: 'white',
                  paddingLeft: '40px',
                }}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  opacity: 0.6,
                  fontSize: '15px',
                }}
              >
                🔒
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-gold btn-lg"
            style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
            id="admin-login-submit"
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="login-spinner" />
                Authenticating...
              </span>
            ) : (
              'Sign In to Admin Portal →'
            )}
          </button>
        </form>

        {/* Demo Credentials Quick-Fill Helper */}
        {/* <div className="admin-demo-helper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🔑 Default Admin Access
              </span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="btn btn-outline btn-xs"
                style={{
                  borderColor: 'var(--gold-500)',
                  color: 'var(--gold-400)',
                  padding: '3px 8px',
                  fontSize: '11px',
                }}
              >
                Fill Credentials
              </button>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              <div><strong>Email:</strong> admin@originsatlas.com</div>
              <div><strong>Password:</strong> OriginsAtlas2026!</div>
            </div>
          </div> */}

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link
            href="/"
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ← Return to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--carbonblu-950)' }}>
        <div style={{ color: 'white' }}>Loading Admin Authentication...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
