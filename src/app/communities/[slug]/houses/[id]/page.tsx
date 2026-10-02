import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatUSD, formatPricePerSqm, formatDate, getVerificationDisplay } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: house } = await supabase
    .from('houses')
    .select('house_number, bedrooms, bathrooms, house_size_sqm')
    .eq('id', id)
    .single();

  const title = house
    ? `Unit ${house.house_number || 'House'} (${house.bedrooms} Bed, ${house.bathrooms} Bath) — Origins Atlas`
    : 'Property Intelligence — Origins Atlas';

  return {
    title,
    description: `Comprehensive canonical property record on Origins Atlas. Compare multiple broker listings, track asking price history, and view verification data.`,
  };
}

export default async function HouseDetailPage({ params }: PageProps) {
  const { slug, id } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch community
  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', slug)
    .single();

  // Fetch house with all related data
  const { data: house } = await supabase
    .from('houses')
    .select('*')
    .eq('id', id)
    .single();

  if (!community || !house) {
    return (
      <>
        <Navbar activeTab="communities" />
        <main className="main-content">
          <div className="page-container" style={{ padding: '80px 0', textAlign: 'center' }}>
            <h1 style={{ fontSize: '28px', marginBottom: '12px' }}>Property Not Found</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              The property you are looking for does not exist or has been removed.
            </p>
            <Link href={`/communities/${slug}`} className="btn btn-primary">
              Return to Community
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Fetch source listings with agents
  const { data: listings } = await supabase
    .from('source_listings')
    .select(`
      *,
      agents (*)
    `)
    .eq('house_id', id)
    .order('asking_price_usd', { ascending: true });

  // Fetch price history
  const { data: priceHistory } = await supabase
    .from('price_history')
    .select('*')
    .eq('house_id', id)
    .order('recorded_date', { ascending: false });

  // Fetch verifications
  const { data: verifications } = await supabase
    .from('verifications')
    .select('*')
    .eq('house_id', id)
    .order('created_at', { ascending: false });

  // Calculate price stats
  const prices = (listings || [])
    .map((l) => l.asking_price_usd)
    .filter((p): p is number => p != null);
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : null;
  const highestPrice = prices.length > 0 ? Math.max(...prices) : null;
  const priceDifference =
    lowestPrice && highestPrice && highestPrice > lowestPrice
      ? highestPrice - lowestPrice
      : null;
  const latestVerification = verifications?.[0];

  const galleryImages = [
    house.main_image_url,
    ...(Array.isArray(house.image_urls) ? house.image_urls : []),
  ].filter((url, idx, arr): url is string => Boolean(url) && arr.indexOf(url) === idx);

  return (
    <>
      <Navbar activeTab="communities" />

      <main className="main-content">
        {/* House Header Hero */}
        <div className="house-detail-header">
          <div className="page-container">
            {/* Breadcrumb */}
            <div className="house-detail-breadcrumb" id="house-breadcrumb">
              <Link href="/">Home</Link>
              <span> / </span>
              <Link href="/communities">Communities</Link>
              <span> / </span>
              <Link href={`/communities/${slug}`}>{community.name}</Link>
              <span> / </span>
              <span style={{ color: 'white', fontWeight: 600 }}>
                Unit {house.house_number || 'Property'}
              </span>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-gold">
                Canonical Property
              </span>
              {house.is_new_listing && <span className="badge badge-new">New Listing</span>}
              {house.has_price_reduction && (
                <span className="badge badge-price-drop">Price Reduced</span>
              )}
              {house.status === 'pending_review' && (
                <span className="badge badge-pending">Under Verification</span>
              )}
              {latestVerification && (
                <span
                  className={`badge badge-${
                    latestVerification.verification_status === 'verified'
                      ? 'verified'
                      : 'unverified'
                  }`}
                >
                  ✓ {latestVerification.verification_status}
                </span>
              )}
            </div>

            {/* Title & Location */}
            <h1
              style={{
                fontSize: 'clamp(22px, 5vw, 36px)',
                fontWeight: 800,
                color: 'white',
                marginBottom: '6px',
                lineHeight: 1.25,
                wordBreak: 'break-word',
              }}
            >
              Unit {house.house_number || 'House'} — {house.bedrooms} Bed Villa
            </h1>
            <p
              style={{
                color: 'rgba(255,255,255,0.75)',
                fontSize: '14px',
                marginBottom: '16px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '4px 8px',
                lineHeight: 1.5,
              }}
            >
              <span>📍 {community.name}</span>
              <span>•</span>
              <span>{community.location}</span>
              <span>•</span>
              <span>{community.city}</span>
            </p>

            {/* Price Display */}
            {lowestPrice && (
              <div style={{ marginBottom: '16px' }}>
                <div className="house-detail-price" style={{ fontSize: 'clamp(26px, 6vw, 40px)', lineHeight: 1.2 }}>
                  {lowestPrice === highestPrice
                    ? formatUSD(lowestPrice)
                    : `${formatUSD(lowestPrice)} – ${formatUSD(highestPrice)}`}
                </div>
                {priceDifference && (
                  <p
                    style={{
                      color: 'var(--gold-300)',
                      fontSize: '13px',
                      fontWeight: 600,
                      marginTop: '4px',
                    }}
                  >
                    💡 {formatUSD(priceDifference)} price variance across {listings?.length || 2} competing broker listings
                  </p>
                )}
              </div>
            )}

            {/* Specs Bar */}
            <div className="house-detail-specs" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px' }}>
              {house.bedrooms != null && (
                <span className="house-detail-spec">🛏️ {house.bedrooms} Bedrooms</span>
              )}
              {house.bathrooms != null && (
                <span className="house-detail-spec">🚿 {house.bathrooms} Bathrooms</span>
              )}
              {house.house_size_sqm != null && (
                <span className="house-detail-spec">📐 {house.house_size_sqm} m² Usable</span>
              )}
              {house.land_size_sqm != null && (
                <span className="house-detail-spec">🌿 {house.land_size_sqm} m² Land</span>
              )}
              {house.parking_spaces != null && (
                <span className="house-detail-spec">🚗 {house.parking_spaces} Parking</span>
              )}
              {house.floors != null && (
                <span className="house-detail-spec">🏢 {house.floors} Floors</span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="page-container" style={{ paddingBottom: '72px' }}>
          <div className="house-detail-grid">
            {/* Left Column */}
            <div>
              {/* Property Image Gallery */}
              {galleryImages.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <div className="house-gallery-hero">
                    <img
                      src={galleryImages[0]}
                      alt={`Unit ${house.house_number || 'Villa'}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        background: 'rgba(11, 45, 91, 0.85)',
                        backdropFilter: 'blur(8px)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        maxWidth: 'calc(100% - 24px)',
                      }}
                    >
                      📷 Nirvana Absolute Bangna • Plot {house.house_number}
                    </div>
                  </div>

                  {galleryImages.length > 1 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '10px',
                        marginTop: '12px',
                        overflowX: 'auto',
                        paddingBottom: '6px',
                        WebkitOverflowScrolling: 'touch',
                        maxWidth: '100%',
                      }}
                    >
                      {galleryImages.map((img, idx) => (
                        <div
                          key={img}
                          style={{
                            width: '84px',
                            height: '64px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: idx === 0 ? '2px solid var(--gold-500)' : '1px solid var(--border-default)',
                            flexShrink: 0,
                            cursor: 'pointer',
                          }}
                        >
                          <img
                            src={img}
                            alt={`Photo ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Attached Source Listings Section — Hidden for now
              <div className="section" id="source-listings-section">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div>
                    <h2 className="section-title" style={{ marginBottom: '4px', borderBottom: 'none' }}>
                      Attached Source Listings ({listings?.length || 0})
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: 0 }}>
                      Multiple agents advertise this same house. Compare pricing and listing sources below.
                    </p>
                  </div>
                  {listings && listings.length > 1 && (
                    <span className="badge badge-gold">
                      {listings.length} Competing Listings
                    </span>
                  )}
                </div>

                {listings && listings.length > 0 ? (
                  listings.map((listing, index) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const agent = listing.agents as any;
                    const isLowest = listing.asking_price_usd === lowestPrice;

                    return (
                      <div
                        key={listing.id}
                        className="listing-card"
                        style={{
                          borderLeft: isLowest ? '4px solid var(--gold-500)' : undefined,
                        }}
                      >
                        <div className="listing-card-header">
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                  color: 'var(--text-tertiary)',
                                }}
                              >
                                Source Listing #{index + 1}
                              </span>
                              {isLowest && (
                                <span
                                  className="badge badge-gold"
                                  style={{ fontSize: '11px', padding: '2px 8px' }}
                                >
                                  ★ Best Current Price
                                </span>
                              )}
                            </div>
                            <div className="listing-card-price">
                              {formatUSD(listing.asking_price_usd)}
                              {listing.price_per_sqm_usd && (
                                <span className="listing-card-price-sqm">
                                  {' '}({formatPricePerSqm(listing.price_per_sqm_usd)})
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="listing-card-agent">
                            <span className="listing-card-agent-dot"></span>
                            <span style={{ fontWeight: 600, color: 'var(--carbonblu-900)' }}>
                              {agent?.name || 'Independent Agent'}
                            </span>
                          </div>
                        </div>

                        <div className="listing-card-meta" style={{ flexWrap: 'wrap', gap: '14px' }}>
                          {agent?.source_platform && (
                            <span>🌐 Platform: <strong>{agent.source_platform}</strong></span>
                          )}
                          {listing.listing_date && (
                            <span>📅 First Listed: {formatDate(listing.listing_date)}</span>
                          )}
                          {listing.last_seen_date && (
                            <span>👁️ Last Verified: {formatDate(listing.last_seen_date)}</span>
                          )}
                          <span
                            style={{
                              color: listing.is_active ? 'var(--success-600)' : 'var(--neutral-500)',
                              fontWeight: 600,
                            }}
                          >
                            {listing.is_active ? '● Active Listing' : '○ Delisted'}
                          </span>
                        </div>

                        {listing.listing_description && (
                          <p
                            style={{
                              marginTop: '12px',
                              fontSize: '13px',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.6,
                              background: 'var(--neutral-50)',
                              padding: '10px 14px',
                              borderRadius: '6px',
                            }}
                          >
                            &ldquo;{listing.listing_description}&rdquo;
                          </p>
                        )}

                        <div
                          style={{
                            marginTop: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px',
                          }}
                        >
                          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                            Source ID: <code>{listing.source_listing_id || listing.id.slice(0, 8)}</code>
                          </span>

                          {listing.source_url ? (
                            <a
                              href={listing.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline btn-sm"
                            >
                              Verify on {agent?.source_platform || 'Listing Source'} ↗
                            </a>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                              Verified Direct Listing
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state" style={{ padding: '32px' }}>
                    <p>No source listings attached to this canonical house yet.</p>
                  </div>
                )}
              </div>
              */}

              {/* Price History Timeline */}
              <div className="section" id="price-history-section">
                <div style={{ marginBottom: '16px' }}>
                  <h2 className="section-title" style={{ marginBottom: '4px', borderBottom: 'none' }}>
                    Price History & Change Log
                  </h2>
                  <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: 0 }}>
                    Every price revision is recorded as a permanent historical event.
                  </p>
                </div>

                {priceHistory && priceHistory.length > 0 ? (
                  <div className="price-history-container">
                    {priceHistory.map((entry) => (
                      <div key={entry.id} className="price-history-row">
                        <div className="price-history-date-col">
                          <span className="price-history-date-val">
                            {formatDate(entry.recorded_date)}
                          </span>
                          <span className="price-history-date-sub">
                            Historical Event
                          </span>
                        </div>

                        <div className="price-history-price-col">
                          <span className="price-history-price-val">
                            {formatUSD(entry.price_usd)}
                          </span>
                          {entry.price_per_sqm_usd && (
                            <div className="price-history-price-sqm">
                              {formatPricePerSqm(entry.price_per_sqm_usd)}
                            </div>
                          )}
                        </div>

                        <div className="price-history-change-col">
                          <span className={`price-history-change ${entry.change_type}`}>
                            {entry.change_type === 'decrease'
                              ? `↓ Price Reduction (${entry.change_percentage ? `${entry.change_percentage}%` : 'Reduced'})`
                              : entry.change_type === 'increase'
                              ? `↑ Price Increase (${entry.change_percentage ? `+${entry.change_percentage}%` : 'Increased'})`
                              : entry.change_type === 'initial'
                              ? '● Initial Recording'
                              : '— Listing Update'}
                          </span>
                          {entry.notes && (
                            <p className="price-history-notes">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: '32px' }}>
                    <p>No price changes recorded yet. Initial listing price active.</p>
                  </div>
                )}
              </div>

              {/* Description & Features */}
              {house.description && (
                <div className="section">
                  <h2 className="section-title">About This Villa</h2>
                  <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    {house.description}
                  </p>
                  {house.features && house.features.length > 0 && (
                    <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {house.features.map((feature: string) => (
                        <span key={feature} className="amenity-pill">
                          ✓ {feature}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column — Sidebar */}
            <div>
              {/* Property Details Specs Card */}
              <div className="house-sidebar-card">
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    marginBottom: '16px',
                    color: 'var(--carbonblu-900)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Property Specifications</span>
                  <span style={{ fontSize: '12px', color: 'var(--gold-600)', fontWeight: 600 }}>
                    Plot {house.house_number}
                  </span>
                </h3>

                <div style={{ display: 'grid', gap: '10px' }}>
                  {[
                    { label: 'Unit / Plot', value: house.house_number },
                    { label: 'Property Type', value: house.property_type?.replace('_', ' ') },
                    { label: 'Bedrooms', value: house.bedrooms ? `${house.bedrooms} Beds` : null },
                    { label: 'Bathrooms', value: house.bathrooms ? `${house.bathrooms} Baths` : null },
                    { label: 'House Size', value: house.house_size_sqm ? `${house.house_size_sqm} m²` : null },
                    { label: 'Land Size', value: house.land_size_sqm ? `${house.land_size_sqm} m²` : null },
                    { label: 'Covered Parking', value: house.parking_spaces ? `${house.parking_spaces} Vehicles` : null },
                    { label: 'Floors', value: house.floors ? `${house.floors} Storeys` : null },
                    { label: 'Year Built', value: house.year_built },
                    { label: 'Listing Status', value: house.status?.replace('_', ' ') },
                    { label: 'Community', value: community.name },
                  ]
                    .filter((item) => item.value != null)
                    .map((item) => (
                      <div
                        key={item.label}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '8px 0',
                          borderBottom: '1px solid var(--border-subtle)',
                          fontSize: '13px',
                        }}
                      >
                        <span style={{ color: 'var(--text-tertiary)' }}>{item.label}</span>
                        <span style={{ fontWeight: 600, color: 'var(--carbonblu-900)', textTransform: 'capitalize' }}>
                          {String(item.value)}
                        </span>
                      </div>
                    ))}
                </div>

                <div style={{ marginTop: '20px' }}>
                  <Link
                    href={`/communities/${slug}`}
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    ← Back to {community.name}
                  </Link>
                </div>
              </div>

              {/* Verification History Card */}
              <div
                style={{
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  marginBottom: '24px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    marginBottom: '16px',
                    color: 'var(--carbonblu-900)',
                  }}
                >
                  Verification Status
                </h3>

                {verifications && verifications.length > 0 ? (
                  verifications.map((v) => {
                    const display = getVerificationDisplay(v.verification_status);
                    return (
                      <div key={v.id} className="verification-card">
                        <div className={`verification-icon ${display.className}`}>
                          {display.icon}
                        </div>
                        <div className="verification-info">
                          <h4>{display.label}</h4>
                          {v.verification_date && <p>Verified: {formatDate(v.verification_date)}</p>}
                          {v.verified_by && <p>Auditor: {v.verified_by}</p>}
                          {v.verification_method && <p>Method: {v.verification_method}</p>}
                          {v.notes && (
                            <p style={{ marginTop: '6px', color: 'var(--text-secondary)' }}>
                              {v.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '16px' }}>
                    Verification pending administrative review.
                  </div>
                )}
              </div>

              {/* Community Context Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--carbonblu-900), var(--carbonblu-950))',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  color: 'white',
                  width: '100%',
                }}
              >
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gold-400)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Gated Community
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: 'white' }}>
                  {community.name}
                </h4>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '16px' }}>
                  {community.location} • {community.city}, Thailand
                </p>
                <Link
                  href={`/communities/${slug}`}
                  className="btn btn-gold btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  View All Community Houses →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
