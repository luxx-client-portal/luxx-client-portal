import { notFound } from 'next/navigation';
import { CalendarDays, Image, Video } from 'lucide-react';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Badge, Empty } from '@/components/UI';
import { dateLabel } from '@/lib/utils';

export default async function ClientContentPage({
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
    .select('*')
    .eq('client_id', id)
    .order('scheduled_for', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const items = data || [];

  const pending = items.filter(
    (item) =>
      item.status === 'client_review' ||
      item.status === 'changes_requested',
  );

  const approved = items.filter(
    (item) => item.status === 'approved',
  );

  const scheduled = items.filter(
    (item) => item.status === 'scheduled',
  );

  return (
    <>
      <section className="stat-grid">
        <Stat
          label="Pending review"
          value={String(pending.length)}
        />

        <Stat
          label="Approved"
          value={String(approved.length)}
        />

        <Stat
          label="Scheduled"
          value={String(scheduled.length)}
        />

        <Stat
          label="Total content"
          value={String(items.length)}
        />
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <p className="eyebrow">CONTENT LIBRARY</p>
            <h2>All content</h2>
          </div>
        </div>

        {items.length ? (
          <div className="content-grid">
            {items.map((item) => (
              <article className="content-item-card" key={item.id}>
                <div className="content-item-preview">
                  {item.preview_url ? (
                    item.content_type?.toLowerCase() === 'reel' ||
                    item.content_type?.toLowerCase() === 'video' ? (
                      <video
                        src={item.preview_url}
                        controls
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={item.preview_url}
                        alt={item.title}
                      />
                    )
                  ) : (
                    <div className="content-placeholder">
                      {item.content_type?.toLowerCase() === 'reel' ||
                      item.content_type?.toLowerCase() === 'video' ? (
                        <Video size={28} />
                      ) : (
                        <Image size={28} />
                      )}
                    </div>
                  )}
                </div>

                <div className="content-item-body">
                  <div className="content-item-heading">
                    <div>
                      <strong>{item.title}</strong>
                      <small>
                        {item.content_type || 'Post'}
                      </small>
                    </div>

                    <Badge value={item.status} />
                  </div>

                  {item.caption && (
                    <p className="content-caption">
                      {item.caption}
                    </p>
                  )}

                  <div className="content-item-date">
                    <CalendarDays size={15} />
                    {dateLabel(item.scheduled_for)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="No content yet"
            body="Content added for this client will appear here."
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
