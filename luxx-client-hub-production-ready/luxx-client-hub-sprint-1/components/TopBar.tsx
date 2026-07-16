import Link from 'next/link';
import { Bell, Search } from 'lucide-react';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function TopBar() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { count } = await supabase
    .from('notifications')
    .select('*', {
      count: 'exact',
      head: true,
    })
    .eq('recipient_id', profile.id)
    .eq('is_read', false);

  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={18} />

        <input
          placeholder="Search..."
          disabled
        />
      </div>

      <div className="topbar-actions">
        <Link
          href="/notifications"
          className="notification-button"
        >
          <Bell size={20} />

          {!!count && (
            <span className="notification-badge">
              {count > 99 ? '99+' : count}
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
