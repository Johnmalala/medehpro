import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  FileText, 
  Users,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Sales',
      href: '/sales',
      icon: ShoppingCart,
    },
    {
      name: 'Stock',
      href: '/stock',
      icon: Package,
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: FileText,
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: TrendingUp,
    },
    {
      name: 'Staff',
      href: '/staff',
      icon: Users,
    },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 min-h-screen">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Quick Tip
            </span>
          </div>
          <p className="text-xs text-orange-700 dark:text-orange-300">
            All sales are automatically backed up locally. Reports can be exported as PDF.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
