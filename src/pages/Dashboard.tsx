import React, { useMemo } from 'react';
import { DollarSign, Package, TrendingUp, AlertTriangle, ShoppingCart, Users } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import StatsCard from '../components/Dashboard/StatsCard';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateMockProducts, generateMockSales } from '../data/mockData';
import { Product, Sale } from '../types';
import { format, subDays, startOfDay } from 'date-fns';

const Dashboard: React.FC = () => {
  const [products] = useLocalStorage<Product[]>('madeh_products', generateMockProducts());
  const [sales] = useLocalStorage<Sale[]>('madeh_sales', generateMockSales(products));

  const stats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaySales = sales.filter(sale => sale.date === today);
    
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.quantity <= p.lowStockThreshold).length;
    const totalSales = todaySales.length;

    // Calculate growth percentages (mock data)
    const revenueGrowth = '+12.5%';
    const salesGrowth = '+8.3%';

    return {
      revenue: todayRevenue,
      revenueGrowth,
      totalProducts,
      lowStockProducts,
      totalSales,
      salesGrowth,
    };
  }, [products, sales]);

  // Sales chart data for the last 7 days
  const salesChartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return format(date, 'yyyy-MM-dd');
    }).reverse();

    const dailySales = last7Days.map(date => {
      const daySales = sales.filter(sale => sale.date === date);
      return {
        date: format(new Date(date), 'MMM dd'),
        sales: daySales.length,
        revenue: daySales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      };
    });

    return {
      xAxis: {
        type: 'category',
        data: dailySales.map(d => d.date),
      },
      yAxis: [
        {
          type: 'value',
          name: 'Sales Count',
          position: 'left',
        },
        {
          type: 'value',
          name: 'Revenue (KES)',
          position: 'right',
        }
      ],
      series: [
        {
          name: 'Sales Count',
          type: 'bar',
          data: dailySales.map(d => d.sales),
          itemStyle: { color: '#f97316' },
        },
        {
          name: 'Revenue',
          type: 'line',
          yAxisIndex: 1,
          data: dailySales.map(d => d.revenue),
          itemStyle: { color: '#3b82f6' },
          lineStyle: { color: '#3b82f6' },
        }
      ],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: ['Sales Count', 'Revenue'],
      },
    };
  }, [sales]);

  // Top selling products
  const topProducts = useMemo(() => {
    const productSales = sales.reduce((acc, sale) => {
      acc[sale.productId] = (acc[sale.productId] || 0) + sale.quantity;
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

  const recentSales = sales.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening at Madeh Hardware today.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Today's Revenue"
          value={`KES ${stats.revenue.toLocaleString()}`}
          change={stats.revenueGrowth}
          changeType="positive"
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          color="blue"
        />
        <StatsCard
          title="Today's Sales"
          value={stats.totalSales}
          change={stats.salesGrowth}
          changeType="positive"
          icon={ShoppingCart}
          color="orange"
        />
        <StatsCard
          title="Low Stock Alerts"
          value={stats.lowStockProducts}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sales Trends (Last 7 Days)
          </h3>
          <ReactECharts
            option={salesChartData}
            style={{ height: '300px' }}
            theme="default"
          />
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Selling Products
          </h3>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {product.category}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {product.totalSold} sold
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {product.quantity} in stock
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Sales
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cashier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {sale.productName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {sale.customerName || 'Walk-in Customer'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {sale.quantity}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      KES {sale.totalAmount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {sale.cashierName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {sale.time}
                    </div>
                  </td>
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
