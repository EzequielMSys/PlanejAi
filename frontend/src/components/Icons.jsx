export default function Icon({ name, size = 20, ...props }) {
  const paths = {
    home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
    route: 'M5 5h10a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h10M5 2v6M2 5h6m9 14 2 2 3-3',
    calendar: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Zm2 10h2m4 0h2m-8 4h2',
    book: 'M12 5v16M3 4h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v15h-5a5 5 0 0 0-4 2 5 5 0 0 0-4-2H3Z',
    exam: 'M9 3h6v4H9Zm-2 2H5v16h14V5h-2M8 12h8m-8 4h5',
    pen: 'm15 4 5 5M4 20l5-1L21 7l-4-4L5 15Z',
    chart: 'M4 3v17h17M8 15v-4m5 4V7m5 8v-6',
    check: 'm7 12 3 3 7-7M5 3h14v18H5Z',
    people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-4M13 3a4 4 0 0 1 0 8M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    bell: 'M18 8a6 6 0 0 0-12 0c0 6-3 7-3 9h18c0-2-3-3-3-9M10 21h4',
    settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',
    palette: 'M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 2-2c0-1-1-2-1-3s1-2 2-2h2a3 3 0 0 0 3-3 9 9 0 0 0-9-8ZM7 9h.01M11 6h.01M16 7h.01M6 14h.01',
    user: 'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M12 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    lock: 'M6 10h12v11H6Zm2 0V6a4 4 0 0 1 8 0v4m-4 5v2',
    spark: 'm12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4Z',
    search: 'M21 21l-5-5M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z',
    menu: 'M4 6h16M4 12h16M4 18h16', close: 'm6 6 12 12M6 18 18 6',
    arrow: 'M4 12h16m-6-6 6 6-6 6', copy: 'M8 8h13v13H8ZM16 5V2H2v14h3',
    send: 'm22 2-7 20-4-9-9-4Zm0 0L11 13', logout: 'M9 3H3v18h6m4-14 5 5-5 5m-6-5h15',
    sun: 'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z',
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.book} /></svg>
}
