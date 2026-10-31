import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Farms() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('groups').select('*').order('created_at', { ascending: false });
      if (data) setGroups(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div>جاري تحميل المزارع...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">المزارع (المجموعات)</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-600">اسم المزرعة</th>
              <th className="px-6 py-4 font-semibold text-gray-600">كود الدعوة</th>
              <th className="px-6 py-4 font-semibold text-gray-600">تاريخ الإنشاء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {groups.map((g) => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{g.name}</td>
                <td className="px-6 py-4 text-gray-500 font-mono">{g.invite_code}</td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {new Date(g.created_at).toLocaleDateString('ar-EG')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
