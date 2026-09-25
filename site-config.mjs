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
    { name: 'PRXDIGY', handle: 'prxd.jay', role: 'Founder & Creative Director', model: 'team-prxdigy',
      bio: 'Jay is an artist, songwriter, producer, and engineer with a passion for bringing creative visions to life. As the founder of PRXDIGY Studios, he bridges music, visuals, and artist development to create an environment where creativity has no limits.',
      spotify: 'https://open.spotify.com/artist/2BXB6wbzCaQKOx0kP4sTip' },
    { name: 'SY4NI', handle: 'yanidakoza', role: 'Brooklyn Studio Partner & Engineer', model: 'team-sy4ni',
      bio: 'Yanni is an artist, songwriter, and engineer who brings his creative perspective to every project. As a partner at PRXDIGY’s Brooklyn location, he helps artists shape their sound and turn their ideas into finished records.' },
    { name: "Daniel's Coffin", handle: null, role: 'Recording Engineer & Videographer', model: 'team-daniels-coffin',
      bio: 'Daniel is an artist, songwriter, engineer, and videographer who brings both musical and visual creativity to the team. His versatility allows him to help artists develop their sound while capturing the moments that bring their vision to life.' },
    { name: 'JUDE', handle: 'isjudeok', role: 'Recording Engineer', model: 'team-jude',
      bio: 'Jude is an artist, songwriter, and recording engineer who understands the creative process from both sides of the microphone. He combines his musical perspective with technical expertise to help artists bring their ideas to life.' },
  ],
  results: [
    { value: 20, suffix: 'M+', label: 'Spotify streams generated in 2026' },
    { value: 3, suffix: 'M+', label: 'YouTube views generated in 2026' },
    { value: 190, suffix: '+', label: 'credits across music, content, and campaigns' },
  ],
};
