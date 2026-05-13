import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, RotateCcw, ArrowLeft } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function OTPPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { userId, email } = state || {};
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const refs = useRef([]);

  useEffect(() => { if (!userId) navigate('/login'); }, [userId]);
  useEffect(() => { const t = countdown > 0 && setInterval(() => setCountdown(c => c - 1), 1000); return () => clearInterval(t); }, [countdown]);

  const update = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits]; next[i] = val.slice(-1); setDigits(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i, e) => { if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus(); };
  const onPaste = (e) => {
    const d = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setDigits([...d.split(''), ...Array(6).fill('')].slice(0, 6));
    refs.current[Math.min(d.length, 5)]?.focus();
  };

  const verify = async () => {
    const code = digits.join('');
    if (code.length < 6) { toast.error('Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { userId, otp: code });
      login(res.data.token, res.data.user);
      toast.success('Verified successfully!');
      navigate(`/${res.data.user.role}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid OTP'); setDigits(['','','','','','']); refs.current[0]?.focus(); }
    finally { setLoading(false); }
  };
  const resend = async () => {
    setResending(true);
    try { await api.post('/auth/resend-otp', { userId }); toast.success('New OTP sent!'); setCountdown(60); setDigits(['','','','','','']); refs.current[0]?.focus(); }
    catch { toast.error('Failed to resend'); } finally { setResending(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-grid" /><div className="auth-glow-1" /><div className="auth-glow-2" />
      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <button onClick={() => navigate('/login')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={15} /> Back to login
        </button>
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <ShieldCheck size={24} color="var(--green)" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Check your email</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.6, marginBottom: 28 }}>
            We sent a 6-digit verification code to<br />
            <strong style={{ color: '#3b82f6' }}>{email}</strong>
          </p>
          <div className="otp-group" onPaste={onPaste} style={{ marginBottom: 24 }}>
            {digits.map((d, i) => (
              <input key={i} ref={el => refs.current[i] = el} className="otp-box" maxLength={1} value={d}
                onChange={e => update(i, e.target.value)} onKeyDown={e => onKey(i, e)} autoFocus={i === 0} />
            ))}
          </div>
          <button className="btn btn-primary btn-lg" onClick={verify} disabled={loading} style={{ width: '100%', marginBottom: 14 }}>
            {loading ? <><span className="spinner" style={{ borderTopColor: '#fff' }} />Verifying…</> : <><ShieldCheck size={16} />Verify code</>}
          </button>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Didn't receive it?{' '}
            {countdown > 0
              ? <span>Resend in <strong style={{ color: '#3b82f6' }}>{countdown}s</strong></span>
              : <button onClick={resend} disabled={resending} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}><RotateCcw size={12} />{resending ? 'Sending…' : 'Resend code'}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
