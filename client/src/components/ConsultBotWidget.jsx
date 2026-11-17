import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api.js'

const QUICK_PROMPTS = [
  'Phòng dưới 4 triệu',
  'Phòng có gác',
  'Gần Hutech / Hàng Xanh',
  'Đường Bùi Đình Túy',
]

function formatPriceVnd(value) {
  if (value === null || value === undefined || value === '') return 'Liên hệ'
  return `${Number(value).toLocaleString('vi-VN')} ₫`
}

function BeToanMascot({ size = 38 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className="bot-mascot-svg"
    >
      <defs>
        <linearGradient id="beToanHood" x1="10" y1="8" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#0F5132" />
        </linearGradient>
        <linearGradient id="beToanFace" x1="32" y1="20" x2="32" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFDF9" />
          <stop offset="100%" stopColor="#F5EFE6" />
        </linearGradient>
      </defs>

      {/* Ngôi sao AI lấp lánh trên đỉnh */}
      <path
        className="bot-mascot-star"
        d="M32 3.5L33.9 8.1L38.5 10L33.9 11.9L32 16.5L30.1 11.9L25.5 10L30.1 8.1L32 3.5Z"
        fill="#FDE047"
      />

      {/* Tai mèo/mái nhà bo tròn dễ thương */}
      <path
        d="M15 24C12 16 17 11 24 16L32 12L40 16C47 11 52 16 49 24"
        fill="url(#beToanHood)"
        stroke="#0D3427"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Khung đầu tròn chibi */}
      <rect
        x="11"
        y="17"
        width="42"
        height="37"
        rx="18.5"
        fill="url(#beToanHood)"
        stroke="#0D3427"
        strokeWidth="2.2"
      />

      {/* Khuôn mặt kem ấm */}
      <rect x="16.5" y="23.5" width="31" height="24.5" rx="12.25" fill="url(#beToanFace)" />

      {/* Đôi mắt to lấp lánh có hiệu ứng chớp mắt */}
      <g className="bot-mascot-eyes">
        <circle cx="25.5" cy="34" r="3.4" fill="#12201B" />
        <circle cx="26.7" cy="32.7" r="1.2" fill="#FFFFFF" />
        <circle cx="24.5" cy="35" r="0.6" fill="#A7F3D0" />

        <circle cx="38.5" cy="34" r="3.4" fill="#12201B" />
        <circle cx="39.7" cy="32.7" r="1.2" fill="#FFFFFF" />
        <circle cx="37.5" cy="35" r="0.6" fill="#A7F3D0" />
      </g>

      {/* Má hồng đào siêu cute */}
      <ellipse cx="21" cy="39.2" rx="3.2" ry="1.8" fill="#FDA4AF" opacity="0.85" />
      <ellipse cx="43" cy="39.2" rx="3.2" ry="1.8" fill="#FDA4AF" opacity="0.85" />

      {/* Miệng cười chúm chím kiểu mèo */}
      <path
        d="M28.8 39.2C29.8 41.2 31.3 41.2 32 39.7C32.7 41.2 34.2 41.2 35.2 39.2"
        stroke="#154D3A"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function ConsultBotWidget({ navigate, hasMobileStickyCta = false }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'model',
      text: 'Chào bạn nè! Mình là Bé Toàn AI — trợ lý tìm phòng của Phòng trọ Ngọc Toàn. Bạn muốn tìm phòng tầm giá nào, có gác hay gần khu nào ở Bình Thạnh để Bé gợi ý giúp nha!',
      rooms: [],
    },
  ])
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, open, sending])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const sendMessage = async (rawText) => {
    const text = String(rawText ?? input).trim()
    if (!text || sending) return

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      rooms: [],
    }
    const historyPayload = messages
      .filter((item) => item.id !== 'welcome')
      .slice(-6)
      .map((item) => ({
        role: item.role,
        text: item.text.slice(0, 500),
      }))

    setMessages((prev) => [...prev, userMsg])
    if (rawText === undefined) setInput('')
    setSending(true)

    try {
      const data = await api('/public/chat', {
        method: 'POST',
        json: {
          message: text,
          history: historyPayload,
        },
      })
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          role: 'model',
          text: data?.reply || 'Bé Toàn AI đã tìm thông tin phòng giúp bạn rồi nè!',
          rooms: Array.isArray(data?.rooms) ? data.rooms : [],
        },
      ])
    } catch (caught) {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-err-${Date.now()}`,
          role: 'model',
          text: caught?.message || 'Hic, mạng đang hơi chập chờn xíu. Bạn thử nhắn lại giúp Bé Toàn AI nhé!',
          rooms: [],
        },
      ])
    } finally {
      setSending(false)
    }
  }

  const openRoomFromBot = (roomId) => {
    navigate(`/rooms/${roomId}`)
    if (window.innerWidth <= 767) {
      setOpen(false)
    }
  }

  return (
    <div className={`consult-bot-root${hasMobileStickyCta ? ' has-sticky-cta' : ''}`}>
      {open && (
        <section className="consult-bot-window" role="dialog" aria-label="Cửa sổ chat Bé Toàn AI">
          <header className="consult-bot-header">
            <div className="consult-bot-title-wrap">
              <div className="consult-bot-avatar">
                <BeToanMascot size={40} />
                <span className="consult-bot-dot" aria-hidden="true" />
              </div>
              <div>
                <strong>Bé Toàn AI</strong>
                <small>Trợ lý tìm phòng · Ngọc Toàn</small>
              </div>
            </div>
            <button
              type="button"
              className="consult-bot-close"
              onClick={() => setOpen(false)}
              aria-label="Đóng Bé Toàn AI"
            >
              ×
            </button>
          </header>

          <div className="consult-bot-messages" ref={scrollRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={`bot-msg-group is-${msg.role}`}>
                <div className={`bot-bubble is-${msg.role}`}>
                  {msg.text}
                </div>
                {msg.rooms?.length > 0 && (
                  <div className="bot-room-list">
                    {msg.rooms.map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        className="bot-room-card"
                        onClick={() => openRoomFromBot(room.id)}
                      >
                        {room.coverImageUrl ? (
                          <img src={room.coverImageUrl} alt={room.title} loading="lazy" />
                        ) : (
                          <span className="bot-room-thumb-empty">Phòng</span>
                        )}
                        <span className="bot-room-info">
                          <strong>{room.title}</strong>
                          <span>
                            <b>{formatPriceVnd(room.priceVnd)}</b>
                            {room.areaM2 ? ` · ${room.areaM2} m²` : ''}
                          </span>
                          <small>{room.ward || room.publicAddress || 'Bình Thạnh'}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="bot-msg-group is-model">
                <div className="bot-bubble is-model is-typing" aria-label="Bé Toàn AI đang trả lời">
                  <span /><span /><span />
                </div>
              </div>
            )}

            {messages.length <= 2 && !sending && (
              <div className="bot-quick-prompts">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="bot-quick-chip"
                    onClick={() => sendMessage(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            className="consult-bot-form"
            onSubmit={(event) => {
              event.preventDefault()
              sendMessage()
            }}
          >
            <input
              ref={inputRef}
              type="text"
              maxLength={400}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Nhắn Bé Toàn AI (vd: dưới 4tr có gác)..."
              disabled={sending}
            />
            <button type="submit" className="consult-bot-send" disabled={sending || !input.trim()}>
              Gửi
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className={`consult-bot-launcher${open ? ' is-open' : ''}`}
        onClick={() => {
          setOpen((prev) => !prev)
          window.setTimeout(() => inputRef.current?.focus(), 120)
        }}
        aria-expanded={open}
        aria-label="Mở Bé Toàn AI"
      >
        <span className="consult-bot-launcher-avatar">
          <BeToanMascot size={38} />
          <span className="consult-bot-dot" aria-hidden="true" />
        </span>
        <span className="consult-bot-launcher-label">Bé Toàn AI</span>
      </button>
    </div>
  )
}
