import { notFound } from 'next/navigation';
import { Mail, ShieldCheck, UserPlus } from 'lucide-react';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { inviteClientUserAction } from '@/lib/actions/portal';
import { AdminForm } from '@/components/AdminForms';
import { Empty } from '@/components/UI';

type ClientUser = {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
};

export default async function ClientSettingsPage({
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
      .select('id, name, email, contact_name')
      .eq('id', id)
      .single();

  if (clientError || !client) {
    notFound();
  }

  const { data: users, error: usersError } =
    await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .eq('client_id', id)
      .order('created_at', {
        ascending: true,
      });

  if (usersError) {
    throw new Error(usersError.message);
  }

  const clientUsers = (users || []) as ClientUser[];

  return (
    <section className="settings-grid">
      <AdminForm
        title="Invite Client User"
        action={inviteClientUserAction}
      >
        <input
          type="hidden"
          name="client_id"
          value={id}
        />

        <label>
          Full name
          <input
            name="full_name"
            defaultValue={client.contact_name || ''}
          />
        </label>

        <label>
          Email address
          <input
            name="email"
            type="email"
            required
            defaultValue={client.email || ''}
          />
        </label>

        <div className="form-help">
          <ShieldCheck size={17} />

          <p>
            This user will only be able to access
            {` ${client.name}`} content, files,
            invoices and requests.
          </p>
        </div>

        <button
          className="button primary"
          type="submit"
        >
          <UserPlus size={17} />
          Send Invitation
        </button>
      </AdminForm>

      <div className="card">
        <div className="card-head">
          <div>
            <p className="eyebrow">
              WORKSPACE ACCESS
            </p>

            <h2>Client users</h2>
          </div>
        </div>

        {clientUsers.length ? (
          <div className="access-list">
            {clientUsers.map((user) => (
              <div
                className="access-row"
                key={user.id}
              >
                <div className="access-avatar">
                  {(user.full_name || 'C')
                    .slice(0, 1)
                    .toUpperCase()}
                </div>

                <div>
                  <strong>
                    {user.full_name || 'Client User'}
                  </strong>

                  <small>
                    <Mail size={14} />
                    Password-protected client access
                  </small>
                </div>

                <span className="access-role">
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title="No client users"
            body="Invite the first person who should access this workspace."
          />
        )}
      </div>
    </section>
  );
}
