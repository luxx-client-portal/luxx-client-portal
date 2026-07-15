'use server';
import { revalidatePath } from 'next/cache';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
export async function createRequestAction(formData:FormData){
 const p=await requireProfile(); if(!p.client_id) throw new Error('No client assigned'); const s=await createClient();
 const {error}=await s.from('requests').insert({client_id:p.client_id,created_by:p.id,request_type:String(formData.get('request_type')),details:String(formData.get('details')),preferred_deadline:String(formData.get('preferred_deadline')||'')||null}); if(error) throw error; revalidatePath('/requests');
}
export async function createClientAction(formData:FormData){ await requireProfile(true); const s=await createClient(); const {error}=await s.from('clients').insert({name:String(formData.get('name')),slug:String(formData.get('slug')).toLowerCase().replace(/[^a-z0-9]+/g,'-')}); if(error) throw error; revalidatePath('/admin/clients'); }
export async function createDocumentAction(formData:FormData){ await requireProfile(true); const s=await createClient(); const {error}=await s.from('documents').insert({client_id:String(formData.get('client_id')),name:String(formData.get('name')),category:String(formData.get('category')),file_path:String(formData.get('file_path'))}); if(error) throw error; revalidatePath('/admin/documents'); }
export async function createInvoiceAction(formData:FormData){ await requireProfile(true); const s=await createClient(); const amount=Math.round(Number(formData.get('amount'))*100); const {error}=await s.from('invoices').insert({client_id:String(formData.get('client_id')),invoice_number:String(formData.get('invoice_number')),amount_cents:amount,status:String(formData.get('status')),due_date:String(formData.get('due_date')||'')||null,file_path:String(formData.get('file_path')||'')||null}); if(error) throw error; revalidatePath('/admin/invoices'); }
