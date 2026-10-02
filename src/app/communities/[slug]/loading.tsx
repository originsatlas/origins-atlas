import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageLoader from '@/components/PageLoader';

export default function CommunityDetailLoading() {
  return (
    <>
      <Navbar activeTab="communities" />
      <main className="main-content">
        <PageLoader message="Loading community listings &amp; canonical houses…" />
      </main>
      <Footer />
    </>
  );
}
