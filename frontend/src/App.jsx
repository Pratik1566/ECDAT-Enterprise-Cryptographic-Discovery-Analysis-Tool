import { useState } from 'react';
import Navbar from './components/Navbar';
import UploadPage from './pages/UploadPage';
import OverviewPage from './pages/OverviewPage';
import DetailPage from './pages/DetailPage';
import {runScan, runScanFromGithub} from './lib/api';

export default function App() {
  const [view, setView] = useState('upload'); // 'upload' | 'overview' | 'detail'
  const [scan, setScan] = useState(null); // { files, profile, scenario, meta }
  const [findings, setFindings] = useState([]);
  const [activeId, setActiveId] = useState(null);

  // TODO(backend): replace this block with a real API call once the backend is live:
  //   const res = await fetch(`${API_URL}/api/scan`, { method: 'POST', body: formData });
  //   const data = await res.json();
  // Until then we enrich the bundled sample JSON with the chosen profile/scenario.
  async function handleScanComplete(params) {
    setScan(params);
    const data = params.repo
        ? await runScanFromGithub(params.repo.owner, params.repo.repo, params.profile, params.scenario)
        : await runScan(params.files, params.profile, params.scenario);
    setFindings(data.findings);
    setActiveId(null);
    setView('overview');
  }

  const activeIndex = findings.findIndex((f) => f.id === activeId);
  const activeFinding = activeIndex >= 0 ? findings[activeIndex] : null;

  return (
    <div className="app">
      <Navbar current={view === 'detail' ? 'detail' : view} />

      <main className="app-main">
        {view === 'upload' && (
          <UploadPage onComplete={handleScanComplete} />
        )}

        {view === 'overview' && scan && (
          <OverviewPage
            scan={scan}
            findings={findings}
            onOpenFinding={(id) => { setActiveId(id); setView('detail'); }}
            onRescan={() => { setScan(null); setFindings([]); setView('upload'); }}
          />
        )}

        {view === 'detail' && activeFinding && (
          <DetailPage
            finding={activeFinding}
            index={activeIndex}
            total={findings.length}
            onBack={() => setView('overview')}
            onPrev={() => setActiveId(findings[Math.max(activeIndex - 1, 0)].id)}
            onNext={() => setActiveId(findings[Math.min(activeIndex + 1, findings.length - 1)].id)}
          />
        )}
      </main>

      <footer className="app-footer">
        ECDAT · SIH 2026 · SIH26164 — prototype frontend · sample data
      </footer>
    </div>
  );
}
