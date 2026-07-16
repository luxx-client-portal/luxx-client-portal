import NotificationBellClient from './NotificationBellClient';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

type NotificationRecord = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export default async function NotificationBell() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [
    notificationsResult,
    unreadResult,
  ] = await Promise.all([
    supabase
      .from('notifications')
      .select(`
        id,
        title,
        body,
        link,
        is_read,
        created_at
      `)
      .eq('recipient_id', profile.id)
      .order('created_at', {
        ascending: false,
      })
      .limit(6),

    supabase
      .from('notifications')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('recipient_id', profile.id)
      .eq('is_read', false),
  ]);

  if (notificationsResult.error) {
    throw new Error(
      notificationsResult.error.message,
    );
  }

  if (unreadResult.error) {
    throw new Error(
      unreadResult.error.message,
    );
  }

  return (
    <NotificationBellClient
      notifications={
        (notificationsResult.data ||
          []) as NotificationRecord[]
      }
      initialUnreadCount={
        unreadResult.count || 0
      }
    />
  );
}
