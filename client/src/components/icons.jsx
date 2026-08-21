const base = {
  width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': 'true',
};

export const HomeIcon = (p) => (
  <svg {...base} {...p}><path d="M3 10.5 12 4l9 6.5V19a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
);
export const BillsIcon = (p) => (
  <svg {...base} {...p}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4M8 14h.01M12 14h.01M16 14h.01" /></svg>
);
export const WalletIcon = (p) => (
  <svg {...base} {...p}><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2" /><rect x="3" y="7" width="18" height="12" rx="2" /><path d="M16 13h2" /></svg>
);
export const NotesIcon = (p) => (
  <svg {...base} {...p}><path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v6h6M9 13h7M9 17h5" /></svg>
);
export const FiguresIcon = (p) => (
  <svg {...base} {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5" /></svg>
);
export const GearIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 14.5H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 8.5l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9.5 3V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.3z" /></svg>
);
export const SunIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const MoonIcon = (p) => (
  <svg {...base} {...p}><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" /></svg>
);
export const PlusIcon = (p) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const CheckIcon = (p) => (
  <svg {...base} {...p}><path d="m4 12.5 5 5L20 6.5" /></svg>
);
export const SearchIcon = (p) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></svg>
);
export const ChevronIcon = (p) => (
  <svg {...base} {...p}><path d="m9 6 6 6-6 6" /></svg>
);
export const AlertIcon = (p) => (
  <svg {...base} {...p}><path d="M12 3.5 22 20H2z" /><path d="M12 10v4M12 17h.01" /></svg>
);
