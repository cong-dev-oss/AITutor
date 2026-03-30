import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { UserPlus, User, Lock, Mail, Loader2 } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/register', { username, email, password });
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data));
      navigate('/');
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md bg-card p-10 shadow-sm border border-border/80">
        <h1 className="text-3xl font-serif text-center font-bold text-primary mb-2 italic">AITutor</h1>
        <p className="text-center text-muted-foreground mb-8 font-serif uppercase tracking-wider text-xs">Ghi danh</p>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 mb-6 text-sm border-l-4 border-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none font-serif flex items-center gap-2">
              <User className="w-4 h-4 opacity-70" /> Tên hiển thị
            </label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex h-12 w-full border border-border bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary disabled:opacity-50 transition-colors"
              placeholder="Nguyen Van A"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none font-serif flex items-center gap-2">
              <Mail className="w-4 h-4 opacity-70" /> Email
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex h-12 w-full border border-border bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary disabled:opacity-50 transition-colors"
              placeholder="nguyenvan@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none font-serif flex items-center gap-2">
              <Lock className="w-4 h-4 opacity-70" /> Mật khẩu
            </label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex h-12 w-full border border-border bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary disabled:opacity-50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="inline-flex items-center justify-center text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-full mt-4 rounded-sm shadow-inner transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
            Đăng Ký
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border text-center text-sm">
          <p className="text-muted-foreground">
            Đã là học viên?{' '}
            <Link to="/login" className="font-semibold px-2 py-1 bg-stone-100 hover:bg-stone-200 text-primary transition-colors">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
