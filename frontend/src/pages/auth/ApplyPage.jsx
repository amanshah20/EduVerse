import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap, BookOpen, User, Mail, Phone, FileText, ArrowLeft, ChevronRight, CheckCircle } from 'lucide-react';
import api from '../../utils/api';

export default function ApplyPage() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const [role, setRole] = useState(sp.get('role') || 'student');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', contact:'', purpose:'', grade:'', qualification:'', experience:'', subjects:'', bio:'', chargeTuition:'' });
  const set = (k,v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.contact) { toast.error('Fill all required fields'); return; }
    setLoading(true);
    try {
      await api.post('/auth/apply', { ...form, role, email: form.email.trim().toLowerCase() });
      setSubmitted(true);
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed'); }
    finally { setLoading(false); }
  };

  if (submitted) return (
    <div className="auth-page">
      <div className="auth-glow-1" /><div className="auth-glow-2" />
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ width: 64, height: 64, background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={28} color="var(--green)" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>Application Submitted!</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 340, margin: '0 auto 28px', lineHeight: 1.7 }}>
          Your {role} application is under review. Once approved, your login credentials will be sent to <strong style={{ color: 'var(--text-secondary)' }}>{form.email}</strong>.
        </p>
        <Link to="/login" className="btn btn-primary">Go to Login</Link>
      </div>
    </div>
  );

  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', padding: '40px 20px' }}>
      <div className="auth-glow-1" /><div className="auth-glow-2" />
      <div style={{ width: '100%', maxWidth: 680, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <button onClick={() => navigate('/login')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={15} /> Back to login
        </button>

        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>Apply for Access</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Submit your application — credentials will be emailed after admin approval</p>
        </div>

        <div className="auth-card auth-card-wide">
          {/* Role tabs */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
            {[{ k:'student', label:'Student', icon: GraduationCap }, { k:'teacher', label:'Teacher', icon: BookOpen }].map(r => {
              const Icon = r.icon; const active = role === r.k;
              return (
                <button key={r.k} onClick={() => setRole(r.k)} style={{ flex: 1, padding: '14px', borderRadius: 10, border: `1px solid ${active ? '#3b82f6' : 'rgba(59,130,246,0.12)'}`, background: active ? 'rgba(59,130,246,0.08)' : 'var(--bg-input)', cursor: 'pointer', transition: 'all 160ms', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Icon size={18} color={active ? '#3b82f6' : 'var(--text-muted)'} />
                  <span style={{ fontWeight: 600, fontSize: 14, color: active ? '#3b82f6' : 'var(--text-muted)' }}>{r.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="g2">
              <div className="field">
                <label className="field-label">Full name *</label>
                <div className="input-wrap"><User size={15} className="input-icon" /><input placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
              </div>
              <div className="field">
                <label className="field-label">Email address *</label>
                <div className="input-wrap"><Mail size={15} className="input-icon" /><input type="email" placeholder="john@example.com" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
              </div>
            </div>
            <div className="field">
              <label className="field-label">Contact number *</label>
              <div className="input-wrap"><Phone size={15} className="input-icon" /><input placeholder="+91 98765 43210" value={form.contact} onChange={e => set('contact', e.target.value)} required /></div>
            </div>

            {role === 'student' && (
              <div className="g2">
                <div className="field">
                  <label className="field-label">Grade / Course *</label>
                  <select value={form.grade} onChange={e => set('grade', e.target.value)} required>
                    <option value="">Select grade</option>
                    {['Class 9','Class 10','Class 11','Class 12','B.Tech','B.Sc','BCA','MBA','MCA','M.Tech','Other'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Purpose of joining *</label>
                  <input placeholder="e.g., Exam preparation" value={form.purpose} onChange={e => set('purpose', e.target.value)} required />
                </div>
              </div>
            )}

            {role === 'teacher' && (<>
              <div className="g2">
                <div className="field">
                  <label className="field-label">Qualification *</label>
                  <select value={form.qualification} onChange={e => set('qualification', e.target.value)} required>
                    <option value="">Select qualification</option>
                    {['B.Ed','M.Ed','B.Tech','M.Tech','PhD','M.Sc','B.Sc','MBA','Other'].map(q => <option key={q}>{q}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Teaching experience *</label>
                  <input placeholder="e.g., 5 years" value={form.experience} onChange={e => set('experience', e.target.value)} required />
                </div>
              </div>
              <div className="g2">
                <div className="field">
                  <label className="field-label">Subjects you teach *</label>
                  <input placeholder="Mathematics, Physics, Chemistry" value={form.subjects} onChange={e => set('subjects', e.target.value)} required />
                </div>
                <div className="field">
                  <label className="field-label">Hourly rate (₹)</label>
                  <input type="number" placeholder="500" value={form.chargeTuition} onChange={e => set('chargeTuition', e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label className="field-label">About you</label>
                <div className="input-wrap" style={{ alignItems: 'flex-start' }}>
                  <FileText size={15} style={{ position: 'absolute', left: 13, top: 12, color: 'var(--text-muted)' }} />
                  <textarea rows={3} style={{ paddingLeft: 40, resize: 'vertical' }} placeholder="Brief bio about your teaching background…" value={form.bio} onChange={e => set('bio', e.target.value)} />
                </div>
              </div>
            </>)}

            <div className="alert alert-info">
              <Mail size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>After approval, your login credentials will be emailed to <strong>{form.email || 'your email'}</strong>.</span>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
              {loading ? <><span className="spinner" style={{ borderTopColor:'#fff' }} />Submitting…</> : <>Submit Application <ChevronRight size={16} /></>}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
            Already have credentials? <Link to="/login" style={{ color: '#3b82f6', fontWeight: 600 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
