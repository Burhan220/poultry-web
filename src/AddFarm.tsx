import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Home, Save, Calendar, Package, Bird } from 'lucide-react';

export default function AddFarm() {
  const [loading, setLoading] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);
  
  // بيانات المزرعة
  const [name, setName] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [location, setLocation] = useState('');
  
  // بيانات الدفعة الأولى
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split('T')[0]);
  const [initialChicks, setInitialChicks] = useState('0');
  const [source, setSource] = useState('');
  const [initialFeedBags, setInitialFeedBags] = useState('0');
  const [feedType, setFeedType] = useState('سوبر');

  useEffect(() => {
    async function getGroup() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('group_members').select('group_id').eq('user_id', user.id).limit(1).single();
        if (data) setGroupId(data.group_id);
      }
    }
    getGroup();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('اكتب اسم المزرعة');
    if (Number(initialChicks) <= 0) return alert('أدخل كمية الكتاكيت');
    
    setLoading(true);

    const newFarmId = crypto.randomUUID();
    const newFlockId = crypto.randomUUID();
    
    // تحويل العلف من أكياس إلى كجم
    const initialFeedKg = Number(initialFeedBags) * 50;

    // بناء هيكل الدفعة
    const newFlock = {
      id: newFlockId,
      arrivalDate: arrivalDate,
      initialAgeDays: 0,
      initialChicks: Number(initialChicks),
      initialFeedKg: initialFeedKg,
      source: source.trim(),
      active: true,
      feedType: feedType.trim(),
    };

    // هيكل المزرعة
    const newFarmData = {
      id: newFarmId,
      name: name.trim(),
      supervisor: supervisor.trim(),
      doctorName: doctorName.trim(),
      location: location.trim(),
      active_flock_id: newFlockId,
      flocks: [newFlock],
      group_id: groupId,
      owner_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('farms_cloud').insert([newFarmData]);

    setLoading(false);

    if (error) {
      alert('حدث خطأ أثناء الحفظ: ' + error.message);
    } else {
      alert('✅ تم إنشاء المزرعة وإضافة الدفعة الأولى بنجاح');
      setName(''); setSupervisor(''); setDoctorName(''); setLocation('');
      setInitialChicks('0'); setSource(''); setInitialFeedBags('0');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <h2 className="text-3xl font-extrabold text-gray-800">إنشاء مزرعة جديدة</h2>
        <p className="text-gray-500 mt-1 font-medium">أضف بيانات المزرعة والدفعة الأولى للبدء.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 space-y-8">
          
          {/* القسم الأول: بيانات المزرعة */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
              <Home className="text-emerald-600" /> بيانات المزرعة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">اسم المزرعة</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" placeholder="مثال: مزرعة طارق حيدر" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">المشرف</label>
                <input type="text" value={supervisor} onChange={e => setSupervisor(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" placeholder="اسم المشرف" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">اسم الدكتور</label>
                <input type="text" value={doctorName} onChange={e => setDoctorName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" placeholder="اسم الدكتور" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">الموقع</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold" placeholder="الموقع" />
              </div>
            </div>
          </div>

          {/* القسم الثاني: بيانات الدفعة الأولى */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
              <Bird className="text-blue-600" /> بيانات الدفعة الأولى
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ الوصول</label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-3.5 text-gray-400" size={20} />
                  <input type="date" value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} required className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">عدد الكتاكيت</label>
                <input type="number" min="1" value={initialChicks} onChange={e => setInitialChicks(e.target.value)} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">المصدر</label>
                <input type="text" value={source} onChange={e => setSource(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="مثال: سياني" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">نوع العلف</label>
                <input type="text" value={feedType} onChange={e => setFeedType(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="سوبر" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">العلف الأولي (أكياس)</label>
                <div className="relative">
                  <Package className="absolute right-3 top-3.5 text-gray-400" size={20} />
                  <input type="number" step="0.1" min="0" value={initialFeedBags} onChange={e => setInitialFeedBags(e.target.value)} className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-end">
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 transition-all disabled:opacity-50">
            <Save size={20} />
            {loading ? 'جاري الحفظ...' : 'حفظ المزرعة والدفعة'}
          </button>
        </div>
      </form>
    </div>
  );
}
