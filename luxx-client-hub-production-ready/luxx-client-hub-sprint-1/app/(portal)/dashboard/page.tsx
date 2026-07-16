import Link from 'next/link';
import {
  Building2,
  CalendarCheck2,
  FileText,
  MessageSquare,
  Receipt,
  Users,
} from 'lucide-react';

import { ActivityFeed } from '@/components/ActivityFeed';
import { Badge, Empty, PageHeader } from '@/components/UI';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { dateLabel, money } from '@/lib/utils';

import type {
  ClientRequest,
  ContentItem,
  Invoice,
} from '@/lib/types';

type Client = {
  id: string;
  name: string;
  slug: string;
  status?: string | null;
  created_at: string;
};

type AdminContentItem = ContentItem & {
  client_id: string;
};

type Activity = {
  id: string;
  action_type: string;
  title: string;
  description: string | null;
  created_at: string;
};

export default async function Dashboard() {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (profile.role === 'admin') {
    return (
      <AdminDashboard
        profile={profile}
        supabase={supabase}
      />
    );
  }

  return (
    <ClientDashboard
      profile={profile}
      supabase={supabase}
    />
  );
}

async function AdminDashboard({
  profile,
  supabase,
}: {
  profile: Awaited<ReturnType<typeof requireProfile>>;
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  const [
    clientsResult,
    contentResult,
    invoicesResult,
    requestsResult,
    activityResult,
  ] = await Promise.all([
    supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true }),

    supabase
      .from('content_items')
      .select('*')
      .order('scheduled_for', {
        ascending: true,
        nullsFirst: false,
      }),

    supabase
      .from('invoices')
      .select('*')
      .order('due_date', {
        ascending: true,
        nullsFirst: false,
      }),

    supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false }),

    supabase
      .from('activity_log')
      .select(
        `
          id,
          action_type,
          title,
          description,
          created_at
        `,
      )
      .order('created_at', { ascending: false })
      .limit(12),
  ]);

  if (clientsResult.error) {
    throw new Error(clientsResult.error.message);
  }

  if (contentResult.error) {
    throw new Error(contentResult.error.message);
  }

  if (invoicesResult.error) {
    throw new Error(invoicesResult.error.message);
  }

  if (requestsResult.error) {
    throw new Error(requestsResult.error.message);
  }

  if (activityResult.error) {
    throw new Error(activityResult.error.message);
  }

  const clients = (clientsResult.data || []) as Client[];

  const content =
    (contentResult.data || []) as AdminContentItem[];

  const invoices =
    (invoicesResult.data || []) as Invoice[];

  const requests =
    (requestsResult.data || []) as ClientRequest[];

  const activities =
    (activityResult.data || []) as Activity[];

  const activeClients = clients.filter(
    (client) =>
      !client.status ||
      client.status === 'active' ||
      client.status === 'onboarding',
  );

  const pendingApprovals = content.filter(
    (item) =>
      item.status === 'client_review' ||
      item.status === 'changes_requested',
  );

  const openInvoices = invoices.filter(
    (invoice) => invoice.status !== 'paid',
  );

  const openRequests = requests.filter(
    (request) => request.status === 'open',
  );

  const firstName =
    profile.full_name?.split(' ')[0] || 'Priscilla';

  return (
    <>
      <PageHeader
        eyebrow="LUXX ADMIN"
        title={`Welcome back, ${firstName}`}
        description="Manage your clients, content, requests, documents and billing from one place."
      />

      <section className="stat-grid">
        <Stat
          icon={<Users />}
          label="Active clients"
          value={String(activeClients.length)}
        />

        <Stat
          icon={<CalendarCheck2 />}
          label="Pending approvals"
          value={String(pendingApprovals.length)}
        />

        <Stat
          icon={<MessageSquare />}
          label="Open requests"
          value={String(openRequests.length)}
        />

        <Stat
          icon={<Receipt />}
          label="Open invoices"
          value={String(openInvoices.length)}
        />
      </section>

      <section className="two-col">
        <div className="card">
          <div className="card-head">
            <div>
              <p className="eyebrow">CLIENT MANAGEMENT</p>
              <h2>Your clients</h2>
            </div>

            <Link href="/admin/clients">
              View all
            </Link>
          </div>

          {clients.length ? (
            clients.slice(0, 6).map((client) => (
              <Link
                className="list-row"
                href={`/admin/clients/${client.id}`}
                key={client.id}
              >
                <div className="stat-icon">
                  <Building2 size={18} />
                </div>

                <div style={{ flex: 1 }}>
                  <strong>{client.name}</strong>

                  <small>
                    Added {dateLabel(client.created_at)}
                  </small>
                </div>

                <Badge value={client.status || 'active'} />
              </Link>
            ))
          ) : (
            <Empty
              title="No clients yet"
              body="Your client accounts will appear here once they are added."
            />
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <p className="eyebrow">APPROVALS</p>
              <h2>Needs attention</h2>
            </div>

            <Link href="/admin/approvals">
              View all
            </Link>
          </div>

          {pendingApprovals.length ? (
            pendingApprovals
              .slice(0, 5)
              .map((item) => (
                <Link
                  className="list-row"
                  href={`/admin/clients/${item.client_id}/content#${item.id}`}
                  key={item.id}
                >
                  <div>
                    <strong>{item.title}</strong>

                    <small>
                      {dateLabel(item.scheduled_for)} ·{' '}
                      {item.content_type || 'Post'}
                    </small>
                  </div>

                  <Badge value={item.status} />
                </Link>
              ))
          ) : (
            <Empty
              title="Nothing waiting"
              body="Posts awaiting approval or edits will appear here."
            />
          )}
        </div>
      </section>

      <section className="two-col">
        <div className="card">
          <div className="card-head">
            <div>
              <p className="eyebrow">CLIENT SUPPORT</p>
              <h2>Recent requests</h2>
            </div>

            <Link href="/requests">
              View all
            </Link>
          </div>

          {openRequests.length ? (
            openRequests
              .slice(0, 5)
              .map((request) => (
                <div
                  className="list-row"
                  key={request.id}
                >
                  <div>
                    <strong>
                      {request.request_type}
                    </strong>

                    <small>
                      {request.details}
                    </small>
                  </div>

                  <Badge value={request.status} />
                </div>
              ))
          ) : (
            <Empty
              title="No open requests"
              body="New client requests will appear here."
            />
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <p className="eyebrow">BILLING</p>
              <h2>Outstanding invoices</h2>
            </div>

            <Link href="/admin/invoices">
              View all
            </Link>
          </div>

          {openInvoices.length ? (
            openInvoices
              .slice(0, 5)
              .map((invoice) => (
                <div
                  className="list-row"
                  key={invoice.id}
                >
                  <div>
                    <strong>
                      {invoice.invoice_number ||
                        'Invoice'}
                    </strong>

                    <small>
                      Due {dateLabel(invoice.due_date)}
                    </small>
                  </div>

                  <div className="align-right">
                    <strong>
                      {money(invoice.amount_cents)}
                    </strong>

                    <Badge value={invoice.status} />
                  </div>
                </div>
              ))
          ) : (
            <Empty
              title="No outstanding invoices"
              body="Unpaid client invoices will appear here."
            />
          )}
        </div>
      </section>

      <section className="dashboard-activity-section">
        <ActivityFeed activities={activities} />
      </section>
    </>
  );
}

async function ClientDashboard({
  profile,
  supabase,
}: {
  profile: Awaited<ReturnType<typeof requireProfile>>;
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  const [
    contentResult,
    documentsResult,
    invoicesResult,
    requestsResult,
  ] = await Promise.all([
    supabase
      .from('content_items')
      .select('*')
      .order('scheduled_for', {
        ascending: true,
        nullsFirst: false,
      })
      .limit(5),

    supabase
      .from('documents')
      .select('id', {
        count: 'exact',
        head: true,
      }),

    supabase
      .from('invoices')
      .select('*')
      .order('due_date', {
        ascending: false,
        nullsFirst: false,
      })
      .limit(3),

    supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  if (contentResult.error) {
    throw new Error(contentResult.error.message);
  }

  if (documentsResult.error) {
    throw new Error(documentsResult.error.message);
  }

  if (invoicesResult.error) {
    throw new Error(invoicesResult.error.message);
  }

  if (requestsResult.error) {
    throw new Error(requestsResult.error.message);
  }

  const content =
    (contentResult.data || []) as ContentItem[];

  const invoices =
    (invoicesResult.data || []) as Invoice[];

  const requests =
    (requestsResult.data || []) as ClientRequest[];

  const pendingApprovals = content.filter(
    (item) =>
      item.status === 'client_review' ||
      item.status === 'changes_requested',
  ).length;

  const firstName =
    profile.full_name?.split(' ')[0] || 'there';

  return (
    <>
      <PageHeader
        eyebrow="LUXX CLIENT HUB"
        title={`Welcome back, ${firstName}`}
        description={`Everything for ${
          profile.clients?.name || 'your brand'
        }, all in one place.`}
      />

      <section className="stat-grid">
        <Stat
          icon={<CalendarCheck2 />}
          label="Pending approvals"
          value={String(pendingApprovals)}
        />

        <Stat
          icon={<FileText />}
          label="Documents"
          value={String(documentsResult.count || 0)}
        />

        <Stat
          icon={<Receipt />}
          label="Open invoices"
          value={String(
            invoices.filter(
              (invoice) => invoice.status !== 'paid',
            ).length,
          )}
        />

        <Stat
          icon={<MessageSquare />}
          label="Open requests"
          value={String(
            requests.filter(
              (request) =>
                request.status === 'open',
            ).length,
          )}
        />
      </section>

      <section className="two-col">
        <div className="card">
          <div className="card-head">
            <div>
              <p className="eyebrow">COMING UP</p>
              <h2>Content calendar</h2>
            </div>

            <Link href="/content">
              View all
            </Link>
          </div>

          {content.length ? (
            content.map((item) => (
              <Link
                className="list-row"
                href={`/content#${item.id}`}
                key={item.id}
              >
                <div>
                  <strong>{item.title}</strong>

                  <small>
                    {dateLabel(item.scheduled_for)} ·{' '}
                    {item.content_type || 'Post'}
                  </small>
                </div>

                <Badge value={item.status} />
              </Link>
            ))
          ) : (
            <Empty
              title="No upcoming content"
              body="New posts will appear here once they are added."
            />
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <p className="eyebrow">BILLING</p>
              <h2>Recent invoices</h2>
            </div>

            <Link href="/invoices">
              View all
            </Link>
          </div>

          {invoices.length ? (
            invoices.map((invoice) => (
              <div
                className="list-row"
                key={invoice.id}
              >
                <div>
                  <strong>
                    {invoice.invoice_number ||
                      'Invoice'}
                  </strong>

                  <small>
                    Due {dateLabel(invoice.due_date)}
                  </small>
                </div>

                <div className="align-right">
                  <strong>
                    {money(invoice.amount_cents)}
                  </strong>

                  <Badge value={invoice.status} />
                </div>
              </div>
            ))
          ) : (
            <Empty
              title="No invoices yet"
              body="Invoices will appear here when added."
            />
          )}
        </div>
      </section>
    </>
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
      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
