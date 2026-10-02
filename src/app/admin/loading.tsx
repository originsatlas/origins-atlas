import PageLoader from '@/components/PageLoader';

export default function AdminLoading() {
  return (
    <div style={{ padding: '40px 0' }}>
      <PageLoader message="Loading administrative records from Supabase…" minHeight="50vh" />
    </div>
  );
}
