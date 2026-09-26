import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  const { data: communities } = await supabase
    .from('communities')
    .select('*')
    .order('name');

  const { count: totalHouses } = await supabase
    .from('houses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: totalListings } = await supabase
    .from('source_listings')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  return (
    <>
      {/* Navigation */}
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-brand">
            <span className="navbar-brand-icon">OA</span>
            Origins Atlas
          </Link>
          <ul className="navbar-links">
            <li><Link href="/" className="active">Home</Link></li>
            {/* Hidden for now:
            <li><Link href="/communities">Communities</Link></li>
            <li><Link href="/admin">Admin</Link></li>
            */}
          </ul>
        </div>
      </nav>

      <main className="main-content">
        {/* Hero Section */}
      <section className="community-hero" style={{ padding: '80px 0 72px' }}>
        <div className="page-container community-hero-content">
          <div className="community-hero-eyebrow">Community-First Real Estate Platform</div>
          <h1 className="community-hero-title" style={{ fontSize: '48px', maxWidth: '700px' }}>
            One house.{' '}
            <span style={{ color: 'var(--accent-400)' }}>One record.</span>{' '}
            Every listing.
          </h1>
          <p className="community-hero-description" style={{ fontSize: '18px' }}>
            Origins Atlas connects all agent listings, price histories, and verification data
            to a single canonical property record — giving you the most complete picture
            of Thailand&apos;s real estate market.
          </p>
          <div className="community-hero-stats">
            <div className="community-hero-stat">
              <div className="community-hero-stat-value">{communities?.length || 0}</div>
              <div className="community-hero-stat-label">Communities</div>
            </div>
            <div className="community-hero-stat">
              <div className="community-hero-stat-value">{totalHouses || 0}</div>
              <div className="community-hero-stat-label">Houses Tracked</div>
            </div>
            <div className="community-hero-stat">
              <div className="community-hero-stat-value">{totalListings || 0}</div>
              <div className="community-hero-stat-label">Active Listings</div>
            </div>
          </div>
        </div>
      </section>

      {/* Communities Section */}
      <section style={{ padding: '48px 0' }}>
        <div className="page-container">
          <div className="page-header">
            <h2 className="page-title">Featured Communities</h2>
            <p className="page-subtitle">
              Explore Thailand&apos;s premier residential communities with verified property data.
            </p>
          </div>

          {communities && communities.length > 0 ? (
            <div className="property-grid">
              {communities.map((community) => (
                /* Link to community commented out for now:
                <Link
                  key={community.id}
                  href={`/communities/${community.slug}`}
                  style={{ textDecoration: 'none' }}
                >
                */
                  <div key={community.id} className="card">
                    <div
                      className="card-image"
                      style={{
                        position: 'relative',
                        height: '180px',
                        overflow: 'hidden',
                      }}
                    >
                      {community.image_url ? (
                        <img
                          src={community.image_url}
                          alt={community.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, var(--primary-800), var(--primary-950))',
                            color: 'white',
                            fontSize: '48px',
                            height: '100%',
                          }}
                        >
                          🏘️
                        </div>
                      )}
                    </div>
                    <div className="card-body">
                      <div style={{ marginBottom: '6px' }}>
                        <span className="badge badge-new" style={{ fontSize: '10px' }}>
                          {community.community_type?.replace('_', ' ') || 'Community'}
                        </span>
                      </div>
                      <h3 className="card-title">{community.name}</h3>
                      <p className="card-text" style={{ marginBottom: '12px' }}>
                        {community.location} • {community.city}
                      </p>
                      <p className="card-text" style={{ fontSize: '13px' }}>
                        {community.description
                          ? community.description.slice(0, 120) + '…'
                          : 'Explore properties in this community'}
                      </p>
                      <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                        <span style={{
                          fontSize: '13px',
                          color: 'var(--text-tertiary)',
                        }}>
                          ~{community.total_units || '—'} units
                        </span>
                        {/* Link to properties commented out for now:
                        <span style={{
                          fontSize: '13px',
                          color: 'var(--primary-600)',
                          fontWeight: 600,
                        }}>
                          View Properties →
                        </span>
                        */}
                      </div>
                    </div>
                  </div>
                /* </Link> */
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🏗️</div>
              <h3>No communities yet</h3>
              <p>Communities will appear here once they are added via the admin panel.</p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '48px 0', background: 'var(--neutral-0)' }}>
        <div className="page-container">
          <div className="page-header" style={{ textAlign: 'center' }}>
            <h2 className="page-title">How Origins Atlas Works</h2>
            <p className="page-subtitle">
              We merge duplicate property listings into one canonical record.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            marginTop: '16px',
          }}>
            {[
              {
                icon: '🏠',
                title: 'One Canonical House',
                desc: 'Each physical property exists once in our database, no matter how many agents list it.',
              },
              {
                icon: '👥',
                title: 'Multiple Agent Listings',
                desc: 'See every agent\'s listing, asking price, and listing date attached to the same house.',
              },
              {
                icon: '📊',
                title: 'Price History & Verification',
                desc: 'Track price changes over time and see verification status for each property.',
              },
            ].map((item) => (
              <div key={item.title} className="stat-card" style={{ textAlign: 'center', padding: '32px 24px' }}>
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>{item.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{item.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">Origins Atlas</div>
          <div className="footer-text">
            © {new Date().getFullYear()} Origins Atlas. Community-first real estate.
          </div>
        </div>
      </footer>
    </>
  );
}
