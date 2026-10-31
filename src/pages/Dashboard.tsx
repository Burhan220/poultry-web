import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({ groups: 0, profiles: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [groups, profiles] = await Promise.all([
        supabase.from('groups').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
      ]);
      setStats({
        groups: groups.count || 0,
        profiles: profiles.count || 0,
      });
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return <div>جاري تحميل الإحصائيات...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">لوحة التحكم</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">إجمالي المجموعات (المزارع)</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.groups}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">المستخدمون المسجلون</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.profiles}</p>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[300px]">
        <h3 className="text-lg font-bold text-gray-700 mb-4">مرحباً بك 👋</h3>
        <p className="text-gray-500">اختر "المزارع" من القائمة الجانبية لعرض وتعديل بيانات المزارع.</p>
      </div>
    </div>
  );
}
