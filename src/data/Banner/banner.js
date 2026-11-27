import worksLogos from '../../assets/worksLogo/worksData';

/**
 * Expandable Announcement / Release Banner Configuration.
 * Add new project launches here and set `active: true` on the banner you want to feature.
 * When multiple banners have `active: true`, the banner smoothly morphs between them every 4 seconds.
 * When the user dismisses the active announcement banner, the fallback quote banner is shown.
 */
export const bannerData = [
  {
    id: 'barstile-v1',
    active: true,
    version: 'B1',
    logo: worksLogos.barstile,
    title: 'Barstile 1.2',
    subtitle: 'is now released publicly!',
    ctaText: 'Visit Barstile',
    ctaUrl: 'https://barstile.pages.dev',
  },
];

export const fallbackBannerQuote =
  'Built for what your business actually needs.';

export function getActiveBanners() {
  return bannerData.filter((item) => item.active);
}

