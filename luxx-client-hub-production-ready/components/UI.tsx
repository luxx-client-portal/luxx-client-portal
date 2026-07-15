import type { ReactNode } from 'react';
export function PageHeader({eyebrow,title,description,action}:{eyebrow?:string,title:string,description?:string,action?:ReactNode}){return <header className="page-header"><div>{eyebrow&&<p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description&&<p>{description}</p>}</div>{action}</header>}
export function Empty({title,body}:{title:string,body:string}){return <div className="empty"><h3>{title}</h3><p>{body}</p></div>}
export function Badge({value}:{value:string}){return <span className={`badge badge-${value}`}>{value.replaceAll('_',' ')}</span>}
