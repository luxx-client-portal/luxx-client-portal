import Link from 'next/link';
import { Bell } from 'lucide-react';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function NotificationBell() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { count } = await supabase
    .from('notifications')
    .select('*', {
      head: true,
      count: 'exact',
    })
    .eq('recipient_id', profile.id)
    .eq('is_read', false);

  return (
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
  );
}
