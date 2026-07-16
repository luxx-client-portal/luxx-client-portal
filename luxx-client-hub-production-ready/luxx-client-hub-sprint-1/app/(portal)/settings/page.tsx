import Link from 'next/link';
import { Settings, Users } from 'lucide-react';

import { requireProfile } from '@/lib/auth';
import { PageHeader } from '@/components/UI';

export default async function SettingsPage() {
  const profile = await requireProfile();

  return (
    <>
      <PageHeader
        eyebrow="ACCOUNT"
        title="Settings"
        description="Manage your Luxx Client Hub account and workspace access."
      />

      <section className="two-col">
        <div className="card">
          <div className="stat-icon">
            <Settings />
          </div>

          <p className="eyebrow">YOUR ACCOUNT</p>
          <h2>{profile.full_name || 'Luxx User'}</h2>

          <div className="detail-list">
            <div className="detail-row">
              <span>Role</span>
              <strong>{profile.role}</strong>
            </div>
          </div>
        </div>

        {profile.role === 'admin' && (
          <div className="card">
            <div className="stat-icon">
              <Users />
            </div>

            <p className="eyebrow">CLIENT ACCESS</p>
            <h2>Workspace settings</h2>

            <p>
              Open a client workspace to manage invitations, users,
              permissions and access.
            </p>

            <Link href="/admin/clients" className="workspace-link">
              Manage client workspaces →
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
