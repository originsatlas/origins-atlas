import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageLoader from '@/components/PageLoader';

export default function RootLoading() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <PageLoader message="Accessing Origins Atlas property intelligence…" />
      </main>
      <Footer />
    </>
  );
}
