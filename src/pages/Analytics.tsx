import React, { useMemo, useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Product, Sale } from '../types';
import { format, subDays, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import Loader from '../components/Layout/Loader';
import { useTheme } from '../hooks/useTheme';

const Analytics: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isDark } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const productsPromise = supabase.from('products').select('*');
      const salesPromise = supabase.from('sales').select('*');

      const [productsResult, salesResult] = await Promise.all([
        productsPromise,
        salesPromise,
      ]);

      if (productsResult.error)
        console.error('Error fetching products:', productsResult.error);
      if (salesResult.error)
        console.error('Error fetching sales:', salesResult.error);

      setProducts(productsResult.data || []);
      setSales(salesResult.data || []);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const chartOptions = {
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    backgroundColor: 'transparent',
  };

  const salesTrendData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) =>
      format(subDays(new Date(), i), 'yyyy-MM-dd')
    ).reverse();

    const dailyData = last30Days.map((dateStr) => {
      const revenue = sales
        .filter((s) => s.date === dateStr)
        .reduce((sum, s) => sum + s.total_amount, 0);
      return {
        date: format(parseISO(dateStr), 'MMM dd'),
        revenue,
      };
    });

    return {
      ...chartOptions,
      xAxis: { type: 'category', data: dailyData.map((d) => d.date) },
      yAxis: { type: 'value', name: 'Revenue (KES)' },
      series: [
        {
          name: 'Revenue',
          type: 'line',
          data: dailyData.map((d) => d.revenue),
          smooth: true,
          itemStyle: { color: '#3b82f6' },
          lineStyle: { color: '#3b82f6' },
        },
      ],
    };
  }, [sales]);

  const categoryData = useMemo(() => {
    const salesByCategory = sales.reduce((acc, sale) => {
      const product = products.find((p) => p.id === sale.product_id);
      if (product) {
        const category = product.category;
        acc[category] = (acc[category] || 0) + sale.total_amount;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: KES {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        type: 'scroll',
      },
      series: [
        {
          name: 'Category Sales',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: { show: false, position: 'center' },
          emphasis: {
            label: { show: true, fontSize: '20', fontWeight: 'bold' },
          },
          data: Object.entries(salesByCategory).map(([name, value]) => ({
            name,
            value: Math.round(value),
          })),
        },
      ],
      backgroundColor: 'transparent',
    };
  }, [sales, products]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Detailed insights and performance metrics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sales Trend (Last 30 Days)
          </h3>
          <ReactECharts
            option={salesTrendData}
            style={{ height: '350px' }}
            theme={isDark ? 'dark' : 'default'}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sales by Category
          </h3>
          <ReactECharts
            option={categoryData}
            style={{ height: '350px' }}
            theme={isDark ? 'dark' : 'default'}
          />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
