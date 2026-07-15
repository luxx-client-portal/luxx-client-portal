import { notFound } from 'next/navigation';
import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquare,
  ReceiptText,
} from 'lucide-react';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Empty } from '@/components/UI';
import { money } from '@/lib/utils';

type ContentRecord = {
  id: string;
  status: string;
  content_type: string | null;
};

type InvoiceRecord = {
  id: string;
  status: string;
  amount_cents: number;
};

type RequestRecord = {
  id: string;
  status: string;
};

export default async function ClientAnalyticsPage({
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
    supabase
      .from('clients')
      .select('id, name')
      .eq('id', id)
      .single(),

    supabase
      .from('content_items')
      .select('id, status, content_type')
      .eq('client_id', id),

    supabase
      .from('documents')
      .select('id', { count: 'exact' })
      .eq('client_id', id),

    supabase
      .from('invoices')
      .select('id, status, amount_cents')
      .eq('client_id', id),

    supabase
      .from('requests')
      .select('id, status')
      .eq('client_id', id),
  ]);

  if (clientResult.error || !clientResult.data) {
    notFound();
  }

  const content = (contentResult.data || []) as ContentRecord[];
  const invoices = (invoicesResult.data || []) as InvoiceRecord[];
  const requests = (requestsResult.data || []) as RequestRecord[];

  const approvedContent = content.filter(
    (item) =>
      item.status === 'approved' ||
      item.status === 'scheduled' ||
      item.status === 'posted',
  );

  const pendingContent = content.filter(
    (item) =>
      item.status === 'client_review' ||
      item.status === 'changes_requested',
  );

  const postedContent = content.filter(
    (item) => item.status === 'posted',
  );

  const reels = content.filter((item) =>
    ['reel', 'video'].includes(
      item.content_type?.toLowerCase() || '',
    ),
  );

  const carousels = content.filter(
    (item) =>
      item.content_type?.toLowerCase() === 'carousel',
  );

  const paidInvoices = invoices.filter(
    (invoice) => invoice.status === 'paid',
  );

  const openInvoices = invoices.filter(
    (invoice) => invoice.status !== 'paid',
  );

  const totalPaid = paidInvoices.reduce(
    (total, invoice) => total + invoice.amount_cents,
    0,
  );

  const outstanding = openInvoices.reduce(
    (total, invoice) => total + invoice.amount_cents,
    0,
  );

  const openRequests = requests.filter(
    (request) => request.status === 'open',
  );

  const completedRequests = requests.filter(
    (request) => request.status === 'completed',
  );

  const approvalRate = content.length
    ? Math.round((approvedContent.length / content.length) * 100)
    : 0;

  const requestCompletionRate = requests.length
    ? Math.round(
        (completedRequests.length / requests.length) * 100,
      )
    : 0;

  return (
    <>
      <section className="stat-grid">
        <AnalyticsStat
          icon={<CalendarCheck2 />}
          label="Total content"
          value={String(content.length)}
        />

        <AnalyticsStat
          icon={<CheckCircle2 />}
          label="Approval rate"
          value={`${approvalRate}%`}
        />

        <AnalyticsStat
          icon={<FileText />}
          label="Documents"
          value={String(documentsResult.count || 0)}
        />

        <AnalyticsStat
          icon={<ReceiptText />}
          label="Total paid"
          value={money(totalPaid)}
        />
      </section>

      <section className="analytics-grid">
        <div className="card">
          <div className="card-head">
            <div>
              <p className="eyebrow">CONTENT WORKFLOW</p>
              <h2>Content status</h2>
            </div>
          </div>

          {content.length ? (
            <div className="analytics-list">
              <MetricRow
                label="Posted"
                value={postedContent.length}
                total={content.length}
              />

              <MetricRow
                label="Approved or scheduled"
                value={approvedContent.length}
                total={content.length}
              />

              <MetricRow
                label="Waiting for review"
                value={pendingContent.length}
                total={content.length}
              />

              <MetricRow
                label="Reels and videos"
                value={reels.length}
                total={content.length}
              />

              <MetricRow
                label="Carousels"
                value={carousels.length}
                total={content.length}
              />
            </div>
          ) : (
            <Empty
              title="No content data"
              body="Content analytics will appear after posts are added."
            />
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <p className="eyebrow">CLIENT SUPPORT</p>
              <h2>Request activity</h2>
            </div>
          </div>

          {requests.length ? (
            <>
              <div className="analytics-highlight">
                <strong>{requestCompletionRate}%</strong>
                <span>Request completion rate</span>
              </div>

              <div className="analytics-list">
                <MetricRow
                  label="Open requests"
                  value={openRequests.length}
                  total={requests.length}
                />

                <MetricRow
                  label="Completed requests"
                  value={completedRequests.length}
                  total={requests.length}
                />
              </div>
            </>
          ) : (
            <Empty
              title="No request data"
              body="Client request activity will appear here."
            />
          )}
        </div>
      </section>

      <section className="analytics-grid">
        <div className="card">
          <div className="card-head">
            <div>
              <p className="eyebrow">BILLING</p>
              <h2>Invoice performance</h2>
            </div>
          </div>

          {invoices.length ? (
            <div className="analytics-financials">
              <div>
                <span>Paid revenue</span>
                <strong>{money(totalPaid)}</strong>
              </div>

              <div>
                <span>Outstanding balance</span>
                <strong>{money(outstanding)}</strong>
              </div>

              <div>
                <span>Paid invoices</span>
                <strong>{paidInvoices.length}</strong>
              </div>

              <div>
                <span>Open invoices</span>
                <strong>{openInvoices.length}</strong>
              </div>
            </div>
          ) : (
            <Empty
              title="No billing data"
              body="Invoice analytics will appear after invoices are added."
            />
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <p className="eyebrow">WORKSPACE HEALTH</p>
              <h2>Current snapshot</h2>
            </div>
          </div>

          <div className="workspace-health">
            <HealthItem
              icon={<Clock3 />}
              label="Pending approvals"
              value={String(pendingContent.length)}
            />

            <HealthItem
              icon={<MessageSquare />}
              label="Open requests"
              value={String(openRequests.length)}
            />

            <HealthItem
              icon={<ReceiptText />}
              label="Open invoices"
              value={String(openInvoices.length)}
            />
          </div>
        </div>
      </section>
    </>
  );
}

function AnalyticsStat({
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

function MetricRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage = total
    ? Math.round((value / total) * 100)
    : 0;

  return (
    <div className="metric-row">
      <div className="metric-row-copy">
        <span>{label}</span>
        <strong>
          {value} / {total}
        </strong>
      </div>

      <div className="metric-track">
        <div
          className="metric-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function HealthItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="health-item">
      <div className="stat-icon">{icon}</div>

      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
