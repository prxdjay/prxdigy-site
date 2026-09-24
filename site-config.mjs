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
  // Primary navigation order, per the approved revision doc — distinct from the
  // `destinations` order above, which still drives the homepage's 01/02/03 cards.
  nav: [
    { label: 'Brooklyn', href: '/studio/brooklyn/' },
    { label: 'Long Island', href: '/studio/long-island/' },
    { label: 'Creative Projects', href: '/creative-projects/' },
    { label: 'The Team', href: '/team/' },
    { label: 'Contact', href: '/#contact' },
    { label: 'T&C', href: '/terms.html' },
  ],
  results: [
    { value: 20, suffix: 'M+', label: 'Spotify streams generated in 2026' },
    { value: 3, suffix: 'M+', label: 'YouTube views generated in 2026' },
    { value: 190, suffix: '+', label: 'credits across music, content, and campaigns' },
  ],
};
