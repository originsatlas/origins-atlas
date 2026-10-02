import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Communities — Origins Atlas',
  description: 'Explore all available residential communities on Origins Atlas.',
};

export default async function CommunitiesPage() {
  const supabase = await createServerSupabaseClient();

  const { data: communities } = await supabase
    .from('communities')
    .select('*')
    .order('name');

  return (
    <>
      <Navbar activeTab="communities" />

      <main className="main-content">
        {/* Hero */}
        <section className="community-hero" style={{ padding: '40px 0 36px' }}>
          <div className="page-container community-hero-content">
            <div className="community-hero-eyebrow">Property Intelligence</div>
            <h1 className="community-hero-title" style={{ fontSize: '36px' }}>All Communities</h1>
            <p className="community-hero-description" style={{ marginBottom: 0 }}>
              Browse residential communities tracked by Origins Atlas. Each community contains
              verified property listings with complete price histories.
            </p>
          </div>
        </section>

        {/* Community Grid */}
        <section style={{ padding: '40px 0 64px', flex: 1 }}>
          <div className="page-container">
            {communities && communities.length > 0 ? (
              <div className="property-grid">
                {communities.map((community) => (
                  <Link
                    key={community.id}
                    href={`/communities/${community.slug}`}
                    className="community-card"
                    id={`community-${community.slug}`}
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
                        {community.location} • {community.city}, {community.country}
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
      </main>

      <Footer />
    </>
  );
}
