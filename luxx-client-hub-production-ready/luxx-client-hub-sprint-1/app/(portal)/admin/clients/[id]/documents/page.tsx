import { notFound } from 'next/navigation';
import {
  Download,
  File,
  FileText,
  FolderOpen,
} from 'lucide-react';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Empty } from '@/components/UI';
import { dateLabel } from '@/lib/utils';

type DocumentRecord = {
  id: string;
  name: string;
  category: string;
  file_path: string;
  created_at: string;
};

export default async function ClientDocumentsPage({
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
    .from('documents')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const documents = (data || []) as DocumentRecord[];

  const groupedDocuments = documents.reduce<
    Record<string, DocumentRecord[]>
  >((groups, document) => {
    const category = document.category || 'Other';

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(document);
    return groups;
  }, {});

  const categoryEntries = Object.entries(groupedDocuments);

  return (
    <>
      <section className="stat-grid">
        <Stat
          label="Total documents"
          value={String(documents.length)}
        />

        <Stat
          label="Categories"
          value={String(categoryEntries.length)}
        />

        <Stat
          label="Contracts"
          value={String(
            documents.filter(
              (document) =>
                document.category.toLowerCase() === 'contract',
            ).length,
          )}
        />

        <Stat
          label="Reports"
          value={String(
            documents.filter(
              (document) =>
                document.category.toLowerCase() === 'report',
            ).length,
          )}
        />
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <p className="eyebrow">CLIENT FILES</p>
            <h2>Documents</h2>
          </div>
        </div>

        {categoryEntries.length ? (
          <div className="document-groups">
            {categoryEntries.map(([category, categoryDocuments]) => (
              <section className="document-group" key={category}>
                <div className="document-category">
                  <FolderOpen size={18} />
                  <strong>{category}</strong>
                  <span>{categoryDocuments.length}</span>
                </div>

                <div className="document-list">
                  {categoryDocuments.map((document) => (
                    <article className="document-row" key={document.id}>
                      <div className="document-icon">
                        {document.name
                          .toLowerCase()
                          .endsWith('.pdf') ? (
                          <FileText size={20} />
                        ) : (
                          <File size={20} />
                        )}
                      </div>

                      <div className="document-copy">
                        <strong>{document.name}</strong>
                        <small>
                          Added {dateLabel(document.created_at)}
                        </small>
                      </div>

                      <a
                        href={document.file_path}
                        target="_blank"
                        rel="noreferrer"
                        className="document-action"
                      >
                        <Download size={16} />
                        Open
                      </a>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <Empty
            title="No documents yet"
            body="Contracts, reports and brand files will appear here."
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
