import React, { useMemo, useState, useEffect } from 'react';
import { Download, FileText, Calendar, Package, User } from 'lucide-react';
import { Product, Sale, Staff } from '../types';
import {
  format,
  startOfWeek,
  startOfMonth,
  endOfWeek,
  endOfMonth,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { supabase } from '../lib/supabase';
import Loader from '../components/Layout/Loader';

const Reports: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const productsPromise = supabase.from('products').select('*');
      const salesPromise = supabase.from('sales').select('*');
      const staffPromise = supabase.from('staff').select('*');

      const [productsResult, salesResult, staffResult] = await Promise.all([
        productsPromise,
        salesPromise,
        staffPromise,
      ]);

      if (productsResult.error) console.error('Error fetching products:', productsResult.error);
      if (salesResult.error) console.error('Error fetching sales:', salesResult.error);
      if (staffResult.error) console.error('Error fetching staff:', staffResult.error);

      setProducts(productsResult.data || []);
      setSales(salesResult.data || []);
      setStaff((staffResult.data as Staff[]) || []);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const reportData = useMemo(() => {
    const date = parseISO(selectedDate);
    let filteredSales: Sale[] = [];

    switch (reportType) {
      case 'daily':
        filteredSales = sales.filter((sale) => sale.date === selectedDate);
        break;
      case 'weekly':
        const weekStart = startOfWeek(date);
        const weekEnd = endOfWeek(date);
        filteredSales = sales.filter((sale) =>
          isWithinInterval(parseISO(sale.date), { start: weekStart, end: weekEnd })
        );
        break;
      case 'monthly':
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        filteredSales = sales.filter((sale) =>
          isWithinInterval(parseISO(sale.date), { start: monthStart, end: monthEnd })
        );
        break;
    }

    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalSales = filteredSales.length;
    const totalQuantity = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0);

    const productSales = filteredSales.reduce((acc, sale) => {
      const product = products.find(p => p.id === sale.product_id);
      if (!acc[sale.product_id]) {
        acc[sale.product_id] = {
          productName: product?.name || 'Unknown Product',
          quantity: 0,
          revenue: 0,
        };
      }
      acc[sale.product_id].quantity += sale.quantity;
      acc[sale.product_id].revenue += sale.total_amount;
      return acc;
    }, {} as Record<string, { productName: string; quantity: number; revenue: number }>);

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const cashierSales = filteredSales.reduce((acc, sale) => {
      const cashier = staff.find(s => s.id === sale.cashier_id);
      if (!acc[sale.cashier_id]) {
        acc[sale.cashier_id] = {
          cashierName: cashier?.name || 'Unknown Staff',
          sales: 0,
          revenue: 0,
        };
      }
      acc[sale.cashier_id].sales += 1;
      acc[sale.cashier_id].revenue += sale.total_amount;
      return acc;
    }, {} as Record<string, { cashierName: string; sales: number; revenue: number }>);

    const cashierPerformance = Object.values(cashierSales).sort((a,b) => b.revenue - a.revenue);

    return {
      filteredSales,
      totalRevenue,
      totalSales,
      totalQuantity,
      topProducts,
      cashierPerformance,
    };
  }, [sales, products, staff, reportType, selectedDate]);

  const downloadReport = () => {
    const reportContent = {
      reportType,
      date: selectedDate,
      summary: {
        totalRevenue: reportData.totalRevenue,
        totalSales: reportData.totalSales,
        totalQuantity: reportData.totalQuantity,
      },
      topProducts: reportData.topProducts,
      cashierPerformance: reportData.cashierPerformance,
      detailedSales: reportData.filteredSales.map(s => {
        const product = products.find(p => p.id === s.product_id);
        const cashier = staff.find(st => st.id === s.cashier_id);
        return { ...s, productName: product?.name, cashierName: cashier?.name };
      }),
    };
    
    const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `madeh-hardware-${reportType}-report-${selectedDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Generate and view detailed sales reports</p>
        </div>
        <button
          onClick={downloadReport}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors w-full sm:w-auto"
        >
          <Download className="w-4 h-4" />
          <span>Download Report</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value as 'daily' | 'weekly' | 'monthly')} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
              <option value="daily">Daily Report</option>
              <option value="weekly">Weekly Report</option>
              <option value="monthly">Monthly Report</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"><div className="flex items-center space-x-3"><div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center"><FileText className="w-6 h-6 text-green-600 dark:text-green-400" /></div><div><p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p><p className="text-2xl font-bold text-gray-900 dark:text-white">KES {reportData.totalRevenue.toLocaleString()}</p></div></div></div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"><div className="flex items-center space-x-3"><div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center"><Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div><div><p className="text-sm text-gray-600 dark:text-gray-400">Total Sales</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.totalSales}</p></div></div></div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"><div className="flex items-center space-x-3"><div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center"><Package className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div><div><p className="text-sm text-gray-600 dark:text-gray-400">Items Sold</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.totalQuantity}</p></div></div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"><div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Products</h3></div><div className="p-4 sm:p-6 space-y-4">{reportData.topProducts.map(p => (<div key={p.productName} className="flex justify-between items-center"><p className="font-medium text-gray-800 dark:text-gray-200">{p.productName}</p><p className="text-sm text-gray-600 dark:text-gray-400">KES {p.revenue.toLocaleString()}</p></div>))}</div></div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"><div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Staff Performance</h3></div><div className="p-4 sm:p-6 space-y-4">{reportData.cashierPerformance.map(c => (<div key={c.cashierName} className="flex justify-between items-center"><p className="font-medium text-gray-800 dark:text-gray-200">{c.cashierName}</p><p className="text-sm text-gray-600 dark:text-gray-400">{c.sales} sales / KES {c.revenue.toLocaleString()}</p></div>))}</div></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detailed Sales ({reportData.filteredSales.length} transactions)</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date/Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {reportData.filteredSales.slice(0, 50).map((sale) => {
                const product = products.find(p => p.id === sale.product_id);
                const cashier = staff.find(s => s.id === sale.cashier_id);
                return (
                  <tr key={sale.id}>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900 dark:text-white">{format(parseISO(sale.date), 'MMM dd, yyyy')}</div><div className="text-sm text-gray-500 dark:text-gray-400">{sale.time ? sale.time.slice(0, 5) : format(new Date(sale.created_at), 'HH:mm')}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900 dark:text-white">{product?.name || 'N/A'}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900 dark:text-white">{sale.quantity}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900 dark:text-white">KES {sale.total_amount.toLocaleString()}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900 dark:text-white">{cashier?.name || 'N/A'}</div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
