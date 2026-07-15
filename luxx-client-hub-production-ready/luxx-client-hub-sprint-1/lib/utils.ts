export const money = (cents:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
export const dateLabel = (value:string|null) => value ? new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(new Date(value)) : 'Not scheduled';
export const statusLabel = (s:string) => s.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
