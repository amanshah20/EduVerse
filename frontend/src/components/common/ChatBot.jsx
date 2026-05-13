import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, Sparkles, RotateCcw, ChevronDown, Bot, User } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const MSG_STYLE_BASE = {
  maxWidth: '82%', padding: '10px 14px', borderRadius: 12, fontSize: 13.5, lineHeight: 1.6, wordBreak: 'break-word'
};

function Md({ text }) {
  // Basic markdown: bold, code, newlines
  const html = text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/`([^`]+)`/g,'<code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12px">$1</code>')
    .replace(/\n/g,'<br/>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function ChatBot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm **EduBot**, your AI learning assistant on **Edu Verse**. I can help you with any subject, explain concepts, assist with assignments, or guide you around the platform. What would you like to learn today?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    api.get('/chatbot/suggestions').then(r => setSuggestions(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = useCallback(async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput('');
    setShowSugg(false);
    const userMsg = { role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const allMsgs = [...messages, userMsg].filter(m => m.role !== 'system');
      const res = await api.post('/chatbot/chat', { messages: allMsgs });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: err.response?.data?.message || 'Sorry, I encountered an error. Please check that the GROQ_API_KEY is configured and try again.' }]);
    } finally { setLoading(false); }
  }, [input, loading, messages]);

  const clear = () => {
    setMessages([{ role: 'assistant', content: `Chat cleared! How can I help you learn today?` }]);
    setShowSugg(true);
  };

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)}
        style={{ position:'fixed', bottom:28, right:28, width:54, height:54, borderRadius:'50%', background:'var(--brand)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(37,99,235,0.5), 0 0 0 0 rgba(37,99,235,0.4)', zIndex:999, transition:'all 200ms', animation: !open ? 'chatPulse 2.5s infinite' : 'none' }}
        onMouseEnter={e => e.currentTarget.style.transform='scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
        {open ? <X size={22} color="#fff" /> : <MessageSquare size={22} color="#fff" />}
        {!open && <div style={{ position:'absolute', top:0, right:0, width:14, height:14, background:'var(--green)', borderRadius:'50%', border:'2px solid var(--bg-base)' }} />}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{ position:'fixed', bottom:96, right:28, width:380, height:580, background:'var(--bg-card)', border:'1px solid var(--border-medium)', borderRadius:20, display:'flex', flexDirection:'column', zIndex:999, boxShadow:'0 20px 60px rgba(0,0,0,0.7)', overflow:'hidden', animation:'slideUp 0.2s ease' }}>
          
          {/* Header */}
          <div style={{ padding:'16px 18px', background:'linear-gradient(135deg,rgba(37,99,235,0.15),rgba(139,92,246,0.08))', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--brand)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 12px rgba(37,99,235,0.4)' }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14.5, letterSpacing:'-0.2px' }}>EduBot AI</div>
              <div style={{ fontSize:11.5, color:'var(--green)', display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)' }} /> Online · Powered by Groq
              </div>
            </div>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={clear} style={{ padding:6, borderRadius:6, background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', transition:'all 160ms' }}
                onMouseEnter={e=>e.currentTarget.style.color='var(--text-primary)'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
                <RotateCcw size={14} />
              </button>
              <button onClick={() => setOpen(false)} style={{ padding:6, borderRadius:6, background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', transition:'all 160ms' }}
                onMouseEnter={e=>e.currentTarget.style.color='var(--text-primary)'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'16px 14px', display:'flex', flexDirection:'column', gap:12 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-end', flexDirection: msg.role==='user' ? 'row-reverse' : 'row' }}>
                <div style={{ width:26, height:26, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: msg.role==='user' ? 'rgba(37,99,235,0.15)' : 'rgba(139,92,246,0.15)', border:`1px solid ${msg.role==='user' ? 'rgba(37,99,235,0.2)' : 'rgba(139,92,246,0.2)'}` }}>
                  {msg.role==='user' ? <User size={13} color="var(--brand-light)" /> : <Bot size={13} color="var(--purple)" />}
                </div>
                <div style={{ ...MSG_STYLE_BASE, background: msg.role==='user' ? 'var(--brand)' : 'var(--bg-elevated)', color: msg.role==='user' ? '#fff' : 'var(--text-primary)', borderBottomRightRadius: msg.role==='user' ? 4 : 12, borderBottomLeftRadius: msg.role==='user' ? 12 : 4, border: msg.role==='user' ? 'none' : '1px solid var(--border-subtle)' }}>
                  <Md text={msg.content} />
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                <div style={{ width:26, height:26, borderRadius:'50%', background:'rgba(139,92,246,0.15)', border:'1px solid rgba(139,92,246,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Bot size={13} color="var(--purple)" />
                </div>
                <div style={{ ...MSG_STYLE_BASE, background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', borderBottomLeftRadius:4 }}>
                  <div style={{ display:'flex', gap:4, alignItems:'center', padding:'2px 0' }}>
                    {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--text-muted)', animation:`pulse 1.2s infinite ${i*0.2}s` }} />)}
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {showSugg && suggestions.length > 0 && messages.length <= 1 && (
              <div style={{ marginTop:4 }}>
                <div style={{ fontSize:11.5, color:'var(--text-muted)', marginBottom:8, textAlign:'center' }}>Suggested questions</div>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {suggestions.slice(0,4).map((s,i) => (
                    <button key={i} onClick={() => send(s)}
                      style={{ padding:'8px 12px', borderRadius:8, background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', color:'var(--text-secondary)', fontSize:12.5, textAlign:'left', cursor:'pointer', transition:'all 160ms', lineHeight:1.4 }}
                      onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--border-medium)'; e.currentTarget.style.color='var(--text-primary)'; }}
                      onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border-subtle)'; e.currentTarget.style.color='var(--text-secondary)'; }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding:'12px 14px', borderTop:'1px solid var(--border-subtle)', background:'var(--bg-elevated)' }}>
            <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
              <textarea ref={inputRef} rows={1} value={input}
                onChange={e => { setInput(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,100)+'px'; }}
                onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask anything…"
                style={{ flex:1, resize:'none', background:'var(--bg-input)', border:'1px solid var(--border-default)', borderRadius:10, padding:'9px 12px', fontSize:13.5, color:'var(--text-primary)', outline:'none', minHeight:38, maxHeight:100, lineHeight:1.5, fontFamily:'inherit', transition:'border-color 160ms' }}
                onFocus={e=>e.target.style.borderColor='var(--brand)'}
                onBlur={e=>e.target.style.borderColor='var(--border-default)'}
              />
              <button onClick={() => send()} disabled={!input.trim()||loading}
                style={{ width:38, height:38, borderRadius:10, background: input.trim()&&!loading ? 'var(--brand)' : 'var(--bg-highlight)', border:'none', cursor: input.trim()&&!loading ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 160ms' }}>
                {loading ? <span className="spinner-sm" style={{ width:14,height:14,borderTopColor: input.trim()?'#fff':'var(--text-muted)' }} /> : <Send size={15} color={input.trim()&&!loading?'#fff':'var(--text-muted)'} />}
              </button>
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center', marginTop:7 }}>Powered by Groq LLaMA 3 · Shift+Enter for newline</div>
          </div>
        </div>
      )}

      <style>{`@keyframes chatPulse{0%,100%{box-shadow:0 4px 20px rgba(37,99,235,0.5),0 0 0 0 rgba(37,99,235,0.4)}70%{box-shadow:0 4px 20px rgba(37,99,235,0.5),0 0 0 10px rgba(37,99,235,0)}}`}</style>
    </>
  );
}
