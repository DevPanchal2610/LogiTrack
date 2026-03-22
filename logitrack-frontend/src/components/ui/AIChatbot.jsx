import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Minimize2, Loader } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { shipmentApi, adminApi } from '../../services/api'
import api from '../../services/api'

async function askBackend(message, history) {
  const res = await api.post('/chat/message', { message, history })
  return res.data.data
}

// ── Shipment data fetcher ─────────────────────────────────────
async function fetchShipmentContext(isAdmin) {
  try {
    const res = isAdmin
      ? await adminApi.getAllShipments()
      : await shipmentApi.getMine()
    return res.data.data || []
  } catch {
    return []
  }
}

// ── Build system prompt with live shipment data ───────────────
function buildSystemPrompt(user, shipments) {
  const role = user?.role?.toLowerCase() || 'user'
  const name = user?.fullName || 'User'

  const shipmentSummary = shipments.length === 0
    ? 'No shipments found.'
    : shipments.map(s => [
        `- Tracking: ${s.trackingNumber}`,
        `  Description: ${s.description}`,
        `  Status: ${s.currentStatus}`,
        `  From: ${s.originAddress}`,
        `  To: ${s.destinationAddress}`,
        `  Customer: ${s.customerName} (${s.customerEmail})`,
        `  Vendor: ${s.vendorName}`,
        `  Created: ${new Date(s.createdAt).toLocaleDateString()}`,
        s.estimatedDelivery ? `  Est. Delivery: ${new Date(s.estimatedDelivery).toLocaleDateString()}` : '',
        s.actualDelivery    ? `  Actual Delivery: ${new Date(s.actualDelivery).toLocaleDateString()}` : '',
        s.statusHistory?.length
          ? `  Last Update: ${s.statusHistory.at(-1).status} at ${s.statusHistory.at(-1).location}`
          : '',
      ].filter(Boolean).join('\n')).join('\n\n')

  return `You are LogiBot, a friendly and helpful AI assistant for LogiTrack — a shipment and supply chain tracking platform.

You are speaking with ${name}, who is logged in as a ${role}.

CURRENT SHIPMENT DATA FOR THIS USER:
${shipmentSummary}

YOUR CAPABILITIES:
- Answer questions about specific shipments using the data above
- Explain shipment statuses (CREATED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED_DELIVERY, RETURNED, CANCELLED)
- Help users understand the platform (how to create shipments, update status, track packages)
- Give estimated delivery advice based on current status
- Suggest next steps when there are issues (FAILED_DELIVERY, RETURNED etc.)

RULES:
- Keep responses concise and friendly — 2-4 sentences max unless more detail is needed
- If asked about a specific tracking number, find it in the data above and give accurate info
- Never make up tracking numbers or shipment data not in the list above
- If you don't have data for something, say so honestly
- Always address the user by their first name (${name.split(' ')[0]})
- Format tracking numbers in backticks like \`LGT-XXXXXX\``
}

