import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import Home from './pages/Home';
import Politicians from './pages/Politicians';
import PoliticianDetail from './pages/PoliticianDetail';
import Promises from './pages/Promises';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import DiarioOficial from './pages/DiarioOficial';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/admin/Dashboard';
import AdminDiario from './pages/admin/AdminDiario';
import AdminPoliticians from './pages/admin/AdminPoliticians';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPromises from './pages/admin/AdminPromises';
import AdminNepotism from './pages/admin/AdminNepotism';
import AdminPolls from './pages/admin/AdminPolls';
import Polls from './pages/Polls';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/politicians" element={<Politicians />} />
              <Route path="/politicians/:id" element={<PoliticianDetail />} />
              <Route path="/promises" element={<Promises />} />
              <Route path="/news" element={<News />} />
              <Route path="/news/:id" element={<NewsDetail />} />
              <Route path="/diario" element={<DiarioOficial />} />
              <Route path="/polls" element={<Polls />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/diario" element={<AdminDiario />} />
              <Route path="/admin/politicians" element={<AdminPoliticians />} />
              <Route path="/admin/promises" element={<AdminPromises />} />
              <Route path="/admin/nepotism" element={<AdminNepotism />} />
              <Route path="/admin/polls" element={<AdminPolls />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
