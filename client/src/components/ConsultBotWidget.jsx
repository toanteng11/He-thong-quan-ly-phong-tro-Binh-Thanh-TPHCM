import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api.js'

const QUICK_PROMPTS = [
  'Phòng dưới 4 triệu',
  'Phòng có gác',
  'Gần Hàng Xanh',
  'Có ban công, cửa sổ',
]

function formatPriceVnd(value) {
  if (value === null || value === undefined || value === '') return 'Liên hệ'
  return `${Number(value).toLocaleString('vi-VN')} ₫`
}

function BotMascot({ size = 34 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className="bot-mascot-svg"
    >
      {/* Ăng-ten trái tim/mầm xanh */}
      <path d="M32 14V8" stroke="#FDE68A" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="32" cy="7" r="4" fill="#FDE68A" />
      {/* Tai nghe hai bên */}
      <rect x="6" y="26" width="7" height="16" rx="3.5" fill="#A7F3D0" />
      <rect x="51" y="26" width="7" height="16" rx="3.5" fill="#A7F3D0" />
      {/* Đầu bo tròn */}
      <rect x="11" y="14" width="42" height="38" rx="18" fill="#FFFDF9" stroke="#154D3A" strokeWidth="2.5" />
      {/* Màn hình khuôn mặt */}
      <rect x="17" y="21" width="30" height="23" rx="11" fill="#154D3A" />
      {/* Mắt tròn lấp lánh */}
      <circle cx="25.5" cy="31" r="3" fill="#FFFDF9" />
      <circle cx="26.5" cy="29.8" r="1" fill="#A7F3D0" />
      <circle cx="38.5" cy="31" r="3" fill="#FFFDF9" />
      <circle cx="39.5" cy="29.8" r="1" fill="#A7F3D0" />
      {/* Má hồng cute */}
      <ellipse cx="21.5" cy="35.5" rx="2.8" ry="1.6" fill="#FDA4AF" opacity="0.9" />
      <ellipse cx="42.5" cy="35.5" rx="2.8" ry="1.6" fill="#FDA4AF" opacity="0.9" />
      {/* Nụ cười nhỏ xinh */}
      <path d="M29 36.5C30.4 38.2 33.6 38.2 35 36.5" stroke="#FFFDF9" strokeWidth="2.2" strokeLinecap="round" />
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
      text: 'Chào bạn nè! Mình là Bot tư vấn của Phòng trọ Ngọc Toàn. Bạn muốn tìm phòng tầm giá nào, có gác hay gần khu nào ở Bình Thạnh để mình gợi ý nha!',
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
          text: data?.reply || 'Mình đã tìm thông tin phòng giúp bạn rồi nè!',
          rooms: Array.isArray(data?.rooms) ? data.rooms : [],
        },
      ])
    } catch (caught) {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-err-${Date.now()}`,
          role: 'model',
          text: caught?.message || 'Hic, mạng đang hơi chập chờn xíu. Bạn thử nhắn lại giúp Bot tư vấn nhé!',
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
        <section className="consult-bot-window" role="dialog" aria-label="Cửa sổ chat Bot tư vấn">
          <header className="consult-bot-header">
            <div className="consult-bot-title-wrap">
              <div className="consult-bot-avatar">
                <BotMascot size={36} />
                <span className="consult-bot-dot" aria-hidden="true" />
              </div>
              <div>
                <strong>Bot tư vấn</strong>
                <small>Trợ lý tìm phòng Bình Thạnh</small>
              </div>
            </div>
            <button
              type="button"
              className="consult-bot-close"
              onClick={() => setOpen(false)}
              aria-label="Đóng Bot tư vấn"
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
                <div className="bot-bubble is-model is-typing" aria-label="Bot tư vấn đang trả lời">
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
              placeholder="Nhắn tìm phòng (vd: dưới 4tr có gác)..."
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
        aria-label="Mở Bot tư vấn"
      >
        <span className="consult-bot-launcher-avatar">
          <BotMascot size={34} />
          <span className="consult-bot-dot" aria-hidden="true" />
        </span>
        <span className="consult-bot-launcher-label">Bot tư vấn</span>
      </button>
    </div>
  )
}
