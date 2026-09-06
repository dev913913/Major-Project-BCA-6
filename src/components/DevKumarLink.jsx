export const DEV_KUMAR_PORTFOLIO_URL = 'https://dev-portfolio-3000.vercel.app/';

function DevKumarLink({ className = '' }) {
  return (
    <a
      href={DEV_KUMAR_PORTFOLIO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit Dev Kumar's portfolio (opens in a new tab)"
      title="Visit Dev Kumar's portfolio (opens in a new tab)"
      className={`inline-flex items-center whitespace-nowrap underline decoration-2 underline-offset-4 transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${className}`}
    >
      Dev Kumar
      <span className="ml-1 text-[0.8em]" aria-hidden="true">↗</span>
    </a>
  );
}

export default DevKumarLink;
