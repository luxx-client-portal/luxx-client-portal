import Link from 'next/link';
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  MessageSquareWarning,
} from 'lucide-react';

import { Badge, Empty, PageHeader } from '@/components/UI';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { dateLabel } from '@/lib/utils';

type ApprovalItem = {
  id: string;
  client_id: string;
  title: string;
  content_type: string | null;
  scheduled_for: string | null;
  status: string;
  created_at: string;
  clients:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

export default async function ApprovalCenterPage() {
  await requireProfile(true);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('content_items')
    .select(`
      id,
      client_id,
      title,
      content_type,
      scheduled_for,
      status,
      created_at,
      clients (
        name
      )
    `)
    .in('status', [
      'client_review',
      'changes_requested',
      'approved',
    ])
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const items = (data || []) as ApprovalItem[];

  const waitingForClient = items.filter(
    (item) => item.status === 'client_review',
  );

  const changesRequested = items.filter(
    (item) => item.status === 'changes_requested',
  );

  const approved = items.filter(
    (item) => item.status === 'approved',
  );

  return (
    <>
      <PageHeader
        eyebrow="LUXX ADMIN"
        title="Approval Center"
        description="Track content waiting on clients, requested revisions and posts ready to schedule."
      />

      <section className="stat-grid">
        <Stat
          icon={<Clock3 />}
          label="Waiting for client"
          value={String(waitingForClient.length)}
        />

        <Stat
          icon={<MessageSquareWarning />}
          label="Changes requested"
          value={String(changesRequested.length)}
        />

        <Stat
          icon={<CheckCircle2 />}
          label="Ready to schedule"
          value={String(approved.length)}
        />
      </section>

      <section className="approval-center-grid">
        <ApprovalSection
          eyebrow="CLIENT REVIEW"
          title="Waiting for approval"
          items={waitingForClient}
          emptyTitle="Nothing waiting"
          emptyBody="Content sent for client review will appear here."
        />

        <ApprovalSection
          eyebrow="REVISIONS"
          title="Changes requested"
          items={changesRequested}
          emptyTitle="No revisions requested"
          emptyBody="Client edit requests will appear here."
        />
      </section>

      <section className="approval-center-full">
        <ApprovalSection
          eyebrow="APPROVED"
          title="Ready to schedule"
          items={approved}
          emptyTitle="No approved content"
          emptyBody="Approved posts that are ready for scheduling will appear here."
        />
      </section>
    </>
  );
}

function ApprovalSection({
  eyebrow,
  title,
  items,
  emptyTitle,
  emptyBody,
}: {
  eyebrow: string;
  title: string;
  items: ApprovalItem[];
  emptyTitle: string;
  emptyBody: string;
}) {
  return (
    <div className="card approval-section">
      <div className="card-head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>

        <span className="approval-count">
          {items.length}
        </span>
      </div>

      {items.length ? (
        <div className="approval-list">
          {items.map((item) => {
            const client = Array.isArray(item.clients)
              ? item.clients[0]
              : item.clients;

            return (
              <Link
                href={`/admin/clients/${item.client_id}/content#${item.id}`}
                className="approval-row"
                key={item.id}
              >
                <div className="approval-row-main">
                  <strong>{item.title}</strong>

                  <small>
                    {client?.name || 'Client workspace'}
                    {' · '}
                    {item.content_type || 'Post'}
                  </small>
                </div>

                <div className="approval-row-date">
                  <span>
                    {item.scheduled_for
                      ? dateLabel(item.scheduled_for)
                      : 'Not scheduled'}
                  </span>

                  <Badge value={item.status} />
                </div>

                <ExternalLink size={17} />
              </Link>
            );
          })}
        </div>
      ) : (
        <Empty
          title={emptyTitle}
          body={emptyBody}
        />
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>

      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
