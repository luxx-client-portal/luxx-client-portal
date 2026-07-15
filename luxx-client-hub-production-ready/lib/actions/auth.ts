'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
export async function loginAction(formData:FormData) {
  const email=String(formData.get('email')||''); const password=String(formData.get('password')||'');
  const supabase=await createClient(); const {error}=await supabase.auth.signInWithPassword({email,password});
  if(error) redirect('/login?error='+encodeURIComponent(error.message)); redirect('/dashboard');
}
export async function logoutAction(){ const supabase=await createClient(); await supabase.auth.signOut(); redirect('/login'); }
export async function forgotPasswordAction(formData:FormData){
  const email=String(formData.get('email')||''); const supabase=await createClient();
  const base=process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000'; await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${base}/auth/callback?next=/dashboard`});
  redirect('/login?message=Password reset email sent.');
}
