import Link from 'next/link';
import {
  CalendarCheck2,
  FileText,
  Receipt,
  MessageSquare,
  Users,
  Building2,
} from 'lucide-react';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, Badge, Empty } from '@/components/UI';
import { dateLabel, money } from '@/lib/utils';

import type {
  ContentItem,
  Invoice,
  ClientRequest,
} from '@/lib/types';

type Client = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export default async function Dashboard() {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (profile.role === 'admin') {
    return <AdminDashboard profile={profile} supabase={supabase} />;
  }

  return <ClientDashboard profile={profile} supabase={supabase} />;
}

async function AdminDashboard({
  profile,
  supabase,
}: {
  profile: Awaited<ReturnType<typeof requireProfile>>;
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  const [clientsResult, contentResult, invoicesResult, requestsResult] =
    await Promise.all([
      supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true }),

      supabase
        .from('content_items')
        .select('*')
        .order('scheduled_for', { ascending: true }),

      supabase
        .from('invoices')
        .select('*')
        .order('due_date', { ascending: true }),

      supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);

  const clients = (clientsResult.data || []) as Client[];
  const content = (contentResult.data || []) as ContentItem[];
  const invoices = (invoicesResult.data || []) as Invoice[];
  const requests = (requestsResult.data || []) as ClientRequest[];

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
          value={String(clients.length)}
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
          </div>

          {clients.length ? (
            clients.map((client) => (
              <div className="list-row" key={client.id}>
                <div className="stat-icon">
                  <Building2 />
                </div>

                <div style={{ flex: 1 }}>
                  <strong>{client.name}</strong>
                  <small>
                    Added {dateLabel(client.created_at)}
                  </small>
                </div>

                <Badge value="active" />
              </div>
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

            <Link href="/content">View all</Link>
          </div>

          {pendingApprovals.length ? (
            pendingApprovals.slice(0, 5).map((item) => (
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

            <Link href="/requests">View all</Link>
          </div>

          {openRequests.length ? (
            openRequests.slice(0, 5).map((request) => (
              <div className="list-row" key={request.id}>
                <div>
                  <strong>{request.request_type}</strong>
                  <small>{request.details}</small>
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

            <Link href="/invoices">View all</Link>
          </div>

          {openInvoices.length ? (
            openInvoices.slice(0, 5).map((invoice) => (
              <div className="list-row" key={invoice.id}>
                <div>
                  <strong>
                    {invoice.invoice_number || 'Invoice'}
                  </strong>
                  <small>
                    Due {dateLabel(invoice.due_date)}
                  </small>
                </div>

                <div className="align-right">
                  <strong>{money(invoice.amount_cents)}</strong>
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
  const [contentResult, documentsResult, invoicesResult, requestsResult] =
    await Promise.all([
      supabase
        .from('content_items')
        .select('*')
        .order('scheduled_for', { ascending: true })
        .limit(5),

      supabase
        .from('documents')
        .select('id', { count: 'exact', head: true }),

      supabase
        .from('invoices')
        .select('*')
        .order('due_date', { ascending: false })
        .limit(3),

      supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3),
    ]);

  const content = (contentResult.data || []) as ContentItem[];
  const invoices = (invoicesResult.data || []) as Invoice[];
  const requests = (requestsResult.data || []) as ClientRequest[];

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
              (request) => request.status === 'open',
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

            <Link href="/content">View all</Link>
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

            <Link href="/invoices">View all</Link>
          </div>

          {invoices.length ? (
            invoices.map((invoice) => (
              <div className="list-row" key={invoice.id}>
                <div>
                  <strong>
                    {invoice.invoice_number || 'Invoice'}
                  </strong>
                  <small>
                    Due {dateLabel(invoice.due_date)}
                  </small>
                </div>

                <div className="align-right">
                  <strong>{money(invoice.amount_cents)}</strong>
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
      <div className="stat-icon">{icon}</div>

      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
