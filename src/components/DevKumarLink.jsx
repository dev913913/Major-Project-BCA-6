export const DEV_KUMAR_PORTFOLIO_URL = 'https://dev-portfolio-3000.vercel.app/';

function DevKumarLink({ className = '' }) {
  return (
    <a
      href={DEV_KUMAR_PORTFOLIO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      Dev Kumar
    </a>
  );
}

export default DevKumarLink;
