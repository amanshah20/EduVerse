import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, BookOpen, Clock, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
const API = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

export default function TeacherClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [form, setForm] = useState({ name: '', subject: '', description: '', schedule: [] });
  const [creating, setCreating] = useState(false);

  const load = () => api.get('/teacher/classes').then(r => setClasses(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name || !form.subject) { toast.error('Name and subject required'); return; }
    setCreating(true);
    try {
      if (editClass) {
        await api.put(`/teacher/classes/${editClass._id}`, form);
        toast.success('Class updated!');
      } else {
        await api.post('/teacher/classes', form);
        toast.success('Class created!');
      }
      setShowCreate(false);
      setForm({ name: '', subject: '', description: '', schedule: [] });
      setEditClass(null);
      load();
    } catch { toast.error('Failed'); } 
    finally { setCreating(false); }
  };

  const deleteClass = async (id) => {
    if (!confirm('Delete this class?')) return;
    try {
      await api.delete(`/teacher/classes/${id}`);
      toast.success('Class deleted');
      load();
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'var(--brand)' }} /></div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>My Classes</h1>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditClass(null); setForm({ name: '', subject: '', description: '', schedule: [] }); setShowCreate(true); }}>
          <Plus size={14} /> Create Class
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="empty" style={{ minHeight: 300 }}><BookOpen className="empty-icon" /><p>No classes yet. Create one to get started!</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {classes.map(cls => (
            <div key={cls._id} className="card card-hover">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{cls.name}</h3>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="badge badge-blue" style={{ fontSize: 11 }}>{cls.subject}</span>
                    <span className="badge badge-gray" style={{ fontSize: 11 }}><Users size={11} style={{ marginRight: 4 }} />{cls.students?.length || 0} students</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditClass(cls); setForm(cls); setShowCreate(true); }}><Edit2 size={13} /></button>
                  <button className="btn btn-ghost btn-danger btn-sm" onClick={() => deleteClass(cls._id)}><Trash2 size={13} /></button>
                </div>
              </div>

              {cls.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>{cls.description}</p>}

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

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => window.location.href = `/teacher/class-details/${cls._id}`}>View Details</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2>{editClass ? 'Edit Class' : 'Create New Class'}</h2>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label className="field-label">Class Name</label>
                <input type="text" placeholder="e.g., Class A" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="field">
                <label className="field-label">Subject</label>
                <input type="text" placeholder="e.g., Mathematics" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
              </div>
              <div className="field">
                <label className="field-label">Description</label>
                <textarea placeholder="Class description..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ minHeight: 80 }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={creating} onClick={save}>
                {creating ? <span className="spinner-sm" style={{ borderTopColor: '#fff' }} /> : <Check size={14} />}
                {editClass ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
