import type { SupabaseClient } from '@supabase/supabase-js';

type ActivityInput = {
  clientId?: string | null;
  actorId: string;
  actionType: string;
  title: string;
  description?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logActivity(
  supabase: SupabaseClient,
  activity: ActivityInput,
) {
  const { error } = await supabase
    .from('activity_log')
    .insert({
      client_id: activity.clientId || null,
      actor_id: activity.actorId,
      action_type: activity.actionType,
      title: activity.title,
      description: activity.description || null,
      entity_type: activity.entityType || null,
      entity_id: activity.entityId || null,
      metadata: activity.metadata || {},
    });

  if (error) {
    console.error('Activity log error:', error.message);
  }
}
