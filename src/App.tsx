import { useState } from 'react';
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
