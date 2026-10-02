import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageLoader from '@/components/PageLoader';

export default function CommunitiesLoading() {
  return (
    <>
      <Navbar activeTab="communities" />
      <main className="main-content">
        <PageLoader message="Loading communities &amp; verified residential data…" />
      </main>
      <Footer />
    </>
  );
}
