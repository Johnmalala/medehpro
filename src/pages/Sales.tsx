import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Search, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Product, Sale } from '../types';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import Loader from '../components/Layout/Loader';
import ProductAutocomplete from '../components/Sales/ProductAutocomplete';

const Sales: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showNewSale, setShowNewSale] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Form state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [editableUnitPrice, setEditableUnitPrice] = useState<number | null>(null);
  const [quantityError, setQuantityError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSales = useCallback(async () => {
    const { data, error } = await supabase
      .from('sales')
      .select('*, cashier:staff!sales_cashier_id_fkey(name)')
      .order('created_at', { ascending: false });
    if (error) console.error("Error fetching sales:", error);
    else setSales(data || []);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (productsError) console.error("Error fetching products:", productsError);
      else setProducts(productsData || []);
      
      await fetchSales();
      setIsLoading(false);
    };
    fetchData();
  }, [fetchSales]);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const cashierName = sale.cashier_name || sale.cashier?.name || '';
      const matchesSearch = sale.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (sale.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cashierName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = !dateFilter || sale.date === dateFilter;
      return matchesSearch && matchesDate;
    });
  }, [sales, searchTerm, dateFilter]);

  const handleNewSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      const product = products.find(p => p.id === selectedProduct);
      if (!product || !user?.staff_id || !user.name || editableUnitPrice === null) {
        throw new Error('Please fill out all required fields correctly.');
      }
      if (quantityError) throw new Error(quantityError);
      if (quantity <= 0) throw new Error('Quantity must be greater than 0.');
      if (editableUnitPrice < product.buying_price) {
        throw new Error('Selling price cannot be lower than the buying price.');
      }

      const newSaleData = {
        product_id: product.id,
        product_name: product.name,
        cashier_id: user.staff_id,
        cashier_name: user.name,
        staff_id: user.staff_id,
        quantity,
        unit_price: editableUnitPrice,
        total_amount: quantity * editableUnitPrice,
        customer_name: customerName || null,
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm:ss'),
      };

      const { error: saleError } = await supabase.from('sales').insert(newSaleData);
      if (saleError) throw saleError;

      const newQuantity = product.quantity - quantity;
      const { error: productUpdateError } = await supabase
        .from('products')
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', product.id);

      if (productUpdateError) {
        alert('Sale recorded, but failed to update stock count. Please manually adjust.');
        console.error(productUpdateError);
      }

      setProducts(products.map(p => p.id === product.id ? { ...p, quantity: newQuantity } : p));
      await fetchSales();
      closeModal();

    } catch (error: any) {
      console.error('Sale submission error:', error);
      let errorMessage = 'Failed to record sale. Please try again.';
      // Check if it's a Supabase/PostgREST error object
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = `Error: ${error.message}`;
        if ('details' in error && error.details) {
          errorMessage += ` Details: ${error.details}`;
        }
        if ('hint' in error && error.hint) {
          errorMessage += ` Hint: ${error.hint}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    const product = products.find(p => p.id === productId);
    if (product) {
      setEditableUnitPrice(product.price);
      setQuantity(1);
      setQuantityError('');
    } else {
      setEditableUnitPrice(null);
    }
  };
  
  const handleQuantityChange = (value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setQuantity(numValue);
    const product = products.find(p => p.id === selectedProduct);
    if (numValue <= 0) {
      setQuantityError('Quantity must be greater than 0.');
    } else if (product && numValue > product.quantity) {
      setQuantityError(`Only ${product.quantity} available in stock.`);
    } else {
      setQuantityError('');
    }
  };

  const closeModal = () => {
    setShowNewSale(false);
    setSelectedProduct('');
    setQuantity(1);
    setCustomerName('');
    setEditableUnitPrice(null);
    setQuantityError('');
    setFormError('');
    setIsSubmitting(false);
  };

  const currentSelectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProduct);
  }, [selectedProduct, products]);

  const canRecordSale = !!user?.staff_id;

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Management</h1><p className="text-gray-600 dark:text-gray-400 mt-1">Record new sales and view transaction history</p></div>
        <button 
          onClick={() => setShowNewSale(true)} 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors w-full sm:w-auto disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={!canRecordSale}
        >
          <Plus className="w-4 h-4" />
          <span>New Sale</span>
        </button>
      </div>
      
      {!canRecordSale && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4">
          <div className="flex">
            <div className="flex-shrink-0"><AlertCircle className="h-5 w-5 text-yellow-400 dark:text-yellow-500" /></div>
            <div className="ml-3"><p className="text-sm text-yellow-700 dark:text-yellow-200">To record a sale, your user account must be linked to a staff profile. Please go to the <a href="/staff" className="font-medium underline">Staff page</a> to create one.</p></div>
          </div>
        </div>
      )}

      {showNewSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Record New Sale</h3>
            <form onSubmit={handleNewSale} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product</label><ProductAutocomplete products={products} onProductSelect={handleProductSelect} selectedProductId={selectedProduct} /></div>
              {currentSelectedProduct && editableUnitPrice !== null && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label htmlFor="buyingPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Buying Price (KES)</label><input id="buyingPrice" type="text" value={currentSelectedProduct.buying_price.toLocaleString()} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600/50 dark:text-gray-300" readOnly /></div>
                    <div><label htmlFor="sellingPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selling Price (KES)</label><input id="sellingPrice" type="number" min={currentSelectedProduct.buying_price} value={editableUnitPrice} onChange={(e) => setEditableUnitPrice(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" required /></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Default: KES {currentSelectedProduct.price.toLocaleString()}. You can adjust for bargaining.</p>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity</label>
                <input type="number" min="1" value={quantity} onChange={(e) => handleQuantityChange(e.target.value)} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white ${quantityError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`} required disabled={!selectedProduct} />
                {quantityError && <p className="text-red-500 text-xs mt-1">{quantityError}</p>}
              </div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Customer Name (Optional)</label><input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" placeholder="Enter customer name" /></div>
              {currentSelectedProduct && editableUnitPrice !== null && (<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"><div className="text-sm"><p className="font-medium text-blue-800 dark:text-blue-200">Total Amount: KES {(editableUnitPrice * quantity).toLocaleString()}</p></div></div>)}
              
              {formError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-4">
                  <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4"><button type="button" onClick={closeModal} className="w-full sm:w-auto flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button><button type="submit" disabled={!!quantityError || !selectedProduct || isSubmitting} className="w-full sm:w-auto flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">{isSubmitting ? 'Recording...' : 'Record Sale'}</button></div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1"><div className="relative"><Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search sales..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" /></div></div>
          <div><input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" /></div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales History ({filteredSales.length} transactions)</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[768px]">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date/Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cashier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900 dark:text-white">{format(new Date(sale.date), 'MMM dd, yyyy')}</div><div className="text-sm text-gray-500 dark:text-gray-400">{sale.time}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900 dark:text-white">{sale.product_name}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900 dark:text-white">{sale.quantity}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900 dark:text-white">KES {sale.total_amount.toLocaleString()}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900 dark:text-white">{sale.cashier_name || sale.cashier?.name}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sales;
