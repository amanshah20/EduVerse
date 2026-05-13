import { useState, useEffect } from 'react';
import { BookOpen, Users, Clock, Download, FileText, Loader } from 'lucide-react';
import api from '../../utils/api';
const API = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

export default function StudentClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);

  useEffect(() => {
    api.get('/student/classes')
      .then(r => setClasses(r.data))
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor: 'var(--brand)' }} /></div>;

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>My Classes</h1>

      {classes.length === 0 ? (
        <div className="empty" style={{ minHeight: 300 }}><BookOpen className="empty-icon" /><p>No classes yet. Hire a teacher to get access to their classes!</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {classes.map(cls => (
            <div key={cls._id} className="card card-hover">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{cls.name}</h3>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="badge badge-blue" style={{ fontSize: 11 }}>{cls.subject}</span>
                    <span className="badge badge-gray" style={{ fontSize: 11 }}><Users size={11} style={{ marginRight: 4 }} />{cls.students?.length || 0}</span>
                  </div>
                </div>
              </div>

              {cls.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>{cls.description}</p>}

              <div style={{ marginBottom: 12, padding: '12px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Teacher</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: 'var(--green)', flexShrink: 0 }}>
                    {cls.teacher?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{cls.teacher?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cls.teacher?.subjects?.join(', ')}</div>
                  </div>
                </div>
              </div>

              {cls.schedule?.length > 0 && (
                <div style={{ marginBottom: 12, padding: '12px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Clock size={13} /> Schedule
                  </div>
                  {cls.schedule.map((s, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: i < cls.schedule.length - 1 ? 4 : 0 }}>
                      {s.day}: {s.startTime} - {s.endTime}
                    </div>
                  ))}
                </div>
              )}

              {cls.materials?.length > 0 && (
                <div style={{ marginBottom: 12, padding: '12px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <FileText size={13} /> Materials ({cls.materials.length})
                  </div>
                  {cls.materials.slice(0, 3).map((m, i) => (
                    <a key={i} href={`${API}${m.url}`} target="_blank" rel="noreferrer" style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#3b82f6', marginBottom: 6, textDecoration: 'none' }}>
                      <Download size={11} /> {m.title}
                    </a>
                  ))}
                  {cls.materials.length > 3 && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>+{cls.materials.length - 3} more</div>}
                </div>
              )}

              <button className="btn btn-primary btn-sm w-full" onClick={() => setSelectedClass(cls)}>View Class Details</button>
            </div>
          ))}
        </div>
      )}

      {/* Class Details Modal */}
      {selectedClass && (
        <div className="overlay" onClick={() => setSelectedClass(null)}>
          <div className="modal" style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>{selectedClass.name}</h2>
              <button className="btn btn-ghost" onClick={() => setSelectedClass(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Subject</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedClass.subject}</div>
              </div>

              {selectedClass.description && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>About</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>{selectedClass.description}</div>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Teacher</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: 'var(--green)' }}>
                    {selectedClass.teacher?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedClass.teacher?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedClass.teacher?.email}</div>
                  </div>
                </div>
              </div>

              {selectedClass.schedule?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Schedule</div>
                  {selectedClass.schedule.map((s, i) => (
                    <div key={i} style={{ fontSize: 13, padding: '8px', marginBottom: 6, background: 'var(--bg-elevated)', borderRadius: 6 }}>
                      <strong>{s.day}:</strong> {s.startTime} - {s.endTime}
                    </div>
                  ))}
                </div>
              )}

              {selectedClass.materials?.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Materials</div>
                  {selectedClass.materials.map((m, i) => (
                    <a key={i} href={`${API}${m.url}`} target="_blank" rel="noreferrer" style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, padding: '10px 12px', marginBottom: 6, background: 'var(--bg-elevated)', borderRadius: 6, textDecoration: 'none', color: '#3b82f6' }}>
                      <Download size={14} /> {m.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
