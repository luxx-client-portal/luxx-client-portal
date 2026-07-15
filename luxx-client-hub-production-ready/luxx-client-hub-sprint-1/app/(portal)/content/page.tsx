import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Empty } from '@/components/UI';
import { ContentCard } from '@/components/ContentCard';

import type { ContentItem } from '@/lib/types';

export default async function ContentPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .order('scheduled_for', {
      ascending: true,
      nullsFirst: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const items = (data || []) as ContentItem[];

  const pendingItems = items.filter(
    (item) =>
      item.status === 'client_review' ||
      item.status === 'changes_requested',
  );

  const approvedItems = items.filter(
    (item) =>
      item.status === 'approved' ||
      item.status === 'scheduled' ||
      item.status === 'posted',
  );

  return (
    <>
      <PageHeader
        eyebrow="CONTENT"
        title={
          profile.role === 'admin'
            ? 'Content approvals'
            : 'Your content calendar'
        }
        description={
          profile.role === 'admin'
            ? 'Review client content, feedback and approval activity.'
            : 'Review upcoming posts, approve content or request edits.'
        }
      />

      <section className="stat-grid">
        <Stat
          label="Needs review"
          value={String(pendingItems.length)}
        />

        <Stat
          label="Approved"
          value={String(approvedItems.length)}
        />

        <Stat
          label="Total content"
          value={String(items.length)}
        />
      </section>

      {items.length ? (
        <div className="content-grid">
          {items.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              isAdmin={profile.role === 'admin'}
            />
          ))}
        </div>
      ) : (
        <section className="card">
          <Empty
            title="Your calendar is clear"
            body="Upcoming posts will appear here when the Luxx team adds them."
          />
        </section>
      )}
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
