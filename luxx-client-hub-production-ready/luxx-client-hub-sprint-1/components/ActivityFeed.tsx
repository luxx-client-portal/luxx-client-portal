import {
  CalendarCheck2,
  CheckCircle2,
  FileText,
  FolderOpen,
  MessageCircle,
  Receipt,
  UserPlus,
  Users,
} from "lucide-react";

const icons = {
  client_created: Users,
  content_uploaded: CalendarCheck2,
  content_approved: CheckCircle2,
  content_changes_requested: MessageCircle,
  comment_added: MessageCircle,
  invoice_created: Receipt,
  document_uploaded: FolderOpen,
  request_created: FileText,
  client_invited: UserPlus,
};

type Activity = {
  id: string;
  action_type: string;
  title: string;
  description: string | null;
  created_at: string;
};

export function ActivityFeed({
  activities,
}: {
  activities: Activity[];
}) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <p className="eyebrow">
            ACTIVITY
          </p>

          <h2>Recent Activity</h2>
        </div>
      </div>

      {activities.length ? (
        <div className="activity-feed">
          {activities.map((activity) => {
            const Icon =
              icons[
                activity.action_type as keyof typeof icons
              ] || CalendarCheck2;

            return (
              <div
                className="activity-row"
                key={activity.id}
              >
                <div className="activity-icon">
                  <Icon size={18} />
                </div>

                <div className="activity-body">
                  <strong>
                    {activity.title}
                  </strong>

                  {activity.description && (
                    <p>
                      {activity.description}
                    </p>
                  )}

                  <small>
                    {new Intl.DateTimeFormat(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }
                    ).format(
                      new Date(
                        activity.created_at
                      )
                    )}
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p>No activity yet.</p>
      )}
    </div>
  );
}
