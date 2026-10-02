'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/communities', label: 'Communities', icon: '🏘️' },
  { href: '/admin/houses', label: 'Houses', icon: '🏠' },
  { href: '/admin/agents', label: 'Agents', icon: '👤' },
  { href: '/admin/listings', label: 'Source Listings', icon: '📋' },
  { href: '/admin/duplicates', label: 'Duplicate Reviews', icon: '🔍' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // If on login page, render clean login view without admin sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link href="/" className="admin-sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Image
              src="/brand/app-icon-dark.png"
              alt="Origins Atlas"
              width={32}
              height={32}
              style={{ borderRadius: '6px' }}
            />
            <span style={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'white' }}>
              Origins<span style={{ color: 'var(--gold-400)' }}>Atlas</span>
            </span>
          </Link>
        </div>

        <div className="admin-sidebar-label">Management</div>
        <ul className="admin-sidebar-nav">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={pathname === item.href ? 'active' : ''}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="admin-sidebar-label" style={{ marginTop: '24px' }}>Public Views</div>
        <ul className="admin-sidebar-nav">
          <li>
            <Link href="/">
              <span className="nav-icon">🌐</span>
              Home Page
            </Link>
          </li>
          <li>
            <Link href="/communities">
              <span className="nav-icon">🏘️</span>
              All Communities
            </Link>
          </li>
          <li>
            <Link href="/communities/nirvana-absolute-bangna">
              <span className="nav-icon">🏡</span>
              Nirvana Absolute
            </Link>
          </li>
        </ul>

        {/* User Card & Logout Button */}
        <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--gold-500), var(--gold-600))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: 'white',
                fontSize: '12px',
                flexShrink: 0,
              }}
            >
              OA
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                Administrator
              </div>
              <div style={{ fontSize: '11px', color: 'var(--gold-400)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success-500)' }} />
                Active Session
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="btn btn-outline-danger btn-sm"
            style={{
              width: '100%',
              justifyContent: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            id="admin-logout-btn"
          >
            {loggingOut ? (
              <>
                <span className="login-spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }} />
                <span>Signing out...</span>
              </>
            ) : (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sign Out</span>
              </>
            )}
          </button>
        </div>

        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          Origins Atlas v0.2.0 • Admin Portal
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}
