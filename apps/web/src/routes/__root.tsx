import { createRootRoute, Outlet, Link } from '@tanstack/react-router';
import { Settings } from 'lucide-react';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}
