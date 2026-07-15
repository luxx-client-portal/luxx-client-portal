import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  ReceiptText,
  Users,
} from 'lucide-react';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Badge, Empty, PageHeader } from '@/components/UI';
import { dateLabel, money } from '@/lib/utils';

type ClientRecord = {
  id: string;
  name: string;
  slug: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  package_name: string | null;
  monthly_retainer: number | null;
  contract_start: string | null;
  contract_end: string | null;
  status: string;
  services: string[] | null;
  notes: string | null;
};

export default async function ClientWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireProfile(true);

  const { id } = await params;
  const supabase = await createClient();

  const [
    clientResult,
    contentResult,
    documentsResult,
    invoicesResult,
    requestsResult,
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),

    supabase
      .from('content_items')
      .select('*')
      .eq('client_id', id)
      .order('scheduled_for', { ascending: true }),

    supabase
      .from('documents')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false }),

    supabase
      .from('invoices')
      .select('*')
      .eq('client_id', id)
      .order('due_date', { ascending: false }),

    supabase
      .from('requests')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (clientResult.error || !clientResult.data) {
    notFound();
  }

  const client = clientResult.data as ClientRecord;
  const content = contentResult.data || [];
  const documents = documentsResult.data || [];
  const invoices = invoicesResult.data || [];
  const requests = requestsResult.data || [];

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

  return (
    <>
      <Link href="/admin/clients" className="back-link">
        <ArrowLeft size={16} />
        Back to clients
      </Link>

      <PageHeader
        eyebrow="CLIENT WORKSPACE"
        title={client.name}
        description={
          client.package_name ||
          'Manage this client workspace.'
        }
      />

      <div className="workspace-meta">
        <Badge value={client.status} />

        {client.contact_name && (
          <span>
            <Users size={16} />
            {client.contact_name}
          </span>
        )}

        {client.email && (
          <span>
            <Mail size={16} />
            {client.email}
          </span>
        )}

        {client.phone && (
          <span>
            <Phone size={16} />
            {client.phone}
          </span>
        )}
      </div>

      <section className="stat-grid">
        <Stat
          icon={<CalendarDays />}
          label="Pending approvals"
          value={String(pendingApprovals.length)}
        />

        <Stat
          icon={<FileText />}
          label="Documents"
          value={String(documents.length)}
        />

        <Stat
          icon={<ReceiptText />}
          label="Open invoices"
          value={String(openInvoices.length)}
        />

        <Stat
          icon={<MessageSquare />}
          label="Open requests"
          value={String(openRequests.length)}
        />
      </section>

      <nav className="workspace-tabs">
        <Link href={`/admin/clients/${client.id}`}>
          Overview
        </Link>

        <Link href={`/admin/content?client=${client.id}`}>
          Content
        </Link>

        <Link href={`/admin/calendar?client=${client.id}`}>
          Calendar
        </Link>

        <Link href={`/admin/documents?client=${client.id}`}>
          Documents
        </Link>

        <Link href={`/admin/invoices?client=${client.id}`}>
          Invoices
        </Link>

        <Link href={`/requests?client=${client.id}`}>
          Requests
        </Link>
      </nav>

      <section className="two-col">
        <div className="card">
          <p className="eyebrow">CLIENT DETAILS</p>
          <h2>Overview</h2>

          <div className="detail-list">
            <Detail
              label="Package"
              value={client.package_name || 'Not added'}
            />

            <Detail
              label="Monthly retainer"
              value={money(client.monthly_retainer || 0)}
            />

            <Detail
              label="Contract start"
              value={dateLabel(client.contract_start)}
            />

            <Detail
              label="Contract end"
              value={dateLabel(client.contract_end)}
            />

            <Detail
              label="Services"
              value={
                client.services?.length
                  ? client.services.join(' · ')
                  : 'Not added'
              }
            />
          </div>
        </div>

        <div className="card">
          <p className="eyebrow">INTERNAL</p>
          <h2>Luxx notes</h2>

          {client.notes ? (
            <p className="workspace-notes">{client.notes}</p>
          ) : (
            <Empty
              title="No internal notes"
              body="Private Luxx team notes will appear here."
            />
          )}
        </div>
      </section>

      <section className="two-col">
        <div className="card">
          <div className="card-head">
            <div>
              <p className="eyebrow">CONTENT</p>
              <h2>Upcoming posts</h2>
            </div>

            <Link href={`/admin/content?client=${client.id}`}>
              View all
            </Link>
          </div>

          {content.length ? (
            content.slice(0, 5).map((item) => (
              <div className="list-row" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <small>
                    {dateLabel(item.scheduled_for)} ·{' '}
                    {item.content_type || 'Post'}
                  </small>
                </div>

                <Badge value={item.status} />
              </div>
            ))
          ) : (
            <Empty
              title="No content yet"
              body="Content added for this client will appear here."
            />
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <p className="eyebrow">BILLING</p>
              <h2>Recent invoices</h2>
            </div>

            <Link href={`/admin/invoices?client=${client.id}`}>
              View all
            </Link>
          </div>

          {invoices.length ? (
            invoices.slice(0, 5).map((invoice) => (
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
              body="Invoices for this client will appear here."
            />
          )}
        </div>
      </section>
    </>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
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
