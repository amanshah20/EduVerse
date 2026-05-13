import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, ChevronRight, GraduationCap, BookOpen, Shield, Briefcase } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const ROLES = [
  { key: 'student', label: 'Student', icon: GraduationCap, color: '#3b82f6' },
  { key: 'teacher', label: 'Teacher', icon: BookOpen, color: '#10b981' },
  { key: 'admin',   label: 'Admin',   icon: Shield,        color: '#8b5cf6' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ email: '', password: '', empId: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill in all fields'); return; }
    if (role === 'teacher' && !form.empId) { toast.error('Please enter your Employee ID'); return; }
    
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { 
        email: form.email.trim().toLowerCase(), 
        password: form.password, 
        role,
        empId: form.empId || undefined
      });
      
      if (res.data.requireOTP) {
        navigate('/verify-otp', { state: { userId: res.data.userId, email: form.email.trim() } });
      } else {
        login(res.data.token, res.data.user);
        toast.success('Welcome back!');
        navigate(`/${res.data.user.role}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally { setLoading(false); }
  };

  const activeRole = ROLES.find(r => r.key === role);

  return (
    <div className="auth-page">
      <div className="auth-grid" />
      <div className="auth-glow-1" />
      <div className="auth-glow-2" />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(59,130,246,0.3)' }}>
            <BookOpen size={22} color="#fff" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>EduVerse</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Sign in to continue learning</p>
        </div>

        <div className="auth-card">
          {/* Role selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 26 }}>
            {ROLES.map(r => {
              const Icon = r.icon;
              const active = role === r.key;
              return (
                <button key={r.key} onClick={() => setRole(r.key)}
                  style={{ flex: 1, padding: '10px 8px', borderRadius: 8, border: `1px solid ${active ? r.color : 'rgba(59,130,246,0.12)'}`, background: active ? `${r.color}14` : 'var(--bg-input)', cursor: 'pointer', transition: 'all 160ms', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <Icon size={17} color={active ? r.color : 'var(--text-muted)'} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: active ? r.color : 'var(--text-muted)' }}>{r.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label className="field-label">Email address</label>
              <div className="input-wrap">
                <Mail size={15} className="input-icon" />
                <input type="email" placeholder="you@example.com" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required autoComplete="email" autoFocus />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Password</label>
              <div className="input-wrap">
                <Lock size={15} className="input-icon" />
                <input type={showPass ? 'text' : 'password'} placeholder="Enter your password" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required autoComplete="current-password"
                  style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>
                  {showPass ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {role === 'teacher' && (
              <div className="field">
                <label className="field-label">Employee ID</label>
                <div className="input-wrap">
                  <Briefcase size={15} className="input-icon" />
                  <input type="text" placeholder="EMP12345" value={form.empId}
                    onChange={e => setForm(p => ({ ...p, empId: e.target.value }))} required />
                </div>
              </div>
            )}

            {role === 'admin' && (
              <div className="alert alert-info" style={{ fontSize: 13 }}>
                <Shield size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Admin accounts login directly without OTP verification.</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
              style={{ width: '100%', marginTop: 4, gap: 8 }}>
              {loading ? <><span className="spinner" style={{ borderTopColor: '#fff' }} />Signing in…</> : <>Sign in <ChevronRight size={16} /></>}
            </button>
          </form>

          <div style={{ borderTop: '1px solid rgba(59,130,246,0.1)', marginTop: 22, paddingTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
            New to EduVerse?{' '}
            <Link to="/apply" style={{ color: '#3b82f6', fontWeight: 600 }}>Apply for access</Link>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          © 2024 EduVerse · All rights reserved
        </p>
      </div>
    </div>
  );
}
