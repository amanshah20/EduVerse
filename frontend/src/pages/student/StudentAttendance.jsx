import { useState, useEffect } from 'react';
import { BarChart2, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';

export default function StudentAttendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/student/attendance').then(r=>setData(r.data)).finally(()=>setLoading(false)); }, []);

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'var(--brand)' }} /></div>;

  const { records=[], bySubject={}, overall={} } = data||{};
  const pct = overall.percentage||0;
  const low = pct < 75 && overall.total > 0;

  return (
    <div className="fade-in">
      {low && (
        <div className="alert alert-warn" style={{ marginBottom:20 }}>
          <AlertTriangle size={15} style={{ flexShrink:0 }} />
          <span>Your attendance is <strong>{pct}%</strong> — below the required 75%. Please attend more classes.</span>
        </div>
      )}

      <div className="stat-grid" style={{ marginBottom:24 }}>
        {[
          { label:'Overall Attendance', value:`${pct}%`, icon:BarChart2, color: pct>=75?'var(--green)':'var(--red)', bg: pct>=75?'var(--green-dim)':'var(--red-dim)' },
          { label:'Days Present', value:overall.present||0, icon:CheckCircle, color:'var(--green)', bg:'var(--green-dim)' },
          { label:'Days Absent', value:(overall.total||0)-(overall.present||0), icon:XCircle, color:'var(--red)', bg:'var(--red-dim)' },
          { label:'Total Classes', value:overall.total||0, icon:Clock, color:'var(--brand)', bg:'rgba(37,99,235,0.08)' },
        ].map((s,i) => { const Icon=s.icon; return (
          <div key={i} className="stat-card">
            <div className="stat-icon-wrap" style={{ background:s.bg }}><Icon size={18} color={s.color} /></div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
          </div>
        );})}
      </div>

      {/* Subject-wise */}
      {Object.keys(bySubject).length>0 && (
        <div className="card" style={{ marginBottom:20 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:20 }}>Subject-wise Breakdown</div>
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {Object.entries(bySubject).map(([subj,counts],i) => {
              const total = counts.present+counts.absent+(counts.late||0);
              const present = counts.present+(counts.late||0);
              const p = total ? Math.round((present/total)*100) : 0;
              return (
                <div key={i}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                    <span style={{ fontWeight:600, fontSize:14 }}>{subj}</span>
                    <span style={{ fontWeight:700, color:p>=75?'var(--green)':'var(--red)', fontSize:14 }}>{p}%</span>
                  </div>
                  <div className="progress" style={{ height:7 }}>
                    <div className="progress-fill" style={{ width:`${p}%`, background:p>=75?'var(--green)':'var(--red)' }} />
                  </div>
                  <div style={{ display:'flex', gap:16, marginTop:6, fontSize:12, color:'var(--text-muted)' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}><CheckCircle size={11} /> {counts.present} present</span>
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}><XCircle size={11} /> {counts.absent} absent</span>
                    {counts.late>0 && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Clock size={11} /> {counts.late} late</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Records table */}
      <div className="card">
        <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Attendance History</div>
        {records.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Subject</th><th>Status</th><th>Method</th></tr></thead>
              <tbody>
                {records.slice(0,40).map((r,i) => (
                  <tr key={i}>
                    <td style={{ fontSize:13 }}>{new Date(r.date).toLocaleDateString()}</td>
                    <td style={{ fontWeight:500 }}>{r.subject}</td>
                    <td><span className={`badge ${r.status==='present'?'badge-green':r.status==='late'?'badge-amber':'badge-red'}`} style={{ fontSize:11 }}>{r.status}</span></td>
                    <td style={{ fontSize:12, color:'var(--text-muted)', textTransform:'capitalize' }}>{r.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty" style={{ padding:'30px 0' }}><BarChart2 className="empty-icon" /><p>No attendance records yet</p></div>
        )}
      </div>
    </div>
  );
}
