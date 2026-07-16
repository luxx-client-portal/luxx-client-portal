import Link from 'next/link';
import { Bell } from 'lucide-react';

import { requireProfile } from '@/lib/auth';

export default async function TopBar() {
  const profile = await requireProfile();

  return (
    <header className="topbar">
      <div className="topbar-spacer" />

      <div className="topbar-actions">
        <Link
          href="/notifications"
          className="notification-button"
          aria-label="View notifications"
        >
          <Bell size={20} />
        </Link>

        <div className="topbar-avatar">
          {(profile.full_name || 'L')
            .charAt(0)
            .toUpperCase()}
        </div>
      </div>
    </header>
  );
}
