import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(email, password); navigate('/'); }
    catch (err: any) { setError(err.response?.data?.error || 'Erro ao fazer login'); }
    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto mt-20">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-ink">Entrar</h1>
        <p className="text-sm text-muted mt-1">Acesse sua conta para votar e avaliar</p>
      </div>
      <div className="bg-white border border-border rounded-lg p-6">
        {error && <div className="bg-red/5 border border-red/20 text-red text-sm rounded-lg p-2.5 mb-4 text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider mb-1 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-green/20" placeholder="seu@email.com" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider mb-1 block">Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-green/20" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-green text-white rounded-lg text-sm font-medium hover:bg-green-dark transition-colors disabled:opacity-50">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
      <p className="text-center text-sm text-muted mt-4">Não tem conta? <Link to="/register" className="text-green font-medium hover:underline">Cadastre-se</Link></p>
    </div>
  );
}
