'use client';

import { useEffect, useState } from 'react';

interface NavLink {
  href: string;
  label: string;
}

const LINKS: NavLink[] = [
  { href: '#invitation', label: 'Faire-part' },
  { href: '#details', label: 'Save the Date' },
  { href: '#bracha', label: 'Mazal Tov' },
  { href: '#rsvp', label: 'Répondre' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setOpen(false);
    // Trigger reveal si on est encore au hero (pour que le contenu soit visible)
    if (!document.body.classList.contains('revealed')) {
      document.body.classList.add('revealed');
    }
    const id = href.startsWith('#') ? href.slice(1) : href;
    const el = document.getElementById(id);
    if (el) {
      requestAnimationFrame(() =>
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      );
    }
  };

  return (
    <header className={`site-header ${scrolled || open ? 'scrolled' : ''}`}>
      <nav className="site-nav">
        <a
          href="#invitation"
          className="brand"
          onClick={(e) => handleNav(e, '#invitation')}
        >
          Shmouel &amp; Perla
        </a>

        <ul className="nav-links">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={(e) => handleNav(e, l.href)}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="nav-burger"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </nav>

      {open && (
        <div className="mobile-menu" role="dialog" aria-modal="true">
          <ul>
            {LINKS.map((l, i) => (
              <li key={l.href}>
                <a href={l.href} onClick={(e) => handleNav(e, l.href)}>
                  <span className="menu-index" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="menu-label">{l.label}</span>
                  <span className="menu-arrow" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="M13 5l7 7-7 7" />
                    </svg>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="menu-footer" aria-hidden="true">Shmouel &amp; Perla · 03·09·26</p>
        </div>
      )}
    </header>
  );
}
