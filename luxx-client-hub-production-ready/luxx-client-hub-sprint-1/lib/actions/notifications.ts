'use server';

import { revalidatePath } from 'next/cache';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function markNotificationReadAction(
  formData: FormData,
) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const notificationId = String(
    formData.get('notification_id') || '',
  );

  if (!notificationId) {
    throw new Error('Notification ID is required.');
  }

  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .eq('recipient_id', profile.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard');
  revalidatePath('/notifications');
}

export async function markAllNotificationsReadAction() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('recipient_id', profile.id)
    .eq('is_read', false);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard');
  revalidatePath('/notifications');
}
