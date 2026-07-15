import { notFound } from 'next/navigation';
import {
  CalendarDays,
  Image as ImageIcon,
  Video,
} from 'lucide-react';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createContentAction } from '@/lib/actions/portal';
import { Badge, Empty } from '@/components/UI';
import { AdminForm } from '@/components/AdminForms';
import { dateLabel } from '@/lib/utils';

type ContentRecord = {
  id: string;
  title: string;
  content_type: string | null;
  caption: string | null;
  preview_url: string | null;
  scheduled_for: string | null;
  status: string;
};

export default async function ClientContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireProfile(true);

  const { id } = await params;
  const supabase = await createClient();

  const { data: client, error: clientError } =
    await supabase
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
    .order('scheduled_for', {
      ascending: true,
      nullsFirst: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const items = (data || []) as ContentRecord[];

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

      <section className="content-admin-layout">
        <AdminForm
          title="Add Content"
          action={createContentAction}
        >
          <input
            type="hidden"
            name="client_id"
            value={id}
          />

          <label>
            Content title
            <input name="title" required />
          </label>

          <label>
            Content type
            <select
              name="content_type"
              defaultValue="Reel"
            >
              <option value="Reel">Reel</option>
              <option value="Carousel">
                Carousel
              </option>
              <option value="Photo">Photo</option>
              <option value="Story">Story</option>
              <option value="TikTok">TikTok</option>
              <option value="Video">Video</option>
            </select>
          </label>

          <label>
            Caption
            <textarea
              name="caption"
              rows={8}
            />
          </label>

          <label>
            Preview URL
            <input
              name="preview_url"
              type="url"
            />
          </label>

          <label>
            Scheduled date and time
            <input
              name="scheduled_for"
              type="datetime-local"
            />
          </label>

          <label>
            Status
            <select
              name="status"
              defaultValue="draft"
            >
              <option value="draft">Draft</option>

              <option value="internal_review">
                Internal review
              </option>

              <option value="client_review">
                Client review
              </option>

              <option value="changes_requested">
                Changes requested
              </option>

              <option value="approved">
                Approved
              </option>

              <option value="scheduled">
                Scheduled
              </option>

              <option value="posted">
                Posted
              </option>
            </select>
          </label>
        </AdminForm>

        <div className="card">
          <div className="card-head">
            <div>
              <p className="eyebrow">
                CONTENT LIBRARY
              </p>

              <h2>All content</h2>
            </div>
          </div>

          {items.length ? (
            <div className="content-grid">
              {items.map((item) => (
                <article
                  className="content-item-card"
                  key={item.id}
                >
                  <div className="content-item-preview">
                    {item.preview_url ? (
                      isVideoContent(
                        item.content_type,
                        item.preview_url,
                      ) ? (
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
                        {isVideoContent(
                          item.content_type,
                          '',
                        ) ? (
                          <Video size={28} />
                        ) : (
                          <ImageIcon size={28} />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="content-item-body">
                    <div className="content-item-heading">
                      <div>
                        <strong>{item.title}</strong>

                        <small>
                          {item.content_type ||
                            'Post'}
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

                      {item.scheduled_for
                        ? dateLabel(
                            item.scheduled_for,
                          )
                        : 'Not scheduled'}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Empty
              title="No content yet"
              body="Add the first post using the form."
            />
          )}
        </div>
      </section>
    </>
  );
}

function isVideoContent(
  contentType: string | null,
  url: string,
) {
  const type = contentType?.toLowerCase() || '';

  return (
    type === 'reel' ||
    type === 'video' ||
    type === 'tiktok' ||
    /\.(mp4|mov|webm)(\?.*)?$/i.test(url)
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
