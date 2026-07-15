import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  BarChart3,
  CalendarDays,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Phone,
  ReceiptText,
  StickyNote,
  Users,
} from 'lucide-react';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Badge, PageHeader } from '@/components/UI';

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
  const base = `/admin/clients/${client.id}`;

  const tabs = [
    [base, 'Overview', LayoutDashboard],
    [`${base}/content`, 'Content', FileText],
    [`${base}/calendar`, 'Calendar', CalendarDays],
    [`${base}/documents`, 'Documents', FolderOpen],
    [`${base}/invoices`, 'Invoices', ReceiptText],
    [`${base}/requests`, 'Requests', MessageSquare],
    [`${base}/notes`, 'Notes', StickyNote],
    [`${base}/analytics`, 'Analytics', BarChart3],
  ] as const;

  return (
    <>
      <PageHeader
        eyebrow="CLIENT WORKSPACE"
        title={client.name}
        description={
          client.package_name || 'Manage this client workspace.'
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

      <nav className="workspace-tabs">
        {tabs.map(([href, label, Icon]) => (
          <Link href={href} key={href}>
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      {children}
    </>
  );
}
