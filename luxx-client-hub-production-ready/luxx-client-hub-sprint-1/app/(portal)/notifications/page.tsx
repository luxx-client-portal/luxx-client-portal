import Link from 'next/link';
import {
  Bell,
  Check,
  CheckCheck,
  CircleCheck,
  FileUp,
  MessageSquare,
  RefreshCw,
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

function relativeDate(value: string) {
  const date = new Date(value);
  const now = new Date();

  const differenceInSeconds = Math.floor(
    (now.getTime() - date.getTime()) / 1000,
  );

  if (differenceInSeconds < 60) {
    return 'Just now';
  }

  const differenceInMinutes = Math.floor(
    differenceInSeconds / 60,
  );

  if (differenceInMinutes < 60) {
    return `${differenceInMinutes} ${
      differenceInMinutes === 1 ? 'minute' : 'minutes'
    } ago`;
  }

  const differenceInHours = Math.floor(
    differenceInMinutes / 60,
  );

  if (differenceInHours < 24) {
    return `${differenceInHours} ${
      differenceInHours === 1 ? 'hour' : 'hours'
    } ago`;
  }

  const differenceInDays = Math.floor(
    differenceInHours / 24,
  );

  if (differenceInDays === 1) {
    return 'Yesterday';
  }

  if (differenceInDays < 7) {
    return `${differenceInDays} days ago`;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year:
      date.getFullYear() !== now.getFullYear()
        ? 'numeric'
        : undefined,
  }).format(date);
}

function NotificationIcon({
  type,
}: {
  type: string;
}) {
  if (
    type === 'content_approved' ||
    type === 'request_status_updated'
  ) {
    return <CircleCheck size={18} />;
  }

  if (
    type === 'content_uploaded' ||
    type === 'document_uploaded'
  ) {
    return <FileUp size={18} />;
  }

  if (
    type === 'content_comment' ||
    type === 'request_created'
  ) {
    return <MessageSquare size={18} />;
  }

  if (type === 'content_changes_requested') {
    return <RefreshCw size={18} />;
  }

  return <Bell size={18} />;
}

export default async function NotificationsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notifications')
    .select(
      `
        id,
        notification_type,
        title,
        body,
        link,
        is_read,
        created_at
      `,
    )
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
            <Bell size={21} />
          </div>

          <div>
            <strong>{unreadCount}</strong>
            <span>
              {unreadCount === 1
                ? 'Unread notification'
                : 'Unread notifications'}
            </span>
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

          <span className="notification-total">
            {notifications.length}{' '}
            {notifications.length === 1
              ? 'notification'
              : 'notifications'}
          </span>
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
                    <NotificationIcon
                      type={
                        notification.notification_type
                      }
                    />
                  </div>

                  <div className="notification-copy">
                    <div className="notification-title-row">
                      <strong>
                        {notification.title}
                      </strong>

                      {!notification.is_read && (
                        <span
                          className="notification-unread-dot"
                          aria-label="Unread"
                        />
                      )}
                    </div>

                    {notification.body && (
                      <p>{notification.body}</p>
                    )}

                    <small
                      title={new Intl.DateTimeFormat(
                        'en-US',
                        {
                          month: 'long',
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
                    >
                      {relativeDate(
                        notification.created_at,
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
            body="Approvals, comments, uploads and request updates will appear here."
          />
        )}
      </section>
    </>
  );
}
