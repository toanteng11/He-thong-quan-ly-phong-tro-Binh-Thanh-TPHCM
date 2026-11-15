import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './components/Icon.jsx'
import { api } from './lib/api.js'
import { branding } from './branding.js'
import './App.css'

const ROOM_TYPES = ['Phòng trọ', 'Phòng có gác', 'Phòng studio', 'Căn hộ mini', 'Phòng ở ghép']
const BINH_THANH_WARDS = [
  'Phường Gia Định',
  'Phường Bình Thạnh',
  'Phường Bình Lợi Trung',
  'Phường Thạnh Mỹ Tây',
  'Phường Bình Quới',
]
const AMENITIES = [
  'Máy lạnh', 'Tủ lạnh', 'Thang máy', 'Giường', 'Tủ quần áo', 'Bếp riêng',
  'Nhà vệ sinh riêng', 'Ban công', 'Gác lửng', 'Wifi', 'Chỗ để xe', 'Cửa sổ',
]
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ALLOWED_IMAGE_EXTS = /\.(jpe?g|png|webp)$/i
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function validateDraftImageFile(file) {
  if (!file) return 'Tệp không hợp lệ.'
  const hasAllowedMime = file.type ? ALLOWED_IMAGE_TYPES.has(file.type) : false
  const hasAllowedExt = ALLOWED_IMAGE_EXTS.test(file.name || '')
  if (!hasAllowedMime && !hasAllowedExt) {
    return 'Chỉ hỗ trợ ảnh định dạng JPEG, PNG hoặc WebP.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Kích thước ảnh vượt quá giới hạn 10 MB.'
  }
  return ''
}

const emptyListing = {
  title: '', description: '', roomType: '', priceVnd: null, areaM2: null, amenities: [],
  ward: '', district: 'Bình Thạnh', city: 'TP. Hồ Chí Minh', publicAddress: '', privateAddress: '',
  allowExactAddress: false, contactPhone: '', allowPublicPhone: false, contactZalo: '', allowPublicZalo: false,
}
const editableKeys = Object.keys(emptyListing)

function formatPriceVnd(value) {
  if (value === null || value === undefined || value === '') return 'Liên hệ'
  return `${Number(value).toLocaleString('vi-VN')} ₫`
}

function formatDateVn(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
}

function buildZaloHref(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  if (/^https:\/\/zalo\.me\/[A-Za-z0-9._-]+$/i.test(value)) return value
  const digits = value.replace(/[^0-9]/g, '')
  if (!digits) return ''
  return `https://zalo.me/${digits}`
}

function normalizeAdminPath(pathname) {
  if (pathname === '/admin' || pathname === '/admin/') return '/'
  if (pathname.startsWith('/admin/')) return pathname.slice('/admin'.length)
  return pathname || '/'
}

function useLocationRouter() {
  const [location, setLocation] = useState(() => ({
    pathname: window.location.pathname,
    search: window.location.search,
  }))

  useEffect(() => {
    const update = () => {
      setLocation({
        pathname: window.location.pathname,
        search: window.location.search,
      })
    }
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])

  const navigate = useCallback((next, options = {}) => {
    if (!options.force && !options.replace) {
      const intent = new CustomEvent('room-admin-navigation', { detail: { to: next }, cancelable: true })
      window.dispatchEvent(intent)
      if (intent.defaultPrevented) return false
    }
    if (options.replace) window.history.replaceState({}, '', next)
    else window.history.pushState({}, '', next)

    const url = new URL(next, window.location.origin)
    setLocation({ pathname: url.pathname, search: url.search })
    if (!options.preserveScroll) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    return true
  }, [])

  return [location, navigate]
}

function AppLink({ to, navigate, className, children, onClick, ...props }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented && !event.metaKey && !event.ctrlKey && event.button === 0) {
          event.preventDefault()
          navigate(to)
        }
      }}
      {...props}
    >
      {children}
    </a>
  )
}

function SafeImage({ src, alt, className, fallbackLabel = 'Chưa có ảnh phòng' }) {
  const [failedSrc, setFailedSrc] = useState(null)

  if (!src || failedSrc === src) {
    return (
      <div className={`image-fallback-box ${className || ''}`}>
        <Icon name="image" size={30} />
        <span>{fallbackLabel}</span>
      </div>
    )
  }

  return <img src={src} alt={alt || ''} className={className} loading="lazy" onError={() => setFailedSrc(src)} />
}

function StatusBadge({ status }) {
  const config = {
    AVAILABLE: ['availability-available', 'Còn trống'],
    RENTED: ['availability-rented', 'Đã thuê'],
    PUBLISHED: ['publish-published', 'Đang hiển thị'],
    DRAFT: ['publish-draft', 'Bản nháp'],
    HIDDEN: ['publish-hidden', 'Đã ẩn'],
  }[status] || ['publish-hidden', status]

  return (
    <span className={`status-badge ${config[0]}`}>
      <i aria-hidden="true" />
      {config[1]}
    </span>
  )
}

function Brand({ to, navigate }) {
  const content = (
    <span className="brand-lockup">
      <img
        className="brand-logo"
        src={branding.logoSrc}
        alt={`${branding.name} — ${branding.areaLabel}`}
      />
    </span>
  )
  if (to && navigate) {
    return <AppLink to={to} navigate={navigate} style={{ textDecoration: 'none' }}>{content}</AppLink>
  }
  return content
}

