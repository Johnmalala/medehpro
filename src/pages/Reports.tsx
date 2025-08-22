import React, { useMemo, useState } from 'react';
import { Download, FileText, Calendar } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateMockProducts, generateMockSales } from '../data/mockData';
import { Product, Sale } from '../types';
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

const Reports: React.FC = () => {
  const [products] = useLocalStorage<Product[]>('madeh_products', generateMockProducts());
  const [sales] = useLocalStorage<Sale[]>('madeh_sales', generateMockSales(products));
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const reportData = useMemo(() => {
    const date = parseISO(selectedDate);
    let filteredSales: Sale[] = [];

    switch (reportType) {
      case 'daily':
        filteredSales = sales.filter(sale => sale.date === selectedDate);
        break;
      case 'weekly':
        const weekStart = startOfWeek(date);
        const weekEnd = endOfWeek(date);
        filteredSales = sales.filter(sale => 
          isWithinInterval(parseISO(sale.date), { start: weekStart, end: weekEnd })
        );
        break;
      case 'monthly':
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        filteredSales = sales.filter(sale => 
          isWithinInterval(parseISO(sale.date), { start: monthStart, end: monthEnd })
        );
        break;
    }

    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalSales = filteredSales.length;
    const totalQuantity = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0);

    // Product performance
    const productSales = filteredSales.reduce((acc, sale) => {
      if (!acc[sale.productId]) {
        acc[sale.productId] = {
          productName: sale.productName,
          quantity: 0,
          revenue: 0,
        };
      }
      acc[sale.productId].quantity += sale.quantity;
      acc[sale.productId].revenue += sale.totalAmount;
      return acc;
    }, {} as Record<string, { productName: string; quantity: number; revenue: number }>);

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Cashier performance
    const cashierSales = filteredSales.reduce((acc, sale) => {
      if (!acc[sale.cashierId]) {
        acc[sale.cashierId] = {
          cashierName: sale.cashierName,
          sales: 0,
          revenue: 0,
        };
      }
      acc[sale.cashierId].sales += 1;
      acc[sale.cashierId].revenue += sale.totalAmount;
      return acc;
    }, {} as Record<string, { cashierName: string; sales: number; revenue: number }>);

    const cashierPerformance = Object.values(cashierSales);

    return {
      filteredSales,
      totalRevenue,
      totalSales,
      totalQuantity,
      topProducts,
      cashierPerformance,
    };
  }, [sales, reportType, selectedDate]);

  const downloadReport = () => {
    // In a real application, this would generate and download a PDF
    const reportContent = {
      reportType,
      date: selectedDate,
      ...reportData,
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generate and view detailed sales reports
          </p>
        </div>
        <button
          onClick={downloadReport}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download Report</span>
        </button>
      </div>

      {/* Report Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'daily' | 'weekly' | 'monthly')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="daily">Daily Report</option>
              <option value="weekly">Weekly Report</option>
              <option value="monthly">Monthly Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                KES {reportData.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {reportData.totalSales}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Items Sold</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {reportData.totalQuantity}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Selling Products
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {reportData.topProducts.map((product, index) => (
                <div key={`${product.productName}-${index}`} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {product.productName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {product.quantity} units sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      KES {product.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cashier Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Staff Performance
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {reportData.cashierPerformance.map((cashier, index) => (
                <div key={cashier.cashierName} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {cashier.cashierName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {cashier.sales} sales
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      KES {cashier.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Sales Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Detailed Sales ({reportData.filteredSales.length} transactions)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Staff
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {reportData.filteredSales.slice(0, 50).map((sale) => (
                <tr key={sale.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {format(parseISO(sale.date), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {sale.time}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {sale.productName}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
