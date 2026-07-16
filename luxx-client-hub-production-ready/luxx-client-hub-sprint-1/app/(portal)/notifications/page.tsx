import Link from 'next/link';
import {
  Bell,
  Check,
  CheckCheck,
} from 'lucide-react';

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/lib/actions/notifications';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Empty, PageHeader } from '@/components/UI';

type NotificationRecord = {
  id: string;
  notification_type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export default async function NotificationsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      id,
      notification_type,
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
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  const notifications =
    (data || []) as NotificationRecord[];

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="NOTIFICATIONS"
        title="Notification Center"
        description="Review recent approvals, comments, uploads and client activity."
      />

      <section className="notification-summary">
        <div className="stat">
          <div className="stat-icon">
            <Bell />
          </div>

          <div>
            <strong>{unreadCount}</strong>
            <span>Unread notifications</span>
          </div>
        </div>

        {unreadCount > 0 && (
          <form
            action={markAllNotificationsReadAction}
          >
            <button
              type="submit"
              className="button secondary"
            >
              <CheckCheck size={17} />
              Mark all as read
            </button>
          </form>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <p className="eyebrow">
              RECENT ACTIVITY
            </p>

            <h2>Notifications</h2>
          </div>
        </div>

        {notifications.length ? (
          <div className="notification-list">
            {notifications.map(
              (notification) => (
                <article
                  className={
                    notification.is_read
                      ? 'notification-row'
                      : 'notification-row unread'
                  }
                  key={notification.id}
                >
                  <div className="notification-icon">
                    <Bell size={18} />
                  </div>

                  <div className="notification-copy">
                    <strong>
                      {notification.title}
                    </strong>

                    {notification.body && (
                      <p>
                        {notification.body}
                      </p>
                    )}

                    <small>
                      {new Intl.DateTimeFormat(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        },
                      ).format(
                        new Date(
                          notification.created_at,
                        ),
                      )}
                    </small>
                  </div>

                  <div className="notification-actions">
                    {notification.link && (
                      <Link
                        href={notification.link}
                        className="notification-link"
                      >
                        Open
                      </Link>
                    )}

                    {!notification.is_read && (
                      <form
                        action={
                          markNotificationReadAction
                        }
                      >
                        <input
                          type="hidden"
                          name="notification_id"
                          value={notification.id}
                        />

                        <button
                          type="submit"
                          className="notification-read-button"
                          title="Mark as read"
                          aria-label="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      </form>
                    )}
                  </div>
                </article>
              ),
            )}
          </div>
        ) : (
          <Empty
            title="No notifications yet"
            body="Approvals, comments and other updates will appear here."
          />
        )}
      </section>
    </>
  );
}
