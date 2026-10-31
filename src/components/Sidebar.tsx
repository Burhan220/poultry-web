import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Home, Users, LogOut, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  const handleLogout = () => supabase.auth.signOut();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 right-0 z-50 w-64 bg-white border-l border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex
      `}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-emerald-800">🐔 سجل الدواجن</h1>
            <p className="text-xs text-gray-500 mt-1">نظام الإدارة الذكي</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-500 hover:text-red-500">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavLink to="/" className={linkClass} onClick={() => setIsOpen(false)}>
            <LayoutDashboard size={20} />
            <span>لوحة التحكم</span>
          </NavLink>
          <NavLink to="/farms" className={linkClass} onClick={() => setIsOpen(false)}>
            <Home size={20} />
            <span>المزارع</span>
          </NavLink>
          <NavLink to="/users" className={linkClass} onClick={() => setIsOpen(false)}>
            <Users size={20} />
            <span>المستخدمون</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={20} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
