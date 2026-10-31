import os

sidebar_code = '''import { NavLink } from 'react-router-dom';
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
'''

with open('src/components/Sidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(sidebar_code)
print("✅ تم تحديث ملف Sidebar.tsx")

app_code = '''import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Farms from './pages/Farms';
import Users from './pages/Users';
import DailyLog from './DailyLog';
import ReportsView from './ReportsView';
import AddFarm from './AddFarm';
import Login from './pages/Login';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isAuthenticated = true; 

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50 overflow-hidden" dir="rtl">
        
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed top-4 right-4 z-30 p-2 bg-white rounded-lg shadow-md text-gray-700"
        >
          <Menu size={24} />
        </button>

        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/farms" element={<Farms />} />
            <Route path="/users" element={<Users />} />
            <Route path="/daily-log" element={<DailyLog />} />
            <Route path="/reports" element={<ReportsView />} />
            <Route path="/add-farm" element={<AddFarm />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
'''

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(app_code)
print("✅ تم تحديث ملف App.tsx")

os.system('git add .')
os.system('git commit -m "Add responsive sidebar"')
os.system('git push')
print("✅ تم رفع التعديلات! انتظر دقيقة وسيتحدث Vercel.")
