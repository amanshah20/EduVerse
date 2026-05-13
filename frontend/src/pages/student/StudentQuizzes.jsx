import { useState, useEffect } from 'react';
import { BrainCircuit, Clock, CheckCircle, AlertCircle, PlayCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function StudentQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('available');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    api.get('/student/quizzes')
      .then(r => setQuizzes(r.data))
      .catch(() => setQuizzes([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedQuiz || !selectedQuiz.duration) return;
    
    const endTime = Date.now() + selectedQuiz.duration * 60000;
    const interval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimer(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [selectedQuiz]);

  const submitQuiz = async () => {
    if (!selectedQuiz) return;
    setSubmitting(true);
    try {
      await api.post(`/student/quizzes/${selectedQuiz._id}/submit`, { answers });
      toast.success('Quiz submitted! Check your results.');
      setSelectedQuiz(null);
      setAnswers({});
      api.get('/student/quizzes').then(r => setQuizzes(r.data));
    } catch { toast.error('Failed to submit quiz'); }
    finally { setSubmitting(false); }
  };

  const formatTime = (ms) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor: 'var(--brand)' }} /></div>;

  const available = quizzes.filter(q => !q.myResult && new Date(q.startDate) <= new Date() && new Date(q.endDate) >= new Date());
  const completed = quizzes.filter(q => q.myResult);
  const list = tab === 'available' ? available : completed;

  return (
    <div className="fade-in">
      <div className="tabs" style={{ maxWidth: 340, marginBottom: 24 }}>
        <button className={`tab-btn ${tab === 'available' ? 'active' : ''}`} onClick={() => setTab('available')}>
          Available <span className="badge badge-blue" style={{ marginLeft: 6, fontSize: 10.5 }}>{available.length}</span>
        </button>
        <button className={`tab-btn ${tab === 'completed' ? 'active' : ''}`} onClick={() => setTab('completed')}>
          Completed <span className="badge badge-green" style={{ marginLeft: 6, fontSize: 10.5 }}>{completed.length}</span>
        </button>
      </div>

      {list.length === 0 ? (
        <div className="empty" style={{ minHeight: 300 }}>
          <BrainCircuit className="empty-icon" />
          <p>{tab === 'available' ? 'No quizzes available right now' : 'You haven\'t completed any quizzes yet'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {list.map(q => (
            <div key={q._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{q.title}</h3>
                  {q.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{q.description}</p>}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
                    <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <BrainCircuit size={13} /> {q.questions?.length || 0} questions
                    </span>
                    {q.duration && <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <Clock size={13} /> {q.duration} min
                    </span>}
                  </div>
                </div>
                {tab === 'completed' && q.myResult && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>{q.myResult.score}/{q.myResult.totalMarks}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{q.myResult.percentage}%</div>
                  </div>
                )}
              </div>

              {tab === 'available' ? (
                <button className="btn btn-primary btn-sm" onClick={() => setSelectedQuiz(q)} style={{ display: 'inline-flex', gap: 6 }}>
                  <PlayCircle size={14} /> Start Quiz
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  {q.myResult?.score > q.myResult?.totalMarks * 0.7 ? (
                    <div className="alert alert-success" style={{ flex: 1, justifyContent: 'center' }}>
                      <CheckCircle size={14} /> Passed!
                    </div>
                  ) : (
                    <div className="alert alert-warning" style={{ flex: 1, justifyContent: 'center' }}>
                      <AlertCircle size={14} /> Needs Improvement
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quiz Modal */}
      {selectedQuiz && (
        <div className="overlay" onClick={() => setSelectedQuiz(null)}>
          <div className="modal" style={{ maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div>
                <h2>{selectedQuiz.title}</h2>
                {timer !== null && (
                  <div style={{ fontSize: 12, color: timer < 300000 ? 'var(--red)' : 'var(--text-muted)', marginTop: 4 }}>
                    Time Remaining: <strong>{formatTime(timer)}</strong>
                  </div>
                )}
              </div>
              <button className="btn btn-ghost" onClick={() => setSelectedQuiz(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {selectedQuiz.questions?.map((q, i) => (
                <div key={i} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: i < selectedQuiz.questions.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                    Q{i + 1}. {q.question}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {q.options?.map((opt, j) => (
                      <label key={j} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', background: answers[i] === j ? 'rgba(59,130,246,0.1)' : 'var(--bg-elevated)', borderRadius: 8, border: answers[i] === j ? '1px solid #3b82f6' : '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'all 160ms' }}>
                        <input type="radio" name={`q${i}`} value={j} checked={answers[i] === j} onChange={() => setAnswers(p => ({ ...p, [i]: j }))} style={{ cursor: 'pointer' }} />
                        <span style={{ fontSize: 13 }}>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedQuiz(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={submitting} onClick={submitQuiz}>
                {submitting ? <span className="spinner-sm" style={{ borderTopColor: '#fff' }} /> : <CheckCircle size={14} />}
                Submit Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
