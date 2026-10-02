import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata = { title: 'Duplicate Reviews — Origins Atlas Admin' };

export default async function AdminDuplicatesPage() {
  const supabase = await createServerSupabaseClient();

  const { data: duplicates } = await supabase
    .from('duplicate_reviews')
    .select(`
      *,
      house_a:houses!duplicate_reviews_house_id_a_fkey (
        id, house_number, bedrooms, bathrooms, house_size_sqm, parking_spaces, status
      ),
      house_b:houses!duplicate_reviews_house_id_b_fkey (
        id, house_number, bedrooms, bathrooms, house_size_sqm, parking_spaces, status
      )
    `)
    .order('created_at', { ascending: false });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-pending">Pending Review</span>;
      case 'confirmed_duplicate':
        return <span className="badge badge-price-drop">Confirmed Duplicate</span>;
      case 'not_duplicate':
        return <span className="badge badge-verified">Not Duplicate</span>;
      default:
        return <span className="badge badge-unverified">{status}</span>;
    }
  };

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h1 className="page-title">Duplicate Reviews</h1>
          <p className="page-subtitle">
            Review potential duplicate house records. Houses with similar attributes are flagged for manual review.
          </p>
        </div>
      </div>

      {duplicates && duplicates.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {duplicates.map((dup) => {
            /* eslint-disable @typescript-eslint/no-explicit-any */
            const houseA = dup.house_a as any;
            const houseB = dup.house_b as any;
            /* eslint-enable @typescript-eslint/no-explicit-any */
            return (
              <div key={dup.id} style={{
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {getStatusBadge(dup.status)}
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Match Score: {Math.round(dup.match_score * 100)}%
                    </span>
                  </div>
                </div>

                {/* Comparison */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '24px', alignItems: 'center' }}>
                  {/* House A */}
                  <div style={{
                    padding: '16px',
                    background: 'var(--neutral-50)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
                      🏠 {houseA?.house_number || 'Unknown'}
                    </h4>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'grid', gap: '4px' }}>
                      <span>Bedrooms: <strong>{houseA?.bedrooms || '—'}</strong></span>
                      <span>Bathrooms: <strong>{houseA?.bathrooms || '—'}</strong></span>
                      <span>Size: <strong>{houseA?.house_size_sqm ? `${houseA.house_size_sqm} m²` : '—'}</strong></span>
                      <span>Parking: <strong>{houseA?.parking_spaces ?? '—'}</strong></span>
                      <span>Status: <strong style={{ textTransform: 'capitalize' }}>{houseA?.status?.replace('_', ' ') || '—'}</strong></span>
                    </div>
                  </div>

                  {/* VS */}
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-heading)',
                  }}>
                    VS
                  </div>

                  {/* House B */}
                  <div style={{
                    padding: '16px',
                    background: 'var(--neutral-50)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
                      🏠 {houseB?.house_number || 'Unknown'}
                    </h4>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'grid', gap: '4px' }}>
                      <span>Bedrooms: <strong>{houseB?.bedrooms || '—'}</strong></span>
                      <span>Bathrooms: <strong>{houseB?.bathrooms || '—'}</strong></span>
                      <span>Size: <strong>{houseB?.house_size_sqm ? `${houseB.house_size_sqm} m²` : '—'}</strong></span>
                      <span>Parking: <strong>{houseB?.parking_spaces ?? '—'}</strong></span>
                      <span>Status: <strong style={{ textTransform: 'capitalize' }}>{houseB?.status?.replace('_', ' ') || '—'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Match Reasons */}
                {dup.match_reasons && dup.match_reasons.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Match Reasons:
                    </span>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {dup.match_reasons.map((reason: string) => (
                        <span key={reason} style={{
                          padding: '3px 10px',
                          background: 'var(--accent-50)',
                          color: 'var(--accent-800)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}>
                          {reason.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {dup.notes && (
                  <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                    {dup.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <h3>No duplicates to review</h3>
          <p>All potential duplicates have been resolved or none have been detected yet.</p>
        </div>
      )}
    </>
  );
}
