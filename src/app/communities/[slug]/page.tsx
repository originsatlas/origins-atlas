import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatUSD, formatPricePerSqm } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: community } = await supabase
    .from('communities')
    .select('name, description')
    .eq('slug', slug)
    .single();

  return {
    title: community ? `${community.name} — Origins Atlas` : 'Community — Origins Atlas',
    description: community?.description || 'Explore properties in this community on Origins Atlas.',
  };
}

export default async function CommunityPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch community
  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!community) {
    return (
      <>
        <Navbar activeTab="communities" />
        <main className="main-content">
          <div className="page-container" style={{ padding: '80px 0', textAlign: 'center' }}>
            <h1>Community not found</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
              <Link href="/communities">Back to communities</Link>
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Fetch houses with their source listings and agents
  const { data: houses } = await supabase
    .from('houses')
    .select(`
      *,
      source_listings (
        id,
        asking_price_usd,
        price_per_sqm_usd,
        is_active,
        agent_id,
        agents (
          id,
          name,
          source_platform
        )
      ),
      verifications (
        verification_status
      )
    `)
    .eq('community_id', community.id)
    .in('status', ['active', 'pending_review'])
    .order('created_at', { ascending: false });

  // Count active houses and total listings
  const activeHouses = houses?.filter((h) => h.status === 'active') || [];
  const totalListings = houses?.reduce((sum, h) => sum + (h.source_listings?.length || 0), 0) || 0;

  return (
    <>
      <Navbar activeTab="communities" />

      <main className="main-content">
        {/* Community Hero */}
        <section className="community-hero">
          <div className="page-container community-hero-content">
            <div className="house-detail-breadcrumb">
              <Link href="/">Home</Link>
              {' / '}
              <Link href="/communities">Communities</Link>
              {' / '}
              <span>{community.name}</span>
            </div>
            <div className="community-hero-eyebrow">
              {community.community_type?.replace('_', ' ') || 'Community'}
            </div>
            <h1 className="community-hero-title">{community.name}</h1>
            <p className="community-hero-description">{community.description}</p>
            <div className="community-hero-stats">
              <div className="community-hero-stat">
                <div className="community-hero-stat-value">{activeHouses.length}</div>
                <div className="community-hero-stat-label">Active Houses</div>
              </div>
              <div className="community-hero-stat">
                <div className="community-hero-stat-value">{totalListings}</div>
                <div className="community-hero-stat-label">Source Listings</div>
              </div>
              <div className="community-hero-stat">
                <div className="community-hero-stat-value">~{community.total_units || '—'}</div>
                <div className="community-hero-stat-label">Total Units</div>
              </div>
              <div className="community-hero-stat">
                <div className="community-hero-stat-value">{community.city}</div>
                <div className="community-hero-stat-label">City</div>
              </div>
            </div>
            {community.amenities && community.amenities.length > 0 && (
              <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {community.amenities.map((amenity: string) => (
                  <span key={amenity} className="amenity-pill">
                    {amenity}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Properties */}
        <section style={{ padding: '40px 0 64px' }}>
          <div className="page-container">
            <div className="page-header">
              <h2 className="page-title">Available Houses</h2>
              <p className="page-subtitle">
                {activeHouses.length} {activeHouses.length === 1 ? 'house' : 'houses'} currently listed from {totalListings} source {totalListings === 1 ? 'listing' : 'listings'}
              </p>
            </div>

            {houses && houses.length > 0 ? (
              <div className="property-grid">
                {houses.map((house) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const listings = (house.source_listings || []) as any[];
                  const prices = listings.map((l: { asking_price_usd: number }) => l.asking_price_usd).filter(Boolean);
                  const lowestPrice = prices.length > 0 ? Math.min(...prices) : null;
                  const pricePerSqm = listings[0]?.price_per_sqm_usd;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const latestVerification = (house.verifications as any[])?.[0];
                  const verificationStatus = latestVerification?.verification_status || 'unverified';

                  // Get unique agent names
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const agentNames = [...new Set(listings.map((l: any) => l.agents?.name).filter(Boolean))];

                  return (
                    <Link
                      key={house.id}
                      href={`/communities/${slug}/houses/${house.id}`}
                      style={{ textDecoration: 'none' }}
                      id={`house-card-${house.house_number?.replace('/', '-')}`}
                    >
                      <div className="property-card">
                        {/* Image Area */}
                        <div className="property-card-image-wrapper">
                          {house.main_image_url ? (
                            <img
                              src={house.main_image_url}
                              alt={`Unit ${house.house_number || ''}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'linear-gradient(135deg, var(--neutral-200), var(--neutral-300))',
                              fontSize: '48px',
                            }}>
                              🏠
                            </div>
                          )}

                          {/* Badges */}
                          <div className="property-card-badges">
                            {house.is_new_listing && <span className="badge badge-new">New</span>}
                            {house.has_price_reduction && <span className="badge badge-price-drop">Price Drop</span>}
                            {house.status === 'pending_review' && <span className="badge badge-pending">Review</span>}
                          </div>

                          {/* Price overlay */}
                          {lowestPrice && (
                            <div className="property-card-price">
                              <div className="property-card-price-value">
                                {formatUSD(lowestPrice)}
                              </div>
                              {pricePerSqm && (
                                <div className="property-card-price-sqm">
                                  {formatPricePerSqm(pricePerSqm)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="property-card-body">
                          <h3 className="property-card-title">
                            {house.house_number || 'House'} — {house.property_type?.replace('_', ' ')}
                          </h3>
                          <p className="property-card-location">{community.name}, {community.location}</p>

                          {/* Specs */}
                          <div className="property-card-specs">
                            {house.bedrooms != null && (
                              <span className="property-card-spec">
                                <span className="property-card-spec-icon">🛏️</span>
                                {house.bedrooms} Bed
                              </span>
                            )}
                            {house.bathrooms != null && (
                              <span className="property-card-spec">
                                <span className="property-card-spec-icon">🚿</span>
                                {house.bathrooms} Bath
                              </span>
                            )}
                            {house.house_size_sqm != null && (
                              <span className="property-card-spec">
                                <span className="property-card-spec-icon">📐</span>
                                {house.house_size_sqm} m²
                              </span>
                            )}
                            {house.parking_spaces != null && (
                              <span className="property-card-spec">
                                <span className="property-card-spec-icon">🚗</span>
                                {house.parking_spaces} Park
                              </span>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="property-card-footer">
                            <div className="property-card-agent">
                              <span className={`status-dot ${verificationStatus}`}></span>
                              {agentNames.length > 0 ? (
                                <span>{agentNames.length} {agentNames.length === 1 ? 'agent' : 'agents'}</span>
                              ) : (
                                <span>No agents</span>
                              )}
                            </div>
                            <span className="property-card-listings-count">
                              {listings.length} {listings.length === 1 ? 'listing' : 'listings'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🏠</div>
                <h3>No houses listed yet</h3>
                <p>Houses will appear here once they are added via the admin panel.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
