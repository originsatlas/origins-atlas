import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata = { title: 'Manage Listings — Origins Atlas Admin' };

export default async function AdminListingsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: listings } = await supabase
    .from('source_listings')
    .select(`
      *,
      houses (id, house_number, community_id, communities (name, slug)),
      agents (id, name, source_platform)
    `)
    .order('created_at', { ascending: false });

  const formatUSD = (n: number | null) =>
    n != null ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—';

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h1 className="page-title">Source Listings</h1>
          <p className="page-subtitle">Manage agent listings attached to canonical houses</p>
        </div>
        <Link href="/admin/listings/new" className="btn btn-primary">+ Add Listing</Link>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Agent</th>
              <th>House</th>
              <th>Price (USD)</th>
              <th>$/m²</th>
              <th>Platform</th>
              <th>Active</th>
              <th>Listed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings?.map((listing) => {
              /* eslint-disable @typescript-eslint/no-explicit-any */
              const agent = listing.agents as any;
              const house = listing.houses as any;
              /* eslint-enable @typescript-eslint/no-explicit-any */
              return (
                <tr key={listing.id}>
                  <td style={{ fontSize: '13px' }}><strong>{agent?.name || '—'}</strong></td>
                  <td style={{ fontSize: '13px' }}>{house?.house_number || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{formatUSD(listing.asking_price_usd)}</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                    {listing.price_per_sqm_usd ? `$${listing.price_per_sqm_usd.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ fontSize: '13px' }}>{agent?.source_platform || '—'}</td>
                  <td>
                    {listing.is_active ? (
                      <span style={{ color: 'var(--success-600)', fontWeight: 600, fontSize: '13px' }}>● Active</span>
                    ) : (
                      <span style={{ color: 'var(--neutral-400)', fontSize: '13px' }}>○ Inactive</span>
                    )}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{listing.listing_date || '—'}</td>
                  <td>
                    <div className="data-table-actions">
                      <Link href={`/admin/listings/${listing.id}/edit`} className="btn btn-sm btn-secondary">Edit</Link>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!listings || listings.length === 0) && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '40px' }}>
                  No listings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
