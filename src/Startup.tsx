export default function Startup() {
  return <div className="app-viewport startup-viewport"><div className="app-shell startup-screen startup-mobile" role="status" aria-label="Loading BinGo">
    <div className="startup-mark"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M35 8C15 8 9 17 12 29c12 8 25-1 23-21Z M14 34l15-16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg><span /></div>
    <h1>BinGo</h1><p>A greener everyday.</p><span className="sr-only">Preparing your recycling space</span>
  </div></div>;
}
