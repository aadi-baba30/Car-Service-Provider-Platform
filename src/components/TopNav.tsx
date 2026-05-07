import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wrench, ChevronDown, User, Info, LifeBuoy } from 'lucide-react';
import { Logo } from './Logo';

export function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex justify-between items-center px-8 py-6 bg-white border-b border-gray-200 relative">
      <div className="relative" ref={dropdownRef}>
        {isAuthPage ? (
          <Logo />
        ) : (
          <>
            <div 
              className="flex items-center gap-2 cursor-pointer group" 
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <Logo />
              <ChevronDown className={`w-4 h-4 transition-transform ml-2 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {dropdownOpen && (
              <div className="absolute top-14 left-0 w-64 bg-white border-2 border-black rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <p className="font-bold text-sm">Welcome to STYKY</p>
                  {user && <p className="text-xs text-gray-500">{user.email}</p>}
                </div>
                <div className="py-2">
                  <button onClick={() => { setDropdownOpen(false); navigate(user?.role === 'admin' ? '/admin' : user?.role === 'vendor' ? '/vendor' : '/home'); }} className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-gray-50 flex items-center gap-3">
                    <Wrench className="w-4 h-4 text-gray-400" />
                    Dashboard
                  </button>
                  {user?.role === 'customer' && (
                    <button onClick={() => { setDropdownOpen(false); navigate('/profile'); }} className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-gray-50 flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-400" />
                      Profile Details
                    </button>
                  )}
                  <button onClick={() => { setDropdownOpen(false); navigate('/about'); }} className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-gray-50 flex items-center gap-3">
                    <Info className="w-4 h-4 text-gray-400" />
                    About Us
                  </button>
                  <button onClick={() => { setDropdownOpen(false); navigate('/support'); }} className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-gray-50 flex items-center gap-3">
                    <LifeBuoy className="w-4 h-4 text-gray-400" />
                    Customer Support
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-6 text-sm font-medium text-gray-500 hidden md:flex">
        {user && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span>{user.role} Active: {user.name}</span>
          </div>
        )}
        <div className="h-4 w-[1px] bg-gray-300 hidden md:block"></div>
        <span className="hidden md:block">Sector-4, Gurugram</span>
        {user ? (
          <button onClick={handleLogout} className="px-4 py-2 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">Logout</button>
        ) : (
          <button onClick={() => navigate('/login')} className="px-4 py-2 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">Login</button>
        )}
      </div>
      {/* Mobile view fallback for auth buttons */}
      <div className="flex items-center gap-4 md:hidden">
         {user ? (
          <button onClick={handleLogout} className="px-4 py-2 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest">Logout</button>
        ) : (
          <button onClick={() => navigate('/login')} className="px-4 py-2 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest">Login</button>
        )}
      </div>
    </header>
  )
}
