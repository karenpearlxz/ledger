import { useEffect, useId, useRef } from 'react';

import { useApp } from '../lib/store.jsx';

export function Sheet({ title, subtitle, onClose, children, footer }) {
  const ref = useRef(null);
  const headingId = useId();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    // Focus the panel rather than the first field: autofocusing a text input
    // on iOS yanks the keyboard up before the sheet has finished rising.
    ref.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        ref={ref}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 id={headingId} className="text-2xl leading-tight">{title}</h2>
            {subtitle ? <p className="text-sm text-mute mt-1">{subtitle}</p> : null}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>
        {children}
        {footer ? <div className="mt-5 flex gap-2 justify-end flex-wrap">{footer}</div> : null}
      </div>
    </>
  );
}

export function Toasts() {
  const { toasts, dismiss } = useApp();
  if (!toasts.length) return null;
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast card-flat enter flex items-center gap-3 px-4 py-3 shadow-lift"
          role={t.tone === 'error' ? 'alert' : 'status'}
          style={{ borderColor: t.tone === 'error' ? 'var(--ember)' : 'var(--line)' }}
        >
          <span
            aria-hidden="true"
            className="inline-block w-2 h-2 rounded-full shrink-0"
            style={{ background: t.tone === 'error' ? 'var(--ember)' : 'var(--teal)' }}
          />
          <span className="text-sm flex-1">{t.message}</span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="text-mute text-lg leading-none px-2 -mr-2 min-h-[32px]"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export function Empty({ title, hint, action }) {
  return (
    <div className="card px-6 py-10 text-center">
      <p className="font-display text-xl mb-1">{title}</p>
      {hint ? <p className="text-sm text-mute max-w-sm mx-auto">{hint}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export const Skeleton = ({ className = 'h-4 w-24' }) => <div className={`skel ${className}`} />;

export function Bar({ percent, color = 'var(--teal)', height = 10 }) {
  const value = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div
      className="w-full rounded-pill overflow-hidden"
      style={{ height, background: 'color-mix(in srgb, var(--ink) 8%, transparent)' }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-pill transition-[width] duration-500"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

/** Confirmation lives inline next to the thing it destroys, never in an alert(). */
export function ConfirmButton({ label = 'Delete', confirmLabel = 'Sure?', onConfirm, armed, setArmed }) {
  return armed ? (
    <span className="inline-flex gap-1">
      <button type="button" className="btn btn-danger btn-sm" onClick={onConfirm}>{confirmLabel}</button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setArmed(false)}>No</button>
    </span>
  ) : (
    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setArmed(true)}>{label}</button>
  );
}
