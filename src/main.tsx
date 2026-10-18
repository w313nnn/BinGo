import { lazy, Suspense, useEffect, useState, Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import Startup from './Startup';
const appModule = import('./App.tsx');
const App = lazy(() => appModule);
function Boot() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650);
    const pause = () => document.documentElement.classList.toggle('motion-paused', document.hidden);
    pause(); document.addEventListener('visibilitychange', pause);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', pause); };
  }, []);
  return ready ? <Suspense fallback={<Startup />}><App /></Suspense> : <Startup />;
}
import { MotionConfig } from 'motion/react';
import './index.css';

declare global {
  interface Window { gm_authFailure?: () => void; }
}

// Google Maps also reports authentication failures through this callback.
window.gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-auth-failed'));
};
const originalError = console.error;
console.error = (...args: unknown[]) => {
  originalError.apply(console, args);
  const message = args.map(String).join(' ');
  if (message.includes('OverQuotaMapError') || message.includes('QuotaExceededError')) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('BinGo rendering failed', error, info.componentStack);
  }
  render() {
    if (this.state.failed) {
      return (
        <main className="min-h-screen flex items-center justify-center p-6">
          <section role="alert" className="max-w-sm rounded-2xl bg-white p-6 shadow-sm">
            <h1 className="text-xl font-bold">BinGo could not load this screen</h1>
            <p className="my-4 text-slate-600">Reload to try again. Any unsaved changes may be lost.</p>
            <button type="button" onClick={() => window.location.reload()}
              className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white">
              Reload BinGo
            </button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
if (!root) throw new Error('BinGo requires a #root element in index.html.');
createRoot(root).render(<AppErrorBoundary><MotionConfig reducedMotion="user"><Boot /></MotionConfig></AppErrorBoundary>);
