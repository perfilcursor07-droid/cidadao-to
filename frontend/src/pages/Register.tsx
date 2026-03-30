import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await register(name, email, password); navigate('/'); }
    catch (err: any) { setError(err.response?.data?.error || 'Erro ao cadastrar'); }
    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto mt-20">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-ink">Cadastro</h1>
        <p className="text-sm text-muted mt-1">Crie sua conta e participe</p>
      </div>
      <div className="bg-white border border-border rounded-lg p-6">
        {error && <div className="bg-red/5 border border-red/20 text-red text-sm rounded-lg p-2.5 mb-4 text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider mb-1 block">Nome</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-green/20" placeholder="Seu nome" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider mb-1 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-green/20" placeholder="seu@email.com" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider mb-1 block">Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-green/20" placeholder="Mínimo 6 caracteres" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-green text-white rounded-lg text-sm font-medium hover:bg-green-dark transition-colors disabled:opacity-50">
            {loading ? 'Cadastrando...' : 'Criar Conta'}
          </button>
        </form>
      </div>
      <p className="text-center text-sm text-muted mt-4">Já tem conta? <Link to="/login" className="text-green font-medium hover:underline">Entrar</Link></p>
    </div>
  );
}
