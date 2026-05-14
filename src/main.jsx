import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';

// Note: React StrictMode is intentionally removed.
// StrictMode double-invokes effects and state initialisers in development,
// which exposed and worsened the OAuth callback race condition. Auth state
// management is now robust enough to handle it (ref guard in OAuthCallbackPage),
// but removing StrictMode eliminates the noise during development and avoids
// any future regressions from double effect execution.
createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </AuthProvider>
);
