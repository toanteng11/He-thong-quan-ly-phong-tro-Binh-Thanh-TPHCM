import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from './components/Icon.jsx'
import ConsultBotWidget from './components/ConsultBotWidget.jsx'
import { api } from './lib/api.js'
import { branding } from './branding.js'
import './App.css'

const ROOM_TYPES = ['Phòng trọ', 'Phòng có gác', 'Phòng studio', 'Căn hộ mini', 'Phòng ở ghép']
const DEFAULT_AMENITIES = [
  'Máy lạnh', 'Tủ lạnh', 'Thang máy', 'Giường', 'Tủ quần áo', 'Bếp riêng',
  'Nhà vệ sinh riêng', 'Ban công', 'Gác lửng', 'Wifi', 'Chỗ để xe', 'Cửa sổ',
]

const defaultPublicFilters = {
  q: '',
  ward: '',
  roomType: '',
  availability: '',
  amenities: [],
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

function buildZaloHref(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  if (/^https:\/\/zalo\.me\/[A-Za-z0-9._-]+$/i.test(value)) return value
  const digits = value.replace(/[^0-9]/g, '')
  if (!digits) return ''
  return `https://zalo.me/${digits}`
}

function parseAmenitiesParam(params) {
  const raw = params.getAll('amenities')
  const items = raw
    .flatMap((entry) => String(entry).split(','))
    .map((item) => item.trim())
    .filter(Boolean)
  return [...new Set(items)]
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
      amenities: parseAmenitiesParam(params),
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
    if (key === 'amenities') {
      if (Array.isArray(value) && value.length > 0) {
        params.set('amenities', value.join(','))
      }
      return
    }
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
  const [location, setLocation] = useState(() => {
    const pathname = window.location.pathname
    const search = window.location.search
    const isCatalog = pathname === '/' || pathname === '/rooms'
    return {
      pathname,
      search,
      lastCatalogPath: isCatalog ? `/rooms${search}` : '/rooms',
    }
  })

  useEffect(() => {
    const update = () => {
      const pathname = window.location.pathname
      const search = window.location.search
      const isCatalog = pathname === '/' || pathname === '/rooms'
      setLocation((prev) => ({
        pathname,
        search,
        lastCatalogPath: isCatalog ? `/rooms${search}` : prev.lastCatalogPath,
      }))
    }
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])

  const navigate = useCallback((next, options = {}) => {
    if (options.replace) window.history.replaceState({}, '', next)
    else window.history.pushState({}, '', next)

    const url = new URL(next, window.location.origin)
    const isCatalog = url.pathname === '/' || url.pathname === '/rooms'
    setLocation((prev) => ({
      pathname: url.pathname,
      search: url.search,
      lastCatalogPath: isCatalog ? `/rooms${url.search}` : prev.lastCatalogPath,
    }))
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

function SafeImage({ src, alt, className, fallbackLabel = 'Chưa có ảnh phòng', priority = false }) {
  const [failedSrc, setFailedSrc] = useState(null)

  if (!src || failedSrc === src) {
    return (
      <div className={`image-fallback-box ${className || ''}`}>
        <Icon name="image" size={30} />
        <span>{fallbackLabel}</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt || ''}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      onError={() => setFailedSrc(src)}
    />
  )
}

function StatusBadge({ status }) {
  const config = {
    AVAILABLE: ['availability-available', 'Còn trống'],
    RENTED: ['availability-rented', 'Đã thuê'],
  }[status] || ['availability-rented', status]

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
  const publicDetailMatch = location.pathname.match(/^\/rooms\/([^/]+)$/i)
  const isCatalog = location.pathname === '/' || location.pathname === '/rooms'

  return (
    <>
      {isCatalog ? (
        <PublicCatalogPage location={location} navigate={navigate} />
      ) : publicDetailMatch ? (
        <PublicRoomDetailPage
          roomId={publicDetailMatch[1]}
          navigate={navigate}
          backPath={location.lastCatalogPath}
        />
      ) : (
        <NotFound navigate={navigate} homePath="/rooms" homeLabel="Về danh sách phòng" />
      )}
      <ConsultBotWidget navigate={navigate} hasMobileStickyCta={Boolean(publicDetailMatch)} />
    </>
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
          </nav>
        </div>
      </header>
      {children}
      <footer className="public-footer">
        <div className="public-container public-footer-inner">
          <span>
            <strong>{branding.name}</strong> · {branding.cityLabel}
          </span>
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
  const [categories, setCategories] = useState({
    roomTypes: ROOM_TYPES,
    amenities: DEFAULT_AMENITIES,
    wards: [],
  })
  const [reloadTick, setReloadTick] = useState(0)
  const [catalogState, setCatalogState] = useState({ key: null, data: null, error: '' })
  const requestKey = `${buildPublicQueryString(urlState.filters, urlState.page)}|${reloadTick}`
  const loading = catalogState.key !== requestKey
  const data = catalogState.data
  const error = catalogState.key === requestKey ? catalogState.error : ''

  useEffect(() => {
    const controller = new AbortController()
    api('/public/categories', { signal: controller.signal })
      .then((res) =>
        setCategories({
          roomTypes: res.roomTypes || ROOM_TYPES,
          amenities: res.amenities || DEFAULT_AMENITIES,
          wards: res.wards || [],
        }),
      )
      .catch(() => { })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const qs = buildPublicQueryString(urlState.filters, urlState.page)
    const key = `${qs}|${reloadTick}`
    api(`/public/rooms${qs ? `?${qs}` : ''}`, { signal: controller.signal })
      .then((res) => {
        if (active) setCatalogState({ key, data: res, error: '' })
      })
      .catch((caught) => {
        if (!active || caught.name === 'AbortError') return
        setCatalogState((prev) => ({
          key,
          data: prev.data,
          error: caught.message || 'Không thể tải danh sách phòng lúc này.',
        }))
      })
    return () => {
      active = false
      controller.abort()
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

  const toggleAmenity = (amenity, commitNow = false) => {
    const current = Array.isArray(draft.amenities) ? draft.amenities : []
    const exists = current.includes(amenity)
    const nextAmenities = exists ? current.filter((item) => item !== amenity) : [...current, amenity]
    const next = { ...draft, amenities: nextAmenities }
    setDraft(next)
    if (commitNow) {
      commitFilters(next, 1)
    }
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
  ].filter(Boolean).length + (urlState.filters.amenities?.length || 0)

  const advancedFilterCount =
    [
      urlState.filters.minPriceVnd,
      urlState.filters.maxPriceVnd,
      urlState.filters.minAreaM2,
      urlState.filters.maxAreaM2,
    ].filter(Boolean).length + (urlState.filters.amenities?.length || 0)

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
  ;(urlState.filters.amenities || []).forEach((amenity) => {
    activeChips.push({ key: `amenity:${amenity}`, label: `Tiện nghi: ${amenity}` })
  })

  const removeChip = (key) => {
    const next = { ...urlState.filters }
    if (key === 'price') {
      next.minPriceVnd = ''
      next.maxPriceVnd = ''
    } else if (key === 'area') {
      next.minAreaM2 = ''
      next.maxAreaM2 = ''
    } else if (key.startsWith('amenity:')) {
      const target = key.slice('amenity:'.length)
      next.amenities = (next.amenities || []).filter((item) => item !== target)
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
            <h1>Tìm phòng trọ Quận Bình Thạnh</h1>
          </div>
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
                <Icon name="filter" size={16} /> Lọc nâng cao{advancedFilterCount > 0 ? ` (${advancedFilterCount})` : ''}
              </button>

              <button type="submit" className="button button-primary">
                Tìm phòng
              </button>
            </div>

            <div className="filter-secondary-row">
              <div className="quick-chips-stack">
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
              </div>

              {activeFilterCount > 0 && (
                <button type="button" className="text-button" onClick={resetAllFilters}>
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>

            {rangeOpen && (
              <div className="advanced-filter-panel">
                <div className="range-panel">
                  <div className="range-field">
                    <label htmlFor="desktop-min-price">Giá từ (VND / tháng)</label>
                    <input
                      id="desktop-min-price"
                      type="number"
                      inputMode="numeric"
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
                      inputMode="numeric"
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
                      inputMode="decimal"
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
                      inputMode="decimal"
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

                <div className="advanced-subblock">
                  <span className="quick-chip-label">Tiện nghi:</span>
                  <div className="amenity-filter-grid" role="group" aria-label="Lọc theo tiện nghi phòng">
                    {categories.amenities.map((amenity) => {
                      const active = (draft.amenities || []).includes(amenity)
                      return (
                        <button
                          type="button"
                          key={amenity}
                          className={`filter-chip${active ? ' is-active' : ''}`}
                          aria-pressed={active}
                          onClick={() => toggleAmenity(amenity, true)}
                        >
                          {amenity}
                        </button>
                      )
                    })}
                  </div>
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                <button type="button" className="button button-primary" onClick={fetchCatalog}>
                  <Icon name="refresh" size={16} /> Thử lại
                </button>
                {activeFilterCount > 0 && (
                  <button type="button" className="button button-secondary" onClick={resetAllFilters}>
                    Xóa toàn bộ bộ lọc
                  </button>
                )}
              </div>
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
                {data.items.map((room, index) => (
                  <PublicRoomCard key={room.id} room={room} navigate={navigate} priority={index < 3} />
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
                  : 'Chưa có phòng nào'}
              </strong>
              {activeFilterCount > 0 ? (
                <button type="button" className="button button-primary" onClick={resetAllFilters}>
                  Xóa toàn bộ bộ lọc
                </button>
              ) : (
                <button type="button" className="button button-secondary" onClick={fetchCatalog}>
                  Tải lại danh sách
                </button>
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

function PublicRoomCard({ room, navigate, priority = false }) {
  const detailPath = `/rooms/${room.id}`
  const locationText = [room.publicAddress, room.ward, room.district].filter(Boolean).join(', ') || 'Quận Bình Thạnh'
  const visibleAmenities = (room.amenities || []).slice(0, 3)
  const extraAmenities = Math.max(0, (room.amenities || []).length - 3)

  return (
    <article className={`public-room-card${room.availability === 'RENTED' ? ' is-rented' : ''}`}>
      <AppLink to={detailPath} navigate={navigate} className="card-media-link" aria-label={`Xem chi tiết ${room.title}`}>
        <SafeImage src={room.coverImageUrl} alt={room.title} priority={priority} fallbackLabel="Ảnh phòng đang cập nhật" />
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
              inputMode="numeric"
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
              inputMode="numeric"
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
              inputMode="decimal"
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
              inputMode="decimal"
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

          <div className="field">
            <span>Tiện nghi mong muốn</span>
            <div className="amenity-filter-grid" role="group" aria-label="Chọn tiện nghi phòng">
              {(categories.amenities || DEFAULT_AMENITIES).map((amenity) => {
                const active = (draft.amenities || []).includes(amenity)
                return (
                  <button
                    type="button"
                    key={amenity}
                    className={`filter-chip${active ? ' is-active' : ''}`}
                    aria-pressed={active}
                    onClick={() => {
                      const current = Array.isArray(draft.amenities) ? draft.amenities : []
                      const nextAmenities = active
                        ? current.filter((item) => item !== amenity)
                        : [...current, amenity]
                      setDraft({ ...draft, amenities: nextAmenities })
                    }}
                  >
                    {amenity}
                  </button>
                )
              })}
            </div>
          </div>

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
        <SafeImage src={current.url} alt={current.altText || title} priority />
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

function PublicRoomDetailPage({ roomId, navigate, backPath }) {
  const [reloadTick, setReloadTick] = useState(0)
  const requestKey = `${roomId}|${reloadTick}`
  const [detailState, setDetailState] = useState({ key: null, item: null, notFound: false, error: '' })
  const loading = detailState.key !== requestKey
  const item = detailState.key === requestKey ? detailState.item : null
  const notFound = detailState.key === requestKey && detailState.notFound
  const error = detailState.key === requestKey ? detailState.error : ''

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const key = `${roomId}|${reloadTick}`
    api(`/public/rooms/${roomId}`, { signal: controller.signal })
      .then((data) => {
        if (active) setDetailState({ key, item: data.item, notFound: false, error: '' })
      })
      .catch((caught) => {
        if (!active || caught.name === 'AbortError') return
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
      controller.abort()
    }
  }, [roomId, reloadTick])

  const loadRoom = () => setReloadTick((n) => n + 1)

  const goBackToList = () => {
    navigate(backPath || '/rooms')
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
                    <span>Vị trí: <strong>{item.displayAddress}</strong></span>
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
   SHARED FEEDBACK
   ========================================================= */
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
