import type { ReactNode } from 'react';
export function AdminForm({title,action,children}:{title:string,action:(formData:FormData)=>void|Promise<void>,children:ReactNode}){return <form action={action} className="card stack admin-form"><h2>{title}</h2>{children}<button className="button primary">Save</button></form>}
export function ClientSelect({clients}:{clients:{id:string;name:string}[]}){return <label>Client<select name="client_id" required><option value="">Select a client</option>{clients.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label>}
