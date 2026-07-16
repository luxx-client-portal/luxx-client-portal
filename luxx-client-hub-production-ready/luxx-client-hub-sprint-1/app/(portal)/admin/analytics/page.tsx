import Link from 'next/link';
import { BarChart3 } from 'lucide-react';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Empty, PageHeader } from '@/components/UI';

type ClientRecord = {
  id: string;
  name: string;
  package_name: string | null;
};

export default async function AdminAnalyticsPage() {
  await requireProfile(true);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('clients')
    .select('id, name, package_name')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const clients = (data || []) as ClientRecord[];

  return (
    <>
      <PageHeader
        eyebrow="LUXX ADMIN"
        title="Analytics"
        description="Review portal activity and reporting for each client."
      />

      <section className="card">
        <div className="card-head">
          <div>
            <p className="eyebrow">CLIENT REPORTING</p>
            <h2>Choose a workspace</h2>
          </div>
        </div>

        {clients.length ? (
          <div className="access-list">
            {clients.map((client) => (
              <Link
                href={`/admin/clients/${client.id}/analytics`}
                className="access-row"
                key={client.id}
              >
                <div className="access-avatar">
                  <BarChart3 size={18} />
                </div>

                <div>
                  <strong>{client.name}</strong>
                  <small>
                    {client.package_name || 'Client workspace'}
                  </small>
                </div>

                <span className="workspace-link">View analytics →</span>
              </Link>
            ))}
          </div>
        ) : (
          <Empty
            title="No client analytics"
            body="Create a client workspace first."
          />
        )}
      </section>
    </>
  );
}
