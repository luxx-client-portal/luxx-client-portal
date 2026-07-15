export type Role = 'admin' | 'client';
export type ContentStatus = 'draft'|'internal_review'|'client_review'|'changes_requested'|'approved'|'scheduled'|'posted';
export type Profile = { id:string; client_id:string|null; full_name:string|null; role:Role; clients?:{name:string;slug:string}|null };
export type ContentItem = { id:string; client_id:string; title:string; content_type:string|null; caption:string|null; preview_url:string|null; scheduled_for:string|null; status:ContentStatus; created_at:string; clients?:{name:string}|null };
export type DocumentRow = { id:string; client_id:string; name:string; category:string; file_path:string; created_at:string; clients?:{name:string}|null };
export type Invoice = { id:string; client_id:string; invoice_number:string|null; amount_cents:number; status:string; due_date:string|null; file_path:string|null; clients?:{name:string}|null };
export type ClientRequest = { id:string; client_id:string; request_type:string; details:string; preferred_deadline:string|null; status:string; created_at:string; clients?:{name:string}|null };
