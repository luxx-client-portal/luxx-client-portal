import { notFound } from 'next/navigation';
import { CalendarDays } from 'lucide-react';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Badge, Empty } from '@/components/UI';
import { dateLabel } from '@/lib/utils';

type ContentItem = {
  id: string;
  title: string;
  content_type: string | null;
  scheduled_for: string | null;
  status: string;
};

export default async function ClientCalendarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireProfile(true);

  const { id } = await params;
  const supabase = await createClient();

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .single();

  if (clientError || !client) {
    notFound();
  }

  const { data, error } = await supabase
    .from('content_items')
    .select('id, title, content_type, scheduled_for, status')
    .eq('client_id', id)
    .order('scheduled_for', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const items = (data || []) as ContentItem[];

  const groupedItems = items.reduce<Record<string, ContentItem[]>>(
    (groups, item) => {
      const key = item.scheduled_for
        ? item.scheduled_for.slice(0, 7)
        : 'unscheduled';

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(item);
      return groups;
    },
    {},
  );

  const groupEntries = Object.entries(groupedItems);

  return (
    <>
      <section className="stat-grid">
        <Stat label="Total posts" value={String(items.length)} />

        <Stat
          label="Scheduled"
          value={String(
            items.filter((item) => item.status === 'scheduled').length,
          )}
        />

        <Stat
          label="Approved"
          value={String(
            items.filter((item) => item.status === 'approved').length,
          )}
        />

        <Stat
          label="Needs review"
          value={String(
            items.filter(
              (item) =>
                item.status === 'client_review' ||
                item.status === 'changes_requested',
            ).length,
          )}
        />
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <p className="eyebrow">CONTENT CALENDAR</p>
            <h2>Upcoming schedule</h2>
          </div>
        </div>

        {groupEntries.length ? (
          <div className="calendar-groups">
            {groupEntries.map(([monthKey, monthItems]) => (
              <section className="calendar-group" key={monthKey}>
                <div className="calendar-month">
                  <CalendarDays size={18} />

                  <strong>
                    {monthKey === 'unscheduled'
                      ? 'Unscheduled'
                      : new Intl.DateTimeFormat('en-US', {
                          month: 'long',
                          year: 'numeric',
                        }).format(
                          new Date(`${monthKey}-01T12:00:00`),
                        )}
                  </strong>
                </div>

                <div className="calendar-list">
                  {monthItems.map((item) => (
                    <div className="calendar-row" key={item.id}>
                      <div className="calendar-date">
                        <strong>
                          {item.scheduled_for
                            ? new Intl.DateTimeFormat('en-US', {
                                day: 'numeric',
                              }).format(
                                new Date(item.scheduled_for),
                              )
                            : '—'}
                        </strong>

                        <span>
                          {item.scheduled_for
                            ? new Intl.DateTimeFormat('en-US', {
                                weekday: 'short',
                              }).format(
                                new Date(item.scheduled_for),
                              )
                            : 'TBD'}
                        </span>
                      </div>

                      <div className="calendar-item-copy">
                        <strong>{item.title}</strong>

                        <small>
                          {item.content_type || 'Post'} ·{' '}
                          {dateLabel(item.scheduled_for)}
                        </small>
                      </div>

                      <Badge value={item.status} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <Empty
            title="No scheduled content"
            body="Posts added for this client will appear here by month."
          />
        )}
      </section>
    </>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="stat">
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
