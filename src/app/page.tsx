import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
      <Navbar activeTab="home" />

      <main className="main-content">
        {/* Hero Section */}
        <section className="home-hero">
          <div className="page-container home-hero-content">
            <div className="home-hero-tagline">
              <span>COMMUNITIES</span>
              <span className="home-hero-tagline-dot" />
              <span>HOMES</span>
              <span className="home-hero-tagline-dot" />
              <span>PROPERTY INTELLIGENCE</span>
            </div>

            <h1 className="home-hero-title">
              One house.{' '}
              <span className="highlight">One record.</span>
              <br />
              Every listing.
            </h1>

            <p className="home-hero-description">
              Origins Atlas connects all agent listings, price histories, and verification data
              to a single canonical property record — giving you the most complete picture
              of Thailand&apos;s real estate market.
            </p>

            <div className="home-hero-cta">
              <Link href="/communities" className="btn btn-gold btn-lg" id="hero-explore-btn">
                Explore Communities
              </Link>
              <a href="#how-it-works" className="btn btn-secondary btn-lg" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                How It Works
              </a>
            </div>

            <div className="home-hero-stats">
              <div>
                <div className="home-hero-stat-value">{communities?.length || 0}</div>
                <div className="home-hero-stat-label">Communities</div>
              </div>
              <div>
                <div className="home-hero-stat-value">{totalHouses || 0}</div>
                <div className="home-hero-stat-label">Houses Tracked</div>
              </div>
              <div>
                <div className="home-hero-stat-value">{totalListings || 0}</div>
                <div className="home-hero-stat-label">Active Listings</div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Communities */}
        <section style={{ padding: '56px 0' }} id="featured-communities">
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
                  <Link
                    key={community.id}
                    href={`/communities/${community.slug}`}
                    className="community-card"
                    id={`community-card-${community.slug}`}
                  >
                    <div className="community-card-image">
                      {community.image_url ? (
                        <img
                          src={community.image_url}
                          alt={community.name}
                        />
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '48px',
                            height: '100%',
                          }}
                        >
                          🏘️
                        </div>
                      )}
                      <div className="community-card-badge">
                        <span className="badge badge-gold">
                          {community.community_type?.replace('_', ' ') || 'Community'}
                        </span>
                      </div>
                    </div>
                    <div className="community-card-body">
                      <h3 className="community-card-name">{community.name}</h3>
                      <p className="community-card-location">
                        {community.location} • {community.city}
                      </p>
                      <p className="community-card-desc">
                        {community.description
                          ? community.description.slice(0, 140) + '…'
                          : 'Explore properties in this community'}
                      </p>
                      <div className="community-card-footer">
                        <span className="community-card-stat">
                          ~{community.total_units || '—'} units
                        </span>
                        <span className="community-card-cta">
                          View Properties →
                        </span>
                      </div>
                    </div>
                  </Link>
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
        <section style={{ padding: '56px 0', background: 'var(--neutral-0)' }} id="how-it-works">
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
                <div key={item.title} className="how-it-works-card">
                  <div className="how-it-works-icon">{item.icon}</div>
                  <h3 className="how-it-works-title">{item.title}</h3>
                  <p className="how-it-works-desc">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
