import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from './components/Icon.jsx'
import { api } from './lib/api.js'
import { branding } from './branding.js'
import './App.css'

const ROOM_TYPES = ['Phòng trọ', 'Phòng có gác', 'Phòng studio', 'Căn hộ mini', 'Phòng ở ghép']
const AMENITIES = [
  'Máy lạnh', 'Tủ lạnh', 'Máy giặt', 'Giường', 'Tủ quần áo', 'Bếp riêng',
  'Nhà vệ sinh riêng', 'Ban công', 'Gác lửng', 'Wifi', 'Chỗ để xe', 'Cửa sổ',
]

const emptyListing = {
  title: '', description: '', roomType: '', priceVnd: null, areaM2: null, amenities: [],
  ward: '', district: 'Bình Thạnh', city: 'TP. Hồ Chí Minh', publicAddress: '', privateAddress: '',
  allowExactAddress: false, contactPhone: '', allowPublicPhone: false, contactZalo: '', allowPublicZalo: false,
}
const editableKeys = Object.keys(emptyListing)

const defaultPublicFilters = {
  q: '',
  ward: '',
  roomType: '',
  availability: '',
  minPriceVnd: '',
  maxPriceVnd: '',
  minAreaM2: '',
  maxAreaM2: '',
  sort: 'available_first_publishedAt_desc',
}

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

function parsePublicLocationState(search) {
  const params = new URLSearchParams(search || '')
  const pageNum = Number(params.get('page') || '1')
  return {
    page: Number.isInteger(pageNum) && pageNum >= 1 ? pageNum : 1,
    filters: {
      q: params.get('q') || '',
      ward: params.get('ward') || '',
      roomType: params.get('roomType') || '',
      availability: params.get('availability') || '',
      minPriceVnd: params.get('minPriceVnd') || '',
      maxPriceVnd: params.get('maxPriceVnd') || '',
      minAreaM2: params.get('minAreaM2') || '',
      maxAreaM2: params.get('maxAreaM2') || '',
      sort: params.get('sort') || 'available_first_publishedAt_desc',
    },
  }
}

function buildPublicQueryString(filters, page) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value && !(key === 'sort' && value === 'available_first_publishedAt_desc')) {
      params.set(key, String(value))
    }
  })
  if (page > 1) params.set('page', String(page))
  return params.toString()
}

function validateFilterRanges(filters) {
  const minP = filters.minPriceVnd === '' ? null : Number(filters.minPriceVnd)
  const maxP = filters.maxPriceVnd === '' ? null : Number(filters.maxPriceVnd)
  const minA = filters.minAreaM2 === '' ? null : Number(filters.minAreaM2)
  const maxA = filters.maxAreaM2 === '' ? null : Number(filters.maxAreaM2)
  if (minP !== null && minP < 0) return 'Giá tối thiểu không thể là số âm.'
  if (maxP !== null && maxP < 0) return 'Giá tối đa không thể là số âm.'
  if (minP !== null && maxP !== null && minP > maxP) return 'Giá tối thiểu không được lớn hơn giá tối đa.'
  if (minA !== null && minA <= 0) return 'Diện tích tối thiểu phải lớn hơn 0.'
  if (maxA !== null && maxA <= 0) return 'Diện tích tối đa phải lớn hơn 0.'
  if (minA !== null && maxA !== null && minA > maxA) return 'Diện tích tối thiểu không được lớn hơn diện tích tối đa.'
  return ''
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
      <span className="brand-symbol">{branding.name.slice(0, 1)}</span>
      <span>
        <strong>{branding.name}</strong>
        <small>{branding.areaLabel}</small>
      </span>
    </span>
  )
  if (to && navigate) {
    return <AppLink to={to} navigate={navigate} style={{ textDecoration: 'none' }}>{content}</AppLink>
  }
  return content
}

