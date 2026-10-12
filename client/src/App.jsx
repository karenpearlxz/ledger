import { Navigate, Route, Routes } from 'react-router-dom';

import Shell from './components/Shell.jsx';
import { useApp } from './lib/store.jsx';
import Bills from './pages/Bills.jsx';
import Figures from './pages/Figures.jsx';
import Home from './pages/Home.jsx';
import Lock from './pages/Lock.jsx';
import Money from './pages/Money.jsx';
import Notes from './pages/Notes.jsx';
import Swertres from './pages/Swertres.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  const { unlocked } = useApp();

  // Still asking the server. Rendering the lock screen here would flash it at
  // her on every reload even though she is signed in.
  if (unlocked === null) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <p className="eyebrow">opening</p>
      </div>
    );
  }

  if (!unlocked) return <Lock />;

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/money" element={<Money />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/figures" element={<Figures />} />
        <Route path="/swertres" element={<Swertres />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
