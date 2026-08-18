import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { SITE_PIN } from './config'

const UNLOCKED_STORAGE_KEY = 'nuno-archive-unlocked'

function PinGate({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const submit = (event) => {
    event.preventDefault()
    if (pin === SITE_PIN) {
      sessionStorage.setItem(UNLOCKED_STORAGE_KEY, SITE_PIN)
      onUnlock()
      return
    }
    setError(true)
    setPin('')
    inputRef.current?.focus()
  }

  return <main className="pin-gate" aria-labelledby="pin-title">
    <div className={`pin-gate-inner ${error ? 'pin-gate-shake' : ''}`}>
      <p className="label text-amber">NUNO <span className="text-cream-dim">/</span> IMMA</p>
      <span className="pin-rule" aria-hidden="true" />
      <p className="label text-cream-dim">The archive</p>
      <h1 id="pin-title" className="pin-title">A private<br />collection.</h1>
      <p className="pin-note">For Nuno</p>
      <form className="pin-form" onSubmit={submit} noValidate>
        <label className="sr-only" htmlFor="archive-pin">Enter the archive PIN</label>
        <input ref={inputRef} id="archive-pin" className="pin-input" type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4} autoComplete="off" value={pin} onChange={(event) => { setError(false); setPin(event.target.value.replace(/\\D/g, '').slice(0, 4)) }} aria-label="Enter the archive PIN" aria-describedby="pin-hint pin-status" />
        <button className="pin-submit" type="submit">Unlock <span aria-hidden="true">→</span></button>
      </form>
      <p id="pin-hint" className="pin-hint">Enter the four-digit code to continue.</p>
      <p id="pin-status" className="pin-status" role="status" aria-live="polite">{error ? 'That code was not the one.' : '\u00a0'}</p>
    </div>
    <div className="grain" />
  </main>
}

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { node.classList.add('is-visible'); observer.disconnect() } }, { threshold: 0.12 })
    observer.observe(node); return () => observer.disconnect()
  }, [])
  return <div ref={ref} className={`reveal ${className}`} style={{ '--reveal-delay': `${Math.min(delay, 400)}ms` }}>{children}</div>
}

function Lightbox({ photos, index, onClose, onChange }) {
  const closeRef = useRef(null); const startX = useRef(0)
  const photo = photos[index]
  useEffect(() => {
    document.body.classList.add('modal-open'); closeRef.current?.focus()
    const key = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') onChange((index + 1) % photos.length)
      if (event.key === 'ArrowLeft') onChange((index - 1 + photos.length) % photos.length)
      if (event.key === 'Tab') {
        const controls = [...document.querySelectorAll('[role="dialog"] button')]
        if (controls.length && (event.shiftKey ? document.activeElement === controls[0] : document.activeElement === controls[controls.length - 1])) { event.preventDefault(); (event.shiftKey ? controls[controls.length - 1] : controls[0]).focus() }
      }
    }
    document.addEventListener('keydown', key); return () => { document.body.classList.remove('modal-open'); document.removeEventListener('keydown', key) }
  }, [index, onClose, onChange, photos.length])
  return <div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-5 sm:p-8" role="dialog" aria-modal="true" aria-label={photo.caption} onClick={(e) => e.target === e.currentTarget && onClose()} onTouchStart={(e) => { startX.current = e.changedTouches[0].screenX }} onTouchEnd={(e) => { const delta = e.changedTouches[0].screenX - startX.current; if (Math.abs(delta) > 48) onChange((index + (delta < 0 ? 1 : -1) + photos.length) % photos.length) }}>
    <div className="flex justify-end"><button ref={closeRef} className="modal-button" onClick={onClose} aria-label="Close lightbox">×</button></div>
    <div className="flex min-h-0 flex-1 items-center justify-center"><img src={photo.src} alt={photo.alt} className="max-h-[84svh] max-w-[92vw] object-contain" /></div>
    <div className="flex items-end justify-between gap-4 pt-5 text-cream"><div><p className="font-body text-xs uppercase tracking-[.16em] text-amber">{photo.id} / {String(photos.length).padStart(2,'0')}</p><p className="mt-1 font-body text-sm text-cream-muted">{photo.caption} · {photo.date}</p></div><div className="flex gap-2"><button className="modal-button" onClick={() => onChange((index - 1 + photos.length) % photos.length)} aria-label="Previous photo">←</button><button className="modal-button" onClick={() => onChange((index + 1) % photos.length)} aria-label="Next photo">→</button></div></div>
  </div>
}

