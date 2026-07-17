import Link from 'next/link';
import { Bell } from 'lucide-react';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function TopBar() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', {
      count: 'exact',
      head: true,
    })
    .eq('recipient_id', profile.id)
    .eq('is_read', false);

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

          {(unreadCount ?? 0) > 0 && (
            <span className="notification-badge">
              {(unreadCount ?? 0) > 99
                ? '99+'
                : unreadCount}
            </span>
          )}
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
