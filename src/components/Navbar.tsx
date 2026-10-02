'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface NavbarProps {
  activeTab?: 'home' | 'communities';
}

export default function Navbar({ activeTab }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand" id="navbar-brand-link">
          <Image
            src="/brand/app-icon-dark.png"
            alt="Origins Atlas"
            width={34}
            height={34}
            className="navbar-logo-icon"
            style={{ borderRadius: '8px', height: '34px', width: '34px' }}
            priority
          />
          <span className="navbar-brand-text">
            <span className="navbar-brand-origins">Origins</span>
            <span className="navbar-brand-atlas">Atlas</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <ul className="navbar-links">
          <li>
            <Link href="/" className={activeTab === 'home' ? 'active' : ''} id="nav-home">
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/communities"
              className={activeTab === 'communities' ? 'active' : ''}
              id="nav-communities"
            >
              Communities
            </Link>
          </li>
        </ul>

        {/* Desktop CTA & Mobile Hamburger Button */}
        <div className="navbar-actions">
          <Link href="/communities" className="btn btn-primary btn-sm desktop-only" id="nav-cta-explore">
            Explore
          </Link>
          <button
            type="button"
            className={`navbar-mobile-toggle ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
            id="mobile-nav-toggle"
          >
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-drawer" id="mobile-nav-drawer">
          <ul className="navbar-mobile-links">
            <li>
              <Link
                href="/"
                className={activeTab === 'home' ? 'active' : ''}
                onClick={() => setMobileMenuOpen(false)}
              >
                🏠 Home
              </Link>
            </li>
            <li>
              <Link
                href="/communities"
                className={activeTab === 'communities' ? 'active' : ''}
                onClick={() => setMobileMenuOpen(false)}
              >
                🏘️ All Communities
              </Link>
            </li>
            <li>
              <Link
                href="/communities/nirvana-absolute-bangna"
                onClick={() => setMobileMenuOpen(false)}
              >
                🏡 Nirvana Absolute Bangna
              </Link>
            </li>
          </ul>
          <div className="navbar-mobile-actions">
            <Link
              href="/communities"
              className="btn btn-gold btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Explore Communities →
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
