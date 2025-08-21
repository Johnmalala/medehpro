import { faker } from '@faker-js/faker';
import { Product, Sale } from '../types';

export const PRODUCT_CATEGORIES = [
  'Bicycles',
  'Electric Accessories',
  'Wood & Timber',
  'Mattresses',
  'Plumbing Equipment',
  'Varnish & Paint',
  'Building Materials',
  'Tools & Hardware',
];

export const generateMockProducts = (): Product[] => {
  const products: Product[] = [];
  
  PRODUCT_CATEGORIES.forEach(category => {
    for (let i = 0; i < faker.number.int({ min: 3, max: 8 }); i++) {
      products.push({
        id: faker.string.uuid(),
        name: generateProductName(category),
        category,
        quantity: faker.number.int({ min: 0, max: 100 }),
        price: parseFloat(faker.commerce.price({ min: 100, max: 50000 })),
        lowStockThreshold: 5,
        createdAt: faker.date.past({ years: 1 }).toISOString(),
        updatedAt: faker.date.recent().toISOString(),
      });
    }
  });
  
  return products;
};

const generateProductName = (category: string): string => {
  const names = {
    'Bicycles': ['Mountain Bike', 'Road Bike', 'Hybrid Bike', 'Kids Bike', 'Electric Bike'],
    'Electric Accessories': ['LED Bulbs', 'Extension Cords', 'Power Outlets', 'Circuit Breakers', 'Wire Cables'],
    'Wood & Timber': ['Pine Planks', 'Cedar Boards', 'Plywood Sheets', 'Hardwood Blocks', 'Bamboo Strips'],
    'Mattresses': ['Foam Mattress', 'Spring Mattress', 'Memory Foam', 'Orthopedic Mattress', 'Pillow Top'],
    'Plumbing Equipment': ['PVC Pipes', 'Water Taps', 'Toilet Seats', 'Shower Heads', 'Pipe Fittings'],
    'Varnish & Paint': ['Wood Varnish', 'Wall Paint', 'Primer', 'Paint Brushes', 'Spray Paint'],
    'Building Materials': ['Cement Bags', 'Steel Bars', 'Roofing Sheets', 'Bricks', 'Sand Bags'],
    'Tools & Hardware': ['Hammer', 'Screwdriver Set', 'Drill Machine', 'Measuring Tape', 'Nails & Screws'],
  };
  
  const categoryNames = names[category as keyof typeof names] || ['Generic Item'];
  return faker.helpers.arrayElement(categoryNames);
};

export const generateMockSales = (products: Product[]): Sale[] => {
  const sales: Sale[] = [];
  const cashiers = [
    { id: '2', name: 'Fatima Hassan' },
    { id: '3', name: 'Omar Said' },
  ];
  
  // Generate sales for the last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const dailySales = faker.number.int({ min: 5, max: 20 });
    
    for (let j = 0; j < dailySales; j++) {
      const product = faker.helpers.arrayElement(products);
      const quantity = faker.number.int({ min: 1, max: 5 });
      const cashier = faker.helpers.arrayElement(cashiers);
      
      sales.push({
        id: faker.string.uuid(),
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        totalAmount: quantity * product.price,
        cashierId: cashier.id,
        cashierName: cashier.name,
        customerName: faker.person.fullName(),
        date: date.toISOString().split('T')[0],
        time: faker.date.between({ 
          from: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8, 0), 
          to: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 18, 0) 
        }).toTimeString().split(' ')[0],
      });
    }
  }
  
  return sales.sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());
};
