import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../types';

interface ProductAutocompleteProps {
  products: Product[];
  onProductSelect: (productId: string) => void;
  selectedProductId: string;
}

const ProductAutocomplete: React.FC<ProductAutocompleteProps> = ({
  products,
  onProductSelect,
  selectedProductId,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const selectedProduct = products.find((p) => p.id === selectedProductId);
    setQuery(selectedProduct ? selectedProduct.name : '');
  }, [selectedProductId, products]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (newQuery) {
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(newQuery.toLowerCase()) && p.quantity > 0
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      onProductSelect(''); // Clear selection if input is cleared
    }
  };

  const handleSuggestionClick = (product: Product) => {
    onProductSelect(product.id);
    setQuery(product.name);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => query && suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder="Type to search for a product..."
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((product) => (
            <li
              key={product.id}
              onMouseDown={() => handleSuggestionClick(product)}
              className="px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <p className="font-medium text-gray-800 dark:text-gray-200">{product.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Stock: {product.quantity}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProductAutocomplete;
