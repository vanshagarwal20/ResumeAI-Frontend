import { useState, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import EditorPage from './pages/EditorPage';
import AnalysisPage from './pages/AnalysisPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import ExportHistoryPage from './pages/ExportHistoryPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import JobMatchPage from './pages/JobMatchPage';

const PATH_TO_PAGE = {
  '/oauth/callback': 'oauth/callback',
  '/dashboard': 'dashboard',
  '/editor': 'editor',
  '/analysis': 'analysis',
  '/profile': 'profile',
  '/admin': 'admin',
  '/exports': 'exports',
  '/job-matches': 'job-matches',
};

export default function App() {
  const [page, setPage] = useState(() => {
    // After Google's hard redirect, pathname tells us where we are.
    return PATH_TO_PAGE[window.location.pathname] ?? 'landing';
  });
  const [editorResumeId, setEditorResumeId] = useState(null);

  // useCallback prevents PrivateRoute/AdminRoute useEffect from re-firing on
  // every parent render (stale navigate reference was causing spurious redirect
  // checks that could kick authenticated users back to landing).
  const navigate = useCallback((p, opts = {}) => {
    if (opts.resumeId) setEditorResumeId(opts.resumeId);
    setPage(p);
    // Keep browser URL in sync so refresh lands on the right page
    const path = Object.entries(PATH_TO_PAGE).find(([, v]) => v === p)?.[0] ?? '/';
    window.history.pushState(null, '', path);
    window.scrollTo(0, 0);
  }, []);

  switch (page) {
    case 'landing':
      return <LandingPage onNavigate={navigate} />;
    case 'dashboard':
      return <PrivateRoute onNavigate={navigate}><DashboardPage onNavigate={navigate} /></PrivateRoute>;
    case 'editor':
      return <PrivateRoute onNavigate={navigate}><EditorPage onNavigate={navigate} resumeId={editorResumeId} /></PrivateRoute>;
    case 'analysis':
      return <PrivateRoute onNavigate={navigate}><AnalysisPage onNavigate={navigate} resumeId={editorResumeId} /></PrivateRoute>;
    case 'profile':
      return <PrivateRoute onNavigate={navigate}><ProfilePage onNavigate={navigate} /></PrivateRoute>;
    case 'admin':
      return <AdminRoute onNavigate={navigate}><AdminPage onNavigate={navigate} /></AdminRoute>;
    case 'exports':
      return <PrivateRoute onNavigate={navigate}><ExportHistoryPage onNavigate={navigate} /></PrivateRoute>;
    case 'job-matches':
      return <PrivateRoute onNavigate={navigate}><JobMatchPage onNavigate={navigate} /></PrivateRoute>;
    case 'oauth/callback':
      return <OAuthCallbackPage onNavigate={navigate} />;
    default:
      return <LandingPage onNavigate={navigate} />;
  }
}
