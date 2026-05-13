import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, CheckCircle, XCircle, Trash2, Eye, RefreshCw, ChevronDown, User, Mail, Phone, GraduationCap, BookOpen } from 'lucide-react';
import api from '../../utils/api';

export default function AdminUsers() {
  const [sp] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState(sp.get('role')||'student');
  const [statusFilter, setStatusFilter] = useState(sp.get('status')||'all');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [creds, setCreds] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = () => {
    setLoading(true);
    const p = { role: roleFilter };
    if (statusFilter !== 'all') p.status = statusFilter;
    api.get('/admin/users', { params: p }).then(r => setUsers(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [roleFilter, statusFilter]);

  const approve = async (u) => {
    setBusy(u._id+'approve');
    try {
      const r = await api.post(`/admin/users/${u._id}/approve`);
      toast.success(`Approved! Credentials sent to ${u.email}`);
      load(); setDetail(null);
    } catch (err) { toast.error(err.response?.data?.message||'Failed'); }
    finally { setBusy(null); }
  };
  const reject = async (id) => {
    setBusy(id+'reject');
    try { await api.post(`/admin/users/${id}/reject`); toast.success('Rejected'); load(); setDetail(null); }
    catch { toast.error('Failed'); } finally { setBusy(null); }
  };
  const del = async (id) => {
    if (!confirm('Delete this user permanently?')) return;
    try { await api.delete(`/admin/users/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };
  const toggle = async (id) => {
    try { const r = await api.post(`/admin/users/${id}/toggle-status`); toast.success(r.data.message); load(); }
    catch { toast.error('Failed'); }
  };
  const previewCreds = async (u) => {
    try { const r = await api.post(`/admin/users/${u._id}/generate-password`, { role: u.role }); setCreds(r.data); }
    catch { toast.error('Failed'); }
  };

  const filtered = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  const statusCls = (s) => s==='approved'?'badge-green':s==='pending'?'badge-amber':'badge-red';

  return (
    <div className="fade-in">
      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div className="tabs" style={{ flex:'none' }}>
          <button className={`tab-btn ${roleFilter==='student'?'active':''}`} onClick={()=>setRoleFilter('student')}><GraduationCap size={14} /> Students</button>
          <button className={`tab-btn ${roleFilter==='teacher'?'active':''}`} onClick={()=>setRoleFilter('teacher')}><BookOpen size={14} /> Teachers</button>
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ width:'auto', minWidth:130 }}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <div className="input-wrap" style={{ flex:1, minWidth:200 }}>
          <Search size={14} className="input-icon" />
          <input placeholder="Search name or email…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <span style={{ fontSize:13, color:'var(--text-muted)' }}>{filtered.length} users</span>
      </div>

      {loading ? (
        <div className="loading-page" style={{ minHeight:300 }}><span className="spinner" style={{ borderTopColor:'var(--brand)' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="empty" style={{ minHeight:300 }}><User className="empty-icon" /><p>No users found</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>User</th>
              <th>{roleFilter==='teacher'?'Qualification':'Grade'}</th>
              <th>Contact</th>
              <th>Applied</th>
              <th>Status</th>
              <th>Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id}>
                  <td>
                    <div>
                      <div style={{ fontWeight:600, color:'var(--text-primary)', fontSize:13.5 }}>{u.name}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:1 }}>{u.email}</div>
                      {u.empId && <div style={{ fontSize:11, color:'var(--cyan)', marginTop:1, fontFamily:'monospace' }}>EMP: {u.empId}</div>}
                    </div>
                  </td>
                  <td style={{ fontSize:13 }}>{roleFilter==='teacher'?(u.qualification||'—'):(u.grade||'—')}</td>
                  <td style={{ fontSize:13 }}>{u.contact||'—'}</td>
                  <td style={{ fontSize:12, color:'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                      <span className={`badge ${statusCls(u.status)}`} style={{ fontSize:11 }}>{u.status}</span>
                      {u.status==='approved' && <span className={`badge ${u.isActive?'badge-green':'badge-red'}`} style={{ fontSize:10 }}>{u.isActive?'active':'suspended'}</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      {u.status==='pending' && <>
                        <button className="btn btn-success btn-sm" onClick={()=>approve(u)} disabled={busy===u._id+'approve'}>
                          {busy===u._id+'approve'?<span className="spinner-sm" style={{ width:12,height:12,borderTopColor:'var(--green)' }} />:<CheckCircle size={13} />} Approve
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={()=>reject(u._id)}><XCircle size={13} /> Reject</button>
                      </>}
                      {u.status==='approved' && (
                        <button className="btn btn-ghost btn-sm" onClick={()=>toggle(u._id)}>{u.isActive?'Suspend':'Activate'}</button>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={()=>{ setDetail(u); setCreds(null); }}><Eye size={13} /></button>
                      <button className="btn btn-danger btn-sm" onClick={()=>del(u._id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setDetail(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">User Details</div>
              <button className="modal-close" onClick={()=>setDetail(null)}><XCircle size={18} /></button>
            </div>
            <div style={{ display:'flex', gap:14, alignItems:'center', padding:'16px', background:'var(--bg-elevated)', borderRadius:10, marginBottom:20 }}>
              <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(37,99,235,0.12)', border:'1px solid rgba(37,99,235,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18, color:'var(--brand-light)', flexShrink:0 }}>
                {detail.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:16 }}>{detail.name}</div>
                <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{detail.email}</div>
                <div style={{ display:'flex', gap:6, marginTop:6 }}>
                  <span className={`badge ${statusCls(detail.status)}`}>{detail.status}</span>
                  <span className="badge badge-blue" style={{ textTransform:'capitalize' }}>{detail.role}</span>
                </div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
              {[
                ['Contact', detail.contact],
                [detail.role==='teacher'?'Qualification':'Grade', detail.role==='teacher'?detail.qualification:detail.grade],
                [detail.role==='teacher'?'Experience':'Purpose', detail.role==='teacher'?detail.experience:detail.purpose],
                ['Applied', new Date(detail.createdAt).toLocaleDateString()],
                ...(detail.empId?[['Employee ID', detail.empId]]:[]),
                ...(detail.role==='teacher'&&detail.chargeTuition?[['Hourly Rate', `₹${detail.chargeTuition}`]]:[]),
              ].filter(([,v])=>v).map(([k,v],i) => (
                <div key={i} style={{ padding:'10px 14px', background:'var(--bg-elevated)', borderRadius:8 }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>{k}</div>
                  <div style={{ fontSize:13.5, fontWeight:500 }}>{v}</div>
                </div>
              ))}
            </div>
            {detail.bio && (
              <div style={{ padding:'12px 14px', background:'var(--bg-elevated)', borderRadius:8, marginBottom:16 }}>
                <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>Bio</div>
                <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>{detail.bio}</div>
              </div>
            )}
            {detail.status==='pending' && (
              <div>
                <button className="btn btn-ghost btn-sm" onClick={()=>previewCreds(detail)} style={{ marginBottom:10 }}>
                  <RefreshCw size={13} /> Preview generated credentials
                </button>
                {creds && (
                  <div style={{ background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, padding:'12px 14px', marginBottom:14 }}>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>CREDENTIALS TO BE SENT ON APPROVAL</div>
                    {creds.empId && <div style={{ fontFamily:'monospace', color:'var(--cyan)', marginBottom:3 }}>Employee ID: <strong>{creds.empId}</strong></div>}
                    <div style={{ fontFamily:'monospace', color:'var(--green)' }}>Password: <strong>{creds.password}</strong></div>
                  </div>
                )}
                <div style={{ display:'flex', gap:10 }}>
                  <button className="btn btn-success" style={{ flex:1 }} onClick={()=>approve(detail)} disabled={busy===detail._id+'approve'}>
                    {busy===detail._id+'approve'?<><span className="spinner" style={{ borderTopColor:'var(--green)' }} />Approving…</>:<><CheckCircle size={15} />Approve & Send Credentials</>}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={()=>reject(detail._id)}><XCircle size={14} /> Reject</button>
                </div>
              </div>
            )}
            {detail.status==='approved' && (
              <button className="btn btn-ghost w-full" onClick={()=>toggle(detail._id)}>
                {detail.isActive?'Suspend Account':'Activate Account'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
