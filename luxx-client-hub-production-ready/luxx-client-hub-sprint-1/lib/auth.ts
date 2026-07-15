import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';
export async function requireProfile(adminOnly=false): Promise<Profile> {
  const supabase = await createClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data, error } = await supabase.from('profiles').select('id,client_id,full_name,role,clients(name,slug)').eq('id',user.id).single();
  if (error || !data) redirect('/login?error=profile');
  const profile = data as unknown as Profile;
  if (adminOnly && profile.role !== 'admin') redirect('/dashboard');
  return profile;
}
