// Cấu hình thương hiệu và URL trang khách dành cho cổng quản trị.
const defaultPublicSiteUrl =
  typeof window !== 'undefined' &&
  window.location.hostname !== '127.0.0.1' &&
  window.location.hostname !== 'localhost'
    ? 'https://he-thong-quan-ly-phong-tro-binh-tha.vercel.app'
    : 'http://127.0.0.1:5173'

export const branding = {
  name: 'Ngọc Toàn',
  areaLabel: 'HỆ THỐNG PHÒNG TRỌ BÌNH THẠNH',
  cityLabel: 'Bình Thạnh · TP. Hồ Chí Minh',
  logoSrc: '/Ph%C3%B2ng%20tr%E1%BB%8D%20Ng%E1%BB%8Dc%20To%C3%A0n-Logo.svg',
  publicSiteUrl: import.meta.env.VITE_PUBLIC_SITE_URL || defaultPublicSiteUrl,
}
