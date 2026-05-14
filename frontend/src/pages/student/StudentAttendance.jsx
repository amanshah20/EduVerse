import { useState, useEffect, useRef } from 'react';
import { BarChart2, CheckCircle, XCircle, Clock, AlertTriangle, Camera, MapPin, QrCode, Loader } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function StudentAttendance() {
  const [tab, setTab] = useState('stats'); // stats, mark
  const [data, setData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  // Marking form state
  const [selectedClass, setSelectedClass] = useState(null);
  const [markMethod, setMarkMethod] = useState('face'); // face, geo, qr, manual
  const [faceImage, setFaceImage] = useState(null);
  const [geoLocation, setGeoLocation] = useState(null);
  const [qrData, setQrData] = useState('');
  const cameraRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get('/student/attendance'),
      api.get('/student/attendance/classes')
    ]).then(([dataRes, classesRes]) => {
      setData(dataRes.data);
      setClasses(classesRes.data);
    }).catch(err => toast.error('Failed to load data')).finally(() => setLoading(false));
  }, []);

  // Face Recognition - Start Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast.error('Cannot access camera');
    }
  };

  // Face Recognition - Capture Image
  const captureFrame = () => {
    if (videoRef.current && cameraRef.current) {
      const canvas = cameraRef.current;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/png');
      setFaceImage(imageData);
      stopCamera();
      toast.success('Face captured');
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  // Geolocation - Get Current Location
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          toast.success('Location captured');
        },
        () => toast.error('Cannot access location')
      );
    } else {
      toast.error('Geolocation not supported');
    }
  };

  // Mark Attendance
  const markAttendance = async () => {
    if (!selectedClass) return toast.error('Select a class');
    if (!selectedClass.batch?.attendanceActive) return toast.error('Attendance not yet enabled by teacher');

    // Validate marking method requirements
    if (markMethod === 'face' && !faceImage) return toast.error('Please capture your face');
    if (markMethod === 'geo' && !geoLocation) return toast.error('Please capture your location');
    if (markMethod === 'qr' && !qrData) return toast.error('Please scan or enter QR code');

    setMarking(true);
    try {
      let payload = {
        classId: selectedClass._id,
        batchId: selectedClass.batch._id,
        method: markMethod === 'geo' ? 'geolocation' : markMethod
      };

      if (markMethod === 'face' && faceImage) {
        payload.faceImageUrl = faceImage;
      } else if (markMethod === 'geo' && geoLocation) {
        payload.latitude = geoLocation.latitude;
        payload.longitude = geoLocation.longitude;
        payload.accuracy = geoLocation.accuracy;
      } else if (markMethod === 'qr' && qrData) {
        payload.qrData = qrData;
      }

      const endpoint = markMethod === 'face' ? '/student/attendance/mark-face'
                     : markMethod === 'geo' ? '/student/attendance/mark-geolocation'
                     : markMethod === 'qr' ? '/student/attendance/mark-qr'
                     : null;

      if (!endpoint) return toast.error('Invalid marking method');

      await api.post(endpoint, payload);
      toast.success('Attendance marked successfully!');
      
      // Reset form
      setSelectedClass(null);
      setFaceImage(null);
      setGeoLocation(null);
      setQrData('');
      setMarkMethod('face');
      setTab('stats');
      
      // Refresh data
      const res = await api.get('/student/attendance');
      setData(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <div className="loading-page"><span className="spinner spinner-lg" style={{ borderTopColor:'var(--brand)' }} /></div>;

  const { records=[], bySubject={}, overall={} } = data||{};
  const pct = overall.percentage||0;
  const low = pct < 75 && overall.total > 0;

  return (
    <div className="fade-in">
      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:24, borderBottom:'1px solid var(--border-subtle)', paddingBottom:0 }}>
        {[
          { id:'stats', label:'📊 Statistics' },
          { id:'mark', label:'✓ Mark Attendance' }
        ].map(t => (
          <button key={t.id}
            onClick={() => { setTab(t.id); if(t.id==='mark') startCamera(); else stopCamera(); }}
            style={{
              padding:'12px 20px',
              border:'none',
              background:'none',
              cursor:'pointer',
              fontWeight:tab===t.id?600:400,
              color:tab===t.id?'var(--brand)':'var(--text-muted)',
              borderBottom:tab===t.id?'2px solid var(--brand)':'none',
              fontSize:14
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* STATS TAB */}
      {tab==='stats' && (
        <>
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
                        <span><CheckCircle size={11} style={{ display:'inline', marginRight:4 }} />{counts.present} present</span>
                        <span><XCircle size={11} style={{ display:'inline', marginRight:4 }} />{counts.absent} absent</span>
                        {counts.late>0 && <span><Clock size={11} style={{ display:'inline', marginRight:4 }} />{counts.late} late</span>}
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
        </>
      )}

      {/* MARK ATTENDANCE TAB */}
      {tab==='mark' && (
        <div className="card">
          <h2 style={{ fontSize:18, fontWeight:700, marginBottom:24 }}>Mark Your Attendance</h2>

          {/* Select Class */}
          <div style={{ marginBottom:24 }}>
            <label style={{ display:'block', fontWeight:600, marginBottom:8, fontSize:14 }}>Select Class</label>
            <select
              value={selectedClass?._id || ''}
              onChange={(e) => setSelectedClass(classes.find(c => c._id === e.target.value))}
              style={{
                width:'100%',
                padding:'10px 12px',
                border:'1px solid var(--border-subtle)',
                borderRadius:8,
                fontSize:14,
                fontFamily:'inherit'
              }}
            >
              <option value="">Choose a class...</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} - {cls.subject} ({cls.batch?.name})
                </option>
              ))}
            </select>
          </div>

          {selectedClass && (
            <>
              {/* Attendance Status Check */}
              {!selectedClass.batch?.attendanceActive ? (
                <div style={{
                  marginBottom: 20,
                  padding: 16,
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center'
                }}>
                  <AlertTriangle size={20} color="#ef4444" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>Attendance Not Yet Enabled</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Your teacher hasn't opened attendance marking for this batch yet. Please wait for them to enable it.</div>
                  </div>
                </div>
              ) : (
                <div style={{
                  marginBottom: 20,
                  padding: 16,
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 8,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center'
                }}>
                  <CheckCircle size={20} color="#10b981" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#10b981', marginBottom: 4 }}>✓ Attendance Enabled</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>You can mark your attendance now using face recognition, geolocation, or QR code.</div>
                  </div>
                </div>
              )}

              {selectedClass.batch?.attendanceActive && (
                <>
                  {/* Marking Methods */}
                  <div style={{ marginBottom:24 }}>
                    <label style={{ display:'block', fontWeight:600, marginBottom:12, fontSize:14 }}>Choose Marking Method</label>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:12 }}>
                      {[
                        { id:'face', label:'Face Recognition', icon:Camera },
                        { id:'geo', label:'Geolocation', icon:MapPin },
                        { id:'qr', label:'QR Code', icon:QrCode }
                      ].map(m => (
                        <button key={m.id}
                          onClick={() => setMarkMethod(m.id)}
                          style={{
                            padding:12,
                            border:markMethod===m.id?'2px solid var(--brand)':'1px solid var(--border-subtle)',
                            borderRadius:8,
                            background:markMethod===m.id?'rgba(59,130,246,0.05)':'transparent',
                            cursor:'pointer',
                            display:'flex',
                            flexDirection:'column',
                            alignItems:'center',
                            gap:8,
                            fontSize:13,
                            fontWeight:500,
                            transition:'all 0.2s'
                          }}
                        >
                          <m.icon size={24} color={markMethod===m.id?'var(--brand)':'var(--text-muted)'} />
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Face Recognition */}
                  {markMethod === 'face' && (
                    <div style={{ marginBottom:24 }}>
                      <label style={{ display:'block', fontWeight:600, marginBottom:12, fontSize:14 }}>📸 Face Recognition</label>
                      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                        <div style={{ position:'relative', background:'#000', borderRadius:8, overflow:'hidden', aspectRatio:'16/9' }}>
                          <video ref={videoRef} autoPlay playsInline style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          <canvas ref={cameraRef} width={640} height={480} style={{ display:'none' }} />
                        </div>
                        <div style={{ display:'flex', gap:8 }}>
                          <button onClick={startCamera} style={{ flex:1, padding:'10px 16px', background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', borderRadius:6, cursor:'pointer', fontWeight:500 }}>Start Camera</button>
                          <button onClick={captureFrame} style={{ flex:1, padding:'10px 16px', background:'var(--brand)', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:500 }}>Capture Face</button>
                          <button onClick={stopCamera} style={{ flex:1, padding:'10px 16px', background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', borderRadius:6, cursor:'pointer', fontWeight:500 }}>Stop</button>
                        </div>
                        {faceImage && <div style={{ fontSize:12, color:'var(--green)', fontWeight:500 }}>✓ Face captured and ready</div>}
                      </div>
                    </div>
                  )}

                  {/* Geolocation */}
                  {markMethod === 'geo' && (
                    <div style={{ marginBottom:24 }}>
                      <label style={{ display:'block', fontWeight:600, marginBottom:12, fontSize:14 }}>📍 Geolocation</label>
                      <button onClick={getLocation} style={{ width:'100%', padding:'12px 16px', background:'var(--brand)', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:500, fontSize:14 }}>Get My Location</button>
                      {geoLocation && (
                        <div style={{ marginTop:12, padding:12, background:'var(--bg-elevated)', borderRadius:6, fontSize:13 }}>
                          <div>📍 Latitude: {geoLocation.latitude.toFixed(4)}</div>
                          <div>📍 Longitude: {geoLocation.longitude.toFixed(4)}</div>
                          <div>📊 Accuracy: ±{geoLocation.accuracy.toFixed(0)}m</div>
                          <div style={{ color:'var(--green)', fontWeight:500, marginTop:8 }}>✓ Location captured</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* QR Code */}
                  {markMethod === 'qr' && (
                    <div style={{ marginBottom:24 }}>
                      <label style={{ display:'block', fontWeight:600, marginBottom:12, fontSize:14 }}>🔲 QR Code</label>
                      <input
                        type="text"
                        value={qrData}
                        onChange={(e) => setQrData(e.target.value)}
                        placeholder="Scan QR code or enter code here..."
                        style={{
                          width:'100%',
                          padding:'10px 12px',
                          border:'1px solid var(--border-subtle)',
                          borderRadius:6,
                          fontSize:14,
                          fontFamily:'monospace'
                        }}
                        autoFocus
                      />
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={markAttendance}
                    disabled={marking}
                    style={{
                      width:'100%',
                      padding:'12px 16px',
                      background:marking?'var(--text-muted)':'var(--brand)',
                      color:'#fff',
                      border:'none',
                      borderRadius:6,
                      cursor:marking?'not-allowed':'pointer',
                      fontWeight:600,
                      fontSize:14,
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      gap:8
                    }}
                  >
                    {marking ? <><Loader size={16} style={{ animation:'spin 1s linear infinite' }} /> Marking...</> : '✓ Mark Attendance'}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