function App() {
  const [location, navigate] = useLocationRouter()
  const path = normalizeAdminPath(location.pathname)
  const [auth, setAuth] = useState({ state: 'idle', admin: null })
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (auth.state !== 'idle') return
    let active = true
    api('/admin/auth/me', { suppressExpiredEvent: true })
      .then((data) => {
        if (active) setAuth({ state: 'ready', admin: data.admin })
      })
      .catch(() => {
        if (active) setAuth({ state: 'anonymous', admin: null })
      })
    return () => {
      active = false
    }
  }, [auth.state])

  useEffect(() => {
    const expired = () => {
      setAuth({ state: 'anonymous', admin: null })
      navigate('/login', { replace: true })
      setNotice({ type: 'info', text: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' })
    }
    window.addEventListener('room-admin-session-expired', expired)
    return () => window.removeEventListener('room-admin-session-expired', expired)
  }, [navigate])

  useEffect(() => {
    if (auth.state !== 'ready') return
    if (auth.admin.mustChangePassword && path !== '/change-password') {
      navigate('/change-password', { replace: true })
    } else if (!auth.admin.mustChangePassword && (path === '/login' || path === '/change-password')) {
      navigate('/', { replace: true })
    }
  }, [auth, navigate, path])

  useEffect(() => {
    if (auth.state === 'anonymous' && path !== '/login') {
      navigate('/login', { replace: true })
    }
  }, [auth.state, navigate, path])

  const showNotice = useCallback((text, type = 'success') => {
    const id = Date.now()
    setNotice({ text, type, id })
    window.setTimeout(() => setNotice((current) => (current?.id === id ? null : current)), 4200)
  }, [])

  const handleLogin = (admin) => {
    setAuth({ state: 'ready', admin })
    navigate(admin.mustChangePassword ? '/change-password' : '/')
  }

  const handlePasswordChanged = (admin) => {
    setAuth({ state: 'ready', admin })
    navigate('/')
    showNotice('Mật khẩu đã được cập nhật. Chào mừng bạn trở lại.')
  }

  const handleLogout = async () => {
    try {
      await api('/admin/auth/logout', { method: 'POST' })
    } catch {
      /* phiên đã hết hạn */
    }
    setAuth({ state: 'anonymous', admin: null })
    navigate('/login', { replace: true })
    showNotice('Bạn đã đăng xuất an toàn.', 'info')
  }

  /* Admin Routes */
  if (auth.state === 'idle' || auth.state === 'loading') {
    return (
      <div className="app-loading">
        <span className="loading-mark">NT</span>
        <span>Đang mở khu quản trị…</span>
      </div>
    )
  }

  if (auth.state === 'anonymous') {
    return (
      <>
        <LoginPage onLogin={handleLogin} notice={notice} clearNotice={() => setNotice(null)} />
        {notice && <Toast notice={notice} />}
      </>
    )
  }

  if (auth.admin.mustChangePassword) {
    return (
      <>
        <ChangePasswordPage onComplete={handlePasswordChanged} onLogout={handleLogout} />
        {notice && <Toast notice={notice} />}
      </>
    )
  }

  const match = path.match(/^\/rooms\/([0-9a-f-]+)(?:\/(preview))?$/i)
  let page
  let active = 'dashboard'

  if (path === '/') {
    page = <DashboardPage navigate={navigate} />
  } else if (path === '/rooms') {
    active = 'rooms'
    page = <RoomListPage navigate={navigate} showNotice={showNotice} />
  } else if (path === '/rooms/new') {
    active = 'rooms'
    page = <RoomEditorPage key="new-room" navigate={navigate} showNotice={showNotice} />
  } else if (path === '/rooms/archived') {
    active = 'archive'
    page = <ArchivedPage showNotice={showNotice} />
  } else if (match) {
    active = 'rooms'
    page = match[2]
      ? <RoomPreviewPage key={match[1]} roomId={match[1]} navigate={navigate} />
      : <RoomEditorPage key={match[1]} roomId={match[1]} navigate={navigate} showNotice={showNotice} />
  } else {
    page = <NotFound navigate={navigate} homePath="/" homeLabel="Về tổng quan quản trị" />
  }

  return (
    <AdminLayout admin={auth.admin} active={active} path={path} navigate={navigate} onLogout={handleLogout}>
      {page}
      {notice && <Toast notice={notice} />}
    </AdminLayout>
  )
}

function PaginationBar({ page, totalPages, onPageChange }) {
  const pages = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  for (let p = start; p <= end; p += 1) pages.push(p)

  return (
    <div className="pagination">
      <span>Trang {page} / {totalPages}</span>
      <div className="pagination-controls">
        <button
          type="button"
          className="button button-small button-secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Trước
        </button>
        {pages.map((p) => (
          <button
            type="button"
            key={p}
            className={`page-num-btn${p === page ? ' is-current' : ''}`}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          className="button button-small button-secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Sau
        </button>
      </div>
    </div>
  )
}

function RoomGallery({ images, title }) {
  const [selection, setSelection] = useState({ images, index: 0 })
  const list = images || []
  const activeIndex = selection.images === images && selection.index < list.length ? selection.index : 0
  const setActiveIndex = (updater) =>
    setSelection((prev) => {
      const cur = prev.images === images && prev.index < list.length ? prev.index : 0
      const next = typeof updater === 'function' ? updater(cur) : updater
      return { images, index: next }
    })
  const current = list[activeIndex] || list[0]

  if (!list.length) {
    return (
      <div className="gallery-card">
        <div className="gallery-stage">
          <SafeImage src="" alt={title} fallbackLabel="Ảnh phòng sẽ hiển thị tại đây" />
        </div>
      </div>
    )
  }

  return (
    <div className="gallery-card">
      <div className="gallery-stage">
        <SafeImage src={current.url} alt={current.altText || title} />
        {list.length > 1 && (
          <>
            <button
              type="button"
              className="gallery-nav prev"
              aria-label="Ảnh trước"
              onClick={() => setActiveIndex((idx) => (idx - 1 + list.length) % list.length)}
            >
              <Icon name="chevron" size={20} />
            </button>
            <button
              type="button"
              className="gallery-nav next"
              aria-label="Ảnh tiếp theo"
              onClick={() => setActiveIndex((idx) => (idx + 1) % list.length)}
            >
              <Icon name="chevron" size={20} />
            </button>
            <span className="gallery-counter">{activeIndex + 1} / {list.length}</span>
          </>
        )}
      </div>

      {list.length > 1 && (
        <div className="gallery-thumbs">
          {list.map((img, index) => (
            <button
              type="button"
              key={img.id}
              className={`gallery-thumb-btn${index === activeIndex ? ' is-active' : ''}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Xem ảnh ${index + 1}`}
            >
              <SafeImage src={img.url} alt={img.altText || `${title} - ảnh ${index + 1}`} fallbackLabel="" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* =========================================================
   ADMIN AUTHENTICATION & SHELL
   ========================================================= */
function LoginPage({ onLogin, notice, clearNotice }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    clearNotice()
    try {
      const result = await api('/admin/auth/login', { method: 'POST', json: { identifier, password } })
      onLogin(result.admin)
    } catch (caught) {
      setError(caught.message || 'Không thể đăng nhập lúc này.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      <header className="login-top">
        <Brand />
        <span className="secure-note">
          <Icon name="shield" size={16} /> Khu vực riêng tư
        </span>
      </header>

      <section className="login-card">
        <div className="login-icon">
          <Icon name="homeSmall" size={24} />
        </div>
        <span className="eyebrow">CHÀO MỪNG BẠN TRỞ LẠI</span>
        <h1>Đăng nhập quản trị</h1>
        <p className="login-copy">Đăng nhập để quản lý tin phòng, hình ảnh và trạng thái còn trống.</p>

        {notice && <div className="inline-notice" role="status" style={{ marginBottom: 16 }}>{notice.text}</div>}
        {error && (
          <div className="form-alert" role="alert" style={{ marginBottom: 16 }}>
            <Icon name="shield" size={17} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="login-form">
          <label className="field">
            <span>Email đăng nhập</span>
            <input
              autoComplete="username"
              type="email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="tenban@email.com"
              required
              autoFocus
            />
          </label>

          <label className="field">
            <span>Mật khẩu</span>
            <span className="password-wrap">
              <input
                autoComplete="current-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </span>
          </label>

          <button className="button button-primary button-wide" disabled={busy}>
            {busy ? (
              <>
                <span className="spinner" /> Đang xác thực…
              </>
            ) : (
              <>
                Đăng nhập <Icon name="arrow" size={17} />
              </>
            )}
          </button>
        </form>

        <div className="login-footnote">
          <Icon name="shield" size={16} />
          <span>Phiên đăng nhập được bảo vệ bằng cookie an toàn và tự hết hạn sau 30 phút không hoạt động.</span>
        </div>
      </section>

      <footer className="login-footer">
        <a href={branding.publicSiteUrl} target="_blank" rel="noopener noreferrer" className="text-button">
          ← Mở trang khách xem phòng
        </a>
        <span>{branding.name.toLocaleUpperCase('vi-VN')} · QUẢN TRỊ NỘI BỘ</span>
      </footer>
    </main>
  )
}

function ChangePasswordPage({ onComplete, onLogout }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Hai mật khẩu chưa trùng khớp.')
      return
    }
    setBusy(true)
    try {
      const result = await api('/admin/auth/change-password', { method: 'POST', json: { password, confirmPassword } })
      onComplete(result.admin)
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      <header className="login-top">
        <Brand />
        <span className="secure-note">
          <Icon name="shield" size={16} /> Thiết lập bảo mật lần đầu
        </span>
      </header>
      <section className="login-card change-card">
        <div className="login-icon">
          <Icon name="shield" size={24} />
        </div>
        <span className="eyebrow">BẢO VỆ TÀI KHOẢN CỦA BẠN</span>
        <h1>Tạo mật khẩu riêng</h1>
        <p className="login-copy">
          Mật khẩu khởi tạo chỉ dùng một lần. Hãy đổi sang mật khẩu riêng trước khi quản lý tin phòng.
        </p>
        {error && <div className="form-alert" role="alert" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={submit} className="login-form">
          <label className="field">
            <span>Mật khẩu mới</span>
            <input
              type="password"
              minLength="12"
              maxLength="128"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <small className="field-hint">Dùng ít nhất 12 ký tự để bảo vệ tài khoản.</small>
          </label>
          <label className="field">
            <span>Nhập lại mật khẩu</span>
            <input
              type="password"
              minLength="12"
              maxLength="128"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>
          <button className="button button-primary button-wide" disabled={busy}>
            {busy ? 'Đang cập nhật…' : 'Lưu mật khẩu mới'} <Icon name="arrow" size={17} />
          </button>
        </form>
        <button className="text-button change-logout" onClick={onLogout}>Đăng xuất</button>
      </section>
    </main>
  )
}

function AdminLayout({ admin, active, path, navigate, onLogout, children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: 'home', to: '/admin' },
    { id: 'rooms', label: 'Tin phòng', icon: 'rooms', to: '/admin/rooms' },
    { id: 'archive', label: 'Đã lưu trữ', icon: 'archive', to: '/admin/rooms/archived' },
  ]

  const title = active === 'rooms'
    ? (path.endsWith('/new') ? 'Tạo tin mới' : path.includes('/preview') ? 'Xem trước tin' : 'Tin phòng')
    : active === 'archive'
      ? 'Tin đã lưu trữ'
      : 'Tổng quan'

  return (
    <div className="admin-app">
      {menuOpen && <button className="mobile-scrim" aria-label="Đóng menu" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar${menuOpen ? ' is-open' : ''}`}>
        <div className="sidebar-brand">
          <Brand to="/" navigate={navigate} />
          <button className="icon-button sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Đóng menu">
            <Icon name="close" />
          </button>
        </div>

        <div className="workspace-label">KHÔNG GIAN CỦA BẠN</div>
        <nav className="side-nav" aria-label="Điều hướng quản trị">
          {navItems.map((item) => (
            <AppLink
              key={item.id}
              to={item.to}
              navigate={navigate}
              className={`nav-item${active === item.id ? ' active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.id === 'rooms' && <Icon className="nav-chevron" name="chevron" size={15} />}
            </AppLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <a
            href={branding.publicSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-public-link"
            onClick={() => setMenuOpen(false)}
          >
            <Icon name="external" size={15} /> Xem trang khách
          </a>
          <div className="help-card">
            <span className="help-icon"><Icon name="shield" size={16} /></span>
            <strong>Không gian riêng tư</strong>
            <p>Chỉ bạn có thể tạo, sửa, ẩn hoặc xuất bản các tin phòng.</p>
          </div>
          <button className="profile-button" onClick={() => setLogoutOpen(true)}>
            <span className="avatar">{admin.displayName.slice(0, 1).toUpperCase()}</span>
            <span className="profile-copy">
              <strong>{admin.displayName}</strong>
              <small>Quản trị viên</small>
            </span>
            <Icon name="logout" size={17} />
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="icon-button mobile-menu-button" onClick={() => setMenuOpen(true)} aria-label="Mở menu">
            <Icon name="menu" />
          </button>
          <div className="breadcrumb">
            <span>Quản trị</span>
            <Icon name="chevron" size={14} />
            <strong>{title}</strong>
          </div>
          <div className="topbar-right">
            <span className="topbar-location">
              <span className="location-dot" /> Bình Thạnh, TP.HCM
            </span>
            <button className="user-pill" onClick={() => setLogoutOpen(true)}>
              <span className="avatar avatar-small">{admin.displayName.slice(0, 1).toUpperCase()}</span>
              <span>{admin.displayName}</span>
            </button>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>

      {logoutOpen && (
        <ConfirmDialog
          title="Đăng xuất khỏi khu quản trị?"
          body="Bạn sẽ cần đăng nhập lại để tiếp tục quản lý tin phòng."
          confirmLabel="Đăng xuất"
          onCancel={() => setLogoutOpen(false)}
          onConfirm={() => {
            setLogoutOpen(false)
            onLogout()
          }}
        />
      )}
    </div>
  )
}

function PageHeading({ eyebrow, title, description, action, back }) {
  return (
    <div className={`page-heading${back ? ' has-back' : ''}`}>
      <div>
        {back && (
          <button className="back-link" onClick={back}>
            <Icon name="chevron" size={16} /> Quay lại
          </button>
        )}
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  )
}

/* =========================================================
   ADMIN PAGES
   ========================================================= */
function DashboardPage({ navigate }) {
  const [data, setData] = useState(null)
  const [recent, setRecent] = useState([])
  const [error, setError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    let active = true
    Promise.all([api('/admin/dashboard'), api('/admin/rooms?page=1&pageSize=5')])
      .then(([dashboard, rooms]) => {
        if (!active) return
        setData(dashboard.counts)
        setRecent(rooms.items)
        setError('')
      })
      .catch((caught) => {
        if (active) setError(caught.message)
      })
    return () => {
      active = false
    }
  }, [reloadTick])

  const cards = [
    { label: 'Tổng số tin', value: data?.total, className: 'stat-neutral', icon: 'rooms', detail: 'Tất cả tin đang quản lý' },
    { label: 'Đang hiển thị', value: data?.published, className: 'stat-green', icon: 'eye', detail: 'Khách có thể xem' },
    { label: 'Phòng còn trống', value: data?.available, className: 'stat-sand', icon: 'homeSmall', detail: 'Sẵn sàng đón khách' },
    { label: 'Bản nháp', value: data?.drafts, className: 'stat-lilac', icon: 'edit', detail: 'Đang chờ hoàn thiện' },
    { label: 'Đã ẩn', value: data?.hidden, className: 'stat-hidden', icon: 'archive', detail: 'Tạm không công khai' },
  ]

  return (
    <div className="dashboard-page">
      <PageHeading
        eyebrow="KHÔNG GIAN CỦA BẠN"
        title="Chào bạn, hôm nay thế nào?"
        description="Theo dõi tình hình phòng trọ và cập nhật nhanh thông tin cho khách thuê."
        action={
          <button className="button button-primary" onClick={() => navigate('/rooms/new')}>
            <Icon name="plus" /> Tạo tin mới
          </button>
        }
      />
      {error && (
        <div className="page-alert" role="alert">
          <span>{error}</span>
          <button className="button button-small button-secondary" onClick={() => setReloadTick((n) => n + 1)}>
            Thử lại
          </button>
        </div>
      )}
      <section className="stats-grid" aria-label="Tổng quan tin phòng">
        {cards.map((card) => (
          <article className={`stat-card ${card.className}`} key={card.label}>
            <div className="stat-card-top">
              <span>{card.label}</span>
              <span className="stat-icon"><Icon name={card.icon} /></span>
            </div>
            <strong className="stat-number">{data ? card.value : <span className="skeleton-line" />}</strong>
            <small>{card.detail}</small>
          </article>
        ))}
      </section>

      <section className="dashboard-lower">
        <div className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">CẬP NHẬT GẦN ĐÂY</span>
              <h2>Tin phòng mới chỉnh sửa</h2>
            </div>
            <AppLink to="/rooms" navigate={navigate} className="text-link">
              Xem tất cả <Icon name="arrow" size={15} />
            </AppLink>
          </div>
          {recent.length ? (
            <RoomTable rows={recent} navigate={navigate} compact />
          ) : (
            <div className="empty-state compact-empty">
              <span className="empty-illustration"><Icon name="rooms" size={28} /></span>
              <strong>Chưa có tin phòng nào</strong>
              <p>Tạo tin đầu tiên để bắt đầu xây dựng danh sách phòng trọ của bạn.</p>
              <button className="button button-secondary" onClick={() => navigate('/rooms/new')}>
                <Icon name="plus" size={16} /> Tạo tin đầu tiên
              </button>
            </div>
          )}
        </div>

        <aside className="tip-card">
          <span className="tip-spark"><Icon name="sparkles" size={28} /></span>
          <span className="eyebrow">MẸO NHỎ</span>
          <h2>Ảnh đẹp giúp khách dễ hình dung căn phòng.</h2>
          <p>
            Hãy chụp phòng vào ban ngày có ánh sáng tự nhiên, giữ phòng gọn gàng và chọn góc rộng nhất làm ảnh bìa ngay trong phần chỉnh sửa tin.
          </p>
          <div className="tip-rule" />
          <span className="tip-note">
            <Icon name="image" size={16} /> Tối đa 15 ảnh · JPEG, PNG hoặc WebP
          </span>
        </aside>
      </section>
    </div>
  )
}

function RoomListPage({ navigate, showNotice }) {
  const [filters, setFilters] = useState({ q: '', publishStatus: '', availability: '' })
  const [applied, setApplied] = useState(filters)
  const [page, setPage] = useState(1)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [hiding, setHiding] = useState(null)
  const [reloadTick, setReloadTick] = useState(0)
  const [loadedKey, setLoadedKey] = useState(null)
  const requestKey = `${page}|${JSON.stringify(applied)}|${reloadTick}`
  const busy = loadedKey !== requestKey

  useEffect(() => {
    let active = true
    const key = `${page}|${JSON.stringify(applied)}|${reloadTick}`
    const query = new URLSearchParams({
      page: String(page),
      pageSize: '12',
      ...Object.fromEntries(Object.entries(applied).filter(([, v]) => v)),
    })
    api(`/admin/rooms?${query}`)
      .then((res) => {
        if (!active) return
        setResult(res)
        setError('')
        setLoadedKey(key)
      })
      .catch((caught) => {
        if (!active) return
        setError(caught.message)
        setLoadedKey(key)
      })
    return () => {
      active = false
    }
  }, [applied, page, reloadTick])

  const load = () => setReloadTick((n) => n + 1)

  const applyFilters = (event) => {
    event.preventDefault()
    setPage(1)
    setApplied(filters)
  }

  const executeStatusChange = async (room, publishStatus) => {
    try {
      await api(`/admin/rooms/${room.id}/publish-status`, { method: 'PATCH', json: { publishStatus } })
      showNotice(
        publishStatus === 'PUBLISHED'
          ? 'Tin đã được xuất bản.'
          : publishStatus === 'HIDDEN'
            ? 'Tin đã được ẩn khỏi trang khách.'
            : 'Trạng thái tin đã cập nhật.',
      )
      load()
    } catch (caught) {
      setError(
        caught.fieldErrors
          ? `${caught.message} (${Object.values(caught.fieldErrors).join(' ')})`
          : caught.message,
      )
    }
  }

  const changeStatus = (room, publishStatus) => {
    if (room.publishStatus === 'PUBLISHED' && publishStatus === 'HIDDEN') {
      setHiding(room)
      return
    }
    executeStatusChange(room, publishStatus)
  }

  const changeAvailability = async (room, availability) => {
    try {
      await api(`/admin/rooms/${room.id}/availability`, { method: 'PATCH', json: { availability } })
      showNotice('Tình trạng phòng đã cập nhật.')
      load()
    } catch (caught) {
      setError(caught.message)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await api(`/admin/rooms/${deleting.id}`, { method: 'DELETE' })
      showNotice('Tin đã chuyển vào mục đã lưu trữ.')
      setDeleting(null)
      load()
    } catch (caught) {
      setError(caught.message)
      setDeleting(null)
    }
  }

  return (
    <div className="rooms-page">
      <PageHeading
        eyebrow="QUẢN LÝ NỘI DUNG"
        title="Tin phòng"
        description="Tạo, cập nhật và kiểm soát những tin bạn muốn khách nhìn thấy."
        action={
          <button className="button button-primary" onClick={() => navigate('/rooms/new')}>
            <Icon name="plus" /> Tạo tin mới
          </button>
        }
      />

      <section className="panel listing-panel">
        <form className="filter-bar" onSubmit={applyFilters}>
          <label className="search-field">
            <Icon name="search" size={18} />
            <input
              aria-label="Tìm tin phòng"
              placeholder="Tìm theo tiêu đề hoặc khu vực"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
            {filters.q && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setFilters({ ...filters, q: '' })}
                aria-label="Xóa từ khóa"
              >
                ×
              </button>
            )}
          </label>

          <label className="filter-select">
            <span className="sr-only">Trạng thái tin</span>
            <select
              value={filters.publishStatus}
              onChange={(e) => setFilters({ ...filters, publishStatus: e.target.value })}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PUBLISHED">Đang hiển thị</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="HIDDEN">Đã ẩn</option>
            </select>
          </label>

          <label className="filter-select">
            <span className="sr-only">Tình trạng phòng</span>
            <select
              value={filters.availability}
              onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
            >
              <option value="">Mọi tình trạng</option>
              <option value="AVAILABLE">Còn trống</option>
              <option value="RENTED">Đã thuê</option>
            </select>
          </label>

          <button className="button button-secondary filter-submit">Lọc kết quả</button>
        </form>

        {error && (
          <div className="inline-error error-retry-row" role="alert">
            <span>{error}</span>
            <button type="button" className="button button-small button-secondary" onClick={load}>
              Thử lại
            </button>
          </div>
        )}

        <div className="list-meta">
          <span>{busy ? 'Đang tải danh sách…' : `${result?.totalItems || 0} tin phòng`}</span>
          <span>Trạng thái tin và tình trạng phòng được quản lý riêng biệt</span>
        </div>

        {busy ? (
          <RoomTableSkeleton />
        ) : result?.items.length ? (
          <RoomTable
            rows={result.items}
            navigate={navigate}
            onPublishChange={changeStatus}
            onAvailabilityChange={changeAvailability}
            onDelete={setDeleting}
          />
        ) : (
          <div className="empty-state">
            <span className="empty-illustration"><Icon name="search" size={28} /></span>
            <strong>
              {applied.q || applied.publishStatus || applied.availability
                ? 'Không tìm thấy tin phù hợp'
                : 'Chưa có tin phòng nào'}
            </strong>
            <p>
              {applied.q || applied.publishStatus || applied.availability
                ? 'Thử thay đổi bộ lọc hoặc xóa các điều kiện tìm kiếm.'
                : 'Tạo tin đầu tiên để giới thiệu phòng trọ của bạn.'}
            </p>
            <button
              className="button button-secondary"
              onClick={() => (
                applied.q || applied.publishStatus || applied.availability
                  ? (setFilters({ q: '', publishStatus: '', availability: '' }),
                    setApplied({ q: '', publishStatus: '', availability: '' }))
                  : navigate('/rooms/new')
              )}
            >
              {applied.q || applied.publishStatus || applied.availability
                ? 'Xóa bộ lọc'
                : (
                  <>
                    <Icon name="plus" size={16} /> Tạo tin đầu tiên
                  </>
                )}
            </button>
          </div>
        )}

        {result?.totalPages > 1 && (
          <PaginationBar page={result.page} totalPages={result.totalPages} onPageChange={setPage} />
        )}
      </section>

      {hiding && (
        <ConfirmDialog
          title="Ẩn tin khỏi trang khách?"
          body={`“${hiding.title || 'Tin chưa có tiêu đề'}” sẽ được gỡ khỏi trang khách công khai ngay. Dữ liệu và ảnh vẫn được giữ nguyên để bạn bật lại bất kỳ lúc nào.`}
          confirmLabel="Ẩn tin"
          onCancel={() => setHiding(null)}
          onConfirm={() => {
            const target = hiding
            setHiding(null)
            executeStatusChange(target, 'HIDDEN')
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Chuyển tin vào lưu trữ?"
          body={`“${deleting.title || 'Tin chưa có tiêu đề'}” sẽ không còn xuất hiện với khách. Bạn có thể khôi phục tin này từ mục Đã lưu trữ.`}
          confirmLabel="Chuyển vào lưu trữ"
          tone="danger"
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}

function RoomTable({ rows, navigate, compact = false, onPublishChange, onAvailabilityChange, onDelete }) {
  return (
    <div className={`room-table-wrap${compact ? ' compact-table' : ''}`}>
      <table className="room-table">
        <thead>
          <tr>
            <th>PHÒNG / TIÊU ĐỀ</th>
            <th>GIÁ THUÊ</th>
            <th>TÌNH TRẠNG</th>
            <th>TRẠNG THÁI TIN</th>
            <th>CẬP NHẬT</th>
            {!compact && <th><span className="sr-only">Thao tác</span></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((room) => (
            <tr key={room.id}>
              <td>
                <div className="room-cell">
                  <button
                    className="room-thumb"
                    onClick={() => navigate(`/rooms/${room.id}`)}
                    aria-label={`Sửa ${room.title || 'tin phòng'}`}
                  >
                    {room.images?.[0] ? <SafeImage src={room.images[0].url} alt="" fallbackLabel="" /> : <Icon name="image" size={20} />}
                  </button>
                  <div className="room-title-cell">
                    <button onClick={() => navigate(`/rooms/${room.id}`)} className="room-name">
                      {room.title || 'Tin chưa có tiêu đề'}
                    </button>
                    <span>{[room.ward, room.district].filter(Boolean).join(', ') || 'Chưa nhập khu vực'}</span>
                  </div>
                </div>
              </td>
              <td className="price-cell">
                {room.priceVnd ? formatPriceVnd(room.priceVnd) : 'Chưa nhập'}
                <small>/ tháng</small>
              </td>
              <td>
                {onAvailabilityChange ? (
                  <select
                    className={`status-select availability-${room.availability.toLowerCase()}`}
                    aria-label={`Tình trạng ${room.title}`}
                    value={room.availability}
                    onChange={(e) => onAvailabilityChange(room, e.target.value)}
                  >
                    <option value="AVAILABLE">Còn trống</option>
                    <option value="RENTED">Đã thuê</option>
                  </select>
                ) : (
                  <StatusBadge status={room.availability} />
                )}
              </td>
              <td>
                {onPublishChange ? (
                  <select
                    className={`status-select publish-${room.publishStatus.toLowerCase()}`}
                    aria-label={`Trạng thái tin ${room.title}`}
                    value={room.publishStatus}
                    onChange={(e) => onPublishChange(room, e.target.value)}
                  >
                    <option value="PUBLISHED">Đang hiển thị</option>
                    <option value="DRAFT">Bản nháp</option>
                    <option value="HIDDEN">Đã ẩn</option>
                  </select>
                ) : (
                  <StatusBadge status={room.publishStatus} />
                )}
              </td>
              <td className="date-cell">{formatDateVn(room.updatedAt)}</td>
              {!compact && (
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      title="Xem trước"
                      aria-label={`Xem trước ${room.title}`}
                      onClick={() => navigate(`/rooms/${room.id}/preview`)}
                    >
                      <Icon name="eye" size={18} />
                    </button>
                    <button
                      className="icon-button"
                      title="Chỉnh sửa"
                      aria-label={`Chỉnh sửa ${room.title}`}
                      onClick={() => navigate(`/rooms/${room.id}`)}
                    >
                      <Icon name="edit" size={18} />
                    </button>
                    {onDelete && (
                      <button
                        className="icon-button danger-icon"
                        title="Lưu trữ"
                        aria-label={`Lưu trữ ${room.title}`}
                        onClick={() => onDelete(room)}
                      >
                        <Icon name="trash" size={18} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="room-card-list">
        {rows.map((room) => (
          <article className="room-mobile-card" key={room.id}>
            <div className="room-mobile-head">
              <button className="room-thumb" onClick={() => navigate(`/rooms/${room.id}`)}>
                {room.images?.[0] ? <SafeImage src={room.images[0].url} alt="" fallbackLabel="" /> : <Icon name="image" size={20} />}
              </button>
              <div className="room-title-cell">
                <button onClick={() => navigate(`/rooms/${room.id}`)} className="room-name">
                  {room.title || 'Tin chưa có tiêu đề'}
                </button>
                <span>{[room.ward, room.district].filter(Boolean).join(', ') || 'Chưa nhập khu vực'}</span>
                <strong className="mobile-price">
                  {room.priceVnd ? `${formatPriceVnd(room.priceVnd)} / tháng` : 'Chưa nhập giá'}
                </strong>
              </div>
            </div>
            <div className="mobile-card-status">
              <StatusBadge status={room.availability} />
              <StatusBadge status={room.publishStatus} />
            </div>
            <div className="mobile-actions">
              <button className="button button-small button-secondary" onClick={() => navigate(`/rooms/${room.id}`)}>
                <Icon name="edit" size={15} /> Sửa
              </button>
              {!compact && (
                <button className="button button-small button-quiet" onClick={() => navigate(`/rooms/${room.id}/preview`)}>
                  <Icon name="eye" size={15} /> Xem
                </button>
              )}
              {onDelete && !compact && (
                <button className="button button-small button-quiet danger-text" onClick={() => onDelete(room)}>
                  Lưu trữ
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function RoomTableSkeleton() {
  return (
    <div className="table-skeleton" aria-label="Đang tải danh sách">
      {Array.from({ length: 5 }, (_, i) => (
        <div className="skeleton-row" key={i}>
          <span /><span /><span /><span />
        </div>
      ))}
    </div>
  )
}

function RoomEditorPage({ roomId, navigate, showNotice }) {
  const [form, setForm] = useState(emptyListing)
  const [images, setImages] = useState([])
  const [availability, setAvailability] = useState('AVAILABLE')
  const [publishStatus, setPublishStatus] = useState('DRAFT')
  const [version, setVersion] = useState(1)
  const [loading, setLoading] = useState(Boolean(roomId))
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadErrors, setUploadErrors] = useState([])
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [savedSnapshot, setSavedSnapshot] = useState(() => (roomId ? '' : JSON.stringify(emptyListing)))
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmHide, setConfirmHide] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState('')
  const [imageToRemove, setImageToRemove] = useState(null)
  const pendingUrlsRef = useRef(new Set())

  const isDirty = (savedSnapshot !== '' && JSON.stringify(form) !== savedSnapshot) || (!roomId && images.length > 0)

  useEffect(() => {
    const urls = pendingUrlsRef.current
    return () => {
      for (const url of urls) URL.revokeObjectURL(url)
      urls.clear()
    }
  }, [])

  useEffect(() => {
    if (!roomId) return
    let active = true
    api(`/admin/rooms/${roomId}`)
      .then(({ item }) => {
        if (!active) return
        const nextForm = {
          ...emptyListing,
          ...item,
          amenities: (item.amenities || []).filter((amenity) => AMENITIES.includes(amenity)),
        }
        setForm(nextForm)
        setImages(item.images || [])
        setAvailability(item.availability)
        setPublishStatus(item.publishStatus)
        setVersion(item.version || 1)
        setSavedSnapshot(JSON.stringify(nextForm))
      })
      .catch((caught) => {
        if (active) setError(caught.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [roomId])

  useEffect(() => {
    if (!isDirty) return
    const warn = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    const guard = (event) => {
      if (!event.detail?.to) return
      event.preventDefault()
      setPendingNavigation(event.detail.to)
      setConfirmLeave(true)
    }
    window.addEventListener('beforeunload', warn)
    window.addEventListener('room-admin-navigation', guard)
    return () => {
      window.removeEventListener('beforeunload', warn)
      window.removeEventListener('room-admin-navigation', guard)
    }
  }, [isDirty])

  const update = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }))
    setFieldErrors((previous) => {
      const next = { ...previous }
      delete next[key]
      return next
    })
  }

  const requestData = () =>
    Object.fromEntries(
      editableKeys.map((key) => [
        key,
        key === 'priceVnd' || key === 'areaM2'
          ? (form[key] === '' || form[key] === null ? null : Number(form[key]))
          : form[key],
      ]),
    )

  const save = async (quiet = false) => {
    setBusy(true)
    setError('')
    setFieldErrors({})
    try {
      const payload = requestData()
      const response = roomId
        ? await api(`/admin/rooms/${roomId}`, { method: 'PUT', json: { ...payload, version } })
        : await api('/admin/rooms', { method: 'POST', json: { ...payload, availability } })
      const item = response.item
      if (!roomId) {
        const pendingFiles = images.filter((image) => image.file)
        let uploadedCount = 0
        const uploadFailures = []
        for (let i = 0; i < pendingFiles.length; i += 1) {
          const pending = pendingFiles[i]
          setUploading(`Đang tải ảnh ${i + 1} / ${pendingFiles.length}…`)
          const body = new FormData()
          body.append('file', pending.file)
          try {
            await api(`/admin/rooms/${item.id}/images`, { method: 'POST', body })
            uploadedCount += 1
          } catch (caught) {
            uploadFailures.push(`${pending.originalName}: ${caught.message}`)
          }
        }
        setUploading('')
        setSavedSnapshot(JSON.stringify(form))
        navigate(`/rooms/${item.id}`, { force: true })
        if (!pendingFiles.length) {
          showNotice('Bản nháp đã được lưu. Bạn có thể kiểm tra và bấm Xuất bản khi sẵn sàng.')
        } else if (!uploadFailures.length) {
          showNotice(`Bản nháp đã được lưu kèm ${uploadedCount} ảnh (đã chọn ảnh bìa). Bạn có thể xem lại trước khi xuất bản.`)
        } else {
          showNotice(
            `Đã lưu bản nháp và tải lên ${uploadedCount}/${pendingFiles.length} ảnh. Hãy tải lại các ảnh bị lỗi trong màn chỉnh sửa.`,
            'info',
          )
        }
        return item
      }
      setSavedSnapshot(JSON.stringify(form))
      setAvailability(item.availability)
      setPublishStatus(item.publishStatus)
      setVersion(item.version || version + 1)
      if (!quiet) showNotice('Thông tin tin phòng đã được lưu.')
      return item
    } catch (caught) {
      setUploading('')
      setError(caught.message)
      if (caught.fieldErrors) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(caught.fieldErrors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
          ),
        )
      }
      throw caught
    } finally {
      setBusy(false)
    }
  }

  const uploadFilesList = async (files) => {
    if (!files.length || uploading || images.length >= 15) return
    setError('')
    setUploadErrors([])

    if (!roomId) {
      const remainingSlots = Math.max(0, 15 - images.length)
      const perFileErrors = []
      const queued = []

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i]
        if (queued.length >= remainingSlots) {
          perFileErrors.push({ name: file.name, message: 'Vượt quá giới hạn tối đa 15 ảnh mỗi tin.' })
          continue
        }
        const invalidMessage = validateDraftImageFile(file)
        if (invalidMessage) {
          perFileErrors.push({ name: file.name, message: invalidMessage })
          continue
        }
        const url = URL.createObjectURL(file)
        pendingUrlsRef.current.add(url)
        queued.push({
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${i}`,
          file,
          url,
          originalName: file.name,
          altText: file.name,
          isCover: false,
          isLocal: true,
        })
      }

      if (queued.length > 0) {
        setImages((current) => {
          const combined = [...current, ...queued]
          return combined.map((img, index) => ({ ...img, isCover: index === 0 }))
        })
        showNotice(
          perFileErrors.length
            ? `Đã thêm ${queued.length} ảnh vào bản nháp; ${perFileErrors.length} ảnh không hợp lệ.`
            : `Đã thêm ${queued.length} ảnh. Chọn "Đặt làm bìa" để đổi ảnh nền nếu muốn.`,
        )
      }
      setUploadErrors(perFileErrors)
      return
    }

    let completed = 0
    const perFileErrors = []

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i]
      setUploading(`Đang tải ảnh ${i + 1} / ${files.length}…`)
      const body = new FormData()
      body.append('file', file)
      try {
        await api(`/admin/rooms/${roomId}/images`, { method: 'POST', body })
        completed += 1
      } catch (caught) {
        perFileErrors.push({ name: file.name, message: caught.message })
      }
    }

    setUploading('')
    setUploadErrors(perFileErrors)
    const refreshed = await api(`/admin/rooms/${roomId}`).catch(() => null)
    if (refreshed) {
      setImages(refreshed.item.images || [])
      setVersion(refreshed.item.version || version)
    }
    if (completed) {
      showNotice(
        perFileErrors.length
          ? `${completed} ảnh đã tải lên; ${perFileErrors.length} ảnh không hợp lệ.`
          : `${completed} ảnh đã được tải lên.`,
      )
    }
  }

  const uploadFiles = (event) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    uploadFilesList(files)
  }

  const applyImageOrder = async (nextImages, noticeText = '') => {
    if (!roomId) {
      setImages(nextImages.map((img, idx) => ({ ...img, isCover: idx === 0 })))
      if (noticeText) showNotice(noticeText)
      return
    }
    try {
      const result = await api(`/admin/rooms/${roomId}/images/order`, {
        method: 'PATCH',
        json: { imageIds: nextImages.map((image) => image.id) },
      })
      setImages(result.items)
      if (result.version) setVersion(result.version)
      if (noticeText) showNotice(noticeText)
    } catch (caught) {
      setError(caught.message)
    }
  }

  const reorder = async (index, direction) => {
    const next = [...images]
    const target = index + direction
    if (target < 0 || target >= next.length) return
      ;[next[index], next[target]] = [next[target], next[index]]
    await applyImageOrder(next)
  }

  const makeCover = async (index) => {
    if (index <= 0 || index >= images.length) return
    const next = [...images]
    const [chosen] = next.splice(index, 1)
    next.unshift(chosen)
    await applyImageOrder(next, 'Đã chọn ảnh làm ảnh bìa.')
  }

  const handleRemoveImageClick = (image) => {
    if (!roomId) {
      if (image.url && pendingUrlsRef.current.has(image.url)) {
        URL.revokeObjectURL(image.url)
        pendingUrlsRef.current.delete(image.url)
      }
      setImages((current) =>
        current.filter((item) => item.id !== image.id).map((item, idx) => ({ ...item, isCover: idx === 0 })),
      )
      showNotice('Đã gỡ ảnh khỏi danh sách chờ.')
      return
    }
    setImageToRemove(image)
  }

  const removeImage = async () => {
    if (!imageToRemove) return
    try {
      await api(`/admin/rooms/${roomId}/images/${imageToRemove.id}`, { method: 'DELETE' })
      const refreshed = await api(`/admin/rooms/${roomId}`).catch(() => null)
      if (refreshed) {
        setImages(refreshed.item.images || [])
        setVersion(refreshed.item.version || version)
      } else {
        setImages((current) => current.filter((item) => item.id !== imageToRemove.id))
      }
      showNotice('Ảnh đã được gỡ khỏi tin.')
    } catch (caught) {
      setError(caught.message)
    } finally {
      setImageToRemove(null)
    }
  }

  const setStatus = async (status) => {
    setBusy(true)
    setError('')
    setFieldErrors({})
    try {
      if (status === 'HIDDEN' || status === 'DRAFT') {
        const result = await api(`/admin/rooms/${roomId}/publish-status`, {
          method: 'PATCH',
          json: { publishStatus: status },
        })
        setPublishStatus(result.item.publishStatus)
        setVersion(result.item.version || version)
        await save(true)
      } else {
        const saved = await save(true)
        const result = await api(`/admin/rooms/${roomId}/publish-status`, {
          method: 'PATCH',
          json: { publishStatus: status },
        })
        setPublishStatus(result.item.publishStatus)
        setVersion(result.item.version || saved?.version || version)
      }
      showNotice(
        status === 'PUBLISHED'
          ? 'Tin đã được xuất bản.'
          : status === 'HIDDEN'
            ? 'Tin đã được ẩn khỏi trang khách.'
            : 'Tin đã được chuyển về bản nháp.',
      )
      if (status === 'PUBLISHED') {
        navigate('/', { force: true })
      }
    } catch (caught) {
      setError(caught.message)
      if (caught.fieldErrors) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(caught.fieldErrors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
          ),
        )
      }
    } finally {
      setBusy(false)
    }
  }

  const changeAvailability = async (value) => {
    if (!roomId) {
      setAvailability(value)
      return
    }
    const previous = availability
    setAvailability(value)
    try {
      const updated = await api(`/admin/rooms/${roomId}/availability`, { method: 'PATCH', json: { availability: value } })
      if (updated?.item?.version) setVersion(updated.item.version)
      showNotice('Tình trạng phòng đã cập nhật.')
    } catch (caught) {
      setAvailability(previous)
      setError(caught.message)
    }
  }

  const removeListing = async () => {
    try {
      await api(`/admin/rooms/${roomId}`, { method: 'DELETE' })
      showNotice('Tin đã chuyển vào mục đã lưu trữ.')
      navigate('/rooms')
    } catch (caught) {
      setError(caught.message)
    }
  }

  const toggleAmenity = (value) =>
    update(
      'amenities',
      form.amenities.includes(value) ? form.amenities.filter((item) => item !== value) : [...form.amenities, value],
    )

  const fieldError = (key) => fieldErrors[key] && <small className="field-error">{fieldErrors[key]}</small>

  if (loading) {
    return (
      <div className="editor-loading">
        <span className="spinner dark-spinner" /> Đang tải thông tin tin phòng…
      </div>
    )
  }

  if (error && roomId && !form.id) {
    return (
      <div className="page-alert" role="alert">
        <span>{error}</span>
        <button className="button button-small button-secondary" onClick={() => navigate('/rooms')}>
          Về danh sách
        </button>
      </div>
    )
  }

  return (
    <div className="editor-page">
      <PageHeading
        eyebrow={roomId ? 'CHỈNH SỬA NỘI DUNG' : 'THÊM PHÒNG MỚI'}
        title={roomId ? (form.title || 'Tin chưa có tiêu đề') : 'Tạo tin phòng'}
        description={
          roomId
            ? `Cập nhật lần cuối ${form.updatedAt ? new Date(form.updatedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : ''}`
            : 'Nhập thông tin, chọn tiện nghi và tải ảnh phòng (chọn ảnh bìa) ngay tại đây. Hoàn tất sẽ lưu thành bản nháp để bạn quyết định xuất bản sau.'
        }
        back={() => navigate('/rooms')}
        action={
          roomId && (
            <div className="heading-status">
              <StatusBadge status={availability} />
              <StatusBadge status={publishStatus} />
            </div>
          )
        }
      />

      {error && (
        <div className="form-alert editor-alert" role="alert">
          <Icon name="shield" size={18} />
          <span>{error}</span>
        </div>
      )}

      {Object.keys(fieldErrors).length > 0 && (
        <div className="publish-checklist" role="alert">
          <strong>Chưa thể xuất bản tin này</strong>
          <p>Hãy hoàn thiện các mục sau. Bản nháp và thông tin đã lưu vẫn được giữ nguyên.</p>
          <ul>
            {Object.entries(fieldErrors).map(([key, value]) => (
              <li key={key}>
                <a href={`#field-${key}`}>{value}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        className="listing-form"
        onSubmit={(event) => {
          event.preventDefault()
          save().catch(() => { })
        }}
      >
        <div className="form-main-column">
          <section className="panel form-section">
            <div className="section-heading">
              <span className="section-number">01</span>
              <div>
                <h2>Thông tin phòng</h2>
                <p>Giúp khách hình dung rõ không gian cho thuê.</p>
              </div>
            </div>
            <div className="field-grid">
              <label className="field field-span-2" id="field-title">
                <span>Tiêu đề tin <b>*</b></span>
                <input
                  maxLength="120"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="Ví dụ: Phòng có gác, cửa sổ thoáng gần Hàng Xanh, Bình Thạnh"
                />
                {fieldError('title')}
                <small className="field-hint">10–120 ký tự để xuất bản · {form.title.length}/120</small>
              </label>

              <label className="field field-span-2" id="field-description">
                <span>Mô tả chi tiết <b>*</b></span>
                <textarea
                  rows="6"
                  maxLength="5000"
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Mô tả không gian, ánh sáng, lối đi, giờ giấc và các lưu ý cho khách thuê…"
                />
                {fieldError('description')}
                <small className="field-hint">Tối thiểu 30 ký tự để xuất bản · {form.description.length}/5000</small>
              </label>

              <label className="field" id="field-roomType">
                <span>Loại phòng <b>*</b></span>
                <select value={form.roomType} onChange={(e) => update('roomType', e.target.value)}>
                  <option value="">Chọn loại phòng</option>
                  {ROOM_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {fieldError('roomType')}
              </label>

              <label className="field" id="field-availability">
                <span>Tình trạng phòng</span>
                <select value={availability} onChange={(e) => changeAvailability(e.target.value)}>
                  <option value="AVAILABLE">Còn trống</option>
                  <option value="RENTED">Đã thuê</option>
                </select>
                {fieldError('availability')}
                <small className="field-hint">Độc lập với trạng thái hiển thị của tin.</small>
              </label>
            </div>
          </section>

          <section className="panel form-section">
            <div className="section-heading">
              <span className="section-number">02</span>
              <div>
                <h2>Giá và diện tích</h2>
                <p>Thông tin khách thường muốn xem đầu tiên.</p>
              </div>
            </div>
            <div className="field-grid">
              <label className="field" id="field-priceVnd">
                <span>Giá thuê mỗi tháng <b>*</b></span>
                <span className="unit-input">
                  <input
                    inputMode="numeric"
                    type="number"
                    min="1"
                    step="1"
                    value={form.priceVnd ?? ''}
                    onChange={(e) => update('priceVnd', e.target.value === '' ? null : e.target.value)}
                  />
                  <i>VND / tháng</i>
                </span>
                {fieldError('priceVnd')}
              </label>

              <label className="field" id="field-areaM2">
                <span>Diện tích <b>*</b></span>
                <span className="unit-input">
                  <input
                    inputMode="decimal"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.areaM2 ?? ''}
                    onChange={(e) => update('areaM2', e.target.value === '' ? null : e.target.value)}
                  />
                  <i>m²</i>
                </span>
                {fieldError('areaM2')}
              </label>
            </div>
          </section>

          <section className="panel form-section">
            <div className="section-heading">
              <span className="section-number">03</span>
              <div>
                <h2>Địa chỉ và khu vực</h2>
                <p>Địa chỉ đầy đủ được giữ riêng tư theo mặc định.</p>
              </div>
            </div>
            <div className="field-grid">
              <label className="field field-span-2" id="field-publicAddress">
                <span>Khu vực khách sẽ thấy <b>*</b></span>
                <input
                  value={form.publicAddress}
                  onChange={(e) => update('publicAddress', e.target.value)}
                  placeholder="Ví dụ: Gần cầu Điện Biên Phủ, đường Xô Viết Nghệ Tĩnh"
                />
                {fieldError('publicAddress')}
              </label>

              <label className="field" id="field-ward">
                <span>Phường <b>*</b></span>
                <select value={form.ward} onChange={(e) => update('ward', e.target.value)}>
                  <option value="">Chọn phường (Bình Thạnh 2026)</option>
                  {form.ward && !BINH_THANH_WARDS.includes(form.ward) && (
                    <option value={form.ward}>{form.ward} (tên cũ)</option>
                  )}
                  {BINH_THANH_WARDS.map((wardName) => (
                    <option key={wardName} value={wardName}>{wardName}</option>
                  ))}
                </select>
                {fieldError('ward')}
              </label>

              <label className="field">
                <span>Quận</span>
                <input value={form.district} onChange={(e) => update('district', e.target.value)} />
              </label>

              <label className="field field-span-2" id="field-privateAddress">
                <span>
                  Địa chỉ đầy đủ <small className="optional">chỉ lưu nội bộ trừ khi bạn bật công khai</small>
                </span>
                <input
                  value={form.privateAddress}
                  onChange={(e) => update('privateAddress', e.target.value)}
                  placeholder="Số nhà, tên đường, phường…"
                />
                {fieldError('privateAddress')}
                <span className="check-row">
                  <input
                    type="checkbox"
                    checked={form.allowExactAddress}
                    onChange={(e) => update('allowExactAddress', e.target.checked)}
                  />
                  <span>Cho phép hiển thị địa chỉ đầy đủ cho khách ở tin này</span>
                </span>
              </label>
            </div>
          </section>

          <section className="panel form-section">
            <div className="section-heading">
              <span className="section-number">04</span>
              <div>
                <h2>Nội thất và tiện nghi</h2>
                <p>Chọn những tiện nghi có sẵn trong phòng.</p>
              </div>
            </div>
            <div className="amenities-grid">
              {AMENITIES.map((amenity) => (
                <label
                  className={`amenity-chip${form.amenities.includes(amenity) ? ' is-selected' : ''}`}
                  key={amenity}
                >
                  <input
                    type="checkbox"
                    checked={form.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                  />
                  <span className="chip-check"><Icon name="check" size={12} /></span>
                  {amenity}
                </label>
              ))}
            </div>
          </section>

          <section className="panel form-section" id="field-images">
            <div className="section-heading">
              <span className="section-number">05</span>
              <div>
                <h2>Hình ảnh phòng</h2>
                <p>Ảnh rõ, chân thực giúp khách dễ quyết định hơn. Chọn ảnh làm ảnh bìa ngay trước khi lưu.</p>
              </div>
              <span className="section-counter">{images.length} / 15</span>
            </div>

            <label
              className={`upload-dropzone${uploading ? ' is-uploading' : ''}${isDragOver ? ' is-dragover' : ''}`}
              onDragOver={(event) => {
                event.preventDefault()
                if (!uploading && images.length < 15) setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(event) => {
                event.preventDefault()
                setIsDragOver(false)
                const files = Array.from(event.dataTransfer?.files || [])
                uploadFilesList(files)
              }}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={uploadFiles}
                disabled={Boolean(uploading) || images.length >= 15}
              />
              <span className="upload-icon"><Icon name="upload" size={21} /></span>
              <strong>{uploading || (images.length >= 15 ? 'Đã đạt giới hạn 15 ảnh' : 'Chọn hoặc kéo thả ảnh từ thiết bị')}</strong>
              <small>Hỗ trợ JPEG, PNG hoặc WebP · tối đa 10 MB mỗi ảnh ({images.length}/15)</small>
              <span className="button button-secondary button-small">Chọn hình ảnh</span>
            </label>

            {uploadErrors.length > 0 && (
              <div className="upload-file-errors" role="alert">
                <strong>Một số tệp chưa thể tải lên:</strong>
                <ul>
                  {uploadErrors.map((item, idx) => (
                    <li key={`${item.name}-${idx}`}>
                      <span>{item.name}</span>: {item.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {images.length > 0 && (
              <div className="image-grid">
                {images.map((image, index) => (
                  <article className={`image-tile${image.isCover ? ' is-cover' : ''}`} key={image.id}>
                    <SafeImage src={image.url} alt={image.altText || image.originalName} fallbackLabel="Lỗi tải ảnh" />
                    {image.isCover ? (
                      <span className="cover-label">
                        <Icon name="star" size={13} filled /> Ảnh bìa
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="set-cover-btn"
                        onClick={() => makeCover(index)}
                        title="Chọn làm ảnh bìa hiển thị ngoài danh sách"
                      >
                        <Icon name="star" size={13} /> Đặt làm bìa
                      </button>
                    )}
                    <div className="image-controls">
                      <span>#{index + 1}</span>
                      <div>
                        <button
                          type="button"
                          aria-label="Đưa ảnh lên trước"
                          disabled={index === 0 || Boolean(uploading)}
                          onClick={() => reorder(index, -1)}
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          aria-label="Đưa ảnh xuống sau"
                          disabled={index === images.length - 1 || Boolean(uploading)}
                          onClick={() => reorder(index, 1)}
                        >
                          →
                        </button>
                        <button
                          type="button"
                          aria-label="Gỡ ảnh"
                          disabled={Boolean(uploading)}
                          onClick={() => handleRemoveImageClick(image)}
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {fieldError('images')}
          </section>

          <section className="panel form-section">
            <div className="section-heading">
              <span className="section-number">06</span>
              <div>
                <h2>Thông tin liên hệ</h2>
                <p>Bạn chọn rõ kênh nào khách có thể nhìn thấy khi tin được xuất bản.</p>
              </div>
            </div>
            <div className="field-grid">
              <label className="field" id="field-contactPhone">
                <span>Số điện thoại</span>
                <input
                  inputMode="tel"
                  value={form.contactPhone}
                  onChange={(e) => update('contactPhone', e.target.value)}
                  placeholder="09xx xxx xxx"
                />
                {fieldError('contactPhone')}
                <span className="check-row">
                  <input
                    type="checkbox"
                    checked={form.allowPublicPhone}
                    onChange={(e) => update('allowPublicPhone', e.target.checked)}
                  />
                  <span>Cho phép khách xem số điện thoại</span>
                </span>
              </label>

              <label className="field" id="field-contactZalo">
                <span>Thông tin Zalo</span>
                <input
                  value={form.contactZalo}
                  onChange={(e) => update('contactZalo', e.target.value)}
                  placeholder="Số điện thoại hoặc https://zalo.me/..."
                />
                {fieldError('contactZalo')}
                <span className="check-row">
                  <input
                    type="checkbox"
                    checked={form.allowPublicZalo}
                    onChange={(e) => update('allowPublicZalo', e.target.checked)}
                  />
                  <span>Cho phép khách liên hệ qua Zalo</span>
                </span>
              </label>

              <div className="field-span-2" id="field-contact">{fieldError('contact')}</div>
            </div>
          </section>

          <section className="form-action-bar">
            <div className="save-state">
              {isDirty ? (
                <>
                  <span className="unsaved-dot" /> Có thay đổi chưa lưu
                </>
              ) : (
                <>
                  <Icon name="check" size={16} /> Nội dung đã lưu
                </>
              )}
            </div>
            <div className="form-actions">
              <button type="button" className="button button-quiet" onClick={() => navigate('/rooms')}>
                Quay lại
              </button>
              <button type="submit" className="button button-secondary" disabled={busy || Boolean(uploading)}>
                {busy || uploading ? <span className="spinner dark-spinner" /> : <Icon name="check" size={16} />}
                {!roomId ? 'Hoàn thành & Lưu bản nháp' : publishStatus === 'PUBLISHED' ? 'Lưu thay đổi' : 'Lưu nháp'}
              </button>
              {roomId && (
                <button
                  type="button"
                  className="button button-primary"
                  disabled={busy}
                  onClick={() => setStatus('PUBLISHED')}
                >
                  {publishStatus === 'PUBLISHED' ? 'Cập nhật tin' : 'Xuất bản'} <Icon name="arrow" size={16} />
                </button>
              )}
            </div>
          </section>
        </div>

        <aside className="form-side-column">
          <div className="panel publish-panel">
            <span className="eyebrow">TRẠNG THÁI TIN</span>
            <div className="publish-status-head">
              <StatusBadge status={publishStatus} />
              <span>
                {publishStatus === 'PUBLISHED'
                  ? 'Khách có thể xem tin này trên trang công khai.'
                  : publishStatus === 'HIDDEN'
                    ? 'Tin hiện đang được ẩn khỏi khách.'
                    : 'Chỉ bạn xem được bản nháp này.'}
              </span>
            </div>
            {roomId && (
              <button
                type="button"
                className="button button-secondary button-wide"
                onClick={() => navigate(`/rooms/${roomId}/preview`)}
              >
                <Icon name="eye" size={16} /> Xem trước tin
              </button>
            )}
            {roomId && publishStatus === 'PUBLISHED' && (
              <button type="button" className="text-button hide-link" onClick={() => setConfirmHide(true)}>
                Ẩn tin khỏi khách
              </button>
            )}
            {roomId && publishStatus === 'HIDDEN' && (
              <button type="button" className="text-button hide-link" onClick={() => setStatus('DRAFT')}>
                Chuyển về bản nháp
              </button>
            )}
            <div className="publish-divider" />
            <p className="publish-tip">
              <Icon name="shield" size={16} /> Chỉ xuất bản khi thông tin, ảnh và ít nhất một kênh liên hệ đã đầy đủ.
            </p>
          </div>

          <div className="form-tip-card">
            <span className="tip-icon"><Icon name="location" size={18} /></span>
            <strong>Địa chỉ luôn riêng tư theo mặc định</strong>
            <p>Chỉ khu vực/phường được chia sẻ. Bạn có thể cho phép hiển thị địa chỉ đầy đủ riêng cho từng tin.</p>
          </div>

          {roomId && (
            <button type="button" className="delete-listing-button" onClick={() => setConfirmDelete(true)}>
              <Icon name="trash" size={16} /> Chuyển tin vào lưu trữ
            </button>
          )}
        </aside>
      </form>

      {confirmHide && (
        <ConfirmDialog
          title="Ẩn tin khỏi trang khách?"
          body={`“${form.title || 'Tin chưa có tiêu đề'}” sẽ bị gỡ khỏi trang khách công khai ngay. Dữ liệu và ảnh vẫn được giữ nguyên để bạn bật lại sau.`}
          confirmLabel="Ẩn tin"
          onCancel={() => setConfirmHide(false)}
          onConfirm={() => {
            setConfirmHide(false)
            setStatus('HIDDEN')
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Chuyển tin vào lưu trữ?"
          body={`“${form.title || 'Tin chưa có tiêu đề'}” sẽ không còn xuất hiện với khách. Bạn có thể khôi phục tin từ mục Đã lưu trữ.`}
          confirmLabel="Chuyển vào lưu trữ"
          tone="danger"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false)
            removeListing()
          }}
        />
      )}

      {imageToRemove && (
        <ConfirmDialog
          title="Gỡ ảnh khỏi tin này?"
          body={`Ảnh “${imageToRemove.originalName}” sẽ bị gỡ khỏi tin. Nếu đây là ảnh bìa, ảnh tiếp theo sẽ tự động thay thế.`}
          confirmLabel="Gỡ ảnh"
          tone="danger"
          onCancel={() => setImageToRemove(null)}
          onConfirm={removeImage}
        />
      )}

      {confirmLeave && (
        <ConfirmDialog
          title="Rời trang khi chưa lưu?"
          body="Những thay đổi bạn vừa nhập sẽ không được lưu nếu rời trang bây giờ."
          confirmLabel="Rời trang"
          onCancel={() => {
            setConfirmLeave(false)
            setPendingNavigation('')
          }}
          onConfirm={() => {
            const destination = pendingNavigation
            setConfirmLeave(false)
            setPendingNavigation('')
            navigate(destination, { force: true })
          }}
        />
      )}
    </div>
  )
}

function RoomPreviewPage({ roomId, navigate }) {
  const [item, setItem] = useState(null)
  const [error, setError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    let active = true
    api(`/admin/rooms/${roomId}/preview`)
      .then((data) => {
        if (!active) return
        setItem(data.item)
        setError('')
      })
      .catch((caught) => {
        if (active) setError(caught.message)
      })
    return () => {
      active = false
    }
  }, [roomId, reloadTick])

  if (error) {
    return (
      <div className="page-alert" role="alert">
        <span>{error}</span>
        <div className="error-retry-actions">
          <button className="button button-small button-secondary" onClick={() => setReloadTick((n) => n + 1)}>
            Thử lại
          </button>
          <button className="button button-small button-quiet" onClick={() => navigate(`/rooms/${roomId}`)}>
            Quay lại chỉnh sửa
          </button>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="editor-loading">
        <span className="spinner dark-spinner" /> Đang tạo bản xem trước…
      </div>
    )
  }

  const displayAddress = item.allowExactAddress && item.privateAddress
    ? item.privateAddress
    : [item.publicAddress, item.ward, item.district, item.city].filter(Boolean).join(', ')
  const zaloHref = item.allowPublicZalo ? buildZaloHref(item.contactZalo) : ''

  return (
    <div className="preview-admin">
      <div className="preview-banner">
        <span><Icon name="eye" size={18} /> BẢN XEM TRƯỚC RIÊNG TƯ</span>
        <span>Chỉ bạn có thể xem đường dẫn này trước khi xuất bản</span>
        <button className="button button-secondary button-small" onClick={() => navigate(`/rooms/${roomId}`)}>
          <Icon name="edit" size={15} /> Quay lại chỉnh sửa
        </button>
      </div>

      <div className="detail-layout">
        <div>
          <RoomGallery images={item.images} title={item.title || 'Xem trước phòng'} />
          <div className="detail-content-stack">
            <section className="detail-block">
              <h2>Mô tả chi tiết</h2>
              <p className="detail-description">{item.description || 'Mô tả căn phòng sẽ hiển thị ở khu vực này.'}</p>
            </section>
            {item.amenities?.length > 0 && (
              <section className="detail-block">
                <h2>Nội thất &amp; Tiện nghi có sẵn</h2>
                <div className="detail-amenities-grid">
                  {item.amenities.map((amenity) => (
                    <div className="detail-amenity-item" key={amenity}>
                      <Icon name="check" size={16} />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        <aside className="detail-summary-card">
          <div className="detail-summary-badges">
            <StatusBadge status={item.availability} />
            <span className="room-type-pill">{item.roomType || 'Chưa chọn loại phòng'}</span>
          </div>

          <h1>{item.title || 'Tiêu đề phòng'}</h1>

          <div className="detail-price-box">
            <div className="detail-price-main">
              {item.priceVnd ? formatPriceVnd(item.priceVnd) : 'Chưa có giá'} <small>/ tháng</small>
            </div>
          </div>

          <ul className="detail-facts-list">
            <li>
              <Icon name="maximize" size={18} />
              <span>Diện tích sử dụng: <strong>{item.areaM2 ? `${item.areaM2} m²` : 'Chưa nhập'}</strong></span>
            </li>
            <li>
              <Icon name="location" size={18} />
              <span>Vị trí: <strong>{displayAddress || 'Chưa nhập khu vực'}</strong></span>
            </li>
            <li>
              <Icon name="calendar" size={18} />
              <span>Cập nhật: <strong>{formatDateVn(item.updatedAt)}</strong></span>
            </li>
          </ul>

          <div className="detail-contact-actions">
            {item.allowPublicPhone && item.contactPhone && (
              <a href={`tel:${item.contactPhone}`} className="button button-primary button-wide">
                <Icon name="phone" size={18} /> Gọi xem phòng: {item.contactPhone}
              </a>
            )}
            {zaloHref && (
              <a href={zaloHref} target="_blank" rel="noopener noreferrer" className="button button-zalo button-wide">
                <Icon name="message" size={18} /> Nhắn tin qua Zalo
              </a>
            )}
            {!item.allowPublicPhone && !item.allowPublicZalo && (
              <div className="detail-no-contact">
                Chưa bật kênh liên hệ công khai cho tin này.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function ArchivedPage({ showNotice }) {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [reloadTick, setReloadTick] = useState(0)
  const [loadedKey, setLoadedKey] = useState(null)
  const requestKey = `${page}|${reloadTick}`
  const busy = loadedKey !== requestKey

  useEffect(() => {
    let active = true
    const key = `${page}|${reloadTick}`
    api(`/admin/rooms/archived?page=${page}&pageSize=12`)
      .then((res) => {
        if (!active) return
        setResult(res)
        setError('')
        setLoadedKey(key)
      })
      .catch((caught) => {
        if (!active) return
        setError(caught.message)
        setLoadedKey(key)
      })
    return () => {
      active = false
    }
  }, [page, reloadTick])

  const load = () => setReloadTick((n) => n + 1)

  const restore = async (room) => {
    try {
      await api(`/admin/rooms/${room.id}/restore`, { method: 'POST' })
      showNotice('Tin đã được khôi phục thành bản nháp.')
      load()
    } catch (caught) {
      setError(caught.message)
    }
  }

  return (
    <div className="rooms-page">
      <PageHeading
        eyebrow="LƯU TRỮ AN TOÀN"
        title="Tin đã lưu trữ"
        description="Những tin đã chuyển khỏi danh sách hoạt động. Bạn có thể khôi phục về bản nháp bất kỳ lúc nào."
      />
      {error && (
        <div className="inline-error error-retry-row" role="alert">
          <span>{error}</span>
          <button type="button" className="button button-small button-secondary" onClick={load}>
            Thử lại
          </button>
        </div>
      )}
      <section className="panel listing-panel">
        <div className="list-meta">
          <span>{busy ? 'Đang tải…' : `${result?.totalItems || 0} tin đã lưu trữ`}</span>
          <span>Tin đã lưu trữ không xuất hiện với khách</span>
        </div>
        {busy ? (
          <RoomTableSkeleton />
        ) : result?.items.length ? (
          <div className="archive-list">
            {result.items.map((room) => (
              <article className="archive-item" key={room.id}>
                <span className="archive-room-icon"><Icon name="archive" /></span>
                <div>
                  <strong>{room.title || 'Tin chưa có tiêu đề'}</strong>
                  <small>
                    {[room.ward, room.district].filter(Boolean).join(', ') || 'Chưa nhập khu vực'} · Đã lưu{' '}
                    {formatDateVn(room.deletedAt)}
                  </small>
                </div>
                <button className="button button-secondary button-small" onClick={() => restore(room)}>
                  <Icon name="refresh" size={15} /> Khôi phục về nháp
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-illustration"><Icon name="archive" size={28} /></span>
            <strong>Chưa có tin nào được lưu trữ</strong>
            <p>Các tin phòng được chuyển vào lưu trữ sẽ hiển thị an toàn tại đây.</p>
          </div>
        )}
        {result?.totalPages > 1 && (
          <PaginationBar page={result.page} totalPages={result.totalPages} onPageChange={setPage} />
        )}
      </section>
    </div>
  )
}

/* =========================================================
   SHARED DIALOGS & FEEDBACK
   ========================================================= */
function ConfirmDialog({ title, body, confirmLabel, tone = 'neutral', onCancel, onConfirm }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  return (
    <div
      className="modal-scrim"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <section
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
      >
        <span className={`confirm-icon ${tone}`}>
          <Icon name={tone === 'danger' ? 'trash' : 'logout'} size={22} />
        </span>
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-body">{body}</p>
        <div className="confirm-actions">
          <button className="button button-secondary" onClick={onCancel}>Hủy</button>
          <button className={`button ${tone === 'danger' ? 'button-danger' : 'button-primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}

function Toast({ notice }) {
  return (
    <div className={`toast toast-${notice.type}`} role="status">
      <span className="toast-icon"><Icon name={notice.type === 'success' ? 'check' : 'shield'} size={16} /></span>
      {notice.text}
    </div>
  )
}

function NotFound({
  navigate,
  homePath = '/',
  homeLabel = 'Về tổng quan quản trị',
  title = 'Không tìm thấy trang này',
  description = 'Địa chỉ có thể đã thay đổi hoặc không còn tồn tại.',
}) {
  return (
    <main className="not-found">
      <span className="not-found-code">404</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <button className="button button-primary" onClick={() => navigate(homePath)}>
        {homeLabel} <Icon name="arrow" size={16} />
      </button>
    </main>
  )
}

export default App
