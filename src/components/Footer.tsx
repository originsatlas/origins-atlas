import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="footer" id="main-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand-section">
            <Link href="/" style={{ display: 'inline-block', marginBottom: '16px' }} id="footer-brand-link">
              <Image
                src="/brand/logo-luxury-dark.png"
                alt="Origins Atlas - Communities • Homes • Property Intelligence"
                width={200}
                height={120}
                style={{ height: 'auto', maxHeight: '68px', width: 'auto', display: 'block' }}
              />
            </Link>
            <div className="footer-tagline">
              COMMUNITIES <span className="footer-tagline-dot">■</span> HOMES{' '}
              <span className="footer-tagline-dot">■</span> PROPERTY INTELLIGENCE
            </div>
            <p className="footer-brand-desc" style={{ marginTop: '12px', maxWidth: '420px', color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.6 }}>
              Thailand&apos;s community-first real estate platform connecting multiple agent listings, asking prices, and price histories to one canonical physical house record.
            </p>
          </div>

          <div className="footer-links-section">
            <div className="footer-links-group">
              <h4 className="footer-links-title">Platform</h4>
              <ul className="footer-links-list">
                <li><Link href="/">Home</Link></li>
                <li><Link href="/communities">All Communities</Link></li>
                <li><Link href="/communities/nirvana-absolute-bangna">Nirvana Absolute Bangna</Link></li>
              </ul>
            </div>
            <div className="footer-links-group">
              <h4 className="footer-links-title">Intelligence</h4>
              <ul className="footer-links-list">
                <li><span className="footer-link-disabled">One House, One Record</span></li>
                <li><span className="footer-link-disabled">Price Tracking</span></li>
                <li><span className="footer-link-disabled">Verified Properties</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-text">
            © {new Date().getFullYear()} Origins Atlas. COMMUNITIES • HOMES • PROPERTY INTELLIGENCE.
          </div>
          <div className="footer-text">
            Bangkok, Thailand 🇹🇭
          </div>
        </div>
      </div>
    </footer>
  );
}
