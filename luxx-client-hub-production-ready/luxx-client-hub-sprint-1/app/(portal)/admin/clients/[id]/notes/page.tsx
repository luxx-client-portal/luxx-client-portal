import { notFound } from 'next/navigation';
import {
  Clock3,
  StickyNote,
  User,
} from 'lucide-react';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createClientNoteAction } from '@/lib/actions/portal';
import { Empty } from '@/components/UI';
import { AdminForm } from '@/components/AdminForms';

type NoteRecord = {
  id: string;
  body: string;
  created_at: string;
  profiles:
    | {
        full_name: string | null;
      }
    | {
        full_name: string | null;
      }[]
    | null;
};

export default async function ClientNotesPage({
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
    .from('client_notes')
    .select(`
      id,
      body,
      created_at,
      profiles (
        full_name
      )
    `)
    .eq('client_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const notes = (data || []) as NoteRecord[];

  return (
    <section className="notes-layout">
      <AdminForm
        title="Add Internal Note"
        action={createClientNoteAction}
      >
        <input
          type="hidden"
          name="client_id"
          value={id}
        />

        <label>
          Note
          <textarea
            name="body"
            rows={7}
            required
          />
        </label>
      </AdminForm>

      <div className="card">
        <div className="card-head">
          <div>
            <p className="eyebrow">LUXX TEAM ONLY</p>
            <h2>Notes timeline</h2>
          </div>
        </div>

        {notes.length ? (
          <div className="notes-timeline">
            {notes.map((note) => {
              const profile = Array.isArray(
                note.profiles,
              )
                ? note.profiles[0]
                : note.profiles;

              return (
                <article
                  className="note-entry"
                  key={note.id}
                >
                  <div className="note-marker">
                    <StickyNote size={17} />
                  </div>

                  <div className="note-content">
                    <p>{note.body}</p>

                    <div className="note-meta">
                      <span>
                        <User size={14} />
                        {profile?.full_name ||
                          'Luxx Team'}
                      </span>

                      <span>
                        <Clock3 size={14} />
                        {new Intl.DateTimeFormat(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          },
                        ).format(
                          new Date(note.created_at),
                        )}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <Empty
            title="No internal notes"
            body="Add the first private note for this client."
          />
        )}
      </div>
    </section>
  );
}
