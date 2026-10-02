import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageLoader from '@/components/PageLoader';

export default function HouseDetailLoading() {
  return (
    <>
      <Navbar activeTab="communities" />
      <main className="main-content">
        <PageLoader message="Loading canonical house, broker listings &amp; price history…" />
      </main>
      <Footer />
    </>
  );
}
