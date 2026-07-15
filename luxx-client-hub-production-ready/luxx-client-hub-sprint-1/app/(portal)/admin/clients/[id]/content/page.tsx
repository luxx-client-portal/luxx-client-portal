import ContentUploadForm from '@/components/ContentUploadForm';
import { notFound } from 'next/navigation';
import {
  CalendarDays,
  Image as ImageIcon,
  Video,
} from 'lucide-react';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Badge, Empty } from '@/components/UI';
import { dateLabel } from '@/lib/utils';

type ContentAsset = {
  id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  sort_order: number;
  signed_url?: string | null;
};

type ContentRecord = {
  id: string;
  title: string;
  content_type: string | null;
  caption: string | null;
  scheduled_for: string | null;
  status: string;
  content_assets: ContentAsset[] | null;
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
    .select(`
      id,
      title,
      content_type,
      caption,
      scheduled_for,
      status,
      content_assets (
        id,
        storage_path,
        file_name,
        mime_type,
        sort_order
      )
    `)
    .eq('client_id', id)
    .order('scheduled_for', {
      ascending: true,
      nullsFirst: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const items = (data || []) as ContentRecord[];

  const itemsWithSignedUrls = await Promise.all(
    items.map(async (item) => {
      const orderedAssets = [...(item.content_assets || [])].sort(
        (a, b) => a.sort_order - b.sort_order,
      );

      const assetsWithUrls = await Promise.all(
        orderedAssets.map(async (asset) => {
          const { data: signedData } = await supabase.storage
            .from('content-assets')
            .createSignedUrl(asset.storage_path, 60 * 60);

          return {
            ...asset,
            signed_url: signedData?.signedUrl || null,
          };
        }),
      );

      return {
        ...item,
        content_assets: assetsWithUrls,
      };
    }),
  );

  const pending = itemsWithSignedUrls.filter(
    (item) =>
      item.status === 'client_review' ||
      item.status === 'changes_requested',
  );

  const approved = itemsWithSignedUrls.filter(
    (item) => item.status === 'approved',
  );

  const scheduled = itemsWithSignedUrls.filter(
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
          value={String(itemsWithSignedUrls.length)}
        />
      </section>

      <section className="content-admin-layout">
        <ContentUploadForm clientId={id} />

        <div className="card">
          <div className="card-head">
            <div>
              <p className="eyebrow">CONTENT LIBRARY</p>
              <h2>All content</h2>
            </div>
          </div>

          {itemsWithSignedUrls.length ? (
            <div className="content-grid">
              {itemsWithSignedUrls.map((item) => {
                const assets = item.content_assets || [];
                const firstAsset = assets[0];

                return (
                  <article
                    className="content-item-card"
                    key={item.id}
                  >
                    <div className="content-item-preview">
                      {firstAsset?.signed_url ? (
                        isVideoAsset(firstAsset) ? (
                          <video
                            src={firstAsset.signed_url}
                            controls
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={firstAsset.signed_url}
                            alt={item.title}
                          />
                        )
                      ) : (
                        <div className="content-placeholder">
                          {isVideoContent(item.content_type) ? (
                            <Video size={28} />
                          ) : (
                            <ImageIcon size={28} />
                          )}
                        </div>
                      )}

                      {assets.length > 1 && (
                        <span className="asset-count">
                          {assets.length} slides
                        </span>
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

                        {item.scheduled_for
                          ? dateLabel(item.scheduled_for)
                          : 'Not scheduled'}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <Empty
              title="No content yet"
              body="Upload the first post using the form."
            />
          )}
        </div>
      </section>
    </>
  );
}

function isVideoContent(contentType: string | null) {
  const type = contentType?.toLowerCase() || '';

  return (
    type === 'reel' ||
    type === 'video' ||
    type === 'tiktok'
  );
}

function isVideoAsset(asset: ContentAsset) {
  return (
    asset.mime_type?.startsWith('video/') ||
    /\.(mp4|mov|webm)(\?.*)?$/i.test(asset.file_name)
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
