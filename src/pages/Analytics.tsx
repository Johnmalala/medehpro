import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { TrendingUp, DollarSign, Package, Users } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateMockProducts, generateMockSales } from '../data/mockData';
import { Product, Sale } from '../types';
import { format, subDays, parseISO } from 'date-fns';

const Analytics: React.FC = () => {
  const [products] = useLocalStorage<Product[]>('madeh_products', generateMockProducts());
  const [sales] = useLocalStorage<Sale[]>('madeh_sales', generateMockSales(products));

  // Sales trend data for the last 30 days
  const salesTrendData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), i);
      return format(date, 'yyyy-MM-dd');
    }).reverse();

    const dailySales = last30Days.map(date => {
      const daySales = sales.filter(sale => sale.date === date);
      return {
        date: format(parseISO(date), 'MMM dd'),
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
          name: 'Revenue (KES)',
          position: 'left',
        },
        {
          type: 'value',
          name: 'Sales Count',
          position: 'right',
        }
      ],
      series: [
        {
          name: 'Revenue',
          type: 'line',
          data: dailySales.map(d => d.revenue),
          smooth: true,
          itemStyle: { color: '#f97316' },
          lineStyle: { color: '#f97316' },
        },
        {
          name: 'Sales Count',
          type: 'bar',
          yAxisIndex: 1,
          data: dailySales.map(d => d.sales),
          itemStyle: { color: '#3b82f6' },
        }
      ],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: ['Revenue', 'Sales Count'],
      },
    };
  }, [sales]);

  // Category distribution
  const categoryData = useMemo(() => {
    const categorySales = sales.reduce((acc, sale) => {
      const product = products.find(p => p.id === sale.productId);
      if (product) {
        acc[product.category] = (acc[product.category] || 0) + sale.totalAmount;
      }
      return acc;
    }, {} as Record<string, number>);

    const data = Object.entries(categorySales).map(([category, value]) => ({
      name: category,
      value,
    }));

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: KES {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
      },
      series: [
        {
          name: 'Category Sales',
          type: 'pie',
          radius: '50%',
          data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };
  }, [sales, products]);

  // Monthly comparison
  const monthlyData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const getMonthSales = (monthOffset: number) => {
      const targetDate = new Date(currentYear, currentMonth - monthOffset, 1);
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();
      
      return sales.filter(sale => {
        const saleDate = parseISO(sale.date);
        return saleDate.getMonth() === targetMonth && saleDate.getFullYear() === targetYear;
      });
    };

    const thisMonth = getMonthSales(0);
    const lastMonth = getMonthSales(1);
    const twoMonthsAgo = getMonthSales(2);

    const months = [
      { name: format(new Date(currentYear, currentMonth - 2, 1), 'MMM yyyy'), sales: twoMonthsAgo },
      { name: format(new Date(currentYear, currentMonth - 1, 1), 'MMM yyyy'), sales: lastMonth },
      { name: format(new Date(currentYear, currentMonth, 1), 'MMM yyyy'), sales: thisMonth },
    ];

    return {
      xAxis: {
        type: 'category',
        data: months.map(m => m.name),
      },
      yAxis: {
        type: 'value',
        name: 'Revenue (KES)',
      },
      series: [
        {
          name: 'Monthly Revenue',
          type: 'bar',
          data: months.map(m => m.sales.reduce((sum, sale) => sum + sale.totalAmount, 0)),
          itemStyle: { color: '#10b981' },
        },
      ],
      tooltip: {
        trigger: 'axis',
      },
    };
  }, [sales]);

  // Key metrics
  const metrics = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    const todaySales = sales.filter(sale => sale.date === today);
    const yesterdaySales = sales.filter(sale => sale.date === yesterday);
    
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    const revenueChange = yesterdayRevenue === 0 ? 0 : ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
    const salesChange = yesterdaySales.length === 0 ? 0 : ((todaySales.length - yesterdaySales.length) / yesterdaySales.length) * 100;
    
    const lowStockCount = products.filter(p => p.quantity <= p.lowStockThreshold).length;
    const totalProducts = products.length;
    
    return {
      todayRevenue,
      revenueChange,
      todaySales: todaySales.length,
      salesChange,
      lowStockCount,
      totalProducts,
    };
  }, [sales, products]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Detailed insights and performance metrics
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Today's Revenue
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                KES {metrics.todayRevenue.toLocaleString()}
              </p>
              <p className={`text-sm mt-1 ${metrics.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.revenueChange >= 0 ? '+' : ''}{metrics.revenueChange.toFixed(1)}% from yesterday
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Today's Sales
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.todaySales}
              </p>
              <p className={`text-sm mt-1 ${metrics.salesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.salesChange >= 0 ? '+' : ''}{metrics.salesChange.toFixed(1)}% from yesterday
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Total Products
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.totalProducts}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                In inventory
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Low Stock Items
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.lowStockCount}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                Needs attention
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 flex items-center justify-center">
              <Users className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sales Trend (Last 30 Days)
          </h3>
          <ReactECharts
            option={salesTrendData}
            style={{ height: '350px' }}
            theme="default"
          />
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sales by Category
          </h3>
          <ReactECharts
            option={categoryData}
            style={{ height: '350px' }}
            theme="default"
          />
        </div>
      </div>

      {/* Monthly Comparison */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Monthly Revenue Comparison
        </h3>
        <ReactECharts
          option={monthlyData}
          style={{ height: '300px' }}
          theme="default"
        />
      </div>
    </div>
  );
};

export default Analytics;
