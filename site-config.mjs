// Public facts and navigation used by the static page builder.
export const site = {
  origin: 'https://prxdigystudio.com',
  name: 'PRXDIGY',
  instagram: { label: '@prxdigystudio', href: 'https://instagram.com/prxdigystudio' },
  text: { label: '631-870-9243', href: 'sms:+16318709243' },
  destinations: [
    { label: 'Long Island', href: '/studio/long-island/', status: 'Now booking' },
    { label: 'Creative Projects', href: '/creative-projects/' },
    { label: 'Brooklyn', href: '/studio/brooklyn/', status: 'Now open', media: null /* Brooklyn-specific photography goes here when supplied. */ },
  ],
  // Primary navigation order (Start a Project sits ahead of these as its own button).
  nav: [
    { label: 'Long Island', href: '/studio/long-island/' },
    { label: 'Brooklyn', href: '/studio/brooklyn/' },
    { label: 'Creative Projects', href: '/creative-projects/' },
    { label: 'The Team', href: '/team/' },
  ],
  // Business details shown in the footer and legal pages.
  business: { name: 'PRXDIGY', location: 'Long Island, NY', email: 'prxdigystudio@gmail.com' },
  legal: [
    { label: 'Privacy Policy', href: '/privacy.html' },
    { label: 'Terms & Conditions', href: '/terms.html' },
    { label: 'Cookie Policy', href: '/cookies.html' },
    { label: 'Refund Policy', href: '/refunds.html' },
  ],
  results: [
    { value: 20, suffix: 'M+', label: 'Spotify streams generated in 2026' },
    { value: 3, suffix: 'M+', label: 'YouTube views generated in 2026' },
    { value: 190, suffix: '+', label: 'credits across music, content, and campaigns' },
  ],
};
