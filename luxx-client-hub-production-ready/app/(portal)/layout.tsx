import { Sidebar } from '@/components/Sidebar'; import { requireProfile } from '@/lib/auth';
export default async function PortalLayout({children}:{children:React.ReactNode}){const profile=await requireProfile();return <div className="app-shell"><Sidebar profile={profile}/><main className="main-content">{children}</main></div>}
