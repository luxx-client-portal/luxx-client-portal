import NotificationBell from './NotificationBell';

import { requireProfile } from '@/lib/auth';

export default async function TopBar() {
  const profile = await requireProfile();

  return (
    <header className="topbar">
      <div className="topbar-spacer" />

      <div className="topbar-actions">
        <NotificationBell />

        <div className="topbar-avatar">
          {(profile.full_name || 'L')
            .charAt(0)
            .toUpperCase()}
        </div>
      </div>
    </header>
  );
}