function App() {
  const [location, navigate] = useLocationRouter()
  const path = location.pathname
  const [auth, setAuth] = useState({ state: 'idle', admin: null })
  const [notice, setNotice] = useState(null)
  const isAdminPath = path.startsWith('/admin')

  useEffect(() => {
    if (!isAdminPath || auth.state !== 'idle') return
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
  }, [isAdminPath, auth.state])

  useEffect(() => {
    const expired = () => {
      setAuth({ state: 'anonymous', admin: null })
      navigate('/admin/login', { replace: true })
      setNotice({ type: 'info', text: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' })
    }
    window.addEventListener('room-admin-session-expired', expired)
    return () => window.removeEventListener('room-admin-session-expired', expired)
  }, [navigate])

  useEffect(() => {
    if (!isAdminPath || auth.state !== 'ready') return
    if (auth.admin.mustChangePassword && path !== '/admin/change-password') {
      navigate('/admin/change-password', { replace: true })
    } else if (!auth.admin.mustChangePassword && (path === '/admin/login' || path === '/admin/change-password')) {
      navigate('/admin', { replace: true })
    }
  }, [auth, isAdminPath, navigate, path])

  useEffect(() => {
    if (isAdminPath && auth.state === 'anonymous' && path !== '/admin/login') {
      navigate('/admin/login', { replace: true })
    }
  }, [auth.state, isAdminPath, navigate, path])

  const showNotice = useCallback((text, type = 'success') => {
    const id = Date.now()
    setNotice({ text, type, id })
    window.setTimeout(() => setNotice((current) => (current?.id === id ? null : current)), 4200)
  }, [])

  const handleLogin = (admin) => {
    setAuth({ state: 'ready', admin })
    navigate(admin.mustChangePassword ? '/admin/change-password' : '/admin')
  }

  const handlePasswordChanged = (admin) => {
    setAuth({ state: 'ready', admin })
    navigate('/admin')
    showNotice('Mật khẩu đã được cập nhật. Chào mừng bạn trở lại.')
  }

  const handleLogout = async () => {
    try {
      await api('/admin/auth/logout', { method: 'POST' })
    } catch {
      /* phiên đã hết hạn */
    }
    setAuth({ state: 'anonymous', admin: null })
    navigate('/admin/login', { replace: true })
    showNotice('Bạn đã đăng xuất an toàn.', 'info')
  }

  /* Public Routes */
  if (path === '/' || path === '/rooms') {
    return <PublicCatalogPage location={location} navigate={navigate} />
  }
  const publicDetailMatch = path.match(/^\/rooms\/([^/]+)$/i)
  if (publicDetailMatch) {
    return <PublicRoomDetailPage roomId={publicDetailMatch[1]} navigate={navigate} />
  }
  if (!isAdminPath) {
    return <NotFound navigate={navigate} homePath="/" homeLabel="Về danh sách phòng" />
  }

  /* Admin Routes */
  if (auth.state === 'idle' || auth.state === 'loading') {
    return (
      <div className="app-loading">
        <span className="loading-mark">R</span>
        <span>Đang mở khu quản trị…</span>
      </div>
    )
  }

  if (auth.state === 'anonymous') {
    return (
      <>
        <LoginPage onLogin={handleLogin} notice={notice} clearNotice={() => setNotice(null)} navigate={navigate} />
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

  const match = path.match(/^\/admin\/rooms\/([0-9a-f-]+)(?:\/(preview))?$/i)
  let page
  let active = 'dashboard'

  if (path === '/admin' || path === '/admin/') {
    page = <DashboardPage navigate={navigate} />
  } else if (path === '/admin/rooms') {
    active = 'rooms'
    page = <RoomListPage navigate={navigate} showNotice={showNotice} />
  } else if (path === '/admin/rooms/new') {
    active = 'rooms'
    page = <RoomEditorPage key="new-room" navigate={navigate} showNotice={showNotice} />
  } else if (path === '/admin/rooms/archived') {
    active = 'archive'
    page = <ArchivedPage showNotice={showNotice} />
  } else if (match) {
    active = 'rooms'
    page = match[2]
      ? <RoomPreviewPage key={match[1]} roomId={match[1]} navigate={navigate} />
      : <RoomEditorPage key={match[1]} roomId={match[1]} navigate={navigate} showNotice={showNotice} />
  } else {
    page = <NotFound navigate={navigate} homePath="/admin" homeLabel="Về tổng quan quản trị" />
  }

  return (
    <AdminLayout admin={auth.admin} active={active} path={path} navigate={navigate} onLogout={handleLogout}>
      {page}
      {notice && <Toast notice={notice} />}
    </AdminLayout>
  )
}

/* =========================================================
   PUBLIC COMPONENTS
   ========================================================= */
function PublicLayout({ navigate, active = 'rooms', children }) {
  return (
    <div className="public-shell">
      <header className="public-header-wrap">
        <div className="public-container public-header">
          <Brand to="/" navigate={navigate} />
          <nav className="public-nav" aria-label="Điều hướng chính">
            <AppLink
              to="/rooms"
              navigate={navigate}
              className={`public-nav-link hide-mobile${active === 'rooms' ? ' is-active' : ''}`}
            >
              <Icon name="rooms" size={16} /> Danh sách phòng
            </AppLink>
            <AppLink to="/admin" navigate={navigate} className="button button-secondary button-small">
              <Icon name="shield" size={15} /> Khu quản trị
            </AppLink>
          </nav>
        </div>
      </header>
      {children}
      <footer className="public-footer">
        <div className="public-container public-footer-inner">
          <span>
            <strong>{branding.name}</strong> · {branding.cityLabel}
          </span>
          <span>Thông tin phòng trọ do chủ dự án trực tiếp quản lý · Không cần tài khoản để xem phòng</span>
        </div>
      </footer>
    </div>
  )
}

function PublicCatalogPage({ location, navigate }) {
  const urlState = useMemo(() => parsePublicLocationState(location.search), [location.search])
  const [draftState, setDraftState] = useState({ search: location.search, values: urlState.filters })
  const draft = draftState.search === location.search ? draftState.values : urlState.filters
  const setDraft = useCallback(
    (updater) => {
      setDraftState((prev) => {
        const base = prev.search === location.search ? prev.values : urlState.filters
        const next = typeof updater === 'function' ? updater(base) : updater
        return { search: location.search, values: next }
      })
    },
    [location.search, urlState.filters],
  )
  const [rangeOpen, setRangeOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [rangeError, setRangeError] = useState('')
  const [categories, setCategories] = useState({ roomTypes: ROOM_TYPES, wards: [] })
  const [reloadTick, setReloadTick] = useState(0)
  const [catalogState, setCatalogState] = useState({ key: null, data: null, error: '' })
  const requestKey = `${buildPublicQueryString(urlState.filters, urlState.page)}|${reloadTick}`
  const loading = catalogState.key !== requestKey
  const data = catalogState.data
  const error = catalogState.key === requestKey ? catalogState.error : ''

  useEffect(() => {
    api('/public/categories')
      .then((res) => setCategories({ roomTypes: res.roomTypes || ROOM_TYPES, wards: res.wards || [] }))
      .catch(() => { })
  }, [])

  useEffect(() => {
    let active = true
    const qs = buildPublicQueryString(urlState.filters, urlState.page)
    const key = `${qs}|${reloadTick}`
    api(`/public/rooms${qs ? `?${qs}` : ''}`)
      .then((res) => {
        if (active) setCatalogState({ key, data: res, error: '' })
      })
      .catch((caught) => {
        if (active) {
          setCatalogState((prev) => ({
            key,
            data: prev.data,
            error: caught.message || 'Không thể tải danh sách phòng lúc này.',
          }))
        }
      })
    return () => {
      active = false
    }
  }, [urlState.filters, urlState.page, reloadTick])

  const fetchCatalog = () => setReloadTick((n) => n + 1)

  const commitFilters = (nextFilters, nextPage = 1) => {
    const validationError = validateFilterRanges(nextFilters)
    if (validationError) {
      setRangeError(validationError)
      return false
    }
    setRangeError('')
    const qs = buildPublicQueryString(nextFilters, nextPage)
    navigate(`/rooms${qs ? `?${qs}` : ''}`, { preserveScroll: nextPage === 1 })
    return true
  }

  const applySubmit = (event) => {
    event?.preventDefault()
    if (commitFilters(draft, 1)) {
      setDrawerOpen(false)
    }
  }

  const resetAllFilters = () => {
    setDraft(defaultPublicFilters)
    setRangeError('')
    setDrawerOpen(false)
    navigate('/rooms', { preserveScroll: true })
  }

  const setQuickPrice = (minPriceVnd, maxPriceVnd) => {
    const next = { ...draft, minPriceVnd, maxPriceVnd }
    setDraft(next)
    commitFilters(next, 1)
  }

  const activeFilterCount = [
    urlState.filters.q,
    urlState.filters.ward,
    urlState.filters.roomType,
    urlState.filters.availability,
    urlState.filters.minPriceVnd,
    urlState.filters.maxPriceVnd,
    urlState.filters.minAreaM2,
    urlState.filters.maxAreaM2,
  ].filter(Boolean).length

  const isPricePreset = (min, max) =>
    urlState.filters.minPriceVnd === min && urlState.filters.maxPriceVnd === max

  const activeChips = []
  if (urlState.filters.q) activeChips.push({ key: 'q', label: `Từ khóa: "${urlState.filters.q}"` })
  if (urlState.filters.ward) activeChips.push({ key: 'ward', label: `Phường: ${urlState.filters.ward}` })
  if (urlState.filters.roomType) activeChips.push({ key: 'roomType', label: urlState.filters.roomType })
  if (urlState.filters.availability) {
    activeChips.push({
      key: 'availability',
      label: urlState.filters.availability === 'AVAILABLE' ? 'Chỉ phòng còn trống' : 'Chỉ phòng đã thuê',
    })
  }
  if (urlState.filters.minPriceVnd || urlState.filters.maxPriceVnd) {
    const minText = urlState.filters.minPriceVnd ? `${(Number(urlState.filters.minPriceVnd) / 1000000).toLocaleString('vi-VN')} tr` : '0'
    const maxText = urlState.filters.maxPriceVnd ? `${(Number(urlState.filters.maxPriceVnd) / 1000000).toLocaleString('vi-VN')} tr` : 'trở lên'
    activeChips.push({ key: 'price', label: `Giá: ${minText} – ${maxText}` })
  }
  if (urlState.filters.minAreaM2 || urlState.filters.maxAreaM2) {
    const minA = urlState.filters.minAreaM2 || '0'
    const maxA = urlState.filters.maxAreaM2 ? `${urlState.filters.maxAreaM2} m²` : 'trở lên'
    activeChips.push({ key: 'area', label: `Diện tích: ${minA} – ${maxA}` })
  }

  const removeChip = (key) => {
    const next = { ...urlState.filters }
    if (key === 'price') {
      next.minPriceVnd = ''
      next.maxPriceVnd = ''
    } else if (key === 'area') {
      next.minAreaM2 = ''
      next.maxAreaM2 = ''
    } else {
      next[key] = ''
    }
    setDraft(next)
    commitFilters(next, 1)
  }

  return (
    <PublicLayout navigate={navigate} active="rooms">
      <section className="public-hero-band">
        <div className="public-container public-hero-grid">
          <div className="public-hero-copy">
            <span className="eyebrow">
              <span className="eyebrow-dot" /> QUẬN BÌNH THẠNH · TP. HỒ CHÍ MINH
            </span>
            <h1>
              Tìm phòng trọ thoáng sáng, <em>minh bạch</em> từng thông tin.
            </h1>
            <p>
              Xem nhanh ảnh thực tế, giá thuê theo tháng, diện tích và tình trạng phòng còn trống tại khu vực Bình Thạnh. Không cần đăng nhập, liên hệ trực tiếp chủ nhà.
            </p>
            <div className="hero-highlights">
              <span className="hero-highlight-item">
                <Icon name="check" size={16} /> Cập nhật trực tiếp từ chủ phòng
              </span>
              <span className="hero-highlight-item">
                <Icon name="shield" size={16} /> Minh bạch giá &amp; tình trạng
              </span>
              <span className="hero-highlight-item">
                <Icon name="phone" size={16} /> Gọi điện / Zalo nhanh chóng
              </span>
            </div>
          </div>

          <aside className="hero-feature-card" aria-label="Điểm nổi bật">
            <div className="hero-feature-top">
              <span className="eyebrow">TIÊU CHUẨN TIN PHÒNG</span>
              <span className="hero-feature-badge">
                <Icon name="sparkles" size={14} /> Đã kiểm duyệt
              </span>
            </div>
            <ul className="hero-feature-list">
              <li>
                <span className="hero-feature-icon"><Icon name="image" size={18} /></span>
                <div>
                  <strong>Hình ảnh &amp; thông số thật</strong>
                  <small>Mỗi tin hiển thị diện tích m², loại phòng và tiện nghi có sẵn.</small>
                </div>
              </li>
              <li>
                <span className="hero-feature-icon"><Icon name="location" size={18} /></span>
                <div>
                  <strong>Định vị khu vực thuận tiện</strong>
                  <small>Dễ dàng lọc theo phường, tuyến đường gần nơi học tập và làm việc.</small>
                </div>
              </li>
              <li>
                <span className="hero-feature-icon"><Icon name="clock" size={18} /></span>
                <div>
                  <strong>Phòng còn trống ưu tiên trước</strong>
                  <small>Tình trạng Còn trống / Đã thuê luôn được hiển thị rõ ràng.</small>
                </div>
              </li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="catalog-section">
        <div className="public-container">
          {/* Desktop Filter Dock */}
          <form className="filter-dock" onSubmit={applySubmit}>
            <div className="filter-primary-row">
              <label className="filter-input-box">
                <Icon name="search" size={18} />
                <span className="sr-only">Tìm theo từ khóa hoặc khu vực</span>
                <input
                  placeholder="Tìm tên đường, khu vực, tiêu đề phòng..."
                  value={draft.q}
                  onChange={(e) => setDraft({ ...draft, q: e.target.value })}
                />
                {draft.q && (
                  <button
                    type="button"
                    className="search-clear"
                    onClick={() => {
                      const next = { ...draft, q: '' }
                      setDraft(next)
                      commitFilters(next, 1)
                    }}
                    aria-label="Xóa từ khóa"
                  >
                    ×
                  </button>
                )}
              </label>

              <select
                className="filter-select-control"
                aria-label="Lọc theo phường"
                value={draft.ward}
                onChange={(e) => {
                  const next = { ...draft, ward: e.target.value }
                  setDraft(next)
                  commitFilters(next, 1)
                }}
              >
                <option value="">Tất cả phường</option>
                {categories.wards.map((ward) => (
                  <option key={ward} value={ward}>{ward}</option>
                ))}
              </select>

              <select
                className="filter-select-control"
                aria-label="Lọc theo loại phòng"
                value={draft.roomType}
                onChange={(e) => {
                  const next = { ...draft, roomType: e.target.value }
                  setDraft(next)
                  commitFilters(next, 1)
                }}
              >
                <option value="">Tất cả loại phòng</option>
                {categories.roomTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                className="filter-select-control"
                aria-label="Lọc theo tình trạng phòng"
                value={draft.availability}
                onChange={(e) => {
                  const next = { ...draft, availability: e.target.value }
                  setDraft(next)
                  commitFilters(next, 1)
                }}
              >
                <option value="">Mọi tình trạng</option>
                <option value="AVAILABLE">Còn trống</option>
                <option value="RENTED">Đã thuê</option>
              </select>

              <button
                type="button"
                className="button button-secondary"
                onClick={() => setRangeOpen((v) => !v)}
                aria-expanded={rangeOpen}
              >
                <Icon name="filter" size={16} /> Giá &amp; Diện tích
              </button>

              <button type="submit" className="button button-primary">
                Tìm phòng
              </button>
            </div>

            <div className="filter-secondary-row">
              <div className="quick-price-chips" role="group" aria-label="Chọn nhanh khoảng giá">
                <span className="quick-chip-label">Mức giá nhanh:</span>
                <button
                  type="button"
                  className={`filter-chip${isPricePreset('', '') ? ' is-active' : ''}`}
                  onClick={() => setQuickPrice('', '')}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  className={`filter-chip${isPricePreset('', '3500000') ? ' is-active' : ''}`}
                  onClick={() => setQuickPrice('', '3500000')}
                >
                  Dưới 3,5 triệu
                </button>
                <button
                  type="button"
                  className={`filter-chip${isPricePreset('3500000', '5000000') ? ' is-active' : ''}`}
                  onClick={() => setQuickPrice('3500000', '5000000')}
                >
                  3,5 – 5 triệu
                </button>
                <button
                  type="button"
                  className={`filter-chip${isPricePreset('5000000', '') ? ' is-active' : ''}`}
                  onClick={() => setQuickPrice('5000000', '')}
                >
                  Trên 5 triệu
                </button>
              </div>

              {activeFilterCount > 0 && (
                <button type="button" className="text-button" onClick={resetAllFilters}>
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>

            {rangeOpen && (
              <div className="range-panel">
                <div className="range-field">
                  <label htmlFor="desktop-min-price">Giá từ (VND / tháng)</label>
                  <input
                    id="desktop-min-price"
                    type="number"
                    min="0"
                    step="100000"
                    placeholder="VD: 2500000"
                    value={draft.minPriceVnd}
                    onChange={(e) => {
                      setRangeError('')
                      setDraft({ ...draft, minPriceVnd: e.target.value })
                    }}
                  />
                </div>
                <div className="range-field">
                  <label htmlFor="desktop-max-price">Giá đến (VND / tháng)</label>
                  <input
                    id="desktop-max-price"
                    type="number"
                    min="0"
                    step="100000"
                    placeholder="VD: 5500000"
                    value={draft.maxPriceVnd}
                    onChange={(e) => {
                      setRangeError('')
                      setDraft({ ...draft, maxPriceVnd: e.target.value })
                    }}
                  />
                </div>
                <div className="range-field">
                  <label htmlFor="desktop-min-area">Diện tích từ (m²)</label>
                  <input
                    id="desktop-min-area"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="VD: 18"
                    value={draft.minAreaM2}
                    onChange={(e) => {
                      setRangeError('')
                      setDraft({ ...draft, minAreaM2: e.target.value })
                    }}
                  />
                </div>
                <div className="range-field">
                  <label htmlFor="desktop-max-area">Diện tích đến (m²)</label>
                  <input
                    id="desktop-max-area"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="VD: 35"
                    value={draft.maxAreaM2}
                    onChange={(e) => {
                      setRangeError('')
                      setDraft({ ...draft, maxAreaM2: e.target.value })
                    }}
                  />
                </div>
              </div>
            )}

            {rangeError && (
              <div className="form-alert range-error-banner" role="alert">
                <Icon name="shield" size={17} />
                <span>{rangeError}</span>
              </div>
            )}
          </form>

          {/* Mobile Filter Bar */}
          <form className="mobile-filter-bar" onSubmit={applySubmit}>
            <label className="filter-input-box">
              <Icon name="search" size={18} />
              <input
                aria-label="Tìm phòng"
                placeholder="Tìm đường, phường, tên phòng..."
                value={draft.q}
                onChange={(e) => setDraft({ ...draft, q: e.target.value })}
              />
            </label>
            <div className="mobile-filter-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setDrawerOpen(true)}
              >
                <Icon name="filter" size={16} />
                Bộ lọc {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </button>
              <button type="submit" className="button button-primary">
                Tìm
              </button>
            </div>
          </form>

          {/* Toolbar & Active Filters */}
          <div className="catalog-toolbar">
            <div className="catalog-count">
              {loading
                ? 'Đang tìm phòng phù hợp…'
                : `${data?.totalItems || 0} phòng trọ `}
              {!loading && data?.totalPages > 1 && <span>(Trang {data.page} / {data.totalPages})</span>}
            </div>

            <div className="catalog-sort">
              <label htmlFor="public-sort">Sắp xếp:</label>
              <select
                id="public-sort"
                value={urlState.filters.sort}
                onChange={(e) => {
                  const next = { ...urlState.filters, sort: e.target.value }
                  setDraft(next)
                  commitFilters(next, 1)
                }}
              >
                <option value="available_first_publishedAt_desc">Ưu tiên còn trống</option>
                <option value="publishedAt_desc">Mới cập nhật</option>
                <option value="price_asc">Giá: Thấp đến cao</option>
                <option value="price_desc">Giá: Cao đến thấp</option>
              </select>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="active-filters-bar" aria-label="Bộ lọc đang áp dụng">
              {activeChips.map((chip) => (
                <span className="active-chip" key={chip.key}>
                  {chip.label}
                  <button
                    type="button"
                    onClick={() => removeChip(chip.key)}
                    aria-label={`Bỏ ${chip.label}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button type="button" className="text-button" onClick={resetAllFilters}>
                Xóa lọc
              </button>
            </div>
          )}

          {/* Error / Loading / Empty / Grid */}
          {error ? (
            <div className="panel empty-state" role="alert">
              <span className="empty-illustration"><Icon name="shield" size={28} /></span>
              <strong>Không thể tải danh sách phòng</strong>
              <p>{error}</p>
              <button type="button" className="button button-primary" onClick={fetchCatalog}>
                <Icon name="refresh" size={16} /> Thử lại
              </button>
            </div>
          ) : loading ? (
            <div className="public-room-grid" aria-label="Đang tải danh sách phòng">
              {Array.from({ length: 6 }, (_, index) => (
                <div className="skeleton-card" key={index}>
                  <div className="skeleton-thumb" />
                  <div className="skeleton-body">
                    <div className="skeleton-bar short" />
                    <div className="skeleton-bar" />
                    <div className="skeleton-bar medium" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.items?.length ? (
            <>
              <div className="public-room-grid">
                {data.items.map((room) => (
                  <PublicRoomCard key={room.id} room={room} navigate={navigate} />
                ))}
              </div>
              {data.totalPages > 1 && (
                <div className="panel" style={{ marginTop: 28 }}>
                  <PaginationBar
                    page={data.page}
                    totalPages={data.totalPages}
                    onPageChange={(nextPage) => {
                      const qs = buildPublicQueryString(urlState.filters, nextPage)
                      navigate(`/rooms${qs ? `?${qs}` : ''}`)
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="panel empty-state">
              <span className="empty-illustration">
                <Icon name={activeFilterCount > 0 ? 'search' : 'home'} size={28} />
              </span>
              <strong>
                {activeFilterCount > 0
                  ? 'Không tìm thấy phòng phù hợp tiêu chí của bạn'
                  : 'Danh sách phòng đang được chủ nhà cập nhật'}
              </strong>
              <p>
                {activeFilterCount > 0
                  ? 'Bạn thử mở rộng mức giá, thay đổi khu vực hoặc xóa bớt bộ lọc để xem thêm lựa chọn.'
                  : 'Hiện chưa có tin phòng nào được xuất bản công khai. Nếu bạn là chủ dự án, hãy đăng nhập khu quản trị để đăng tin mới.'}
              </p>
              {activeFilterCount > 0 ? (
                <button type="button" className="button button-primary" onClick={resetAllFilters}>
                  Xóa toàn bộ bộ lọc
                </button>
              ) : (
                <AppLink to="/admin/login" navigate={navigate} className="button button-secondary">
                  Vào khu quản trị
                </AppLink>
              )}
            </div>
          )}
        </div>
      </section>

      {drawerOpen && (
        <MobileFilterDrawer
          draft={draft}
          setDraft={setDraft}
          categories={categories}
          rangeError={rangeError}
          setRangeError={setRangeError}
          onClose={() => setDrawerOpen(false)}
          onApply={applySubmit}
          onReset={resetAllFilters}
        />
      )}
    </PublicLayout>
  )
}

function PublicRoomCard({ room, navigate }) {
  const detailPath = `/rooms/${room.id}`
  const locationText = [room.publicAddress, room.ward, room.district].filter(Boolean).join(', ') || 'Quận Bình Thạnh'
  const visibleAmenities = (room.amenities || []).slice(0, 3)
  const extraAmenities = Math.max(0, (room.amenities || []).length - 3)

  return (
    <article className={`public-room-card${room.availability === 'RENTED' ? ' is-rented' : ''}`}>
      <AppLink to={detailPath} navigate={navigate} className="card-media-link" aria-label={`Xem chi tiết ${room.title}`}>
        <SafeImage src={room.coverImageUrl} alt={room.title} fallbackLabel="Ảnh phòng đang cập nhật" />
        <div className="card-media-badges">
          <StatusBadge status={room.availability} />
          {room.roomType && <span className="card-type-pill">{room.roomType}</span>}
        </div>
      </AppLink>

      <div className="card-body">
        <div className="card-price-row">
          <span className="card-price">
            {formatPriceVnd(room.priceVnd)} <small>/ tháng</small>
          </span>
          <span className="card-area">
            <Icon name="maximize" size={14} /> {room.areaM2} m²
          </span>
        </div>

        <AppLink to={detailPath} navigate={navigate} className="card-title-link">
          {room.title}
        </AppLink>

        <div className="card-location">
          <Icon name="location" size={16} />
          <span>{locationText}</span>
        </div>

        {visibleAmenities.length > 0 && (
          <div className="card-amenities">
            {visibleAmenities.map((item) => (
              <span className="card-amenity-chip" key={item}>{item}</span>
            ))}
            {extraAmenities > 0 && <span className="card-amenity-chip">+{extraAmenities} tiện nghi</span>}
          </div>
        )}

        <div className="card-footer">
          <span className="card-updated">Cập nhật {formatDateVn(room.updatedAt)}</span>
          <AppLink to={detailPath} navigate={navigate} className="card-detail-cta">
            Xem chi tiết <Icon name="arrow" size={15} />
          </AppLink>
        </div>
      </div>
    </article>
  )
}

function MobileFilterDrawer({ draft, setDraft, categories, rangeError, setRangeError, onClose, onApply, onReset }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="drawer-scrim"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <section className="filter-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-filter-title">
        <div className="drawer-header">
          <h2 id="drawer-filter-title">Bộ lọc tìm phòng</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Đóng bộ lọc">
            <Icon name="close" />
          </button>
        </div>

        <form id="mobile-filter-form" className="drawer-body" onSubmit={onApply}>
          <label className="field">
            <span>Phường / Khu vực</span>
            <select value={draft.ward} onChange={(e) => setDraft({ ...draft, ward: e.target.value })}>
              <option value="">Tất cả phường</option>
              {categories.wards.map((ward) => (
                <option key={ward} value={ward}>{ward}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Loại phòng</span>
            <select value={draft.roomType} onChange={(e) => setDraft({ ...draft, roomType: e.target.value })}>
              <option value="">Tất cả loại phòng</option>
              {categories.roomTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Tình trạng phòng</span>
            <select value={draft.availability} onChange={(e) => setDraft({ ...draft, availability: e.target.value })}>
              <option value="">Mọi tình trạng</option>
              <option value="AVAILABLE">Còn trống</option>
              <option value="RENTED">Đã thuê</option>
            </select>
          </label>

          <label className="field">
            <span>Giá tối thiểu (VND / tháng)</span>
            <input
              type="number"
              min="0"
              step="100000"
              placeholder="VD: 2500000"
              value={draft.minPriceVnd}
              onChange={(e) => {
                setRangeError('')
                setDraft({ ...draft, minPriceVnd: e.target.value })
              }}
            />
          </label>

          <label className="field">
            <span>Giá tối đa (VND / tháng)</span>
            <input
              type="number"
              min="0"
              step="100000"
              placeholder="VD: 5500000"
              value={draft.maxPriceVnd}
              onChange={(e) => {
                setRangeError('')
                setDraft({ ...draft, maxPriceVnd: e.target.value })
              }}
            />
          </label>

          <label className="field">
            <span>Diện tích tối thiểu (m²)</span>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="VD: 18"
              value={draft.minAreaM2}
              onChange={(e) => {
                setRangeError('')
                setDraft({ ...draft, minAreaM2: e.target.value })
              }}
            />
          </label>

          <label className="field">
            <span>Diện tích tối đa (m²)</span>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="VD: 35"
              value={draft.maxAreaM2}
              onChange={(e) => {
                setRangeError('')
                setDraft({ ...draft, maxAreaM2: e.target.value })
              }}
            />
          </label>

          {rangeError && (
            <div className="form-alert" role="alert">
              <Icon name="shield" size={16} />
              <span>{rangeError}</span>
            </div>
          )}
        </form>

        <div className="drawer-footer">
          <button type="button" className="button button-secondary" onClick={onReset}>
            Xóa lọc
          </button>
          <button type="submit" form="mobile-filter-form" className="button button-primary">
            Áp dụng
          </button>
        </div>
      </section>
    </div>
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

function PublicRoomDetailPage({ roomId, navigate }) {
  const [reloadTick, setReloadTick] = useState(0)
  const requestKey = `${roomId}|${reloadTick}`
  const [detailState, setDetailState] = useState({ key: null, item: null, notFound: false, error: '' })
  const loading = detailState.key !== requestKey
  const item = detailState.key === requestKey ? detailState.item : null
  const notFound = detailState.key === requestKey && detailState.notFound
  const error = detailState.key === requestKey ? detailState.error : ''

  useEffect(() => {
    let active = true
    const key = `${roomId}|${reloadTick}`
    api(`/public/rooms/${roomId}`)
      .then((data) => {
        if (active) setDetailState({ key, item: data.item, notFound: false, error: '' })
      })
      .catch((caught) => {
        if (!active) return
        if (caught.status === 404) {
          setDetailState({ key, item: null, notFound: true, error: '' })
        } else {
          setDetailState({
            key,
            item: null,
            notFound: false,
            error: caught.message || 'Không thể tải thông tin phòng lúc này.',
          })
        }
      })
    return () => {
      active = false
    }
  }, [roomId, reloadTick])

  const loadRoom = () => setReloadTick((n) => n + 1)

  const goBackToList = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      navigate('/rooms')
    }
  }

  if (notFound) {
    return (
      <PublicLayout navigate={navigate} active="rooms">
        <NotFound
          navigate={navigate}
          homePath="/rooms"
          homeLabel="Quay lại danh sách phòng"
          title="Không tìm thấy tin phòng này"
          description="Tin phòng có thể đã hết hạn, tạm ẩn hoặc đường dẫn không tồn tại."
        />
      </PublicLayout>
    )
  }

  const zaloHref = buildZaloHref(item?.contact?.zalo)
  const phone = item?.contact?.phone

  return (
    <PublicLayout navigate={navigate} active="rooms">
      <section className="detail-section">
        <div className="public-container">
          <div className="detail-breadcrumb">
            <button type="button" className="back-link" onClick={goBackToList} style={{ margin: 0 }}>
              <Icon name="chevron" size={16} /> Quay lại danh sách phòng
            </button>
            {item && (
              <span className="card-updated">
                Cập nhật lần cuối: {formatDateVn(item.updatedAt)}
              </span>
            )}
          </div>

          {error ? (
            <div className="panel empty-state" role="alert">
              <span className="empty-illustration"><Icon name="shield" size={28} /></span>
              <strong>Không thể tải chi tiết phòng</strong>
              <p>{error}</p>
              <button type="button" className="button button-primary" onClick={loadRoom}>
                <Icon name="refresh" size={16} /> Thử lại
              </button>
            </div>
          ) : loading ? (
            <div className="detail-layout">
              <div className="gallery-card">
                <div className="skeleton-thumb" style={{ aspectRatio: '16 / 10', borderRadius: 14 }} />
              </div>
              <div className="detail-summary-card">
                <div className="skeleton-bar short" />
                <div className="skeleton-bar" style={{ marginTop: 16, height: 28 }} />
                <div className="skeleton-bar medium" style={{ marginTop: 16, height: 48 }} />
              </div>
            </div>
          ) : (
            <div className="detail-layout">
              <div>
                <RoomGallery images={item.images} title={item.title} />

                <div className="detail-content-stack">
                  <section className="detail-block">
                    <h2>Mô tả chi tiết</h2>
                    <p className="detail-description">{item.description}</p>
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
                  {item.roomType && <span className="room-type-pill">{item.roomType}</span>}
                </div>

                <h1>{item.title}</h1>

                <div className="detail-price-box">
                  <div className="detail-price-main">
                    {formatPriceVnd(item.priceVnd)} <small>/ tháng</small>
                  </div>
                </div>

                <ul className="detail-facts-list">
                  <li>
                    <Icon name="maximize" size={18} />
                    <span>Diện tích sử dụng: <strong>{item.areaM2} m²</strong></span>
                  </li>
                  <li>
                    <Icon name="building" size={18} />
                    <span>Loại phòng: <strong>{item.roomType}</strong></span>
                  </li>
                  <li>
                    <Icon name="location" size={18} />
                    <span>
                      Vị trí: <strong>{item.displayAddress}</strong>
                      {!item.exactAddress && ' (khu vực tham khảo, liên hệ để xem nhà cụ thể)'}
                    </span>
                  </li>
                  <li>
                    <Icon name="calendar" size={18} />
                    <span>Cập nhật: <strong>{formatDateVn(item.updatedAt)}</strong></span>
                  </li>
                </ul>

                <div className="detail-contact-actions">
                  {phone && (
                    <a href={`tel:${phone}`} className="button button-primary button-wide">
                      <Icon name="phone" size={18} /> Gọi xem phòng: {phone}
                    </a>
                  )}
                  {zaloHref && (
                    <a
                      href={zaloHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button-zalo button-wide"
                    >
                      <Icon name="message" size={18} /> Nhắn tin qua Zalo
                    </a>
                  )}
                  {!phone && !zaloHref && (
                    <div className="detail-no-contact">
                      Chưa có kênh liên hệ công khai cho tin phòng này.
                    </div>
                  )}
                </div>

                <div className="detail-trust-note">
                  <Icon name="shield" size={17} />
                  <span>
                    Tin được cập nhật trực tiếp trên hệ thống quản lý phòng trọ Bình Thạnh. Vui lòng kiểm tra trực tiếp phòng và thỏa thuận rõ ràng khi xem nhà.
                  </span>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      {!loading && item && (phone || zaloHref) && (
        <div className="mobile-sticky-cta">
          {phone && (
            <a href={`tel:${phone}`} className="button button-primary">
              <Icon name="phone" size={17} /> Gọi điện
            </a>
          )}
          {zaloHref && (
            <a href={zaloHref} target="_blank" rel="noopener noreferrer" className="button button-zalo">
              <Icon name="message" size={17} /> Nhắn Zalo
            </a>
          )}
        </div>
      )}
    </PublicLayout>
  )
}

/* =========================================================
   ADMIN AUTHENTICATION & SHELL
   ========================================================= */
function LoginPage({ onLogin, notice, clearNotice, navigate }) {
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
        <Brand to="/" navigate={navigate} />
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
        <AppLink to="/" navigate={navigate} className="text-button">
          ← Quay về trang khách xem phòng
        </AppLink>
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
          <Brand to="/admin" navigate={navigate} />
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
          <AppLink to="/rooms" navigate={navigate} className="sidebar-public-link" onClick={() => setMenuOpen(false)}>
            <Icon name="external" size={15} /> Xem trang khách
          </AppLink>
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
          <button className="button button-primary" onClick={() => navigate('/admin/rooms/new')}>
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
            <AppLink to="/admin/rooms" navigate={navigate} className="text-link">
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
              <button className="button button-secondary" onClick={() => navigate('/admin/rooms/new')}>
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
          <button className="button button-primary" onClick={() => navigate('/admin/rooms/new')}>
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
                  : navigate('/admin/rooms/new')
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
                    onClick={() => navigate(`/admin/rooms/${room.id}`)}
                    aria-label={`Sửa ${room.title || 'tin phòng'}`}
                  >
                    {room.images?.[0] ? <SafeImage src={room.images[0].url} alt="" fallbackLabel="" /> : <Icon name="image" size={20} />}
                  </button>
                  <div className="room-title-cell">
                    <button onClick={() => navigate(`/admin/rooms/${room.id}`)} className="room-name">
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
                      onClick={() => navigate(`/admin/rooms/${room.id}/preview`)}
                    >
                      <Icon name="eye" size={18} />
                    </button>
                    <button
                      className="icon-button"
                      title="Chỉnh sửa"
                      aria-label={`Chỉnh sửa ${room.title}`}
                      onClick={() => navigate(`/admin/rooms/${room.id}`)}
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
              <button className="room-thumb" onClick={() => navigate(`/admin/rooms/${room.id}`)}>
                {room.images?.[0] ? <SafeImage src={room.images[0].url} alt="" fallbackLabel="" /> : <Icon name="image" size={20} />}
              </button>
              <div className="room-title-cell">
                <button onClick={() => navigate(`/admin/rooms/${room.id}`)} className="room-name">
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
              <button className="button button-small button-secondary" onClick={() => navigate(`/admin/rooms/${room.id}`)}>
                <Icon name="edit" size={15} /> Sửa
              </button>
              {!compact && (
                <button className="button button-small button-quiet" onClick={() => navigate(`/admin/rooms/${room.id}/preview`)}>
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

  const isDirty = savedSnapshot !== '' && JSON.stringify(form) !== savedSnapshot

  useEffect(() => {
    if (!roomId) return
    let active = true
    api(`/admin/rooms/${roomId}`)
      .then(({ item }) => {
        if (!active) return
        const nextForm = { ...emptyListing, ...item }
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
        setSavedSnapshot(JSON.stringify(form))
        navigate(`/admin/rooms/${item.id}`, { force: true })
        showNotice('Bản nháp đã được tạo. Bạn có thể tiếp tục bổ sung thông tin và ảnh.')
        return item
      }
      setSavedSnapshot(JSON.stringify(form))
      setAvailability(item.availability)
      setPublishStatus(item.publishStatus)
      setVersion(item.version || version + 1)
      if (!quiet) showNotice('Thông tin tin phòng đã được lưu.')
      return item
    } catch (caught) {
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
    if (!roomId || !files.length || uploading || images.length >= 15) return
    setError('')
    setUploadErrors([])
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
      navigate('/admin/rooms')
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
        <button className="button button-small button-secondary" onClick={() => navigate('/admin/rooms')}>
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
            : 'Nhập thông tin cơ bản trước. Bạn có thể lưu nháp và hoàn thiện sau.'
        }
        back={() => navigate('/admin/rooms')}
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
                <input
                  value={form.ward}
                  onChange={(e) => update('ward', e.target.value)}
                  placeholder="Ví dụ: Phường 15"
                />
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
                <p>Ảnh rõ, chân thực giúp khách dễ quyết định hơn. Chọn ảnh đầu tiên làm ảnh bìa.</p>
              </div>
              <span className="section-counter">{images.length} / 15</span>
            </div>

            {!roomId ? (
              <div className="upload-prerequisite">
                <span className="upload-icon"><Icon name="image" size={21} /></span>
                <span>
                  <strong>Lưu tin nháp trước khi tải ảnh</strong>
                  <small>Sau khi tạo tin nháp, bạn có thể tải, chọn ảnh bìa và sắp xếp tối đa 15 ảnh.</small>
                </span>
              </div>
            ) : (
              <>
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
                              disabled={index === 0}
                              onClick={() => reorder(index, -1)}
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              aria-label="Đưa ảnh xuống sau"
                              disabled={index === images.length - 1}
                              onClick={() => reorder(index, 1)}
                            >
                              →
                            </button>
                            <button
                              type="button"
                              aria-label="Gỡ ảnh"
                              onClick={() => setImageToRemove(image)}
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
              </>
            )}
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
              <button type="button" className="button button-quiet" onClick={() => navigate('/admin/rooms')}>
                Quay lại
              </button>
              <button type="submit" className="button button-secondary" disabled={busy}>
                {busy ? <span className="spinner dark-spinner" /> : <Icon name="check" size={16} />}
                {publishStatus === 'PUBLISHED' ? 'Lưu thay đổi' : 'Lưu nháp'}
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
                onClick={() => navigate(`/admin/rooms/${roomId}/preview`)}
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
          <button className="button button-small button-quiet" onClick={() => navigate(`/admin/rooms/${roomId}`)}>
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
        <button className="button button-secondary button-small" onClick={() => navigate(`/admin/rooms/${roomId}`)}>
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
  homePath = '/rooms',
  homeLabel = 'Về danh sách phòng',
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
