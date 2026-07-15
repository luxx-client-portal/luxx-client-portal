import { notFound } from 'next/navigation';
import {
  CalendarDays,
  ExternalLink,
  ReceiptText,
} from 'lucide-react';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Badge, Empty } from '@/components/UI';
import { dateLabel, money } from '@/lib/utils';

type InvoiceRecord = {
  id: string;
  invoice_number: string | null;
  amount_cents: number;
  status: string;
  due_date: string | null;
  file_path: string | null;
  created_at: string;
};

export default async function ClientInvoicesPage({
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
    .from('invoices')
    .select('*')
    .eq('client_id', id)
    .order('due_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const invoices = (data || []) as InvoiceRecord[];

  const paidInvoices = invoices.filter(
    (invoice) => invoice.status === 'paid',
  );

  const openInvoices = invoices.filter(
    (invoice) => invoice.status !== 'paid',
  );

  const totalBilled = invoices.reduce(
    (total, invoice) => total + invoice.amount_cents,
    0,
  );

  const outstandingBalance = openInvoices.reduce(
    (total, invoice) => total + invoice.amount_cents,
    0,
  );

  return (
    <>
      <section className="stat-grid">
        <Stat
          label="Total billed"
          value={money(totalBilled)}
        />

        <Stat
          label="Outstanding"
          value={money(outstandingBalance)}
        />

        <Stat
          label="Paid invoices"
          value={String(paidInvoices.length)}
        />

        <Stat
          label="Open invoices"
          value={String(openInvoices.length)}
        />
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <p className="eyebrow">BILLING HISTORY</p>
            <h2>Invoices</h2>
          </div>
        </div>

        {invoices.length ? (
          <div className="invoice-list">
            {invoices.map((invoice) => (
              <article className="invoice-row" key={invoice.id}>
                <div className="invoice-icon">
                  <ReceiptText size={20} />
                </div>

                <div className="invoice-copy">
                  <strong>
                    {invoice.invoice_number || 'Invoice'}
                  </strong>

                  <small>
                    Created {dateLabel(invoice.created_at)}
                  </small>
                </div>

                <div className="invoice-due">
                  <CalendarDays size={15} />

                  <span>
                    Due {dateLabel(invoice.due_date)}
                  </span>
                </div>

                <div className="invoice-amount">
                  <strong>{money(invoice.amount_cents)}</strong>
                  <Badge value={invoice.status} />
                </div>

                {invoice.file_path ? (
                  <a
                    href={invoice.file_path}
                    target="_blank"
                    rel="noreferrer"
                    className="invoice-action"
                  >
                    <ExternalLink size={16} />
                    View
                  </a>
                ) : (
                  <span className="invoice-no-file">
                    No file
                  </span>
                )}
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="No invoices yet"
            body="Invoices added for this client will appear here."
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
