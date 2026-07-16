import Link from 'next/link';
import {
  BarChart3,
  CalendarCheck2,
  CalendarDays,
  Files,
  LayoutDashboard,
  LogOut,
  MessageSquarePlus,
  ReceiptText,
  Settings,
  Users,
} from 'lucide-react';

import { logoutAction } from '@/lib/actions/auth';
import type { Profile } from '@/lib/types';

const clientNav = [
  ['/dashboard', 'Dashboard', LayoutDashboard],
  ['/content', 'Content', CalendarDays],
  ['/documents', 'Documents', Files],
  ['/invoices', 'Invoices', ReceiptText],
  ['/requests', 'Requests', MessageSquarePlus],
  ['/settings', 'Settings', Settings],
] as const;

const adminNav = [
  ['/dashboard', 'Dashboard', LayoutDashboard],
  ['/admin/clients', 'Clients', Users],
  ['/admin/calendar', 'Calendar', CalendarDays],
  ['/admin/approvals', 'Approvals', CalendarCheck2],
  ['/requests', 'Requests', MessageSquarePlus],
  ['/admin/invoices', 'Invoices', ReceiptText],
  ['/admin/documents', 'Documents', Files],
  ['/admin/analytics', 'Analytics', BarChart3],
  ['/settings', 'Settings', Settings],
] as const;

export function Sidebar({
  profile,
}: {
  profile: Profile;
}) {
  const navigation =
    profile.role === 'admin'
      ? adminNav
      : clientNav;

  return (
    <aside className="sidebar">
      <Link
        href="/dashboard"
        className="logo"
      >
        <span>L</span>

        <div>
          LUXX
          <small>CLIENT HUB</small>
        </div>
      </Link>

      <nav>
        <p className="nav-label">
          {profile.role === 'admin'
            ? 'LUXX OS'
            : 'WORKSPACE'}
        </p>

        {navigation.map(
          ([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ),
        )}
      </nav>

      <div className="sidebar-bottom">
        <div className="avatar">
          {(profile.full_name || 'L')
            .slice(0, 1)
            .toUpperCase()}
        </div>

        <div>
          <strong>
            {profile.full_name ||
              'Luxx User'}
          </strong>

          <small>
            {profile.role === 'admin'
              ? 'Luxx Team'
              : profile.clients?.name ||
                'Client'}
          </small>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={17} />
          </button>
        </form>
      </div>
    </aside>
  );
}
