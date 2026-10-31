import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Save, Calendar, Bird, Package, RefreshCw, Edit3, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

export default function DailyLog() {
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [isOpeningBalance, setIsOpeningBalance] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // حقول الإدخال
  const [deaths, setDeaths] = useState('0');
  const [chicksIn, setChicksIn] = useState('0'); // جديد: الدجاج الداخل
  const [marketed, setMarketed] = useState('0');
  const [feedReceived, setFeedReceived] = useState('0');
  const [feedConsumed, setFeedConsumed] = useState('0');
  const [feedOut, setFeedOut] = useState('0');
  
  const [existingOpeningId, setExistingOpeningId] = useState<string | null>(null);

  useEffect(() => {
    async function loadFarms() {
      const { data } = await supabase.from('farms_cloud').select('*').order('name');
      if (data) {
        setFarms(data);
        if (data.length > 0) setSelectedFarmId(data[0].id);
      }
      setLoading(false);
    }
    loadFarms();
  }, []);

  useEffect(() => {
    async function fetchOpeningBalance() {
      if (!isOpeningBalance || !selectedFarmId) return;
      
      const farm = farms.find(f => f.id === selectedFarmId);
      const flocks = farm?.flocks || [];
      const activeFlock = flocks.find((f: any) => f.active) || flocks[0];
      if (!activeFlock) return;

      const { data } = await supabase
        .from('records_cloud')
        .select('*')
        .eq('flock_id', activeFlock.id)
        .order('date', { ascending: true })
        .limit(1);

      if (data && data.length > 0) {
        const opening = data[0];
        setExistingOpeningId(opening.id);
        setDate(opening.date);
        setDeaths(opening.deaths.toString());
        setChicksIn((opening.chicks_in || 0).toString()); // قراءة الداخل
        setMarketed(opening.marketed_chicks.toString());
        setFeedReceived((opening.feed_received_kg / 50).toString());
        setFeedConsumed((opening.feed_consumed_kg / 50).toString());
        setFeedOut((opening.feed_out_kg / 50).toString());
      } else {
        setExistingOpeningId(null);
        setDate(new Date().toISOString().split('T')[0]);
        setDeaths('0'); setChicksIn('0'); setMarketed('0'); setFeedReceived('0'); setFeedConsumed('0'); setFeedOut('0');
      }
    }
    
    fetchOpeningBalance();
  }, [isOpeningBalance, selectedFarmId, farms]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId) return alert('اختر المزرعة أولاً');
    setSaving(true);

    const farm = farms.find(f => f.id === selectedFarmId);
    const flocks = farm?.flocks || [];
    const activeFlock = flocks.find((f: any) => f.active) || flocks[0];
    
    if (!activeFlock) {
      setSaving(false);
      return alert('لا توجد دفعة نشطة في هذه المزرعة');
    }

    const BAG_SIZE = 50;
    const feedReceivedKg = Number(feedReceived) * BAG_SIZE;
    const feedConsumedKg = Number(feedConsumed) * BAG_SIZE;
    const feedOutKg = Number(feedOut) * BAG_SIZE;

    const recordData = {
      flock_id: activeFlock.id,
      farm_id: farm.id,
      date,
      deaths: Number(deaths),
      chicks_in: Number(chicksIn), // حفظ الداخل
      marketed_chicks: Number(marketed),
      feed_received_kg: feedReceivedKg,
      feed_consumed_kg: feedConsumedKg,
      feed_out_kg: feedOutKg,
    };

    let error;
    if (isOpeningBalance && existingOpeningId) {
      const res = await supabase.from('records_cloud').update(recordData).eq('id', existingOpeningId);
      error = res.error;
    } else {
      const { data: existing } = await supabase
        .from('records_cloud')
        .select('id')
        .eq('flock_id', activeFlock.id)
        .eq('date', date)
        .maybeSingle();

      if (existing) {
        const res = await supabase.from('records_cloud').update(recordData).eq('id', existing.id);
        error = res.error;
      } else {
        const res = await supabase.from('records_cloud').insert([recordData]);
        error = res.error;
      }
    }

    setSaving(false);

    if (error) {
      alert('حدث خطأ: ' + error.message);
    } else {
      alert('✅ تم حفظ البيانات بنجاح');
      if (!isOpeningBalance) {
        setDeaths('0'); setChicksIn('0'); setMarketed('0'); setFeedReceived('0'); setFeedConsumed('0'); setFeedOut('0');
      }
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">جاري التحميل...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800">الإدخال اليومي</h2>
          <p className="text-gray-500 mt-1 font-medium">سجّل بيانات اليوم مباشرة في النظام.</p>
        </div>
      </header>

      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        <div className="bg-gray-50 border-b border-gray-100 p-4 flex gap-4">
          <button type="button" onClick={() => setIsOpeningBalance(false)} className={`flex-1 py-2 rounded-lg font-bold ${!isOpeningBalance ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`}>
            سجل يومي عادي
          </button>
          <button type="button" onClick={() => setIsOpeningBalance(true)} className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 ${isOpeningBalance ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>
            <RefreshCw size={18} /> رصيد افتتاحي (ترحيل/تعديل)
          </button>
        </div>

        <div className="p-8 space-y-6">
          {isOpeningBalance && (
            <div className={`p-4 rounded-xl text-sm font-bold border ${existingOpeningId ? 'bg-amber-50 text-amber-800 border-amber-100' : 'bg-blue-50 text-blue-800 border-blue-100'}`}>
              {existingOpeningId ? (
                <span className="flex items-center gap-2"><Edit3 size={18}/> أنت الآن تقوم بتعديل الرصيد الافتتاحي الموجود لهذه المزرعة.</span>
              ) : (
                <span>💡 استخدم هذا الخيار لإدخال إجمالي الحركات التراكمية التي حدثت <b>قبل</b> بدء استخدام النظام.</span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">المزرعة</label>
              <select value={selectedFarmId} onChange={e => setSelectedFarmId(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-800">
                {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{isOpeningBalance ? 'تاريخ الترحيل (لغاية)' : 'التاريخ'}</label>
              <div className="relative">
                <Calendar className="absolute right-3 top-3.5 text-gray-400" size={20} />
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-800" required />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* قسم حركة الدجاج */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Bird className="text-emerald-600" /> {isOpeningBalance ? 'الحركة التراكمية للدجاج' : 'حركة الدجاج'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                  <ArrowDownToLine size={16} className="text-red-500"/> الوفيات (دجاجة)
                </label>
                <input type="number" min="0" value={deaths} onChange={e => setDeaths(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none font-bold" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                  <ArrowDownToLine size={16} className="text-blue-500"/> الدجاج الداخل
                </label>
                <input type="number" min="0" value={chicksIn} onChange={e => setChicksIn(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none font-bold" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                  <ArrowUpFromLine size={16} className="text-orange-500"/> الدجاج المحمل (تسويق)
                </label>
                <input type="number" min="0" value={marketed} onChange={e => setMarketed(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none font-bold" />
              </div>
            </div>
          </div>

          {/* قسم العلف */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="text-blue-600" /> {isOpeningBalance ? 'إجمالي العلف التراكمي' : 'حركة العلف'} (بالأكياس)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{isOpeningBalance ? 'إجمالي الوارد سابقاً' : 'الوارد اليوم'}</label>
                <input type="number" step="0.1" min="0" value={feedReceived} onChange={e => setFeedReceived(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none font-bold" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{isOpeningBalance ? 'إجمالي المستهلك سابقاً' : 'المستهلك اليوم'}</label>
                <input type="number" step="0.1" min="0" value={feedConsumed} onChange={e => setFeedConsumed(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none font-bold" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{isOpeningBalance ? 'إجمالي الخارج سابقاً' : 'الخارج اليوم'}</label>
                <input type="number" step="0.1" min="0" value={feedOut} onChange={e => setFeedOut(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none font-bold" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-end">
          <button type="submit" disabled={saving} className={`flex items-center gap-2 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg transition-all disabled:opacity-50 ${isOpeningBalance && existingOpeningId ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}>
            <Save size={20} />
            {saving ? 'جاري الحفظ...' : (isOpeningBalance ? (existingOpeningId ? 'تحديث الرصيد الافتتاحي' : 'حفظ الرصيد الافتتاحي') : 'حفظ السجل')}
          </button>
        </div>
      </form>
    </div>
  );
}
