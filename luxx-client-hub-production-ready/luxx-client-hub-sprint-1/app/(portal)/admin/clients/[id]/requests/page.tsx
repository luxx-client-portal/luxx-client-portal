import { notFound } from 'next/navigation';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageSquare,
} from 'lucide-react';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Badge, Empty } from '@/components/UI';
import { dateLabel } from '@/lib/utils';

type RequestRecord = {
  id: string;
  request_type: string;
  details: string;
  preferred_deadline: string | null;
  status: string;
  created_at: string;
};

export default async function ClientRequestsPage({
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
    .from('requests')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const requests = (data || []) as RequestRecord[];

  const openRequests = requests.filter(
    (request) => request.status === 'open',
  );

  const inProgressRequests = requests.filter(
    (request) => request.status === 'in_progress',
  );

  const completedRequests = requests.filter(
    (request) => request.status === 'completed',
  );

  return (
    <>
      <section className="stat-grid">
        <Stat
          label="Open requests"
          value={String(openRequests.length)}
        />

        <Stat
          label="In progress"
          value={String(inProgressRequests.length)}
        />

        <Stat
          label="Completed"
          value={String(completedRequests.length)}
        />

        <Stat
          label="Total requests"
          value={String(requests.length)}
        />
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <p className="eyebrow">CLIENT SUPPORT</p>
            <h2>Requests</h2>
          </div>
        </div>

        {requests.length ? (
          <div className="request-list">
            {requests.map((request) => (
              <article className="request-card" key={request.id}>
                <div className="request-card-top">
                  <div className="request-icon">
                    {request.status === 'completed' ? (
                      <CheckCircle2 size={20} />
                    ) : request.status === 'in_progress' ? (
                      <Clock3 size={20} />
                    ) : (
                      <MessageSquare size={20} />
                    )}
                  </div>

                  <div className="request-heading">
                    <strong>{request.request_type}</strong>

                    <small>
                      Submitted {dateLabel(request.created_at)}
                    </small>
                  </div>

                  <Badge value={request.status} />
                </div>

                <p className="request-details">
                  {request.details}
                </p>

                <div className="request-footer">
                  <span>
                    <CalendarDays size={15} />

                    Preferred deadline:{' '}
                    {request.preferred_deadline
                      ? dateLabel(request.preferred_deadline)
                      : 'No deadline provided'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="No requests yet"
            body="Requests submitted by this client will appear here."
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
