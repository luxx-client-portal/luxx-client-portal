import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageSquare,
} from 'lucide-react';

import { Badge, Empty } from '@/components/UI';
import { logActivity } from '@/lib/activity';
import { requireProfile } from '@/lib/auth';
import {
  createNotifications,
  getClientUserIds,
} from '@/lib/notifications';
import { createClient } from '@/lib/supabase/server';
import { dateLabel } from '@/lib/utils';

type RequestRecord = {
  id: string;
  client_id: string;
  request_type: string;
  details: string;
  preferred_deadline: string | null;
  status: string;
  created_at: string;
};

type RequestStatus =
  | 'open'
  | 'in_progress'
  | 'completed';

async function updateRequestStatusAction(
  formData: FormData,
) {
  'use server';

  const profile = await requireProfile(true);
  const supabase = await createClient();

  const requestId = String(
    formData.get('request_id') || '',
  ).trim();

  const clientId = String(
    formData.get('client_id') || '',
  ).trim();

  const status = String(
    formData.get('status') || '',
  ).trim() as RequestStatus;

  const allowedStatuses: RequestStatus[] = [
    'open',
    'in_progress',
    'completed',
  ];

  if (
    !requestId ||
    !clientId ||
    !allowedStatuses.includes(status)
  ) {
    throw new Error(
      'A valid request and status are required.',
    );
  }

  const { data: request, error: requestError } =
    await supabase
      .from('requests')
      .select(
        'id, client_id, request_type, status',
      )
      .eq('id', requestId)
      .eq('client_id', clientId)
      .single();

  if (requestError || !request) {
    throw new Error(
      requestError?.message ||
        'Request could not be found.',
    );
  }

  if (request.status === status) {
    return;
  }

  const { error: updateError } = await supabase
    .from('requests')
    .update({
      status,
    })
    .eq('id', requestId)
    .eq('client_id', clientId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const statusLabels: Record<
    RequestStatus,
    string
  > = {
    open: 'Open',
    in_progress: 'In Progress',
    completed: 'Completed',
  };

  const statusLabel = statusLabels[status];

  await logActivity(supabase, {
    clientId,
    actorId: profile.id,
    actionType: 'request_status_updated',
    title: 'Request status updated',
    description: `${request.request_type} was marked ${statusLabel}.`,
    entityType: 'request',
    entityId: requestId,
    metadata: {
      previousStatus: request.status,
      newStatus: status,
    },
  });

  const clientUserIds =
    await getClientUserIds(clientId);

  await createNotifications({
    recipientIds: clientUserIds.filter(
      (recipientId) =>
        recipientId !== profile.id,
    ),
    clientId,
    notificationType:
      'request_status_updated',
    title: 'Request updated',
    body: `${request.request_type} is now ${statusLabel}.`,
    link: '/requests',
  });

  revalidatePath('/dashboard');
  revalidatePath('/requests');
  revalidatePath('/admin/requests');

  revalidatePath(
    `/admin/clients/${clientId}`,
  );

  revalidatePath(
    `/admin/clients/${clientId}/requests`,
  );
}

export default async function ClientRequestsPage({
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
    .from('requests')
    .select(
      `
        id,
        client_id,
        request_type,
        details,
        preferred_deadline,
        status,
        created_at
      `,
    )
    .eq('client_id', id)
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const requests =
    (data || []) as RequestRecord[];

  const openRequests = requests.filter(
    (request) => request.status === 'open',
  );

  const inProgressRequests = requests.filter(
    (request) =>
      request.status === 'in_progress',
  );

  const completedRequests = requests.filter(
    (request) =>
      request.status === 'completed',
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
          value={String(
            inProgressRequests.length,
          )}
        />

        <Stat
          label="Completed"
          value={String(
            completedRequests.length,
          )}
        />

        <Stat
          label="Total requests"
          value={String(requests.length)}
        />
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <p className="eyebrow">
              CLIENT SUPPORT
            </p>

            <h2>Requests</h2>

            <small>
              Manage requests submitted by{' '}
              {client.name}.
            </small>
          </div>
        </div>

        {requests.length ? (
          <div className="request-list">
            {requests.map((request) => (
              <article
                className="request-card"
                key={request.id}
              >
                <div className="request-card-top">
                  <div className="request-icon">
                    {request.status ===
                    'completed' ? (
                      <CheckCircle2 size={20} />
                    ) : request.status ===
                      'in_progress' ? (
                      <Clock3 size={20} />
                    ) : (
                      <MessageSquare size={20} />
                    )}
                  </div>

                  <div className="request-heading">
                    <strong>
                      {request.request_type}
                    </strong>

                    <small>
                      Submitted{' '}
                      {dateLabel(
                        request.created_at,
                      )}
                    </small>
                  </div>

                  <Badge
                    value={request.status}
                  />
                </div>

                <p className="request-details">
                  {request.details}
                </p>

                <div className="request-footer">
                  <span>
                    <CalendarDays size={15} />

                    Preferred deadline:{' '}
                    {request.preferred_deadline
                      ? dateLabel(
                          request.preferred_deadline,
                        )
                      : 'No deadline provided'}
                  </span>
                </div>

                <div className="request-actions">
                  <RequestStatusButton
                    request={request}
                    status="open"
                    label="Mark open"
                  />

                  <RequestStatusButton
                    request={request}
                    status="in_progress"
                    label="Start request"
                  />

                  <RequestStatusButton
                    request={request}
                    status="completed"
                    label="Mark completed"
                  />
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

function RequestStatusButton({
  request,
  status,
  label,
}: {
  request: RequestRecord;
  status: RequestStatus;
  label: string;
}) {
  const isCurrentStatus =
    request.status === status;

  return (
    <form action={updateRequestStatusAction}>
      <input
        type="hidden"
        name="request_id"
        value={request.id}
      />

      <input
        type="hidden"
        name="client_id"
        value={request.client_id}
      />

      <input
        type="hidden"
        name="status"
        value={status}
      />

      <button
        className={
          isCurrentStatus
            ? 'button button-secondary'
            : 'button button-ghost'
        }
        disabled={isCurrentStatus}
        type="submit"
      >
        {isCurrentStatus ? 'Current status' : label}
      </button>
    </form>
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
