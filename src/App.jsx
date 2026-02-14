import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

const HomePage = lazy(() => import('./pages/HomePage'));
const LessonsPage = lazy(() => import('./pages/LessonsPage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const DashboardPage = lazy(() => import('./admin/DashboardPage'));
const LessonsManagerPage = lazy(() => import('./admin/LessonsManagerPage'));
const CategoriesManagerPage = lazy(() => import('./admin/CategoriesManagerPage'));
const MediaManagerPage = lazy(() => import('./admin/MediaManagerPage'));

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
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

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default App;
