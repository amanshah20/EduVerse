import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, BookOpen, Clock, X, Check, Monitor, MapPin, Folder, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
const API = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

export default function TeacherClasses() {
  const [batches, setBatches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('batches'); // 'batches' or 'classes'
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [editBatch, setEditBatch] = useState(null);
  const [editClass, setEditClass] = useState(null);
  const [batchForm, setBatchForm] = useState({ name: '', description: '', students: [] });
  const [classForm, setClassForm] = useState({ name: '', subject: '', description: '', batch: '', teachingMode: 'online', meetingLink: '', students: [], schedule: [] });
  const [creating, setCreating] = useState(false);

  const load = () => Promise.all([
    api.get('/teacher/batches'),
    api.get('/teacher/classes'),
    api.get('/teacher/students')
  ]).then(([batchRes, classRes, studRes]) => {
    setBatches(batchRes.data);
    setClasses(classRes.data);
    setApprovedStudents(studRes.data || []);
  }).finally(() => setLoading(false));
  
  useEffect(() => { load(); }, []);

  const saveBatch = async (e) => {
    e.preventDefault();
    if (!batchForm.name) { toast.error('Batch name required'); return; }
    setCreating(true);
    try {
      if (editBatch) {
        await api.put(`/teacher/batches/${editBatch._id}`, batchForm);
        toast.success('Batch updated!');
      } else {
        await api.post('/teacher/batches', batchForm);
        toast.success('Batch created!');
      }
      setShowCreateBatch(false);
      setBatchForm({ name: '', description: '', students: [] });
      setEditBatch(null);
      load();
    } catch (error) { 
      toast.error(error.response?.data?.message || error.message || 'Failed to create batch');
      console.error('Batch creation error:', error.response?.data || error);
    } 
    finally { setCreating(false); }
  };

  const saveClass = async (e) => {
    e.preventDefault();
    if (!classForm.name || !classForm.subject || !classForm.batch) { 
      toast.error('Class name, subject, and batch required'); return; 
    }
    setCreating(true);
    try {
      if (editClass) {
        await api.put(`/teacher/classes/${editClass._id}`, classForm);
        toast.success('Class updated!');
      } else {
        await api.post('/teacher/classes', classForm);
        toast.success('Class created!');
      }
      setShowCreateClass(false);
      setClassForm({ name: '', subject: '', description: '', batch: '', teachingMode: 'online', meetingLink: '', students: [], schedule: [] });
      setEditClass(null);
      load();
    } catch (error) { 
      toast.error(error.response?.data?.message || error.message || 'Failed to create class');
      console.error('Class creation error:', error.response?.data || error);
    } 
    finally { setCreating(false); }
  };

  const deleteBatch = async (id) => {
    if (!confirm('Delete this batch?')) return;
    try {
      await api.delete(`/teacher/batches/${id}`);
      toast.success('Batch deleted');
      load();
    } catch { toast.error('Failed'); }
  };

  const deleteClass = async (id) => {
    if (!confirm('Delete this class?')) return;
    try {
      await api.delete(`/teacher/classes/${id}`);
      toast.success('Class deleted');
      load();
    } catch { toast.error('Failed'); }
  };

  const passAttendance = async (batchId) => {
    try {
      await api.post(`/teacher/batches/${batchId}/pass-attendance`, { durationMinutes: 30 });
      toast.success('Attendance enabled for 30 minutes!');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to enable attendance');
    }
  };

  const stopAttendance = async (batchId) => {
    try {
      await api.post(`/teacher/batches/${batchId}/stop-attendance`, {});
      toast.success('Attendance disabled');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to disable attendance');
    }
  };

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'var(--brand)' }} /></div>;

  return (
    <div className="fade-in">
      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className={`btn ${activeTab === 'batches' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('batches')}
          >
            <Folder size={14} /> Create Batch
          </button>
          <button 
            className={`btn ${activeTab === 'classes' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('classes')}
          >
            <BookOpen size={14} /> Create Class
          </button>
        </div>
        <button 
          className="btn btn-primary btn-sm" 
          onClick={() => activeTab === 'batches' ? setShowCreateBatch(true) : setShowCreateClass(true)}
        >
          <Plus size={14} /> {activeTab === 'batches' ? 'New Batch' : 'New Class'}
        </button>
      </div>

      {/* ===== BATCHES TAB ===== */}
      {activeTab === 'batches' && (
        <>
          {batches.length === 0 ? (
            <div className="empty" style={{ minHeight: 300 }}><Folder className="empty-icon" /><p>No batches yet. Create one to organize your students!</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {batches.map(batch => (
                <div key={batch._id} className="card card-hover">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{batch.name}</h3>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="badge badge-blue" style={{ fontSize: 11 }}><Users size={11} style={{ marginRight: 4 }} />{batch.students?.length || 0} students</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { 
                        setEditBatch(batch); 
                        setBatchForm({
                          ...batch,
                          students: (batch.students || []).map(s => typeof s === 'object' ? s._id : s)
                        }); 
                        setShowCreateBatch(true); 
                      }}><Edit2 size={13} /></button>
                      <button className="btn btn-ghost btn-danger btn-sm" onClick={() => deleteBatch(batch._id)}><Trash2 size={13} /></button>
                    </div>
                  </div>

                  {batch.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>{batch.description}</p>}

                  {/* Attendance Status */}
                  <div style={{ marginBottom: 12, padding: '10px 12px', background: batch.attendanceActive ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)', borderRadius: 8, border: `1px solid ${batch.attendanceActive ? 'rgba(16,185,129,0.3)' : 'rgba(107,114,128,0.3)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} color={batch.attendanceActive ? '#10b981' : '#6b7280'} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: batch.attendanceActive ? '#10b981' : '#6b7280' }}>
                          {batch.attendanceActive ? '✓ Attendance Active' : '○ Attendance Inactive'}
                        </span>
                      </div>
                      {batch.attendanceActive && batch.attendanceEndTime && (
                        <span style={{ fontSize: 11, color: '#10b981', fontWeight: 500 }}>
                          Ends: {new Date(batch.attendanceEndTime).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {batch.attendanceActive ? (
                        <button 
                          onClick={() => stopAttendance(batch._id)}
                          style={{
                            flex: 1,
                            padding: '6px 12px',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Stop Attendance
                        </button>
                      ) : (
                        <button 
                          onClick={() => passAttendance(batch._id)}
                          style={{
                            flex: 1,
                            padding: '6px 12px',
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Pass Attendance
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Students in this batch:</div>
                    {batch.students && batch.students.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {batch.students.slice(0, 3).map((student, i) => (
                          <div key={i} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            • {typeof student === 'object' ? student.name : student}
                          </div>
                        ))}
                        {batch.students.length > 3 && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            +{batch.students.length - 3} more students
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No students added yet</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create/Edit Batch Modal */}
          {showCreateBatch && (
            <div className="overlay" onClick={e => e.target === e.currentTarget && setShowCreateBatch(false)}>
              <div className="modal" style={{ maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header">
                  <h2>{editBatch ? 'Edit Batch' : 'Create New Batch'}</h2>
                  <button className="btn btn-ghost" onClick={() => setShowCreateBatch(false)}><X size={18} /></button>
                </div>
                <form onSubmit={saveBatch}>
                  <div className="modal-body">
                    <div className="field">
                      <label className="field-label">Batch Name *</label>
                      <input type="text" placeholder="e.g., Class 10-A" value={batchForm.name} onChange={e => setBatchForm(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label className="field-label">Description</label>
                      <textarea placeholder="Batch description..." value={batchForm.description} onChange={e => setBatchForm(p => ({ ...p, description: e.target.value }))} style={{ minHeight: 80 }} />
                    </div>
                    <div className="field">
                      <label className="field-label">Add Students to Batch ({batchForm.students?.length || 0}/{approvedStudents.length})</label>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>Select students for this batch</p>
                      {approvedStudents.length === 0 ? (
                        <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 6, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                          No approved students yet
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 250, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 10 }}>
                          {approvedStudents.map(student => (
                            <label key={student._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', cursor: 'pointer', borderRadius: 6, background: batchForm.students?.includes(student._id) ? 'rgba(59,130,246,0.1)' : 'transparent' }}>
                              <input
                                type="checkbox"
                                checked={batchForm.students?.includes(student._id) || false}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setBatchForm(p => ({ ...p, students: [...(p.students || []), student._id] }));
                                  } else {
                                    setBatchForm(p => ({ ...p, students: (p.students || []).filter(id => id !== student._id) }));
                                  }
                                }}
                                style={{ width: 16, height: 16, cursor: 'pointer' }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{student.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', wordBreak: 'break-all' }}>{student.email}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-ghost" onClick={() => setShowCreateBatch(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={creating}>
                      {creating ? <span className="spinner-sm" style={{ borderTopColor: '#fff' }} /> : <Check size={14} />}
                      {editBatch ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== CLASSES TAB ===== */}
      {activeTab === 'classes' && (
        <>
          {classes.length === 0 ? (
            <div className="empty" style={{ minHeight: 300 }}><BookOpen className="empty-icon" /><p>No classes yet. Create batches first, then add classes!</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {classes.map(cls => (
                <div key={cls._id} className="card card-hover">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{cls.name}</h3>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="badge badge-blue" style={{ fontSize: 11 }}>{cls.subject}</span>
                        {cls.batch && <span className="badge badge-gray" style={{ fontSize: 11 }}>📁 {cls.batch.name}</span>}
                        <span className={`badge ${cls.teachingMode === 'online' ? 'badge-purple' : cls.teachingMode === 'offline' ? 'badge-green' : 'badge-orange'}`} style={{ fontSize: 11 }}>
                          <Monitor size={11} style={{ marginRight: 4 }} />{cls.teachingMode.toUpperCase()}
                        </span>
                        <span className="badge badge-gray" style={{ fontSize: 11 }}><Users size={11} style={{ marginRight: 4 }} />{cls.students?.length || 0}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { 
                        setEditClass(cls); 
                        setClassForm({
                          ...cls,
                          batch: cls.batch?._id || '',
                          students: (cls.students || []).map(s => typeof s === 'object' ? s._id : s)
                        }); 
                        setShowCreateClass(true); 
                      }}><Edit2 size={13} /></button>
                      <button className="btn btn-ghost btn-danger btn-sm" onClick={() => deleteClass(cls._id)}><Trash2 size={13} /></button>
                    </div>
                  </div>

                  {cls.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>{cls.description}</p>}

                  {cls.teachingMode !== 'offline' && cls.meetingLink && (
                    <div style={{ marginBottom: 12, padding: '10px 12px', background: 'rgba(59,130,246,0.1)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)' }}>
                      <a href={cls.meetingLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
                        🎥 Join Class
                      </a>
                    </div>
                  )}

                  {cls.schedule?.length > 0 && (
                    <div style={{ marginBottom: 12, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Clock size={13} /> Schedule
                      </div>
                      {cls.schedule.map((s, i) => (
                        <div key={i} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: i < cls.schedule.length - 1 ? 4 : 0 }}>
                          {s.day}: {s.startTime} - {s.endTime} {s.room && `(${s.room})`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Create/Edit Class Modal */}
          {showCreateClass && (
            <div className="overlay" onClick={e => e.target === e.currentTarget && setShowCreateClass(false)}>
              <div className="modal" style={{ maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header">
                  <h2>{editClass ? 'Edit Class' : 'Create New Class'}</h2>
                  <button className="btn btn-ghost" onClick={() => setShowCreateClass(false)}><X size={18} /></button>
                </div>
                <form onSubmit={saveClass}>
                  <div className="modal-body">
                    <div className="field">
                      <label className="field-label">Select Batch *</label>
                      <select value={classForm.batch} onChange={e => setClassForm(p => ({ ...p, batch: e.target.value }))}>
                        <option value="">Choose a batch...</option>
                        {batches.map(b => (
                          <option key={b._id} value={b._id}>{b.name}</option>
                        ))}
                      </select>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>This class will be for students in the selected batch</p>
                    </div>
                    <div className="field">
                      <label className="field-label">Class Name *</label>
                      <input type="text" placeholder="e.g., Monday Session" value={classForm.name} onChange={e => setClassForm(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label className="field-label">Subject *</label>
                      <input type="text" placeholder="e.g., Mathematics" value={classForm.subject} onChange={e => setClassForm(p => ({ ...p, subject: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label className="field-label">Description</label>
                      <textarea placeholder="Class description..." value={classForm.description} onChange={e => setClassForm(p => ({ ...p, description: e.target.value }))} style={{ minHeight: 80 }} />
                    </div>
                    <div className="field">
                      <label className="field-label">Teaching Mode *</label>
                      <select value={classForm.teachingMode} onChange={e => setClassForm(p => ({ ...p, teachingMode: e.target.value }))}>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                        <option value="hybrid">Hybrid (Online + Offline)</option>
                      </select>
                    </div>
                    {classForm.teachingMode !== 'offline' && (
                      <div className="field">
                        <label className="field-label">Google Meet/Meeting Link</label>
                        <input 
                          type="url" 
                          placeholder="https://meet.google.com/..." 
                          value={classForm.meetingLink} 
                          onChange={e => setClassForm(p => ({ ...p, meetingLink: e.target.value }))} 
                        />
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Students can join via this link</p>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-ghost" onClick={() => setShowCreateClass(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={creating}>
                      {creating ? <span className="spinner-sm" style={{ borderTopColor: '#fff' }} /> : <Check size={14} />}
                      {editClass ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
