import { useCallback, useEffect, useState } from 'react'
import './App.css'

const HEALTH_URL = '/api/v1/health/ready'

function App() {
  const [health, setHealth] = useState({ state: 'loading', data: null })

  const loadHealth = useCallback(async () => {
    setHealth({ state: 'loading', data: null })
    try {
      const response = await fetch(HEALTH_URL, { headers: { Accept: 'application/json' } })
      const data = await response.json()
      if (!response.ok) throw new Error('Service is not ready')
      setHealth({ state: 'ready', data })
    } catch {
      setHealth({ state: 'unavailable', data: null })
    }
  }, [])

  useEffect(() => {
    loadHealth()
  }, [loadHealth])

  const ready = health.state === 'ready'
  const panelClass = 'status-panel ' + (ready ? 'is-ready' : health.state === 'loading' ? 'is-loading' : 'is-error')

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Trang chủ Room Nhà">
          <span className="brand-mark" aria-hidden="true">R</span>
          <span>Room Nhà</span>
        </a>
        <span className="environment-badge">Sprint 0 · Môi trường local</span>
      </header>

      <section className="welcome-card" aria-labelledby="page-title">
        <p className="eyebrow">NỀN TẢNG ĐÃ KHỞI TẠO</p>
        <h1 id="page-title">Website phòng trọ Bình Thạnh</h1>
        <p className="intro">
          Đây là trang kiểm tra kết nối nền tảng dành cho môi trường phát triển.
          Chức năng xem và quản lý phòng sẽ được xây trong các sprint tiếp theo.
        </p>

        <div className={panelClass} role="status" aria-live="polite">
          <span className="status-dot" aria-hidden="true" />
          <div>
            <strong>{ready ? 'Nền tảng đã sẵn sàng' : health.state === 'loading' ? 'Đang kiểm tra kết nối' : 'Chưa kết nối đầy đủ'}</strong>
            <p>
              {ready
                ? 'Giao diện, API và PostgreSQL đang phản hồi.'
                : health.state === 'loading'
                  ? 'Đang kiểm tra API và cơ sở dữ liệu.'
                  : 'Khởi động API và PostgreSQL, sau đó thử lại.'}
            </p>
          </div>
        </div>

        <div className="service-grid">
          <ServiceCard label="Giao diện" value="React + Vite" state="online" />
          <ServiceCard label="API" value={ready ? 'Đang hoạt động' : 'Chưa sẵn sàng'} state={ready ? 'online' : health.state} />
          <ServiceCard label="Cơ sở dữ liệu" value={health.data?.dependencies?.database ?? (health.state === 'loading' ? 'Đang kiểm tra' : 'Chưa kết nối')} state={ready ? 'online' : health.state} />
        </div>

        <button className="retry-button" type="button" onClick={loadHealth} disabled={health.state === 'loading'}>
          {health.state === 'loading' ? 'Đang kiểm tra…' : 'Kiểm tra lại'}
        </button>
      </section>

      <footer className="footer">
        <span>Phát triển riêng cho chủ dự án</span>
        <span>Local development · Chưa phải production</span>
      </footer>
    </main>
  )
}

function ServiceCard({ label, value, state }) {
  return (
    <article className="service-card">
      <div className="service-card-heading">
        <span className="service-label">{label}</span>
        <span className={'service-indicator ' + state} aria-hidden="true" />
      </div>
      <strong>{value}</strong>
    </article>
  )
}

export default App
