import Sidebar from './Sidebar'
import Topbar from './Topbar'
import AIChatbot from '../ui/AIChatbot'

export default function AppLayout({ title, children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title={title} />
        <main className="page-body">{children}</main>
      </div>
      <AIChatbot />
    </div>
  )
}
