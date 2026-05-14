import { useState, useEffect } from 'react';
import { BookOpen, Users, Clock, Download, FileText, Loader, Monitor, MapPin, Video, Folder, X } from 'lucide-react';
import api from '../../utils/api';
const API = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

export default function StudentClasses() {
  const [batches, setBatches] = useState([]);
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [batchClasses, setBatchClasses] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/student/batches'),
      api.get('/student/classes')
    ]).then(([batchRes, classRes]) => {
      setBatches(batchRes.data);
      const grouped = {};
      classRes.data.forEach(cls => {
        const batchId = cls.batch?._id || 'no-batch';
        if (!grouped[batchId]) grouped[batchId] = [];
        grouped[batchId].push(cls);
      });
      setBatchClasses(grouped);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor: 'var(--brand)' }} /></div>;

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>My Classes</h1>

      {batches.length === 0 ? (
        <div className="empty" style={{ minHeight: 300 }}><BookOpen className="empty-icon" /><p>No batches yet. Hire a teacher and get approved to see your batches!</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {batches.map(batch => {
            const classes = batchClasses[batch._id] || [];
            return (
              <div key={batch._id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
                <div 
                  onClick={() => setExpandedBatch(expandedBatch === batch._id ? null : batch._id)}
                  style={{ 
                    padding: '16px 20px', 
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--bg-elevated)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
                    <Folder size={20} color="var(--brand)" />
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{batch.name}</h3>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        <Users size={11} style={{ display: 'inline', marginRight: 4 }} />{batch.students?.length || 0} students • {classes.length} {classes.length === 1 ? 'class' : 'classes'}
                      </div>
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    {expandedBatch === batch._id ? '▼' : '▶'}
                  </div>
                </div>

                {expandedBatch === batch._id && (
                  <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)' }}>
                    {classes.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px' }}>
                        No classes in this batch yet
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {classes.map(cls => (
                          <div key={cls._id} className="card" style={{ marginBottom: 0 }}>
                            <div style={{ marginBottom: 12 }}>
                              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{cls.name}</h4>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                                <span className="badge badge-blue" style={{ fontSize: 10 }}>{cls.subject}</span>
                                <span className={`badge ${cls.teachingMode === 'online' ? 'badge-purple' : cls.teachingMode === 'offline' ? 'badge-green' : 'badge-orange'}`} style={{ fontSize: 10 }}>
                                  <Monitor size={10} style={{ marginRight: 3 }} />{cls.teachingMode.charAt(0).toUpperCase() + cls.teachingMode.slice(1)}
                                </span>
                              </div>
                            </div>

                            {cls.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>{cls.description}</p>}

                            {cls.teachingMode !== 'offline' && cls.meetingLink && (
                              <div style={{ marginBottom: 12, padding: '10px 12px', background: 'rgba(59,130,246,0.1)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)' }}>
                                <a href={cls.meetingLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
                                  <Video size={13} /> Join Live Class
                                </a>
                              </div>
                            )}

                            {cls.teacher && (
                              <div style={{ marginBottom: 10, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Teacher</div>
                                <div style={{ fontSize: 12, fontWeight: 600 }}>{cls.teacher.name}</div>
                              </div>
                            )}

                            {cls.schedule && cls.schedule.length > 0 && (
                              <div style={{ marginBottom: 10, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', gap: 4, alignItems: 'center' }}>
                                  <Clock size={11} /> Schedule
                                </div>
                                {cls.schedule.map((s, i) => (
                                  <div key={i} style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: i < cls.schedule.length - 1 ? 4 : 0 }}>
                                    <strong>{s.day}</strong> {s.startTime}-{s.endTime}
                                    {s.room && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>📍 {s.room}</div>}
                                  </div>
                                ))}
                              </div>
                            )}

                            <button className="btn btn-primary btn-sm w-full" onClick={() => setSelectedClass(cls)}>View Details</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedClass && (
        <div className="overlay" onClick={() => setSelectedClass(null)}>
          <div className="modal" style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>{selectedClass.name}</h2>
              <button className="btn btn-ghost" onClick={() => setSelectedClass(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Subject</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedClass.subject}</div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Teaching Mode</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`badge ${selectedClass.teachingMode === 'online' ? 'badge-purple' : selectedClass.teachingMode === 'offline' ? 'badge-green' : 'badge-orange'}`}>
                    <Monitor size={13} style={{ marginRight: 6 }} />{selectedClass.teachingMode?.toUpperCase()}
                  </span>
                </div>
              </div>

              {selectedClass.teachingMode !== 'offline' && selectedClass.meetingLink && (
                <div style={{ marginBottom: 20, padding: '14px 12px', background: 'rgba(59,130,246,0.1)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Video size={14} color="#3b82f6" /> Live Class Link
                  </div>
                  <a href={selectedClass.meetingLink} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: 12, color: '#3b82f6', textDecoration: 'none', wordBreak: 'break-all', fontWeight: 600, padding: '8px 0' }}>
                    {selectedClass.meetingLink}
                  </a>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 8, width: '100%' }} onClick={() => window.open(selectedClass.meetingLink, '_blank')}>
                    <Video size={14} /> Join Live Class
                  </button>
                </div>
              )}

              {selectedClass.description && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>About</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>{selectedClass.description}</div>
                </div>
              )}

              {selectedClass.teacher && (
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
              )}

              {selectedClass.schedule?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Schedule</div>
                  {selectedClass.schedule.map((s, i) => (
                    <div key={i} style={{ fontSize: 13, padding: '8px', marginBottom: 6, background: 'var(--bg-elevated)', borderRadius: 6 }}>
                      <strong>{s.day}:</strong> {s.startTime} - {s.endTime}
                      {s.room && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📍 {s.room}</div>}
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