// ── Message bubble ────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isBot = msg.role === 'assistant'
  return (
    <div style={{
      display: 'flex',
      flexDirection: isBot ? 'row' : 'row-reverse',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 14,
    }}>
      {/* Avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: isBot ? '#0f4539' : '#0e5484',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isBot ? <Bot size={14} color="#fff" /> : <User size={14} color="#fff" />}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '80%',
        background: isBot ? '#f3f4f6' : '#0f4539',
        color: isBot ? '#111827' : '#fff',
        borderRadius: isBot ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
        padding: '10px 13px',
        fontSize: 13.5,
        lineHeight: 1.55,
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
      </div>
    </div>
  )
}

// ── Typing indicator ──────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:14 }}>
      <div style={{
        width:28, height:28, borderRadius:'50%', background:'#0f4539',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
      }}>
        <Bot size={14} color="#fff" />
      </div>
      <div style={{
        background:'#f3f4f6', borderRadius:'4px 12px 12px 12px',
        padding:'12px 16px', display:'flex', gap:4, alignItems:'center',
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:6, height:6, borderRadius:'50%', background:'#9ca3af',
            animation: 'bounce 1.2s infinite',
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  )
}

// ── Suggested prompts ─────────────────────────────────────────
const SUGGESTIONS = {
  ADMIN:    ['Show me all shipments', 'Any failed deliveries?', 'How many are in transit?'],
  VENDOR:   ['Status of my shipments', 'Any issues I should know about?', 'Which shipments are pending?'],
  CUSTOMER: ['Where is my package?', 'When will my shipment arrive?', 'What does IN_TRANSIT mean?'],
}

// ── Main Chatbot Component ────────────────────────────────────
export default function AIChatbot() {
  const { user, isAdmin } = useAuth()
  const [open, setOpen]       = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages]   = useState([])
  const [input, setInput]         = useState('')
  const [typing, setTyping]       = useState(false)
  const [shipments, setShipments] = useState([])
  const [loaded, setLoaded]       = useState(false)
  const bottomRef = useRef()
  const inputRef  = useRef()

  // Load shipments once when chat opens
  useEffect(() => {
    if (open && !loaded) {
      fetchShipmentContext(isAdmin).then(data => {
        setShipments(data)
        setLoaded(true)
        // Greeting message
        const firstName = user?.fullName?.split(' ')[0] || 'there'
        setMessages([{
          role: 'assistant',
          content: `Hi ${firstName}! 👋 I'm LogiBot, your AI assistant for LogiTrack.\n\nI can see your shipment data and answer questions about tracking, delivery status, or how to use the platform. What can I help you with?`,
        }])
      })
    }
  }, [open, loaded, isAdmin, user])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // Focus input when opened
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, minimized])

  const send = async (text) => {
    const content = (text || input).trim()
    if (!content || typing) return
    setInput('')

    const newMessages = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setTyping(true)

    try {
          const history = messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          }))
          const reply = await askBackend(content, history)
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I ran into an issue. Please try again in a moment.',
      }])
    } finally {
      setTyping(false)
    }
  }

  const suggestions = SUGGESTIONS[user?.role] || SUGGESTIONS.CUSTOMER
  const hasMessages = messages.length > 0

  return (
    <>
      {/* Bounce animation for typing dots */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes chatSlideIn {
          from { opacity:0; transform: translateY(16px) scale(.96); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
            width: 52, height: 52, borderRadius: '50%',
            background: '#0f4539', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(15,69,57,.4)',
            transition: 'transform .2s, box-shadow .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(15,69,57,.5)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,69,57,.4)' }}
          title="Chat with LogiBot"
        >
          <MessageCircle size={22} color="#fff" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 360, borderRadius: 16,
          background: '#fff', boxShadow: '0 20px 48px rgba(0,0,0,.18)',
          border: '1px solid #e5e7eb',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatSlideIn .2s ease',
          maxHeight: minimized ? 'auto' : 520,
        }}>

          {/* Header */}
          <div style={{
            background: '#0f4539', padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            flexShrink: 0,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={18} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>LogiBot</div>
              <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 11 }}>
                {typing ? 'Typing...' : 'AI Shipment Assistant · Online'}
              </div>
            </div>
            <button onClick={() => setMinimized(m => !m)} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,.7)',
              cursor: 'pointer', padding: 4, borderRadius: 6,
              display: 'flex', alignItems: 'center',
            }}>
              <Minimize2 size={15} />
            </button>
            <button onClick={() => { setOpen(false); setMinimized(false) }} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,.7)',
              cursor: 'pointer', padding: 4, borderRadius: 6,
              display: 'flex', alignItems: 'center',
            }}>
              <X size={16} />
            </button>
          </div>

          {!minimized && (
            <>
              {/* Messages area */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '16px',
                minHeight: 0,
              }}>
                {!loaded ? (
                  <div style={{ textAlign:'center', padding:'32px 16px', color:'#9ca3af' }}>
                    <Loader size={24} style={{ animation:'spin .8s linear infinite', margin:'0 auto 8px' }} />
                    <p style={{ fontSize:13 }}>Loading your shipment data...</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
                    {typing && <TypingIndicator />}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* Suggestions — show only before first user message */}
              {loaded && messages.length <= 1 && (
                <div style={{ padding:'0 16px 10px', display:'flex', flexWrap:'wrap', gap:6 }}>
                  {suggestions.map(s => (
                    <button key={s} onClick={() => send(s)} style={{
                      background: '#f0fdf4', border: '1px solid #bbf7d0',
                      borderRadius: 20, padding: '5px 11px',
                      fontSize: 12, color: '#065f46', cursor: 'pointer',
                      fontWeight: 500, transition: 'background .15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#dcfce7'}
                      onMouseLeave={e => e.currentTarget.style.background = '#f0fdf4'}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input area */}
              <div style={{
                padding: '12px 16px', borderTop: '1px solid #e5e7eb',
                display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0,
              }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send()
                    }
                  }}
                  placeholder="Ask about your shipments..."
                  rows={1}
                  style={{
                    flex: 1, border: '1.5px solid #e5e7eb', borderRadius: 10,
                    padding: '9px 12px', fontSize: 13.5, outline: 'none',
                    resize: 'none', fontFamily: 'inherit', lineHeight: 1.4,
                    maxHeight: 90, overflowY: 'auto',
                    transition: 'border-color .15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#0f4539'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  disabled={typing || !loaded}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || typing || !loaded}
                  style={{
                    width: 36, height: 36, borderRadius: 10, border: 'none',
                    background: input.trim() && !typing ? '#0f4539' : '#e5e7eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: input.trim() && !typing ? 'pointer' : 'not-allowed',
                    transition: 'background .15s', flexShrink: 0,
                  }}
                >
                  <Send size={15} color={input.trim() && !typing ? '#fff' : '#9ca3af'} />
                </button>
              </div>

              {/* Powered by */}
              <div style={{
                textAlign: 'center', padding: '6px 16px 10px',
                fontSize: 10.5, color: '#9ca3af',
              }}>
                Powered by Claude AI · LogiTrack
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
