import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Admin Dashboard — Origins Atlas',
};

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient();

  // Fetch counts
  const [
    { count: totalCommunities },
    { count: totalHouses },
    { count: totalAgents },
    { count: totalListings },
    { count: activeListings },
    { count: pendingDuplicates },
  ] = await Promise.all([
    supabase.from('communities').select('*', { count: 'exact', head: true }),
    supabase.from('houses').select('*', { count: 'exact', head: true }),
    supabase.from('agents').select('*', { count: 'exact', head: true }),
    supabase.from('source_listings').select('*', { count: 'exact', head: true }),
    supabase.from('source_listings').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('duplicate_reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  // Recent houses
  const { data: recentHouses } = await supabase
    .from('houses')
    .select(`
      *,
      communities (name, slug)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  // Recent listings
  const { data: recentListings } = await supabase
    .from('source_listings')
    .select(`
      *,
      houses (house_number),
      agents (name)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  const formatUSD = (n: number | null) => n != null
    ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : '—';

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Origins Atlas administration overview</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon blue">🏘️</div>
          <div className="stat-card-value">{totalCommunities || 0}</div>
          <div className="stat-card-label">Communities</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon green">🏠</div>
          <div className="stat-card-value">{totalHouses || 0}</div>
          <div className="stat-card-label">Canonical Houses</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon purple">👤</div>
          <div className="stat-card-value">{totalAgents || 0}</div>
          <div className="stat-card-label">Agents / Sources</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon gold">📋</div>
          <div className="stat-card-value">{totalListings || 0}</div>
          <div className="stat-card-label">Total Listings</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon rose">✓</div>
          <div className="stat-card-value">{activeListings || 0}</div>
          <div className="stat-card-label">Active Listings</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon orange">🔍</div>
          <div className="stat-card-value">{pendingDuplicates || 0}</div>
          <div className="stat-card-label">Pending Duplicates</div>
        </div>
      </div>

      {/* Recent Houses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Recent Houses</h2>
            <Link href="/admin/houses" className="btn btn-sm btn-secondary">View All</Link>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>House</th>
                  <th>Community</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentHouses?.map((house) => (
                  <tr key={house.id}>
                    <td>
                      <strong>{house.house_number || '—'}</strong>
                      <br />
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        {house.bedrooms}BR / {house.bathrooms}BA
                        {house.house_size_sqm ? ` / ${house.house_size_sqm}m²` : ''}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px' }}>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(house.communities as any)?.name || '—'}
                    </td>
                    <td>
                      <span className={`status-dot ${house.status}`}></span>
                      <span style={{ fontSize: '13px', textTransform: 'capitalize' }}>
                        {house.status?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!recentHouses || recentHouses.length === 0) && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No houses yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Recent Listings</h2>
            <Link href="/admin/listings" className="btn btn-sm btn-secondary">View All</Link>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>House</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {recentListings?.map((listing) => (
                  <tr key={listing.id}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <td style={{ fontSize: '13px' }}>{(listing.agents as any)?.name || '—'}</td>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <td style={{ fontSize: '13px' }}>{(listing.houses as any)?.house_number || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{formatUSD(listing.asking_price_usd)}</td>
                  </tr>
                ))}
                {(!recentListings || recentListings.length === 0) && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No listings yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
