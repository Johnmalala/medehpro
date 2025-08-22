import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import LoginForm from './components/Auth/LoginForm';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Stock from './pages/Stock';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Staff from './pages/Staff';

function App() {
  const { isAuthenticated } = useAuth();
  const { isDark } = useTheme();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <Router>
      <div className={isDark ? 'dark' : ''}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="sales" element={<Sales />} />
            <Route path="stock" element={<Stock />} />
            <Route path="reports" element={<Reports />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="staff" element={<Staff />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
