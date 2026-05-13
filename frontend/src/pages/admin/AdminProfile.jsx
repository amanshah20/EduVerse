import { useState } from 'react';
import { Save, Key, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminProfile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name:user?.name||'', organization:user?.organization||'' });
  const [pw, setPw] = useState({ current:'', next:'', confirm:'' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.put('/admin/profile', form);
      setUser(res.data); localStorage.setItem('user', JSON.stringify(res.data));
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); } finally { setSaving(false); }
  };

  const changePw = async () => {
    if (pw.next!==pw.confirm) { toast.error("Passwords don't match"); return; }
    if (pw.next.length<8) { toast.error('Minimum 8 characters'); return; }
    try {
      await api.put('/auth/change-password', { currentPassword:pw.current, newPassword:pw.next });
      toast.success('Password changed!'); setPw({ current:'', next:'', confirm:'' });
    } catch (err) { toast.error(err.response?.data?.message||'Failed'); }
  };

  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);

  return (
    <div className="fade-in" style={{ maxWidth:580 }}>
      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', gap:16, alignItems:'center', paddingBottom:20, marginBottom:20, borderBottom:'1px solid var(--border-subtle)', flexWrap:'wrap' }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(139,92,246,0.12)', border:'2px solid rgba(139,92,246,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:24, color:'var(--purple)', flexShrink:0 }}>
            {initials}
          </div>
          <div>
            <h2 style={{ fontSize:19, fontWeight:800, letterSpacing:'-0.3px' }}>{user?.name}</h2>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{user?.email}</div>
            <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
              <span className="badge badge-purple" style={{ display:'flex', alignItems:'center', gap:4 }}><Shield size={10}/> Super Admin</span>
              <span className="badge badge-gray">{user?.organization||'Edu Verse'}</span>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="field"><label className="field-label">Admin name</label><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
          <div className="field"><label className="field-label">Organization</label><input value={form.organization} onChange={e=>setForm(p=>({...p,organization:e.target.value}))} placeholder="Edu Verse"/></div>
          <div className="field"><label className="field-label">Email (read-only)</label><input value={user?.email} readOnly style={{ opacity:0.5, cursor:'not-allowed' }}/></div>
          <button className="btn btn-primary btn-sm" style={{ alignSelf:'flex-start' }} onClick={save} disabled={saving}>
            {saving?<><span className="spinner" style={{ borderTopColor:'#fff',width:14,height:14 }}/>Saving…</>:<><Save size={14}/> Save Changes</>}
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:18 }}>
          <div style={{ width:36,height:36,background:'var(--purple-dim)',border:'1px solid rgba(139,92,246,0.2)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <Key size={16} color="var(--purple)"/>
          </div>
          <div style={{ fontWeight:700, fontSize:15 }}>Change Password</div>
        </div>
        <div className="alert alert-warn" style={{ marginBottom:16, fontSize:13 }}>
          <Shield size={14} style={{ flexShrink:0 }}/>
          Admin password changes take effect immediately. Keep it secure.
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="field"><label className="field-label">Current password</label><input type="password" value={pw.current} onChange={e=>setPw(p=>({...p,current:e.target.value}))}/></div>
          <div className="g2">
            <div className="field"><label className="field-label">New password</label><input type="password" value={pw.next} onChange={e=>setPw(p=>({...p,next:e.target.value}))}/></div>
            <div className="field"><label className="field-label">Confirm</label><input type="password" value={pw.confirm} onChange={e=>setPw(p=>({...p,confirm:e.target.value}))}/></div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ alignSelf:'flex-start' }} onClick={changePw}>Update Password</button>
        </div>
      </div>
    </div>
  );
}
