import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, Package, ShoppingCart, AlertTriangle } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import StatsCard from '../components/Dashboard/StatsCard';
import { Product, Sale } from '../types';
import { supabase } from '../lib/supabase';
import { format, subDays } from 'date-fns';
import Loader from '../components/Layout/Loader';

const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      const sevenDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');

      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*, products(name), staff:staff!sales_staff_id_fkey(name)')
        .gte('date', sevenDaysAgo)
        .order('created_at', { ascending: false });

      if (productsError) console.error('Error fetching products:', productsError);
      if (salesError) {
        console.error('Error fetching sales:', salesError);
      }

      setProducts(productsData || []);
      setSales(salesData || []);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const stats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaySales = sales.filter(sale => sale.date === today);
    
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.quantity <= p.low_stock_threshold).length;
    
    return {
      revenue: todayRevenue,
      totalProducts,
      lowStockProducts,
      totalSales: todaySales.length,
    };
  }, [products, sales]);

  const salesChartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return format(date, 'yyyy-MM-dd');
    }).reverse();

    const dailySales = last7Days.map(date => {
      const daySales = sales.filter(sale => sale.date === date);
      return {
        date: format(new Date(date), 'MMM dd'),
        revenue: daySales.reduce((sum, sale) => sum + sale.total_amount, 0),
      };
    });

    return {
      xAxis: { type: 'category', data: dailySales.map(d => d.date) },
      yAxis: { type: 'value', name: 'Revenue (KES)' },
      series: [{ name: 'Revenue', type: 'line', data: dailySales.map(d => d.revenue), itemStyle: { color: '#10b981' }, lineStyle: { color: '#10b981' } }],
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    };
  }, [sales]);

  const topProducts = useMemo(() => {
    const productSales = sales.reduce((acc, sale) => {
      acc[sale.product_id] = (acc[sale.product_id] || 0) + sale.quantity;
      return acc;
    }, {} as Record<string, number>);

    return products
      .map(product => ({
        ...product,
        totalSold: productSales[product.id] || 0,
      }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);
  }, [products, sales]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back! Here's what's happening at Madeh Hardware today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard title="Today's Revenue" value={`KES ${stats.revenue.toLocaleString()}`} icon={DollarSign} color="green" />
        <StatsCard title="Today's Sales" value={stats.totalSales} icon={ShoppingCart} color="blue" />
        <StatsCard title="Total Products" value={stats.totalProducts} icon={Package} color="blue" />
        <StatsCard title="Low Stock Alerts" value={stats.lowStockProducts} icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue (Last 7 Days)</h3>
          <ReactECharts option={salesChartData} style={{ height: '300px' }} theme="default" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Selling Products</h3>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3"><div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-sm font-medium text-blue-600 dark:text-blue-400">{index + 1}</span></div><div><p className="font-medium text-gray-900 dark:text-white truncate">{product.name}</p><p className="text-sm text-gray-500 dark:text-gray-400">{product.category}</p></div></div>
                <div className="text-right flex-shrink-0 ml-2"><p className="font-medium text-gray-900 dark:text-white">{product.totalSold} sold</p><p className="text-sm text-gray-500 dark:text-gray-400">{product.quantity} left</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Sales</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cashier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sales.slice(0, 5).map((sale) => (
                <tr key={sale.id}>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900 dark:text-white">{sale.products?.name}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900 dark:text-white">KES {sale.total_amount.toLocaleString()}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900 dark:text-white">{sale.staff?.name}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-500 dark:text-gray-400">{format(new Date(sale.created_at), 'HH:mm')}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
