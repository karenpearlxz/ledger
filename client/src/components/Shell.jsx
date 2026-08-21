import { NavLink, useLocation } from 'react-router-dom';

import { refreshAll, useApp } from '../lib/store.jsx';
import PullToRefresh from './PullToRefresh.jsx';
import {
  BillsIcon, FiguresIcon, GearIcon, HomeIcon, MoonIcon, NotesIcon, SunIcon, WalletIcon,
} from './icons.jsx';
import { Toasts } from './ui.jsx';

const TABS = [
  { to: '/', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/bills', label: 'Bills', Icon: BillsIcon },
  { to: '/money', label: 'Money', Icon: WalletIcon },
  { to: '/notes', label: 'Notes', Icon: NotesIcon },
  { to: '/figures', label: 'Figures', Icon: FiguresIcon },
];

function ThemeButton({ compact }) {
  const { theme, toggleTheme } = useApp();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={compact ? 'btn btn-ghost btn-sm !min-h-[38px] !px-2.5' : 'railitem w-full'}
      aria-label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
    >
      {theme === 'dark' ? <SunIcon width={18} height={18} /> : <MoonIcon width={18} height={18} />}
      {compact ? null : <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>}
    </button>
  );
}

export default function Shell({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="app-grid">
      <div className="status-shade" aria-hidden="true" />

      {/* Desktop rail. Below the breakpoint this is display:none and the
          bottom tab bar takes over, so there is exactly one nav on screen. */}
      <aside className="rail">
        <div className="rail-inner">
          <div className="mb-8 pl-3">
            <p className="font-display text-3xl leading-none">Ledger</p>
            <p className="eyebrow mt-1.5">karen’s own</p>
          </div>

          <nav className="flex flex-col gap-1" aria-label="Sections">
            {TABS.map(({ to, label, Icon, end }) => (
              <NavLink key={to} to={to} end={end} className="railitem">
                <Icon width={18} height={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-1 pt-6">
            <NavLink to="/settings" className="railitem">
              <GearIcon width={18} height={18} />
              <span>Settings</span>
            </NavLink>
            <ThemeButton />
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Mobile header only; on desktop the rail carries the wordmark. */}
        <header className="topbar md:hidden">
          <div className="shell flex items-center justify-between gap-3 pb-2.5">
            <div className="flex items-baseline gap-2.5">
              <span className="font-display text-2xl leading-none">Ledger</span>
            </div>
            <nav className="flex items-center gap-1">
              <NavLink
                to="/settings"
                className="btn btn-ghost btn-sm !min-h-[38px] !px-2.5"
                aria-label="Settings"
                aria-current={pathname === '/settings' ? 'page' : undefined}
              >
                <GearIcon width={17} height={17} />
              </NavLink>
              <ThemeButton compact />
            </nav>
          </div>
        </header>

        <main className="shell content pt-5 md:pt-10 page-bottom">
          <PullToRefresh onRefresh={refreshAll}>
            {children}
          </PullToRefresh>
        </main>
      </div>

      <nav className="tabbar md:hidden" aria-label="Sections">
        {TABS.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            {({ isActive }) => (
              <>
                <Icon width={20} height={20} style={{ opacity: isActive ? 1 : 0.75 }} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <Toasts />
    </div>
  );
}
