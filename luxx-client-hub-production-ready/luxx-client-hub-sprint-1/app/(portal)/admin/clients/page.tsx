import Link from 'next/link';
import {
  Building2,
  DollarSign,
  Mail,
  Phone,
  Search,
  Users,
} from 'lucide-react';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createClientAction } from '@/lib/actions/portal';
import { PageHeader, Empty, Badge } from '@/components/UI';
import { AdminForm } from '@/components/AdminForms';
import { money } from '@/lib/utils';

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

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  await requireProfile(true);

  const supabase = await createClient();
  const params = await searchParams;
  const search = params.search?.trim() || '';

  let query = supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true });

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const clients = (data || []) as ClientRecord[];

  const activeClients = clients.filter(
    (client) => client.status === 'active',
  );

  const monthlyRevenue = activeClients.reduce(
    (total, client) => total + (client.monthly_retainer || 0),
    0,
  );

  return (
    <>
      <PageHeader
        eyebrow="LUXX ADMIN"
        title="Clients"
        description="Create, manage and access every Luxx client workspace."
      />

      <section className="stat-grid">
        <Stat
          icon={<Users />}
          label="Active clients"
          value={String(activeClients.length)}
        />

        <Stat
          icon={<DollarSign />}
          label="Monthly retainers"
          value={money(monthlyRevenue)}
        />

        <Stat
          icon={<Building2 />}
          label="Total workspaces"
          value={String(clients.length)}
        />
      </section>

      <section className="admin-grid">
        <AdminForm
          title="Create Client Workspace"
          action={createClientAction}
        >
          <label>
            Business name
            <input
              name="name"
              required
              placeholder=""
            />
          </label>

          <label>
            Workspace slug
            <input
              name="slug"
              required
              placeholder=""
            />
          </label>

          <label>
            Primary contact
            <input
              name="contact_name"
              placeholder=""
            />
          </label>

          <label>
            Contact email
            <input
              name="email"
              type="email"
              placeholder=""
            />
          </label>

          <label>
            Phone number
            <input
              name="phone"
              type="tel"
              placeholder=""
            />
          </label>

          <label>
            Package
            <input
              name="package_name"
              placeholder=""
            />
          </label>

          <label>
            Monthly retainer
            <input
              name="monthly_retainer"
              type="number"
              min="0"
              step="1"
              placeholder=""
            />
          </label>

          <label>
            Contract start
            <input
              name="contract_start"
              type="date"
            />
          </label>

          <label>
            Contract end
            <input
              name="contract_end"
              type="date"
            />
          </label>

          <label>
            Services
            <input
              name="services"
              placeholder=""
            />
          </label>

          <label>
            Status
            <select name="status" defaultValue="active">
              <option value="active">Active</option>
              <option value="onboarding">Onboarding</option>
              <option value="paused">Paused</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <label>
            Internal notes
            <textarea
              name="notes"
              rows={4}
              placeholder="Private notes for the Luxx team."
            />
          </label>
        </AdminForm>

        <div className="card">
          <div className="card-head">
            <div>
              <p className="eyebrow">CLIENT CRM</p>
              <h2>Client workspaces</h2>
            </div>
          </div>

          <form method="get" className="client-search">
            <Search size={18} />

            <input
              name="search"
              defaultValue={search}
              placeholder="Search clients..."
            />

            <button type="submit">Search</button>
          </form>

          {clients.length ? (
            <div className="client-list">
              {clients.map((client) => (
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="client-card"
                  key={client.id}
                >
                  <div className="client-card-top">
                    <div className="client-avatar">
                      {client.name.slice(0, 1).toUpperCase()}
                    </div>

                    <div className="client-card-heading">
                      <strong>{client.name}</strong>

                      <small>
                        {client.package_name ||
                          'No package assigned'}
                      </small>
                    </div>

                    <Badge value={client.status} />
                  </div>

                  <div className="client-details">
                    {client.contact_name && (
                      <span>
                        <Users size={15} />
                        {client.contact_name}
                      </span>
                    )}

                    {client.email && (
                      <span>
                        <Mail size={15} />
                        {client.email}
                      </span>
                    )}

                    {client.phone && (
                      <span>
                        <Phone size={15} />
                        {client.phone}
                      </span>
                    )}
                  </div>

                  <div className="client-card-bottom">
                    <div>
                      <small>Monthly retainer</small>
                      <strong>
                        {money(client.monthly_retainer || 0)}
                      </strong>
                    </div>

                    <div className="align-right">
                      <small>Services</small>
                      <strong>
                        {client.services?.length
                          ? client.services.join(' · ')
                          : 'Not added'}
                      </strong>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Empty
              title={
                search
                  ? 'No matching clients'
                  : 'No clients yet'
              }
              body={
                search
                  ? 'Try searching with another name or email.'
                  : 'Add your first client workspace using the form.'
              }
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
