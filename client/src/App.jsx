import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

// Pages
import AuthPage from './pages/AuthPage';
import AuthorDashboard from './pages/author/AuthorDashboard';
import SubmitPaper from './pages/author/SubmitPaper';
import MyPapers from './pages/author/MyPapers';
import ChairDashboard from './pages/chair/ChairDashboard';
import ReviewersPage from './pages/chair/ReviewersPage';
import SchedulePage from './pages/chair/SchedulePage';
import ReviewerDashboard from './pages/reviewer/ReviewerDashboard';
import ReviewForm from './pages/reviewer/ReviewForm';
import MyReviews from './pages/reviewer/MyReviews';

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'author') return <Navigate to="/my-papers" replace />;
  if (user.role === 'chairperson') return <Navigate to="/papers" replace />;
  if (user.role === 'reviewer') return <Navigate to="/assigned" replace />;
  return <Navigate to="/login" replace />;
};

const AppLayout = ({ children }) => (
  <div className="flex min-h-screen bg-black">
    <Sidebar />
    <main className="flex-1 overflow-hidden">
      {children}
    </main>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#2c2c2e',
              color: '#f5f5f7',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />

          {/* Redirect /dashboard to role-specific page */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />

          {/* Author routes */}
          <Route
            path="/my-papers"
            element={
              <ProtectedRoute roles={['author']}>
                <AppLayout><AuthorDashboard /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit"
            element={
              <ProtectedRoute roles={['author']}>
                <AppLayout><SubmitPaper /></AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Chair routes */}
          <Route
            path="/papers"
            element={
              <ProtectedRoute roles={['chairperson']}>
                <AppLayout><ChairDashboard /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviewers"
            element={
              <ProtectedRoute roles={['chairperson']}>
                <AppLayout><ReviewersPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <ProtectedRoute roles={['chairperson']}>
                <AppLayout><SchedulePage /></AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Reviewer routes */}
          <Route
            path="/assigned"
            element={
              <ProtectedRoute roles={['reviewer']}>
                <AppLayout><ReviewerDashboard /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/review/:paperId"
            element={
              <ProtectedRoute roles={['reviewer']}>
                <AppLayout><ReviewForm /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-reviews"
            element={
              <ProtectedRoute roles={['reviewer']}>
                <AppLayout><MyReviews /></AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
