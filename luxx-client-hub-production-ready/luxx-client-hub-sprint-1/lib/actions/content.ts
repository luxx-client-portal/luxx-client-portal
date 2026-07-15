'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import type { ContentStatus } from '@/lib/types';
export async function updateContentStatus(id:string,status:ContentStatus,feedback?:string){
  const profile=await requireProfile(); const supabase=await createClient();
  const allowed:ContentStatus[] = profile.role==='admin' ? ['draft','internal_review','client_review','changes_requested','approved','scheduled','posted'] : ['changes_requested','approved'];
  if(!allowed.includes(status)) throw new Error('Not allowed');
  const {error}=await supabase.from('content_items').update({status}).eq('id',id); if(error) throw error;
  if(feedback?.trim()) { const {error:ce}=await supabase.from('comments').insert({content_item_id:id,author_id:profile.id,body:feedback.trim()}); if(ce) throw ce; }
  revalidatePath('/content'); revalidatePath('/dashboard'); revalidatePath('/admin/content');
}
export async function createContentAction(formData:FormData){
  await requireProfile(true); const supabase=await createClient();
  const payload={client_id:String(formData.get('client_id')),title:String(formData.get('title')),content_type:String(formData.get('content_type')||''),caption:String(formData.get('caption')||''),preview_url:String(formData.get('preview_url')||'')||null,scheduled_for:String(formData.get('scheduled_for')||'')||null,status:String(formData.get('status')||'draft')};
  const {error}=await supabase.from('content_items').insert(payload); if(error) throw error; revalidatePath('/admin/content');
}
