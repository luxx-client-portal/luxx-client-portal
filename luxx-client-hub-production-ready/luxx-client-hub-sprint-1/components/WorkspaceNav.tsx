'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  CalendarDays,
  FileText,
  FolderOpen,
  LayoutDashboard,
  MessageSquare,
  ReceiptText,
  Settings,
  StickyNote,
} from 'lucide-react';

type WorkspaceLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

type WorkspaceSection = {
  label: string;
  links: WorkspaceLink[];
};

export function WorkspaceNav({
  clientId,
}: {
  clientId: string;
}) {
  const pathname = usePathname();
  const base = `/admin/clients/${clientId}`;

  const sections: WorkspaceSection[] = [
    {
      label: 'Workspace',
      links: [
        {
          href: base,
          label: 'Overview',
          icon: LayoutDashboard,
          exact: true,
        },
      ],
    },
    {
      label: 'Content',
      links: [
        {
          href: `${base}/content`,
          label: 'Content',
          icon: FileText,
        },
        {
          href: `${base}/calendar`,
          label: 'Calendar',
          icon: CalendarDays,
        },
      ],
    },
    {
      label: 'Business',
      links: [
        {
          href: `${base}/documents`,
          label: 'Documents',
          icon: FolderOpen,
        },
        {
          href: `${base}/invoices`,
          label: 'Invoices',
          icon: ReceiptText,
        },
      ],
    },
    {
      label: 'Communication',
      links: [
        {
          href: `${base}/requests`,
          label: 'Requests',
          icon: MessageSquare,
        },
        {
          href: `${base}/notes`,
          label: 'Internal Notes',
          icon: StickyNote,
        },
      ],
    },
    {
      label: 'Management',
      links: [
        {
          href: `${base}/analytics`,
          label: 'Analytics',
          icon: BarChart3,
        },
        {
          href: `${base}/settings`,
          label: 'Settings',
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <aside className="workspace-nav">
      {sections.map((section) => (
        <div
          className="workspace-nav-section"
          key={section.label}
        >
          <p className="workspace-nav-label">
            {section.label}
          </p>

          <div className="workspace-nav-links">
            {section.links.map((link) => {
              const Icon = link.icon;

              const isActive = link.exact
                ? pathname === link.href
                : pathname === link.href ||
                  pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  href={link.href}
                  className={
                    isActive
                      ? 'workspace-nav-link active'
                      : 'workspace-nav-link'
                  }
                  key={link.href}
                >
                  <Icon size={17} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}
