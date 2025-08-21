import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import LoginForm from './components/Auth/LoginForm';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';

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
            <Route path="stock" element={<Navigate to="/" replace />} />
            <Route path="reports" element={<Navigate to="/" replace />} />
            <Route path="analytics" element={<Navigate to="/" replace />} />
            <Route path="staff" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
