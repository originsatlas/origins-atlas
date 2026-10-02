import Image from 'next/image';

interface PageLoaderProps {
  message?: string;
  minHeight?: string;
}

export default function PageLoader({
  message = 'Loading Property Intelligence…',
  minHeight = '70vh',
}: PageLoaderProps) {
  return (
    <div
      className="page-loader-container"
      style={{ minHeight }}
      role="status"
      aria-live="polite"
      id="origins-page-loader"
    >
      <div className="page-loader-card">
        {/* Animated Icon & Orbit Ring */}
        <div className="page-loader-icon-wrapper">
          <div className="page-loader-glow-aura" />
          <div className="page-loader-spinner-ring" />
          <Image
            src="/brand/app-icon-dark.png"
            alt="Origins Atlas"
            width={60}
            height={60}
            className="page-loader-icon"
            priority
          />
        </div>

        {/* Brand Title */}
        <div className="page-loader-brand">
          <span className="page-loader-brand-origins">Origins</span>
          <span className="page-loader-brand-atlas">Atlas</span>
        </div>

        {/* Official Tagline */}
        <div className="page-loader-tagline">
          COMMUNITIES <span>■</span> HOMES <span>■</span> PROPERTY INTELLIGENCE
        </div>

        {/* Animated Progress Bar */}
        <div className="page-loader-bar-track">
          <div className="page-loader-bar-fill" />
        </div>

        {/* Status Message */}
        <p className="page-loader-status-text">
          {message}
        </p>
      </div>
    </div>
  );
}
