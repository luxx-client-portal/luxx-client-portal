import { createAdminClient } from '@/lib/supabase/admin';

type NotificationInput = {
  recipientId: string;
  clientId?: string | null;
  activityId?: string | null;
  notificationType: string;
  title: string;
  body?: string | null;
  link?: string | null;
};

type BulkNotificationInput = Omit<
  NotificationInput,
  'recipientId'
> & {
  recipientIds: string[];
};

export async function createNotification(
  notification: NotificationInput,
) {
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from('notifications')
    .insert({
      recipient_id: notification.recipientId,
      client_id: notification.clientId || null,
      activity_id: notification.activityId || null,
      notification_type: notification.notificationType,
      title: notification.title,
      body: notification.body || null,
      link: notification.link || null,
    });

  if (error) {
    console.error(
      'Notification creation failed:',
      error.message,
    );
  }
}

export async function createNotifications(
  notification: BulkNotificationInput,
) {
  const recipientIds = [
    ...new Set(notification.recipientIds),
  ].filter(Boolean);

  if (!recipientIds.length) {
    return;
  }

  const adminSupabase = createAdminClient();

  const rows = recipientIds.map((recipientId) => ({
    recipient_id: recipientId,
    client_id: notification.clientId || null,
    activity_id: notification.activityId || null,
    notification_type:
      notification.notificationType,
    title: notification.title,
    body: notification.body || null,
    link: notification.link || null,
  }));

  const { error } = await adminSupabase
    .from('notifications')
    .insert(rows);

  if (error) {
    console.error(
      'Bulk notification creation failed:',
      error.message,
    );
  }
}

export async function getClientUserIds(
  clientId: string,
) {
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from('profiles')
    .select('id')
    .eq('client_id', clientId)
    .eq('role', 'client');

  if (error) {
    console.error(
      'Unable to load client recipients:',
      error.message,
    );

    return [];
  }

  return (data || []).map((profile) => profile.id);
}

export async function getAdminUserIds() {
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin');

  if (error) {
    console.error(
      'Unable to load admin recipients:',
      error.message,
    );

    return [];
  }

  return (data || []).map((profile) => profile.id);
}
