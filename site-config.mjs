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
  // The Team. `model` = assets/models/<model>.glb (the 3D character shown on the card).
  // Swap a model here if a character is matched to the wrong person.
  team: [
    { name: 'PRXDIGY', handle: 'prxd.jay', role: 'Founder · Artist · Producer · Engineer', model: 'team-prxdigy',
      bio: 'Started PRXDIGY. Makes the records, engineers the sessions, and runs the vision from Long Island to Brooklyn.',
      spotify: 'https://open.spotify.com/artist/2BXB6wbzCaQKOx0kP4sTip' },
    { name: 'SY4NI', handle: 'yanidakoza', role: 'Artist', model: 'team-sy4ni',
      bio: 'Part of the PRXDIGY family. Brings the energy to every session and every rollout.' },
    { name: 'JUDE', handle: 'isjudeok', role: 'Artist', model: 'team-jude',
      bio: 'Part of the PRXDIGY family. On the records and behind the visuals.' },
    { name: "Daniel's Coffin", handle: null, role: 'Artist', model: 'team-daniels-coffin',
      bio: 'Part of the PRXDIGY family. Own lane, own sound.' },
    // Name, role, and handle to come from the owner.
    { name: 'TBA', handle: null, role: 'Artist', model: 'team-leather',
      bio: 'Part of the PRXDIGY family. Name drops soon.' },
  ],
  results: [
    { value: 20, suffix: 'M+', label: 'Spotify streams generated in 2026' },
    { value: 3, suffix: 'M+', label: 'YouTube views generated in 2026' },
    { value: 190, suffix: '+', label: 'credits across music, content, and campaigns' },
  ],
};
