import { useState, useEffect } from 'react';
import { Folder, Users, Calendar, CheckCircle, XCircle, Trash2, Plus, Loader } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function TeacherAttendance() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/teacher/attendance/batches')
      .then(res => setBatches(res.data))
      .catch(() => toast.error('Failed to load batches'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      api.get(`/teacher/attendance/batch/${selectedBatch._id}/classes`)
        .then(res => {
          setClasses(res.data);
          setSelectedClass(null);
        })
        .catch(() => toast.error('Failed to load classes'));
    }
  }, [selectedBatch]);

  useEffect(() => {
    if (selectedBatch) {
      api.get(`/teacher/attendance/batch/${selectedBatch._id}/students`)
        .then(res => {
          setStudents(res.data);
          const att = {};
          res.data.forEach(s => att[s._id] = 'present');
          setAttendance(att);
        })
        .catch(() => toast.error('Failed to load students'));
    }
  }, [selectedBatch]);

  useEffect(() => {
    if (selectedClass) {
      api.get(`/teacher/attendance/class/${selectedClass._id}/date/${selectedDate}`)
        .then(res => {
          const att = {};
          students.forEach(s => {
            const record = res.data.find(r => r.student._id === s._id);
            att[s._id] = record?.status || 'present';
          });
          setAttendance(att);
        })
        .catch(() => {
          const att = {};
          students.forEach(s => att[s._id] = 'present');
          setAttendance(att);
        });
    }
  }, [selectedClass, selectedDate, students]);

  const markAttendance = async () => {
    if (!selectedClass) return toast.error('Select a class');

    setSubmitting(true);
    try {
      const updates = [];
      students.forEach(s => {
        updates.push(
          api.post('/teacher/attendance/mark', {
            studentId: s._id,
            classId: selectedClass._id,
            batchId: selectedBatch._id,
            status: attendance[s._id]
          })
        );
      });

      await Promise.all(updates);
      toast.success('Attendance marked for all students');
      setAttendance({});
    } catch (error) {
      toast.error('Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRecord = async (recordId) => {
    if (!confirm('Delete this attendance record?')) return;
    try {
      await api.delete(`/teacher/attendance/${recordId}`);
      toast.success('Record deleted');
      if (selectedClass) {
        api.get(`/teacher/attendance/class/${selectedClass._id}/date/${selectedDate}`)
          .then(res => {
            const att = {};
            students.forEach(s => {
              const record = res.data.find(r => r.student._id === s._id);
              att[s._id] = record?.status || 'present';
            });
            setAttendance(att);
          });
      }
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'var(--brand)' }} /></div>;

  return (
    <div className="fade-in">
      <h1 style={{ fontSize:24, fontWeight:800, marginBottom:24 }}>Attendance Management</h1>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
        {/* Left: Batch & Class Selection */}
        <div className="card">
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>Select Batch & Class</h3>

          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontWeight:600, fontSize:13, marginBottom:8 }}>Batch</label>
            <select
              value={selectedBatch?._id || ''}
              onChange={(e) => setSelectedBatch(batches.find(b => b._id === e.target.value))}
              style={{
                width:'100%',
                padding:'10px 12px',
                border:'1px solid var(--border-subtle)',
                borderRadius:6,
                fontSize:13,
                fontFamily:'inherit'
              }}
            >
              <option value="">Choose batch...</option>
              {batches.map(b => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.students?.length || 0} students)
                </option>
              ))}
            </select>
          </div>

          {selectedBatch && (
            <>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontWeight:600, fontSize:13, marginBottom:8 }}>Class</label>
                <select
                  value={selectedClass?._id || ''}
                  onChange={(e) => setSelectedClass(classes.find(c => c._id === e.target.value))}
                  style={{
                    width:'100%',
                    padding:'10px 12px',
                    border:'1px solid var(--border-subtle)',
                    borderRadius:6,
                    fontSize:13,
                    fontFamily:'inherit'
                  }}
                >
                  <option value="">Choose class...</option>
                  {classes.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name} - {c.subject}
                    </option>
                  ))}
                </select>
              </div>

              {selectedClass && (
                <div>
                  <label style={{ display:'block', fontWeight:600, fontSize:13, marginBottom:8 }}>Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{
                      width:'100%',
                      padding:'10px 12px',
                      border:'1px solid var(--border-subtle)',
                      borderRadius:6,
                      fontSize:13,
                      fontFamily:'inherit'
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Info */}
        <div className="card">
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>📊 Session Info</h3>
          {selectedBatch ? (
            <>
              <div style={{ marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                <Folder size={16} color="var(--brand)" />
                <span style={{ fontSize:14 }}>
                  <strong>Batch:</strong> {selectedBatch.name}
                </span>
              </div>
              <div style={{ marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                <Users size={16} color="var(--brand)" />
                <span style={{ fontSize:14 }}>
                  <strong>Students:</strong> {students.length}
                </span>
              </div>
              {selectedClass && (
                <>
                  <div style={{ marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:14 }}>
                      <strong>Class:</strong> {selectedClass.name}
                    </span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Calendar size={16} color="var(--brand)" />
                    <span style={{ fontSize:14 }}>
                      <strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}
                    </span>
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={{ color:'var(--text-muted)', fontSize:14 }}>Select a batch to see details</div>
          )}
        </div>
      </div>

      {/* Student Attendance List */}
      {selectedClass && students.length > 0 && (
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h3 style={{ fontSize:16, fontWeight:700 }}>Mark Attendance</h3>
            <button
              onClick={markAttendance}
              disabled={submitting}
              style={{
                padding:'8px 16px',
                background:submitting?'var(--text-muted)':'var(--brand)',
                color:'#fff',
                border:'none',
                borderRadius:6,
                cursor:submitting?'not-allowed':'pointer',
                fontWeight:600,
                fontSize:13,
                display:'flex',
                alignItems:'center',
                gap:6
              }}
            >
              {submitting ? <><Loader size={14} /> Saving...</> : <><CheckCircle size={14} /> Save Attendance</>}
            </button>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {students.map(student => (
              <div key={student._id}
                style={{
                  display:'flex',
                  justifyContent:'space-between',
                  alignItems:'center',
                  padding:12,
                  background:'var(--bg-elevated)',
                  borderRadius:6,
                  border:'1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <div style={{ fontWeight:600, fontSize:14 }}>{student.name}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{student.email}</div>
                </div>

                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <select
                    value={attendance[student._id] || 'present'}
                    onChange={(e) => setAttendance({...attendance, [student._id]: e.target.value})}
                    style={{
                      padding:'6px 10px',
                      border:'1px solid var(--border-subtle)',
                      borderRadius:4,
                      fontSize:12,
                      fontFamily:'inherit',
                      background:'var(--bg-card)'
                    }}
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!selectedClass && selectedBatch && (
        <div className="empty" style={{ minHeight:200 }}>
          <Calendar className="empty-icon" />
          <p>Select a class to mark attendance</p>
        </div>
      )}

      {!selectedBatch && (
        <div className="empty" style={{ minHeight:200 }}>
          <Folder className="empty-icon" />
          <p>Select a batch to get started</p>
        </div>
      )}
    </div>
  );
}
