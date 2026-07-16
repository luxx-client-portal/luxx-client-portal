import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  Users,
} from 'lucide-react';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Badge, PageHeader } from '@/components/UI';
import { WorkspaceNav } from '@/components/WorkspaceNav';

type ClientRecord = {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  package_name: string | null;
  status: string;
};

export default async function ClientWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  await requireProfile(true);

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('clients')
    .select(
      'id, name, contact_name, email, phone, package_name, status',
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    notFound();
  }

  const client = data as ClientRecord;

  return (
    <>
      <Link
        href="/admin/clients"
        className="back-link"
      >
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

      <div className="workspace-shell">
        <WorkspaceNav clientId={client.id} />

        <main className="workspace-main">
          {children}
        </main>
      </div>
    </>
  );
}
