import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Shield, AlertTriangle, Activity, Users, Lock } from 'lucide-react';
import api from '../../utils/api';

export default function AdminSettings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('activity');

  useEffect(()=>{ api.get('/admin/platform-stats').then(r=>setData(r.data)).finally(()=>setLoading(false)); },[]);

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'var(--brand)' }}/></div>;

  const { users=[], recentLogins=[] } = data||{};
  const success = recentLogins.filter(l=>l.success).length;
  const failed = recentLogins.filter(l=>!l.success).length;
  const active = users.filter(u=>u.isActive).length;
  const suspended = users.filter(u=>!u.isActive).length;
  const locked = users.filter(u=>u.lockUntil&&new Date(u.lockUntil)>new Date()).length;

  return (
    <div className="fade-in">
      <div className="tabs" style={{ maxWidth:480, marginBottom:24 }}>
        <button className={`tab-btn ${tab==='activity'?'active':''}`} onClick={()=>setTab('activity')}><Activity size={13}/> Login Activity</button>
        <button className={`tab-btn ${tab==='users'?'active':''}`} onClick={()=>setTab('users')}><Users size={13}/> User Status</button>
        <button className={`tab-btn ${tab==='security'?'active':''}`} onClick={()=>setTab('security')}><Shield size={13}/> Security</button>
      </div>

      {tab==='activity' && (<>
        <div className="stat-grid" style={{ marginBottom:24 }}>
          {[
            { label:'Successful Logins', value:success, icon:CheckCircle, color:'var(--green)', bg:'var(--green-dim)' },
            { label:'Failed Attempts',   value:failed,  icon:XCircle,     color:'var(--red)',   bg:'var(--red-dim)'   },
            { label:'Total Users',       value:users.length, icon:Users,  color:'var(--brand)', bg:'rgba(37,99,235,0.08)' },
            { label:'Locked Accounts',   value:locked,  icon:Lock,        color:'#f59e0b',      bg:'rgba(245,158,11,0.08)' },
          ].map((s,i)=>{ const Icon=s.icon; return (
            <div key={i} className="stat-card">
              <div className="stat-icon-wrap" style={{ background:s.bg }}><Icon size={18} color={s.color}/></div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
            </div>
          );})}
        </div>
        <div className="card">
          <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Recent Login Events</div>
          {recentLogins.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>User</th><th>Role</th><th>Time</th><th>Status</th><th>IP</th></tr></thead>
                <tbody>
                  {recentLogins.map((l,i)=>(
                    <tr key={i}>
                      <td>
                        <div style={{ fontWeight:500 }}>{l.userName}</div>
                        <div style={{ fontSize:11.5, color:'var(--text-muted)', marginTop:1 }}>{l.userEmail}</div>
                      </td>
                      <td><span className={`badge badge-${l.role==='student'?'blue':'green'}`} style={{ fontSize:10.5 }}>{l.role}</span></td>
                      <td style={{ fontSize:12.5 }}>{new Date(l.timestamp).toLocaleString()}</td>
                      <td>
                        {l.success
                          ? <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12.5, color:'var(--green)' }}><CheckCircle size={12}/> Success</span>
                          : <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12.5, color:'var(--red)' }}><XCircle size={12}/> Failed</span>}
                      </td>
                      <td style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'monospace' }}>{l.ip||'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty" style={{ padding:'30px 0' }}><Clock className="empty-icon"/><p>No login activity recorded</p></div>
          )}
        </div>
      </>)}

      {tab==='users' && (<>
        <div className="stat-grid" style={{ marginBottom:24 }}>
          {[
            { label:'Active Users',    value:active,    icon:CheckCircle, color:'var(--green)', bg:'var(--green-dim)' },
            { label:'Suspended Users', value:suspended, icon:XCircle,     color:'var(--red)',   bg:'var(--red-dim)'   },
          ].map((s,i)=>{ const Icon=s.icon; return (
            <div key={i} className="stat-card">
              <div className="stat-icon-wrap" style={{ background:s.bg }}><Icon size={18} color={s.color}/></div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
            </div>
          );})}
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>User</th><th>Role</th><th>Account</th><th>Activity</th><th>Attempts</th><th>Last Login</th></tr></thead>
            <tbody>
              {users.map((u,i)=>(
                <tr key={i}>
                  <td>
                    <div style={{ fontWeight:500 }}>{u.name}</div>
                    <div style={{ fontSize:11.5, color:'var(--text-muted)', marginTop:1 }}>{u.email}</div>
                  </td>
                  <td><span className={`badge badge-${u.role==='student'?'blue':'green'}`} style={{ fontSize:10.5 }}>{u.role}</span></td>
                  <td><span className={`badge ${u.status==='approved'?'badge-green':u.status==='pending'?'badge-amber':'badge-red'}`} style={{ fontSize:10.5 }}>{u.status}</span></td>
                  <td><span className={`badge ${u.isActive?'badge-green':'badge-red'}`} style={{ fontSize:10.5 }}>{u.isActive?'Active':'Suspended'}</span></td>
                  <td style={{ color:u.loginAttempts>3?'var(--red)':'var(--text-secondary)', fontWeight:u.loginAttempts>3?700:400 }}>{u.loginAttempts||0}</td>
                  <td style={{ fontSize:12, color:'var(--text-muted)' }}>{u.lastLogin?new Date(u.lastLogin).toLocaleDateString():'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>)}

      {tab==='security' && (
        <div style={{ maxWidth:600 }}>
          <div className="card" style={{ marginBottom:14 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Security Configuration</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { label:'OTP Verification',      active:true,  desc:'Students & teachers must verify via OTP on each login' },
                { label:'Account Lockout',        active:true,  desc:'Accounts lock after 5 failed attempts for 30 minutes' },
                { label:'Admin Direct Login',     active:true,  desc:'Admin bypasses OTP with direct credential login' },
                { label:'Email Notifications',    active:true,  desc:'Credentials & alerts delivered via email (Nodemailer)' },
                { label:'Razorpay Payments',      active:true,  desc:'Secure payments via Razorpay with signature verification' },
                { label:'Groq AI Chatbot (EduBot)',active:true, desc:'AI assistant powered by Groq LLaMA 3 for all users' },
              ].map((item,i)=>(
                <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'12px 14px', background:'var(--bg-elevated)', borderRadius:8 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:item.active?'var(--green)':'var(--text-muted)', marginTop:5, flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13.5 }}>{item.label}</div>
                    <div style={{ fontSize:12.5, color:'var(--text-muted)', marginTop:2 }}>{item.desc}</div>
                  </div>
                  <span className={`badge ${item.active?'badge-green':'badge-gray'}`} style={{ fontSize:10.5, flexShrink:0 }}>{item.active?'Enabled':'Disabled'}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Platform Information</div>
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {[['Platform','Edu Verse v2.0'],['Backend','Node.js · Express · MongoDB'],['Frontend','React 18 · Vite · Lucide Icons'],['Auth','JWT · bcrypt · OTP via Email'],['AI Chatbot','Groq LLaMA 3 (groq-sdk)'],['Payments','Razorpay'],['Email','Nodemailer (Gmail SMTP)']].map(([k,v],i,arr)=>(
                <div key={i} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:i<arr.length-1?'1px solid var(--border-subtle)':'none' }}>
                  <span style={{ color:'var(--text-muted)', fontSize:13, width:110, flexShrink:0 }}>{k}</span>
                  <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
