import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, BarChart2, ShieldCheck, Users, Award, ChevronRight, ArrowRight, Star } from 'lucide-react';

const FEATURES = [
  { icon: BookOpen, title: 'Structured Courses', desc: 'Admin-curated courses with modules, chapters, PDF notes, and video content — all in one place.', color: 'var(--brand)' },
  { icon: Users, title: 'Expert Tutors', desc: 'Browse verified teacher profiles with qualifications, experience, and hourly rates. Hire in one click.', color: 'var(--green)' },
  { icon: BarChart2, title: 'Progress Tracking', desc: 'Real-time attendance tracking, assignment grading, and course completion dashboards.', color: 'var(--purple)' },
  { icon: ShieldCheck, title: 'Secure & Verified', desc: 'OTP-based authentication, admin-controlled access, and end-to-end encrypted credentials.', color: 'var(--cyan)' },
  { icon: Award, title: 'Live Assessments', desc: 'Timed MCQ quizzes, auto-scoring, student rankings, and detailed performance analytics.', color: '#f59e0b' },
  { icon: GraduationCap, title: 'Role-Based Portals', desc: 'Dedicated dashboards for students, teachers, and administrators — each purpose-built.', color: '#ec4899' },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Ambient glows */}
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 900, height: 600, background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', height: 64, borderBottom: '1px solid rgba(59,130,246,0.1)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(248,250,252,0.9)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.3px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EduVerse</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/apply" className="btn btn-ghost btn-sm">Apply</Link>
          <Link to="/login" className="btn btn-primary btn-sm">Sign in <ChevronRight size={14} /></Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 40px 80px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 100, padding: '5px 14px', marginBottom: 28 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#3b82f6', letterSpacing: '0.3px' }}>MODERN LEARNING PLATFORM</span>
        </div>
        <h1 style={{ fontSize: 'clamp(38px, 5.5vw, 68px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 22, color: 'var(--text-primary)' }}>
          Learn, Grow, Excel<br />
          <span style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Your Journey Starts Here</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7 }}>
          Your learning ecosystem with courses, guidance, and real-time progress tracking.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/apply?role=student" className="btn btn-primary btn-lg">
            Get started free <ArrowRight size={16} />
          </Link>
          <Link to="/apply?role=teacher" className="btn btn-ghost btn-lg">
            Join as teacher
          </Link>
        </div>


      </div>

      {/* Features */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 10, color: 'var(--text-primary)' }}>Platform Features</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Comprehensive tools for learning and teaching</p>
        </div>
        <div className="g3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 14, padding: '24px', transition: 'all 160ms' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.15)'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${f.color}12`, border: `1px solid ${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={19} color={f.color} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>{f.title}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div style={{ borderTop: '1px solid rgba(59,130,246,0.1)', padding: '80px 40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 12, color: 'var(--text-primary)' }}>Ready to start your journey?</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 15 }}>Apply today and receive your credentials after admin approval.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/apply?role=student" className="btn btn-primary btn-lg">Apply as Student</Link>
          <Link to="/apply?role=teacher" className="btn btn-ghost btn-lg">Apply as Teacher</Link>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '20px 40px', borderTop: '1px solid rgba(59,130,246,0.1)', fontSize: 12, color: 'var(--text-muted)' }}>
        © 2024 EduVerse · Your Learning Ecosystem
      </div>
    </div>
  );
}
