import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EntityProvider } from './context/EntityContext';
import { Layout } from './layouts/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Entities } from './pages/Entities';
import { Transactions } from './pages/Transactions';
import { Rules } from './pages/Rules';
import { Settings } from './pages/Settings';
import { Calendar } from './pages/Calendar';
import { Goals } from './pages/Goals';
import { Analytics } from './pages/Analytics';
import { Profile } from './pages/Profile';

import { FullScreenLoader } from './components/FullScreenLoader';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  return user ? (
    <EntityProvider>
      <Layout>
        <Outlet />
      </Layout>
    </EntityProvider>
  ) : <Navigate to="/login" />;
};

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/entities" element={<Entities />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
