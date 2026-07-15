'use server';

import { revalidatePath } from 'next/cache';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value || '').trim();
  return text || null;
}

export async function createRequestAction(formData: FormData) {
  const profile = await requireProfile();

  if (!profile.client_id) {
    throw new Error('No client assigned');
  }

  const supabase = await createClient();

  const { error } = await supabase.from('requests').insert({
    client_id: profile.client_id,
    created_by: profile.id,
    request_type: String(formData.get('request_type') || '').trim(),
    details: String(formData.get('details') || '').trim(),
    preferred_deadline: optionalText(
      formData.get('preferred_deadline'),
    ),
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/requests');
  revalidatePath('/dashboard');
}

export async function createClientAction(formData: FormData) {
  await requireProfile(true);

  const supabase = await createClient();

  const name = String(formData.get('name') || '').trim();

  const rawSlug =
    String(formData.get('slug') || '').trim() || name;

  const slug = rawSlug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const services = String(formData.get('services') || '')
    .split(',')
    .map((service) => service.trim())
    .filter(Boolean);

  const monthlyRetainerDollars = Number(
    formData.get('monthly_retainer') || 0,
  );

  const monthlyRetainerCents = Number.isFinite(
    monthlyRetainerDollars,
  )
    ? Math.round(monthlyRetainerDollars * 100)
    : 0;

  const { error } = await supabase.from('clients').insert({
    name,
    slug,
    contact_name: optionalText(formData.get('contact_name')),
    email: optionalText(formData.get('email')),
    phone: optionalText(formData.get('phone')),
    package_name: optionalText(formData.get('package_name')),
    monthly_retainer: monthlyRetainerCents,
    contract_start: optionalText(formData.get('contract_start')),
    contract_end: optionalText(formData.get('contract_end')),
    status: String(formData.get('status') || 'active'),
    services,
    notes: optionalText(formData.get('notes')),
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/clients');
  revalidatePath('/dashboard');
}

export async function createDocumentAction(formData: FormData) {
  await requireProfile(true);

  const supabase = await createClient();

  const { error } = await supabase.from('documents').insert({
    client_id: String(formData.get('client_id') || ''),
    name: String(formData.get('name') || '').trim(),
    category: String(formData.get('category') || '').trim(),
    file_path: String(formData.get('file_path') || '').trim(),
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/documents');
  revalidatePath('/documents');
  revalidatePath('/dashboard');
}

export async function createInvoiceAction(formData: FormData) {
  await requireProfile(true);

  const supabase = await createClient();

  const amountDollars = Number(formData.get('amount') || 0);

  const amountCents = Number.isFinite(amountDollars)
    ? Math.round(amountDollars * 100)
    : 0;

  const { error } = await supabase.from('invoices').insert({
    client_id: String(formData.get('client_id') || ''),
    invoice_number: optionalText(
      formData.get('invoice_number'),
    ),
    amount_cents: amountCents,
    status: String(formData.get('status') || 'due'),
    due_date: optionalText(formData.get('due_date')),
    file_path: optionalText(formData.get('file_path')),
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/invoices');
  revalidatePath('/invoices');
  revalidatePath('/dashboard');
}

export async function createClientNoteAction(
  formData: FormData,
) {
  const profile = await requireProfile(true);
  const supabase = await createClient();

  const clientId = String(
    formData.get('client_id') || '',
  );

  const body = String(formData.get('body') || '').trim();

  if (!clientId || !body) {
    throw new Error('Client and note are required.');
  }

  const { error } = await supabase
    .from('client_notes')
    .insert({
      client_id: clientId,
      author_id: profile.id,
      body,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(
    `/admin/clients/${clientId}/notes`,
  );

  revalidatePath(
    `/admin/clients/${clientId}`,
  );
}

export async function createContentAction(
  formData: FormData,
) {
  await requireProfile(true);

  const supabase = await createClient();

  const clientId = String(
    formData.get('client_id') || '',
  );

  const title = String(
    formData.get('title') || '',
  ).trim();

  const contentType = String(
    formData.get('content_type') || '',
  ).trim();

  const caption = String(
    formData.get('caption') || '',
  ).trim();

  const previewUrl = String(
    formData.get('preview_url') || '',
  ).trim();

  const scheduledFor = String(
    formData.get('scheduled_for') || '',
  ).trim();

  const status = String(
    formData.get('status') || 'draft',
  );

  if (!clientId || !title) {
    throw new Error(
      'Client and content title are required.',
    );
  }

  const { error } = await supabase
    .from('content_items')
    .insert({
      client_id: clientId,
      title,
      content_type: contentType || null,
      caption: caption || null,
      preview_url: previewUrl || null,
      scheduled_for: scheduledFor || null,
      status,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(
    `/admin/clients/${clientId}/content`,
  );

  revalidatePath(
    `/admin/clients/${clientId}/calendar`,
  );

  revalidatePath(
    `/admin/clients/${clientId}`,
  );

  revalidatePath('/dashboard');
}

export async function approveContentAction(
  formData: FormData,
) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const contentItemId = String(
    formData.get('content_item_id') || '',
  );

  const clientId = String(
    formData.get('client_id') || '',
  );

  if (!contentItemId || !clientId) {
    throw new Error(
      'Content item and client are required.',
    );
  }

  if (
    profile.role !== 'admin' &&
    profile.client_id !== clientId
  ) {
    throw new Error(
      'You do not have access to this content.',
    );
  }

  const { error: updateError } = await supabase
    .from('content_items')
    .update({
      status: 'approved',
    })
    .eq('id', contentItemId)
    .eq('client_id', clientId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error: feedbackError } = await supabase
    .from('content_feedback')
    .insert({
      content_item_id: contentItemId,
      client_id: clientId,
      author_id: profile.id,
      message: 'Content approved.',
      feedback_type: 'approval',
    });

  if (feedbackError) {
    throw new Error(feedbackError.message);
  }

  revalidateContentPages(clientId, contentItemId);
}

export async function requestContentChangesAction(
  formData: FormData,
) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const contentItemId = String(
    formData.get('content_item_id') || '',
  );

  const clientId = String(
    formData.get('client_id') || '',
  );

  const message = String(
    formData.get('message') || '',
  ).trim();

  if (!contentItemId || !clientId) {
    throw new Error(
      'Content item and client are required.',
    );
  }

  if (!message) {
    throw new Error(
      'Please explain what should be changed.',
    );
  }

  if (
    profile.role !== 'admin' &&
    profile.client_id !== clientId
  ) {
    throw new Error(
      'You do not have access to this content.',
    );
  }

  const { error: updateError } = await supabase
    .from('content_items')
    .update({
      status: 'changes_requested',
    })
    .eq('id', contentItemId)
    .eq('client_id', clientId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error: feedbackError } = await supabase
    .from('content_feedback')
    .insert({
      content_item_id: contentItemId,
      client_id: clientId,
      author_id: profile.id,
      message,
      feedback_type: 'changes_requested',
    });

  if (feedbackError) {
    throw new Error(feedbackError.message);
  }

  revalidateContentPages(clientId, contentItemId);
}

export async function addContentCommentAction(
  formData: FormData,
) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const contentItemId = String(
    formData.get('content_item_id') || '',
  );

  const clientId = String(
    formData.get('client_id') || '',
  );

  const message = String(
    formData.get('message') || '',
  ).trim();

  if (!contentItemId || !clientId || !message) {
    throw new Error(
      'Content item, client and comment are required.',
    );
  }

  if (
    profile.role !== 'admin' &&
    profile.client_id !== clientId
  ) {
    throw new Error(
      'You do not have access to this content.',
    );
  }

  const { error } = await supabase
    .from('content_feedback')
    .insert({
      content_item_id: contentItemId,
      client_id: clientId,
      author_id: profile.id,
      message,
      feedback_type: 'comment',
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidateContentPages(clientId, contentItemId);
}

function revalidateContentPages(
  clientId: string,
  contentItemId: string,
) {
  revalidatePath('/content');
  revalidatePath('/dashboard');

  revalidatePath(
    `/admin/clients/${clientId}`,
  );

  revalidatePath(
    `/admin/clients/${clientId}/content`,
  );

  revalidatePath(
    `/admin/clients/${clientId}/content/${contentItemId}`,
  );
}
