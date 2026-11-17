// Cấu hình thương hiệu và URL trang khách dành cho cổng quản trị.
function getDefaultPublicSiteUrl() {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:5173'
  }
  const { hostname } = window.location
  if (hostname === '127.0.0.1' || hostname === 'localhost') {
    return 'http://127.0.0.1:5173'
  }
  if (hostname === 'phongtrobinhthanh.id.vn' || hostname.endsWith('.phongtrobinhthanh.id.vn')) {
    return 'https://www.phongtrobinhthanh.id.vn'
  }
  return 'https://he-thong-quan-ly-phong-tro-binh-tha.vercel.app'
}

export const branding = {
  name: 'Ngọc Toàn',
  areaLabel: 'HỆ THỐNG PHÒNG TRỌ BÌNH THẠNH',
  cityLabel: 'Bình Thạnh · TP. Hồ Chí Minh',
  logoSrc: '/Ph%C3%B2ng%20tr%E1%BB%8D%20Ng%E1%BB%8Dc%20To%C3%A0n-Logo.svg',
  publicSiteUrl: import.meta.env.VITE_PUBLIC_SITE_URL || getDefaultPublicSiteUrl(),
}
