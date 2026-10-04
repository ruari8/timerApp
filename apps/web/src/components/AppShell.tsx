import { Link } from '@tanstack/react-router';
import { ListOrdered, Settings, Timer, Watch } from 'lucide-react';

const TABS = [
  { to: '/', label: 'Timer', icon: Timer },
  { to: '/stopwatch', label: 'Stopwatch', icon: Watch },
  { to: '/routines', label: 'Routines', icon: ListOrdered },
] as const;

// Page frame for the three main tabs: title row on top, tab bar pinned to the bottom
export function AppShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-cream">
      <header className="px-5 pt-6">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <h1 className="text-3xl font-black">{title}</h1>
          <div className="flex items-center gap-2">
            {action}
            <Link
              to="/settings"
              className="grid h-10 w-10 place-items-center rounded-full bg-card text-cream/60 transition-colors hover:text-cream"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pb-28 pt-5">
        <div className="mx-auto max-w-xl">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto grid max-w-xl grid-cols-3">
          {TABS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-1 py-3 text-xs font-bold text-cream/45 transition-colors hover:text-cream/80"
              activeProps={{ className: '!text-signal' }}
              activeOptions={{ exact: true }}
            >
              <Icon className="h-6 w-6" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
