import { useState } from 'react';
import { Camera, Save, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
const API = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

export default function TeacherProfile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name:user?.name||'', contact:user?.contact||'', qualification:user?.qualification||'', experience:user?.experience||'', subjects:user?.subjects?.join(', ')||'', bio:user?.bio||'', chargeTuition:user?.chargeTuition||'' });
  const [pw, setPw] = useState({ current:'', next:'', confirm:'' });
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v])=>fd.append(k,v));
      if (photo) fd.append('photo', photo);
      const res = await api.put('/teacher/profile', fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      setUser(res.data); localStorage.setItem('user', JSON.stringify(res.data));
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); } finally { setSaving(false); }
  };

  const changePw = async () => {
    if (pw.next!==pw.confirm) { toast.error("Passwords don't match"); return; }
    try {
      await api.put('/auth/change-password', { currentPassword:pw.current, newPassword:pw.next });
      toast.success('Password changed!'); setPw({ current:'', next:'', confirm:'' });
    } catch (err) { toast.error(err.response?.data?.message||'Failed'); }
  };

  const photoSrc = photo ? URL.createObjectURL(photo) : user?.profilePhoto ? `${API}${user.profilePhoto}` : null;

  return (
    <div className="fade-in" style={{ maxWidth:700 }}>
      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', gap:18, alignItems:'center', paddingBottom:20, marginBottom:20, borderBottom:'1px solid var(--border-subtle)', flexWrap:'wrap' }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(16,185,129,0.1)', border:'2px solid rgba(16,185,129,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:26, color:'var(--green)', overflow:'hidden' }}>
              {photoSrc ? <img src={photoSrc} style={{ width:80,height:80,objectFit:'cover' }} alt="" /> : initials}
            </div>
            <label style={{ position:'absolute', bottom:0, right:0, width:28, height:28, background:'var(--brand)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'2px solid var(--bg-card)' }}>
              <Camera size={12} color="#fff" />
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={e=>setPhoto(e.target.files[0])} />
            </label>
          </div>
          <div>
            <h2 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.3px' }}>{user?.name}</h2>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{user?.email}</div>
            <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
              <span className="badge badge-green">Teacher</span>
              {user?.empId && <span className="badge badge-blue font-mono" style={{ fontSize:11 }}>EMP: {user.empId}</span>}
              {user?.qualification && <span className="badge badge-purple">{user.qualification}</span>}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="g2">
            <div className="field"><label className="field-label">Full name</label><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></div>
            <div className="field"><label className="field-label">Contact</label><input value={form.contact} onChange={e=>setForm(p=>({...p,contact:e.target.value}))} /></div>
          </div>
          <div className="g2">
            <div className="field"><label className="field-label">Qualification</label><input value={form.qualification} onChange={e=>setForm(p=>({...p,qualification:e.target.value}))} /></div>
            <div className="field"><label className="field-label">Teaching experience</label><input value={form.experience} onChange={e=>setForm(p=>({...p,experience:e.target.value}))} /></div>
          </div>
          <div className="g2">
            <div className="field"><label className="field-label">Subjects (comma separated)</label><input value={form.subjects} onChange={e=>setForm(p=>({...p,subjects:e.target.value}))} placeholder="Math, Physics, Chemistry" /></div>
            <div className="field"><label className="field-label">Hourly rate (₹)</label><input type="number" value={form.chargeTuition} onChange={e=>setForm(p=>({...p,chargeTuition:e.target.value}))} /></div>
          </div>
          <div className="field"><label className="field-label">Bio (visible to students)</label><textarea rows={4} value={form.bio} onChange={e=>setForm(p=>({...p,bio:e.target.value}))} placeholder="Your teaching background, approach, achievements…" style={{ resize:'vertical' }} /></div>
          <button className="btn btn-primary btn-sm" style={{ alignSelf:'flex-start' }} onClick={save} disabled={saving}>
            {saving?<><span className="spinner" style={{ borderTopColor:'#fff',width:14,height:14 }} />Saving…</>:<><Save size={14} />Save Profile</>}
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:18 }}>
          <div style={{ width:36,height:36,background:'var(--purple-dim)',border:'1px solid rgba(139,92,246,0.2)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <Key size={16} color="var(--purple)" />
          </div>
          <div style={{ fontWeight:700, fontSize:15 }}>Change Password</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="field"><label className="field-label">Current password</label><input type="password" value={pw.current} onChange={e=>setPw(p=>({...p,current:e.target.value}))} /></div>
          <div className="g2">
            <div className="field"><label className="field-label">New password</label><input type="password" value={pw.next} onChange={e=>setPw(p=>({...p,next:e.target.value}))} /></div>
            <div className="field"><label className="field-label">Confirm</label><input type="password" value={pw.confirm} onChange={e=>setPw(p=>({...p,confirm:e.target.value}))} /></div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ alignSelf:'flex-start' }} onClick={changePw}>Update Password</button>
        </div>
      </div>
    </div>
  );
}
