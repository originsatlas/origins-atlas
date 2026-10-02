import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata = { title: 'Manage Houses — Origins Atlas Admin' };

export default async function AdminHousesPage() {
  const supabase = await createServerSupabaseClient();

  const { data: houses } = await supabase
    .from('houses')
    .select(`
      *,
      communities (name, slug),
      source_listings (id)
    `)
    .order('created_at', { ascending: false });

  const formatUSD = (n: number | null) =>
    n != null ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—';

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h1 className="page-title">Canonical Houses</h1>
          <p className="page-subtitle">Manage physical property records</p>
        </div>
        <Link href="/admin/houses/new" className="btn btn-primary">+ Add House</Link>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>House #</th>
              <th>Community</th>
              <th>Specs</th>
              <th>Size</th>
              <th>Status</th>
              <th>Listings</th>
              <th>Flags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {houses?.map((house) => {
              /* eslint-disable @typescript-eslint/no-explicit-any */
              const community = house.communities as any;
              const listingsCount = (house.source_listings as any[])?.length || 0;
              /* eslint-enable @typescript-eslint/no-explicit-any */
              return (
                <tr key={house.id}>
                  <td><strong>{house.house_number || '—'}</strong></td>
                  <td style={{ fontSize: '13px' }}>{community?.name || '—'}</td>
                  <td style={{ fontSize: '13px' }}>
                    {house.bedrooms}BR / {house.bathrooms}BA
                    {house.parking_spaces != null ? ` / ${house.parking_spaces}P` : ''}
                  </td>
                  <td style={{ fontSize: '13px' }}>
                    {house.house_size_sqm ? `${house.house_size_sqm} m²` : '—'}
                  </td>
                  <td>
                    <span className={`status-dot ${house.status}`}></span>
                    <span style={{ fontSize: '13px', textTransform: 'capitalize' }}>
                      {house.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className="property-card-listings-count">{listingsCount}</span>
                  </td>
                  <td>
                    {house.is_new_listing && <span className="badge badge-new" style={{ marginRight: 4 }}>New</span>}
                    {house.has_price_reduction && <span className="badge badge-price-drop">Drop</span>}
                  </td>
                  <td>
                    <div className="data-table-actions">
                      <Link href={`/admin/houses/${house.id}/edit`} className="btn btn-sm btn-secondary">Edit</Link>
                      {/* Link to community commented out for now:
                      {community?.slug && (
                        <Link href={`/communities/${community.slug}/houses/${house.id}`} className="btn btn-sm btn-secondary">View</Link>
                      )}
                      */}
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!houses || houses.length === 0) && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '40px' }}>
                  No houses yet. Click &ldquo;Add House&rdquo; to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
