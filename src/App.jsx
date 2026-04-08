import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import BackToTopButton from './components/BackToTopButton';
import { isSupabaseConfigured } from './services/supabaseClient';

const HomePage = lazy(() => import('./pages/HomePage'));
const LessonsPage = lazy(() => import('./pages/LessonsPage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const DashboardPage = lazy(() => import('./admin/DashboardPage'));
const LessonsManagerPage = lazy(() => import('./admin/LessonsManagerPage'));
const CategoriesManagerPage = lazy(() => import('./admin/CategoriesManagerPage'));
const MediaManagerPage = lazy(() => import('./admin/MediaManagerPage'));

function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="h-40 animate-pulse rounded-2xl bg-slate-100"
    />
  );
}

function App() {
  const location = useLocation();

  if (!isSupabaseConfigured) {
    console.error('Supabase is not configured. Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.');

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-red-200 bg-white p-10 shadow-sm">
            <p className="text-5xl" aria-hidden="true">
              ⚠️
            </p>
            <h1 className="mt-6 text-3xl font-black text-slate-900">Something went wrong</h1>
            <p className="mt-4 text-left text-slate-600">
              This site is temporarily unavailable due to database issues. Please try again later.
            </p>
            <p className="mt-6 text-left text-slate-600">
              If this continues, please contact the site owner.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-indigo-700 focus:shadow"
      >
        Skip to main content
      </a>
      <ScrollToTop />
      <Header />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <ErrorBoundary key={location.pathname} resetKey={location.pathname}>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/lessons" element={<LessonsPage />} />
              <Route path="/lesson/:id" element={<LessonPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="lessons" element={<LessonsManagerPage />} />
                <Route path="categories" element={<CategoriesManagerPage />} />
                <Route path="media" element={<MediaManagerPage />} />
              </Route>

              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <BackToTopButton />
      <Footer />
    </div>
  );
}

export default App;
