import { Component } from 'react';
import { Link } from 'react-router-dom';
import { reportError } from '../utils/errorUtils';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    reportError('UI runtime crash', { error, info });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-red-700">
          We hit an unexpected issue while rendering this page. Please refresh and try again.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
            onClick={() => window.location.reload()}
          >
            Refresh page
          </button>
          <Link
            to="/"
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
          >
            Go to homepage
          </Link>
        </div>
      </section>
    );
  }
}

export default ErrorBoundary;
