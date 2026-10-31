import { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { Calendar, Printer, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ReportsView() {
  const [farms, setFarms] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(firstDay);
  const [toDate, setToDate] = useState(today);

  useEffect(() => {
    async function load() {
      const [farmsRes, recordsRes] = await Promise.all([
        supabase.from('farms_cloud').select('*').order('name'),
        supabase.from('records_cloud').select('*')
      ]);
      if (farmsRes.data) setFarms(farmsRes.data);
      if (recordsRes.data) setRecords(recordsRes.data);
      setLoading(false);
    }
    load();
  }, []);

  const reportData = useMemo(() => {
    return farms.map(farm => {
      const flocks = farm.flocks || [];
      const activeFlock = flocks.find((f: any) => f.active) || flocks[0];
      if (!activeFlock) return null;

      const arrival = new Date(activeFlock.arrivalDate);
      const now = new Date();
      const ageDays = Math.floor((now.getTime() - arrival.getTime()) / (1000 * 3600 * 24)) + (activeFlock.initialAgeDays || 0);

      const periodRecords = records.filter(r => 
        r.flock_id === activeFlock.id && 
        r.date >= fromDate && 
        r.date <= toDate
      );

      const totalDeaths = periodRecords.reduce((sum, r) => sum + (r.deaths || 0), 0);
      const totalFeedKg = periodRecords.reduce((sum, r) => sum + (r.feed_consumed_kg || 0), 0);
      const receivedFeedKg = periodRecords.reduce((sum, r) => sum + (r.feed_received_kg || 0), 0);
      const outFeedKg = periodRecords.reduce((sum, r) => sum + (r.feed_out_kg || 0), 0);
      const totalMarketed = periodRecords.reduce((sum, r) => sum + (r.marketed_chicks || 0), 0);

      const sortedRecords = [...periodRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestRecord = sortedRecords[0];
      
      const dailyDeaths = latestRecord ? (latestRecord.deaths || 0) : 0;
      const dailyFeedKg = latestRecord ? (latestRecord.feed_consumed_kg || 0) : 0;
      const dailyMarketed = latestRecord ? (latestRecord.marketed_chicks || 0) : 0;

      const totalFeed = totalFeedKg / 50;
      const receivedFeed = receivedFeedKg / 50;
      const outFeed = outFeedKg / 50;
      const dailyFeed = dailyFeedKg / 50;
      
      const initialFeedKg = activeFlock.initialFeedKg || 0;
      const remainingFeed = (initialFeedKg + receivedFeedKg - totalFeedKg - outFeedKg) / 50;

      const initialChicks = activeFlock.initialChicks || 0;
      const remainingChicks = initialChicks - totalDeaths - totalMarketed;

      return {
        name: farm.name,
        arrivalDate: activeFlock.arrivalDate || '-',
        ageDays,
        chicks: initialChicks,
        source: activeFlock.source || '-',
        feedType: activeFlock.feedType || 'سوبر',
        dailyDeaths, totalDeaths,
        dailyFeed, totalFeed,
        receivedFeed, outFeed,
        remainingFeed: Math.max(0, remainingFeed),
        dailyMarketed, totalMarketed,
        remainingChicks: Math.max(0, remainingChicks)
      };
    }).filter(Boolean);
  }, [farms, records, fromDate, toDate]);

  const totals = reportData.reduce((acc, row: any) => ({
    chicks: acc.chicks + row.chicks,
    dailyDeaths: acc.dailyDeaths + row.dailyDeaths,
    totalDeaths: acc.totalDeaths + row.totalDeaths,
    dailyFeed: acc.dailyFeed + row.dailyFeed,
    totalFeed: acc.totalFeed + row.totalFeed,
    receivedFeed: acc.receivedFeed + row.receivedFeed,
    outFeed: acc.outFeed + row.outFeed,
    remainingFeed: acc.remainingFeed + row.remainingFeed,
    dailyMarketed: acc.dailyMarketed + row.dailyMarketed,
    totalMarketed: acc.totalMarketed + row.totalMarketed,
    remainingChicks: acc.remainingChicks + row.remainingChicks,
  }), { chicks: 0, dailyDeaths: 0, totalDeaths: 0, dailyFeed: 0, totalFeed: 0, receivedFeed: 0, outFeed: 0, remainingFeed: 0, dailyMarketed: 0, totalMarketed: 0, remainingChicks: 0 });

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const wsData = [
      ['م', 'اسم المزرعة', 'تاريخ الوصول', 'العمر', 'الكمية', 'المصدر', 'نوع العلف', 
       'وفيات يومي', 'وفيات إجمالي', 
       'علف مستهلك يومي', 'علف مستهلك إجمالي', 'علف وارد', 'علف خارج', 'علف متبقي',
       'حمول يومي', 'إجمالي الحمول', 'المتبقي من الدجاج']
    ];

    reportData.forEach((row: any, idx: number) => {
      wsData.push([
        (idx + 1).toString(),
        row.name,
        row.arrivalDate,
        row.ageDays.toString(),
        row.chicks.toString(),
        row.source,
        row.feedType,
        row.dailyDeaths.toString() || '-',
        row.totalDeaths.toString() || '-',
        row.dailyFeed ? row.dailyFeed.toFixed(1) : '-',
        row.totalFeed ? row.totalFeed.toFixed(1) : '-',
        row.receivedFeed ? row.receivedFeed.toFixed(1) : '-',
        row.outFeed ? row.outFeed.toFixed(1) : '-',
        row.remainingFeed.toFixed(1),
        row.dailyMarketed.toString() || '-',
        row.totalMarketed.toString() || '-',
        row.remainingChicks.toString()
      ]);
    });

    wsData.push([
      'Σ', 'الإجمالي', '', '', totals.chicks.toString(), '', '',
      totals.dailyDeaths.toString() || '-',
      totals.totalDeaths.toString() || '-',
      totals.dailyFeed ? totals.dailyFeed.toFixed(1) : '-',
      totals.totalFeed ? totals.totalFeed.toFixed(1) : '-',
      totals.receivedFeed ? totals.receivedFeed.toFixed(1) : '-',
      totals.outFeed ? totals.outFeed.toFixed(1) : '-',
      totals.remainingFeed.toFixed(1),
      totals.dailyMarketed.toString() || '-',
      totals.totalMarketed.toString() || '-',
      totals.remainingChicks.toString()
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 5 }, { wch: 20 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "التقرير الشامل");
    XLSX.writeFile(wb, `تقرير_الدواجن_${fromDate}_إلى_${toDate}.xlsx`);
  };

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">جاري جلب التقارير...</div>;

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800">التقارير الشاملة</h2>
          <p className="text-gray-500 mt-1 font-medium">ملخص أداء جميع المزارع.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
            <Calendar className="text-gray-400" size={20} />
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="bg-transparent text-sm font-bold outline-none border-none text-gray-700" />
            <span className="text-gray-400">-</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="bg-transparent text-sm font-bold outline-none border-none text-gray-700" />
          </div>
          
          <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm">
            <Printer size={20} /> طباعة PDF
          </button>

          <button onClick={handleExportExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm">
            <FileSpreadsheet size={20} /> تصدير Excel
          </button>
        </div>
      </header>

      <div className="hidden print:block text-center mb-2">
        <h1 className="text-xl font-bold">تقرير مزارع الدواجن</h1>
        <p className="text-gray-600 text-sm">الفترة: من {fromDate} إلى {toDate}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none print:overflow-visible print:rounded-none">
        <div className="overflow-x-auto max-h-[75vh] custom-scrollbar print:max-h-none print:overflow-visible">
          <table className="w-full text-center text-sm whitespace-nowrap border-collapse">
            <thead className="sticky top-0 z-20 shadow-sm print:static print:shadow-none">
              <tr className="bg-gray-50 border-b-2 border-gray-200 print:bg-gray-100">
                <th className="sticky right-0 bg-gray-50 print:bg-gray-100 px-2 py-3 font-bold text-gray-700 border-l w-10">م</th>
                <th className="sticky right-10 bg-yellow-300 px-2 py-3 font-bold text-gray-800 border-l text-right min-w-[120px] z-30 print:bg-yellow-100">اسم المزرعة</th>
                <th className="px-2 py-3 font-bold text-gray-700 border-l">تاريخ الوصول</th>
                <th className="px-2 py-3 font-bold text-gray-700 border-l bg-blue-50">العمر</th>
                <th className="px-2 py-3 font-bold text-gray-700 border-l">الكمية</th>
                <th className="px-2 py-3 font-bold text-gray-700 border-l">المصدر</th>
                <th className="px-2 py-3 font-bold text-gray-700 border-l">نوع العلف</th>
                <th className="px-2 py-3 font-bold border-l bg-red-50" colSpan={2}>الوفيات</th>
                <th className="px-2 py-3 font-bold border-l bg-blue-50" colSpan={2}>العلف المستهلك</th>
                <th className="px-2 py-3 font-bold border-l bg-green-50">وارد</th>
                <th className="px-2 py-3 font-bold border-l bg-orange-50">خارج</th>
                <th className="px-2 py-3 font-bold border-l bg-green-100">متبقي</th>
                <th className="px-2 py-3 font-bold border-l bg-orange-50" colSpan={2}>الحمول (التسويق)</th>
                <th className="px-2 py-3 font-bold border-l bg-amber-100 text-amber-900">المتبقي</th>
              </tr>
              <tr className="bg-gray-100 border-b-2 border-gray-200 text-xs print:bg-gray-200">
                <th className="sticky right-0 bg-gray-100 print:bg-gray-200 border-l w-10 z-20"></th>
                <th className="sticky right-10 bg-yellow-300 print:bg-yellow-100 border-l z-30 min-w-[120px]"></th>
                <th className="border-l"></th><th className="border-l"></th><th className="border-l"></th><th className="border-l"></th><th className="border-l"></th>
                <th className="px-2 py-2 border-l bg-red-100">اليومي</th><th className="px-2 py-2 border-l bg-red-100">الإجمالي</th>
                <th className="px-2 py-2 border-l bg-blue-100">اليومي</th><th className="px-2 py-2 border-l bg-blue-100">الإجمالي</th>
                <th className="border-l bg-green-100"></th><th className="border-l bg-orange-100"></th><th className="border-l bg-green-100"></th>
                <th className="px-2 py-2 border-l bg-orange-100">اليومي</th><th className="px-2 py-2 border-l bg-orange-100">الإجمالي</th>
                <th className="px-2 py-2 border-l bg-amber-100">دجاجة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 print:divide-gray-300">
              {reportData.map((row: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50 group">
                  <td className="sticky right-0 bg-white group-hover:bg-gray-50 print:bg-white px-2 py-3 border-l text-gray-500 w-10">{(idx + 1).toLocaleString('ar-EG')}</td>
                  <td className="sticky right-10 bg-yellow-50 group-hover:bg-yellow-100 print:bg-yellow-50 px-2 py-3 border-l font-bold text-gray-800 text-right transition-colors min-w-[120px] z-10">{row.name}</td>
                  <td className="px-2 py-3 border-l text-gray-600">{row.arrivalDate}</td>
                  <td className="px-2 py-3 border-l font-bold text-blue-700">{row.ageDays}</td>
                  <td className="px-2 py-3 border-l font-bold text-gray-700">{row.chicks.toLocaleString()}</td>
                  <td className="px-2 py-3 border-l text-gray-600">{row.source}</td>
                  <td className="px-2 py-3 border-l text-gray-600">{row.feedType}</td>
                  
                  {/* الوفيات */}
                  <td className="px-2 py-3 border-l text-red-600">{row.dailyDeaths || '-'}</td>
                  <td className="px-2 py-3 border-l font-bold text-red-700">{row.totalDeaths || '-'}</td>
                  
                  {/* العلف */}
                  <td className="px-2 py-3 border-l text-blue-600">{row.dailyFeed ? row.dailyFeed.toFixed(1) : '-'}</td>
                  <td className="px-2 py-3 border-l font-bold text-blue-700">{row.totalFeed ? row.totalFeed.toFixed(1) : '-'}</td>
                  <td className="px-2 py-3 border-l text-gray-600">{row.receivedFeed ? row.receivedFeed.toFixed(1) : '-'}</td>
                  <td className="px-2 py-3 border-l text-orange-600">{row.outFeed ? row.outFeed.toFixed(1) : '-'}</td>
                  <td className="px-2 py-3 border-l font-bold text-green-700">{row.remainingFeed.toFixed(1)}</td>
                  
                  {/* الحمول والمتبقي */}
                  <td className="px-2 py-3 border-l text-orange-600">{row.dailyMarketed || '-'}</td>
                  <td className="px-2 py-3 border-l font-bold text-orange-700">{row.totalMarketed || '-'}</td>
                  <td className="px-2 py-3 border-l font-bold text-amber-700 bg-amber-50">{row.remainingChicks.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="bg-yellow-300 font-extrabold text-blue-900 border-t-2 border-yellow-500 sticky bottom-0 z-20 print:bg-yellow-200 print:static">
                <td className="sticky right-0 bg-yellow-300 print:bg-yellow-200 px-2 py-3 border-l w-10 z-20">Σ</td>
                <td className="sticky right-10 bg-yellow-300 print:bg-yellow-200 px-2 py-3 border-l text-right min-w-[120px] z-30">الإجمالي</td>
                <td className="px-2 py-3 border-l"></td>
                <td className="px-2 py-3 border-l"></td>
                <td className="px-2 py-3 border-l">{totals.chicks.toLocaleString()}</td>
                <td className="px-2 py-3 border-l"></td>
                <td className="px-2 py-3 border-l"></td>
                <td className="px-2 py-3 border-l">{totals.dailyDeaths || '-'}</td>
                <td className="px-2 py-3 border-l">{totals.totalDeaths || '-'}</td>
                <td className="px-2 py-3 border-l">{totals.dailyFeed ? totals.dailyFeed.toFixed(1) : '-'}</td>
                <td className="px-2 py-3 border-l">{totals.totalFeed ? totals.totalFeed.toFixed(1) : '-'}</td>
                <td className="px-2 py-3 border-l">{totals.receivedFeed ? totals.receivedFeed.toFixed(1) : '-'}</td>
                <td className="px-2 py-3 border-l">{totals.outFeed ? totals.outFeed.toFixed(1) : '-'}</td>
                <td className="px-2 py-3 border-l">{totals.remainingFeed.toFixed(1)}</td>
                <td className="px-2 py-3 border-l">{totals.dailyMarketed || '-'}</td>
                <td className="px-2 py-3 border-l">{totals.totalMarketed || '-'}</td>
                <td className="px-2 py-3">{totals.remainingChicks.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