function App() {
  const [photos, setPhotos] = useState([]); const [quotes, setQuotes] = useState([]); const [active, setActive] = useState(null)
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCKED_STORAGE_KEY) === SITE_PIN)
  useEffect(() => { Promise.all([fetch('./manifest.json').then(r => r.json()), fetch('./quotes.json').then(r => r.json())]).then(([p, q]) => { setPhotos(p); setQuotes(q) }).catch(console.error) }, [])
  useEffect(() => { if (active !== null) { const pre = new Image(); pre.src = photos[(active + 1) % photos.length]?.src } }, [active, photos])
  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />
  return <div className="min-h-screen bg-ink text-cream">
    <header className="relative z-20 flex h-[60px] items-center justify-between px-5 sm:h-[72px] sm:px-8 lg:px-12"><a href="#top" className="font-body text-[11px] font-semibold uppercase tracking-[.16em]">NUNO <span className="text-amber">/</span> IMMA</a><span className="hidden font-body text-[11px] font-semibold uppercase tracking-[.16em] text-cream-dim sm:block">The archive <span className="ml-3 text-amber">{photos.length || '—'} frames</span></span></header>
    <main id="top">
      <section className="hero relative flex min-h-[calc(100svh-60px)] items-end overflow-hidden sm:min-h-[calc(100svh-72px)]"><img src={photos[0]?.src} alt={photos[0]?.alt || ''} className="hero-image absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" /><div className="relative z-10 w-full p-5 pb-10 sm:p-8 sm:pb-16 lg:p-12 lg:pb-20"><p className="label mb-5 text-amber">01 / NUNO + IMMA</p><h1 className="font-display text-[clamp(3.5rem,12vw,10rem)] font-semibold uppercase leading-[.88] tracking-[-.035em]">Nuno</h1><p className="mt-5 max-w-[28rem] font-body text-base leading-[1.55] text-cream-muted">A record of the ordinary days that became ours.</p><div className="mt-10 hidden items-center gap-3 sm:flex"><span className="h-10 w-px bg-amber" /><span className="label text-cream-muted">Scroll to enter</span></div></div></section>
      <section className="mx-auto grid max-w-[1440px] grid-cols-12 gap-6 px-5 py-24 sm:px-8 lg:gap-12 lg:px-12 lg:py-40"><Reveal className="col-span-12 lg:col-span-2"><p className="font-display text-6xl text-amber">02</p></Reveal><Reveal delay={80} className="col-span-12 max-w-[38rem] lg:col-span-7 lg:col-start-4"><h2 className="font-display text-[clamp(2.25rem,6vw,5rem)] font-semibold leading-[.94] tracking-[-.025em]">The days worth keeping.</h2><p className="mt-7 font-body text-base leading-[1.55] text-cream-muted">Places, small rituals, and the space between plans. Nothing staged. Everything ours.</p></Reveal></section>
      <section aria-labelledby="gallery-title" className="mx-auto max-w-[1440px] px-5 pb-24 sm:px-8 lg:px-12 lg:pb-40"><div className="mb-8 flex items-end justify-between border-b border-cream/15 pb-4"><h2 id="gallery-title" className="label text-cream">The frames</h2><span className="label text-cream-dim">A small archive of us</span></div><div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-12 lg:gap-4">{photos.map((photo, i) => <React.Fragment key={photo.id}><Reveal delay={(i % 5) * 80} className={`${photo.featured ? 'col-span-2 lg:col-span-8' : 'col-span-1 lg:col-span-4'} ${photo.orientation === 'portrait' ? 'aspect-[4/5]' : 'aspect-[16/10]'}`}><button className="photo-tile group" onClick={() => setActive(i)} aria-label={`Open ${photo.caption}`}><img src={photo.src} alt={photo.alt} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" width={photo.orientation === 'portrait' ? 800 : 1600} height={1000} /><span className="photo-caption"><span>{photo.caption}</span><span>{photo.date}</span></span></button></Reveal>{i === 3 && quotes[0] && <Quote quote={quotes[0]} />}</React.Fragment>)}</div></section>
      {quotes[1] && <Quote quote={quotes[1]} wide />}
    </main>
    <footer className="border-t border-cream/15 px-5 py-12 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1440px] items-end justify-between"><p className="label text-cream">Nuno + Imma</p><p className="label text-right text-cream-dim">A small archive of us<br />2024 — now</p></div></footer>
    <div className="grain" />{active !== null && <Lightbox photos={photos} index={active} onClose={() => setActive(null)} onChange={setActive} />}
  </div>
}
function Quote({ quote, wide }) { return <section className={`quote-panel ${wide ? 'my-0' : 'col-span-2 lg:col-span-12 my-8 lg:my-16'}`}><Reveal className="mx-auto max-w-[58rem] px-5 text-left sm:px-8 sm:text-center"><span className="mb-8 block h-px w-12 bg-amber" /><blockquote className="font-quote text-[clamp(2rem,4.2vw,4.25rem)] leading-[1.04] tracking-[-.018em] italic">{quote.text}</blockquote>{quote.author && <cite className="mt-7 block label not-italic text-cream-dim">— {quote.author}</cite>}</Reveal></section> }
createRoot(document.getElementById('root')).render(<App />)
