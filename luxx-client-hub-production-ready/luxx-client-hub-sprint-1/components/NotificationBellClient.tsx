'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Check,
  ExternalLink,
} from 'lucide-react';

import { markNotificationReadAction } from '@/lib/actions/notifications';

type NotificationRecord = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationBellClient({
  notifications,
  initialUnreadCount,
}: {
  notifications: NotificationRecord[];
  initialUnreadCount: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      );
    };
  }, []);

  return (
    <div
      className="notification-bell-wrapper"
      ref={dropdownRef}
    >
      <button
        type="button"
        className="notification-button"
        onClick={() =>
          setIsOpen((current) => !current)
        }
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        <Bell size={20} />

        {initialUnreadCount > 0 && (
          <span className="notification-badge">
            {initialUnreadCount > 99
              ? '99+'
              : initialUnreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-head">
            <div>
              <p className="eyebrow">
                UPDATES
              </p>

              <h3>Notifications</h3>
            </div>

            <span>
              {initialUnreadCount} unread
            </span>
          </div>

          {notifications.length ? (
            <div className="notification-dropdown-list">
              {notifications.map(
                (notification) => (
                  <article
                    className={
                      notification.is_read
                        ? 'notification-dropdown-item'
                        : 'notification-dropdown-item unread'
                    }
                    key={notification.id}
                  >
                    <div className="notification-dropdown-icon">
                      <Bell size={16} />
                    </div>

                    <div className="notification-dropdown-copy">
                      <strong>
                        {notification.title}
                      </strong>

                      {notification.body && (
                        <p>
                          {notification.body}
                        </p>
                      )}

                      <small>
                        {formatNotificationDate(
                          notification.created_at,
                        )}
                      </small>
                    </div>

                    <div className="notification-dropdown-actions">
                      {notification.link && (
                        <Link
                          href={notification.link}
                          onClick={() =>
                            setIsOpen(false)
                          }
                          aria-label="Open notification"
                        >
                          <ExternalLink size={15} />
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
                            aria-label="Mark notification as read"
                          >
                            <Check size={15} />
                          </button>
                        </form>
                      )}
                    </div>
                  </article>
                ),
              )}
            </div>
          ) : (
            <div className="notification-dropdown-empty">
              <Bell size={24} />
              <strong>No notifications yet</strong>
              <p>
                New approvals, comments and uploads
                will appear here.
              </p>
            </div>
          )}

          <Link
            href="/notifications"
            className="notification-dropdown-footer"
            onClick={() => setIsOpen(false)}
          >
            View all notifications
            <ExternalLink size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}

function formatNotificationDate(value: string) {
  const date = new Date(value);
  const now = new Date();

  const difference =
    now.getTime() - date.getTime();

  const minutes = Math.floor(
    difference / 60000,
  );

  if (minutes < 1) {
    return 'Just now';
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}
