import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, MessagesSquare, FileText, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    navigate('/login');
    window.location.reload();
  };

  const navLinks = [
    { name: 'Chat', icon: MessagesSquare, path: '/' },
    { name: 'Khảo sát', icon: BookOpen, path: '/assessment' },
    { name: 'Tài liệu', icon: FileText, path: '/documents' },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-stone-200">
      {/* Sidebar */}
      <aside className={`w-64 border-r border-border bg-[#Fdfbf7] flex-shrink-0 transition-transform duration-300 ${menuOpen ? 'translate-x-0 absolute z-50 h-full' : '-translate-x-full absolute'} md:relative md:translate-x-0`}>
        <div className="p-6 md:p-8 border-b border-border flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-serif font-bold text-primary italic">AI Tutor</h1>
            <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-widest">Học tập thông minh</p>
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(false)}>
            <LogOut className="w-5 h-5 opacity-50" />
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link 
                key={link.path} 
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200
                  ${isActive 
                    ? 'bg-stone-200/50 text-primary font-medium shadow-sm border border-stone-200/30' 
                    : 'text-muted-foreground hover:bg-stone-100 hover:text-primary'}
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-border">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-muted-foreground hover:bg-stone-100 hover:text-destructive rounded-md transition-colors">
            <LogOut className="w-5 h-5 opacity-70" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-0 min-w-0 bg-[#Fdfbf7]">
        {/* Mobile Header */}
        <header className="md:hidden p-4 border-b border-border flex items-center justify-between bg-[#Fdfbf7] z-10">
          <h1 className="text-xl font-serif font-bold text-primary italic">AI Tutor</h1>
          <button onClick={() => setMenuOpen(true)}>
            <Menu className="w-6 h-6 text-primary" />
          </button>
        </header>
        
        <main className="flex-1 overflow-auto p-4 md:p-8 relative">
          <div className="max-w-4xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Mobile overlay */}
      {menuOpen && (
        <div className="fixed inset-0 bg-stone-900/10 backdrop-blur-sm z-40 md:hidden" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  );
}
