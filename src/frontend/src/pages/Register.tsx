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
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary/30">
      <div className="w-full max-w-sm bg-card p-8 rounded-lg shadow-sm border border-border">
        
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
            <span className="font-bold text-xl">AI</span>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-foreground tracking-tight mb-2">Create an account</h1>
        <p className="text-center text-muted-foreground mb-8 text-sm">Vui lòng điền thông tin để đăng ký</p>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 mb-6 text-sm flex flex-col gap-1 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              Tên hiển thị
            </label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex h-12 w-full border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 disabled:opacity-50 transition-all duration-200 rounded-md shadow-sm"
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              Email
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex h-12 w-full border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 disabled:opacity-50 transition-all duration-200 rounded-md shadow-sm"
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              Mật khẩu
            </label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex h-12 w-full border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 disabled:opacity-50 transition-all duration-200 rounded-md shadow-sm"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-full mt-6 rounded-md active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tiếp tục'}
          </button>
        </form>

        <div className="mt-8 pt-6 text-center text-sm">
          <p className="text-muted-foreground">
            Đã là thành viên?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline transition-all">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
