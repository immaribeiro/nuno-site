import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { SITE_PIN, SITE_TOKEN } from './config'

const UNLOCKED_STORAGE_KEY = 'nuno-archive-unlocked'
const TOPICS_STORAGE_KEY = 'nuno-event-topics'
const NEWS_TOPICS_STORAGE_KEY = 'nuno-news-topics'
const PINNED_STORAGE_KEY = 'nuno_events_pinned'
const CHAT_STORAGE_KEY = 'nuno-chat-history'

function PinGate({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef(null)
  useEffect(() => { inputRef.current?.focus() }, [])
  const submit = (event) => {
    event.preventDefault()
    if (pin === SITE_PIN) { sessionStorage.setItem(UNLOCKED_STORAGE_KEY, SITE_PIN); onUnlock(); return }
    setError(true); setPin(''); inputRef.current?.focus()
  }
  return <main className="pin-gate" aria-labelledby="pin-title"><div className={`pin-gate-inner ${error ? 'pin-gate-shake' : ''}`}>
    <p className="label text-amber">NUNO <span className="text-cream-dim">/</span> IMMA</p><span className="pin-rule" aria-hidden="true" /><p className="label text-cream-dim">The archive</p>
    <h1 id="pin-title" className="pin-title">A private<br />collection.</h1><p className="pin-note">For Nuno</p>
    <form className="pin-form" onSubmit={submit} noValidate><label className="sr-only" htmlFor="archive-pin">Enter the archive PIN</label><input ref={inputRef} id="archive-pin" className="pin-input" type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4} autoComplete="off" value={pin} onChange={(event) => { setError(false); setPin(event.target.value.replace(/\D/g, '').slice(0, 4)) }} aria-describedby="pin-hint pin-status" /><button className="pin-submit" type="submit">Unlock <span aria-hidden="true">→</span></button></form>
    <p id="pin-hint" className="pin-hint">Enter the four-digit code to continue.</p><p id="pin-status" className="pin-status" role="status" aria-live="polite">{error ? 'That code was not the one.' : '\u00a0'}</p>
  </div><div className="grain" /></main>
}

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  useEffect(() => { const node = ref.current; if (!node) return; const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { node.classList.add('is-visible'); observer.disconnect() } }, { threshold: 0.12 }); observer.observe(node); return () => observer.disconnect() }, [])
  return <div ref={ref} className={`reveal ${className}`} style={{ '--reveal-delay': `${Math.min(delay, 400)}ms` }}>{children}</div>
}

function Lightbox({ photos, index, onClose, onChange }) {
  const closeRef = useRef(null); const startX = useRef(0); const photo = photos[index]
  useEffect(() => { document.body.classList.add('modal-open'); closeRef.current?.focus(); const key = (event) => { if (event.key === 'Escape') onClose(); if (event.key === 'ArrowRight') onChange((index + 1) % photos.length); if (event.key === 'ArrowLeft') onChange((index - 1 + photos.length) % photos.length) }; document.addEventListener('keydown', key); return () => { document.body.classList.remove('modal-open'); document.removeEventListener('keydown', key) } }, [index, onClose, onChange, photos.length])
  return <div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-5 sm:p-8" role="dialog" aria-modal="true" aria-label={photo.caption} onClick={(e) => e.target === e.currentTarget && onClose()} onTouchStart={(e) => { startX.current = e.changedTouches[0].screenX }} onTouchEnd={(e) => { const delta = e.changedTouches[0].screenX - startX.current; if (Math.abs(delta) > 48) onChange((index + (delta < 0 ? 1 : -1) + photos.length) % photos.length) }}>
    <div className="flex justify-end"><button ref={closeRef} className="modal-button" onClick={onClose} aria-label="Close lightbox">×</button></div><div className="flex min-h-0 flex-1 items-center justify-center"><img src={photo.src} alt={photo.alt} className="max-h-[84svh] max-w-[92vw] object-contain" /></div>
    <div className="flex items-end justify-between gap-4 pt-5 text-cream"><div><p className="font-body text-xs uppercase tracking-[.16em] text-amber">{photo.id} / {String(photos.length).padStart(2, '0')}</p><p className="mt-1 font-body text-sm text-cream-muted">{photo.caption} · {photo.date}</p></div><div className="flex gap-2"><button className="modal-button" onClick={() => onChange((index - 1 + photos.length) % photos.length)} aria-label="Previous photo">←</button><button className="modal-button" onClick={() => onChange((index + 1) % photos.length)} aria-label="Next photo">→</button></div></div>
  </div>
}

const dateTime = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
const monthName = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })
function readStorage(key, fallback = []) { try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return Array.isArray(value) ? value : fallback } catch { return fallback } }
function normaliseEvent(event, index) { return { ...event, id: event.id || `${event.title || 'event'}-${index}`, title: event.title || 'Untitled event', topics: Array.isArray(event.topics) ? event.topics : [], focus: Array.isArray(event.focus) ? event.focus : [], price: typeof event.price === 'string' ? event.price.trim() : '', dateValue: new Date(event.date) } }
function eventMatches(event, category, topics) {
  if (category !== 'All' && event.category?.toLowerCase() !== category.toLowerCase()) return false
  const searchable = [event.title, event.description, event.category, ...event.topics].filter(Boolean).join(' ').toLowerCase()
  return topics.every((topic) => searchable.includes(topic.toLowerCase()))
}
function focusTopic(event, focusTopics) { const search = [event.title, event.description, ...event.focus].filter(Boolean).join(' ').toLowerCase(); return focusTopics.find((topic) => search.includes(topic.toLowerCase())) || null }
function groupEvents(events, focusTopics) {
  const today = new Date(); const todayKey = today.toDateString(); const upcomingLimit = new Date(today); upcomingLimit.setDate(today.getDate() + 7); const groups = new Map()
  events.forEach((event) => { const key = event.dateValue.toDateString() === todayKey ? 'Today' : event.dateValue < upcomingLimit ? 'Upcoming' : monthName.format(event.dateValue); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(event) })
  return [...groups.entries()].map(([label, group]) => [label, group.map((event, index) => ({ event, index })).sort((a, b) => (focusTopic(b.event, focusTopics) ? 1 : 0) - (focusTopic(a.event, focusTopics) ? 1 : 0) || a.index - b.index).map(({ event }) => event)])
}
function normalisePin(pin) { return { id: pin.id || '', title: pin.title || 'Untitled event', date: pin.date, venue: pin.venue || '', url: pin.url || '' } }
function EventsPage() {
  const [events, setEvents] = useState([]); const savedTopics = useRef(readStorage(TOPICS_STORAGE_KEY)); const [topics, setTopics] = useState(savedTopics.current); const [focusTopics, setFocusTopics] = useState([]); const [sharedPins, setSharedPins] = useState([]); const [personalPins, setPersonalPins] = useState(() => readStorage(PINNED_STORAGE_KEY).map(normalisePin)); const [category, setCategory] = useState('All'); const [topicInput, setTopicInput] = useState(''); const headingRef = useRef(null)
  useEffect(() => { Promise.allSettled([fetch('./events.json').then((response) => { if (!response.ok) throw new Error('events unavailable'); return response.json() }), fetch('./topics.json').then((response) => { if (!response.ok) throw new Error('topics unavailable'); return response.json() }), fetch('./pinned.json').then((response) => { if (!response.ok) throw new Error('pins unavailable'); return response.json() })]).then(([eventsResult, topicsResult, pinsResult]) => { if (eventsResult.status === 'fulfilled' && Array.isArray(eventsResult.value)) setEvents(eventsResult.value.map(normaliseEvent).filter((event) => !Number.isNaN(event.dateValue.getTime())).sort((a, b) => a.dateValue - b.dateValue)); if (topicsResult.status === 'fulfilled') { const shared = Array.isArray(topicsResult.value?.focus) ? topicsResult.value.focus.filter(Boolean) : []; setFocusTopics(shared); setTopics([...savedTopics.current, ...shared.filter((topic) => !savedTopics.current.some((item) => item.toLowerCase() === topic.toLowerCase()))]) } if (pinsResult.status === 'fulfilled' && Array.isArray(pinsResult.value)) setSharedPins(pinsResult.value.map(normalisePin)) }).catch(() => {}) }, [])
  useEffect(() => { localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(topics)) }, [topics])
  useEffect(() => { localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(personalPins)) }, [personalPins])
  useEffect(() => { headingRef.current?.focus() }, [])
  const addTopic = (event) => { event.preventDefault(); const topic = topicInput.trim().replace(/\s+/g, ' '); if (topic && !topics.some((item) => item.toLowerCase() === topic.toLowerCase())) setTopics([...topics, topic]); setTopicInput('') }
  const togglePin = (event) => { const pin = normalisePin(event); setPersonalPins((current) => current.some((item) => item.id === pin.id) ? current.filter((item) => item.id !== pin.id) : [...current, pin]) }
  const clearFilters = () => { setCategory('All'); setTopics([]) }
  const filtered = events.filter((event) => eventMatches(event, category, topics)); const groups = groupEvents(filtered, focusTopics); const pins = [...sharedPins.map((pin) => ({ ...pin, shared: true })), ...personalPins.map((pin) => ({ ...pin, shared: false }))].reduce((all, pin) => { const live = events.find((event) => pin.id && event.id === pin.id); const current = live ? normalisePin(live) : pin; const existing = all.findIndex((item) => item.id && item.id === current.id); if (existing >= 0) all[existing] = { ...all[existing], ...current, shared: all[existing].shared || pin.shared }; else all.push({ ...current, shared: pin.shared }); return all }, []).sort((a, b) => { const ap = new Date(a.date) < new Date(); const bp = new Date(b.date) < new Date(); return Number(ap) - Number(bp) || new Date(a.date) - new Date(b.date) })
  return <main id="events" className="events-page"><div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-32">
    <div className="mb-12 max-w-[42rem]"><p className="label mb-5 text-amber">03 / OUT IN THE WORLD</p><h1 ref={headingRef} tabIndex="-1" className="font-display text-[clamp(3rem,8vw,6rem)] font-semibold leading-[.94] tracking-[-.025em]">Events</h1><p className="mt-6 font-body text-base leading-[1.55] text-cream-muted">Places to go, things to hear, and a few reasons to leave the house.</p></div>
    {pins.length > 0 && <section className="pinned-strip" aria-label="Pinned events"><div className="pinned-heading"><span className="label text-amber">Pinned</span><span className="label text-cream-dim">{String(pins.length).padStart(2, '0')}</span></div><div className="pinned-grid">{pins.map((pin) => <article className={`pinned-card ${new Date(pin.date) < new Date() ? 'is-past' : ''}`} key={`${pin.id || pin.title}-${pin.date}-${pin.shared ? 'shared' : 'personal'}`}><div className="pinned-card-meta"><time dateTime={pin.date}>{new Date(pin.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</time>{pin.shared && <span className="pinned-shared">shared</span>}</div><h2>{pin.url ? <a href={pin.url} target="_blank" rel="noreferrer">{pin.title}</a> : pin.title}</h2><p>{pin.venue || 'Venue TBC'}</p>{pin.id && events.some((event) => event.id === pin.id) && <button type="button" className="pin-remove" onClick={() => togglePin(pin)} aria-label={`Unpin ${pin.title}`}>★</button>}</article>)}</div></section>}
    <section aria-label="Event filters" className="event-filters"><div className="filter-row"><span className="label text-cream-dim">Category</span><div className="filter-chips">{['All', 'Music', 'Theater', 'Arts'].map((item) => <button key={item} type="button" className={`filter-chip ${category === item ? 'is-active' : ''}`} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div></div>
      <form className="topic-form" onSubmit={addTopic}><label className="label text-cream-dim" htmlFor="event-topic">Focus on a topic</label><div className="topic-entry"><input id="event-topic" value={topicInput} onChange={(event) => setTopicInput(event.target.value)} placeholder="Add topic — jazz, fado…" /><button type="submit">Add</button></div></form>{topics.length > 0 && <div className="topic-list" aria-label="Active topics">{topics.map((topic) => <button type="button" className="topic-chip" key={topic} onClick={() => setTopics(topics.filter((item) => item !== topic))}>{topic} <span aria-hidden="true">×</span><span className="sr-only">Remove {topic}</span></button>)}</div>}
    </section>
    {events.length === 0 ? <div className="events-empty" role="status"><span className="empty-rule" /><h2 className="font-display text-4xl font-semibold">Nothing scheduled yet.</h2><p className="mt-3 max-w-[30rem] font-body text-cream-muted">Try another focus, or check back soon. The calendar is still being written.</p></div> : groups.length === 0 ? <div className="events-empty events-no-matches" role="status"><span className="empty-rule" /><h2 className="font-display text-4xl font-semibold">No matches — remove a topic or category.</h2><p className="mt-3 max-w-[30rem] font-body text-cream-muted">Remove a topic or category to see more of the calendar.</p><button type="button" className="clear-filters" onClick={clearFilters}>Clear filters</button></div> : <div className="event-groups">{groups.map(([label, group]) => <section key={label} aria-labelledby={`event-group-${label}`}><div className="event-group-heading"><h2 id={`event-group-${label}`} className="font-display text-4xl font-semibold">{label}</h2><span className="label text-cream-dim">{String(group.length).padStart(2, '0')} {group.length === 1 ? 'event' : 'events'}</span></div><div className="event-grid">{group.map((event) => { const focusedTopic = focusTopic(event, focusTopics); const isPinned = personalPins.some((pin) => pin.id === event.id); return <article className="event-card" key={event.id}><div className="event-card-top"><time dateTime={event.date}>{dateTime.format(event.dateValue)}</time><div className="event-card-actions">{focusedTopic && <span className="focus-badge">🎯 {focusedTopic}</span>} {event.category && <span className="event-category">{event.category}</span>}<button type="button" className={`pin-toggle ${isPinned ? 'is-pinned' : ''}`} onClick={() => togglePin(event)} aria-pressed={isPinned} aria-label={`${isPinned ? 'Unpin' : 'Pin'} ${event.title}`}>{isPinned ? '★' : '☆'}</button></div></div><h3 className="font-display text-3xl font-semibold leading-none">{event.title}</h3>{(event.venue || event.city) && <p className="event-venue">{[event.venue, event.city].filter(Boolean).join(' · ')}</p>}{event.price && <p className="event-price">{event.price}</p>}{event.description && <p className="event-description">{event.description}</p>}{event.topics.length > 0 && <div className="event-topics">{event.topics.map((topic) => <span key={topic}>{topic}</span>)}</div>}{event.url && <a className="event-link" href={event.url} target="_blank" rel="noreferrer">More info <span aria-hidden="true">↗</span></a>}</article> })}</div></section>)}</div>}
  </div></main>
}

const NEWS_CATEGORIES = [['All', 'All'], ['portugal', 'Portugal'], ['local', 'Porto & Braga'], ['world', 'Mundo'], ['music', 'Música'], ['ai', 'IA']]
const newsDate = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short' })
const newsDayDate = new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
function normaliseNews(item, index) { const publishedValue = new Date(item.published); return { ...item, id: item.id || `news-${index}`, title: item.title || 'Untitled story', source: item.source || 'Unknown source', category: item.category || '', topics: Array.isArray(item.topics) ? item.topics.filter(Boolean) : [], summary: item.summary || '', dateValue: publishedValue } }
function newsMatches(item, category, topics) { if (category !== 'All' && item.category.toLowerCase() !== category) return false; const searchable = [item.title, item.summary, item.source, item.category, ...item.topics].filter(Boolean).join(' ').toLowerCase(); return topics.every((topic) => searchable.includes(topic.toLowerCase())) }
function newsDayKey(date) { return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` }
function groupNews(items) { const now = new Date(); const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1); const groups = new Map(); items.forEach((item) => { const key = newsDayKey(item.dateValue); const label = key === newsDayKey(now) ? 'Hoje' : key === newsDayKey(yesterday) ? 'Ontem' : newsDayDate.format(item.dateValue); if (!groups.has(label)) groups.set(label, []); groups.get(label).push(item) }); return [...groups.entries()] }
function NewsPage() {
  const savedTopics = useRef(readStorage(NEWS_TOPICS_STORAGE_KEY).filter((topic) => typeof topic === 'string'))
  const [news, setNews] = useState([]); const [topics, setTopics] = useState(savedTopics.current); const [category, setCategory] = useState('All'); const [topicInput, setTopicInput] = useState(''); const headingRef = useRef(null)
  useEffect(() => { Promise.allSettled([fetch('./news.json').then((response) => { if (!response.ok) throw new Error('news unavailable'); return response.json() }), fetch('./topics.json').then((response) => { if (!response.ok) throw new Error('topics unavailable'); return response.json() })]).then(([newsResult, topicsResult]) => { if (newsResult.status === 'fulfilled' && Array.isArray(newsResult.value)) setNews(newsResult.value.map(normaliseNews).filter((item) => !Number.isNaN(item.dateValue.getTime())).sort((a, b) => b.dateValue - a.dateValue)); if (topicsResult.status === 'fulfilled') { const shared = Array.isArray(topicsResult.value?.news_focus) ? topicsResult.value.news_focus.filter(Boolean) : []; setTopics([...savedTopics.current, ...shared.filter((topic) => !savedTopics.current.some((item) => item.toLowerCase() === topic.toLowerCase()))]) } }).catch(() => {}) }, [])
  useEffect(() => { localStorage.setItem(NEWS_TOPICS_STORAGE_KEY, JSON.stringify(topics)) }, [topics])
  useEffect(() => { headingRef.current?.focus() }, [])
  const addTopic = (event) => { event.preventDefault(); const topic = topicInput.trim().replace(/\s+/g, ' '); if (topic && !topics.some((item) => item.toLowerCase() === topic.toLowerCase())) setTopics([...topics, topic]); setTopicInput('') }
  const clearFilters = () => { setCategory('All'); setTopics([]) }
  const filtered = news.filter((item) => newsMatches(item, category, topics)); const groups = groupNews(filtered)
  return <main id="news" className="events-page news-page"><div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-32">
    <div className="mb-12 max-w-[42rem]"><p className="label mb-5 text-amber">04 / WHAT'S HAPPENING</p><h1 ref={headingRef} tabIndex="-1" className="font-display text-[clamp(3rem,8vw,6rem)] font-semibold leading-[.94] tracking-[-.025em]">News</h1><p className="mt-6 font-body text-base leading-[1.55] text-cream-muted">A concise read on the places, people, and ideas making noise.</p></div>
    <section aria-label="News filters" className="event-filters"><div className="filter-row"><span className="label text-cream-dim">Category</span><div className="filter-chips">{NEWS_CATEGORIES.map(([value, label]) => <button key={value} type="button" className={`filter-chip ${category === value ? 'is-active' : ''}`} aria-pressed={category === value} onClick={() => setCategory(value)}>{label}</button>)}</div></div><form className="topic-form" onSubmit={addTopic}><label className="label text-cream-dim" htmlFor="news-topic">Focus on a topic</label><div className="topic-entry"><input id="news-topic" value={topicInput} onChange={(event) => setTopicInput(event.target.value)} placeholder="Add topic — IA, música…" /><button type="submit">Add</button></div></form>{topics.length > 0 && <div className="topic-list" aria-label="Active news topics">{topics.map((topic) => <button type="button" className="topic-chip" key={topic} onClick={() => setTopics(topics.filter((item) => item !== topic))}>{topic} <span aria-hidden="true">×</span><span className="sr-only">Remove {topic}</span></button>)}</div>}</section>
    {news.length === 0 ? <div className="events-empty" role="status"><span className="empty-rule" /><h2 className="font-display text-4xl font-semibold">Nothing in the news yet.</h2><p className="mt-3 max-w-[30rem] font-body text-cream-muted">The next dispatch is still being gathered. Check back soon.</p></div> : groups.length === 0 ? <div className="events-empty events-no-matches" role="status"><span className="empty-rule" /><h2 className="font-display text-4xl font-semibold">No matches — remove a topic or category.</h2><p className="mt-3 max-w-[30rem] font-body text-cream-muted">Try widening your reading list to see more stories.</p><button type="button" className="clear-filters" onClick={clearFilters}>Clear filters</button></div> : <div className="news-groups">{groups.map(([label, group]) => <section key={label} aria-labelledby={`news-group-${label}`}><div className="event-group-heading"><h2 id={`news-group-${label}`} className="font-display text-4xl font-semibold">{label}</h2><span className="label text-cream-dim">{String(group.length).padStart(2, '0')} {group.length === 1 ? 'story' : 'stories'}</span></div><div className="news-grid">{group.map((item) => <article className="news-card" key={item.id}><div className="news-card-meta"><span>{item.source}</span><time dateTime={item.published}>{newsDate.format(item.dateValue).toUpperCase()}</time></div><h3><a href={item.url} target="_blank" rel="noreferrer">{item.title}</a></h3>{item.summary && <p className="news-summary">{item.summary}</p>}{item.topics.length > 0 && <div className="news-topics">{item.topics.map((topic) => <span key={topic}>{topic}</span>)}</div>}</article>)}</div></section>)}</div>}
  </div></main>
}

function Gallery({ photos, quotes, onPhoto, onUploaded }) {
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const fileRef = useRef(null)
  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true); setUploadMsg('')
    const form = new FormData()
    form.append('file', file)
    try {
      const response = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${SITE_TOKEN}` }, body: form })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'upload failed')
      setUploadMsg(data.message || 'Foto enviada!')
      onUploaded?.()
    } catch (err) {
      setUploadMsg(typeof err?.message === 'string' && err.message.length < 140 ? err.message : 'Não consegui enviar a foto — tenta outra vez.')
    } finally { setUploading(false) }
  }
  return <main id="top"><section className="hero relative flex min-h-[calc(100svh-60px)] items-end overflow-hidden sm:min-h-[calc(100svh-72px)]"><img src={photos[0]?.src} alt={photos[0]?.alt || ''} className="hero-image absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" /><div className="relative z-10 w-full p-5 pb-10 sm:p-8 sm:pb-16 lg:p-12 lg:pb-20"><p className="label mb-5 text-amber">01 / NUNO + IMMA</p><h1 className="font-display text-[clamp(3.5rem,12vw,10rem)] font-semibold uppercase leading-[.88] tracking-[-.035em]">Nuno</h1><p className="mt-5 max-w-[28rem] font-body text-base leading-[1.55] text-cream-muted">A record of the ordinary days that became ours.</p><div className="mt-10 hidden items-center gap-3 sm:flex"><span className="h-10 w-px bg-amber" /><span className="label text-cream-muted">Scroll to enter</span></div></div></section><section className="mx-auto grid max-w-[1440px] grid-cols-12 gap-6 px-5 py-24 sm:px-8 lg:gap-12 lg:px-12 lg:py-40"><Reveal className="col-span-12 lg:col-span-2"><p className="font-display text-6xl text-amber">02</p></Reveal><Reveal delay={80} className="col-span-12 max-w-[38rem] lg:col-span-7 lg:col-start-4"><h2 className="font-display text-[clamp(2.25rem,6vw,5rem)] font-semibold leading-[.94] tracking-[-.025em]">The days worth keeping.</h2><p className="mt-7 font-body text-base leading-[1.55] text-cream-muted">Places, small rituals, and the space between plans. Nothing staged. Everything ours.</p></Reveal></section><section aria-labelledby="gallery-title" className="mx-auto max-w-[1440px] px-5 pb-24 sm:px-8 lg:px-12 lg:pb-40"><div className="mb-8 flex items-end justify-between border-b border-cream/15 pb-4"><h2 id="gallery-title" className="label text-cream">The frames</h2><span className="label text-cream-dim">A small archive of us</span></div><div className="mb-8 flex flex-wrap items-center justify-end gap-3"><input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={uploadPhoto} aria-label="Add a photo" /><button type="button" className="us-action" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? 'A enviar…' : 'Add a photo +'}</button>{uploadMsg && <span className="label text-cream-dim" role="status">{uploadMsg}</span>}</div><div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-12 lg:gap-4">{photos.map((photo, i) => <React.Fragment key={photo.id}><Reveal delay={(i % 5) * 80} className={`${photo.featured ? 'col-span-2 lg:col-span-8' : 'col-span-1 lg:col-span-4'} ${photo.orientation === 'portrait' ? 'aspect-[4/5]' : 'aspect-[16/10]'}`}><button className="photo-tile group" onClick={() => onPhoto(i)} aria-label={`Open ${photo.caption}`}><img src={photo.src} alt={photo.alt} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" width={photo.orientation === 'portrait' ? 800 : 1600} height={1000} /><span className="photo-caption"><span>{photo.caption}</span><span>{photo.date}</span></span></button></Reveal>{i === 3 && quotes[0] && <Quote quote={quotes[0]} />}</React.Fragment>)}</div></section>{quotes[1] && <Quote quote={quotes[1]} wide />}</main> }
function Quote({ quote, wide }) { return <section className={`quote-panel ${wide ? 'my-0' : 'col-span-2 lg:col-span-12 my-8 lg:my-16'}`}><Reveal className="mx-auto max-w-[58rem] px-5 text-left sm:px-8 sm:text-center"><span className="mb-8 block h-px w-12 bg-amber" /><blockquote className="font-quote text-[clamp(2rem,4.2vw,4.25rem)] leading-[1.04] tracking-[-.018em] italic">{quote.text}</blockquote>{quote.author && <cite className="mt-7 block label not-italic text-cream-dim">— {quote.author}</cite>}</Reveal></section> }

const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=41.1579&longitude=-8.6291&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FLisbon&forecast_days=2'
const WEATHER_LABELS = { 0: ['☀️', 'Céu limpo'], 1: ['🌤️', 'Pouco nublado'], 2: ['⛅', 'Parcialmente nublado'], 3: ['☁️', 'Nublado'], 45: ['🌫️', 'Nevoeiro'], 48: ['🌫️', 'Nevoeiro'], 51: ['🌦️', 'Chuvisco'], 53: ['🌦️', 'Chuvisco'], 55: ['🌦️', 'Chuvisco'], 56: ['🌧️', 'Chuvisco gelado'], 57: ['🌧️', 'Chuvisco gelado'], 61: ['🌧️', 'Chuva'], 63: ['🌧️', 'Chuva'], 65: ['🌧️', 'Chuva forte'], 66: ['🌧️', 'Chuva gelada'], 67: ['🌧️', 'Chuva gelada'], 71: ['❄️', 'Neve'], 73: ['❄️', 'Neve'], 75: ['❄️', 'Neve forte'], 77: ['❄️', 'Granizo'], 80: ['🌦️', 'Aguaceiros'], 81: ['🌧️', 'Aguaceiros'], 82: ['⛈️', 'Aguaceiros fortes'], 85: ['🌨️', 'Neve'], 86: ['🌨️', 'Neve'], 95: ['⛈️', 'Trovoada'], 96: ['⛈️', 'Trovoada com granizo'], 99: ['⛈️', 'Trovoada com granizo'] }
function WeatherWidget() {
  const [weather, setWeather] = useState(null)
  useEffect(() => { fetch(WEATHER_URL).then((r) => r.ok ? r.json() : Promise.reject()).then(setWeather).catch(() => {}) }, [])
  if (!weather?.current) return null
  const [icon, label] = WEATHER_LABELS[weather.current.weather_code] || ['🌡️', 'Tempo variável']
  const today = weather.daily ? `${Math.round(weather.daily.temperature_2m_min[0])}°–${Math.round(weather.daily.temperature_2m_max[0])}°` : ''
  const tomorrow = weather.daily ? `${Math.round(weather.daily.temperature_2m_min[1])}°–${Math.round(weather.daily.temperature_2m_max[1])}°` : ''
  return <div className="weather-widget" aria-label="Porto weather"><span className="weather-icon">{icon}</span><span className="weather-now">{Math.round(weather.current.temperature_2m)}° · {label}</span><span className="weather-today">Hoje {today}</span><span className="weather-tomorrow">Amanhã {tomorrow}</span><span className="weather-wind">vento {Math.round(weather.current.wind_speed_10m)} km/h</span></div>
}

const MISS_YOU_PHRASES = [
  ['Volto na sexta-feira', 'para te dar tanto amor', 'que cais para o lado.'],
  ['Vou buscar-te', 'e não volto sem', 'te encher de beijos.'],
  ['Falta um dia', 'para te amar como deve ser', '— prepara-te.'],
  ['Guarda o colo', 'que na sexta', 'não te largo.'],
  ['Estou a contar as horas', 'para te fazer sorrir', 'até doer a bochecha.'],
  ['Na sexta volto armado', 'de mimos', 'e não há defesa que resista.'],
  ['Sei de um sofá', 'que vai testemunhar', 'a nossa melhor sexta-feira.'],
  ['Prepara o coração', 'que na sexta', 'vem aí um abanão.'],
  ['A mala está feita', 'o bilhete comprado', 'e a vontade toda na sexta.'],
  ['Esta semana até custa', 'mas a sexta', 'vai saber a eternidade.'],
  ['Até lá', 'guarda um sorriso', 'que eu levo o resto.'],
  ['A distância é parva', 'mas o reencontro', 'vai ser tudo menos parvo.'],
  ['Seis dias', 'para te mostrar', 'o que é saudade a sério.'],
  ['Conto os minutos', 'para te ouvir rir', 'e depois calar-te.'],
  ['Não faças planos', 'que a sexta', 'és só minha.'],
  ['O melhor de ti', 'e o melhor de mim', '— sexta-feira, sem rede.'],
  ['Vou aí', 'como quem não quer nada', 'mas quero tudo.'],
  ['Deixa o mundo de lado', 'que na sexta', 'só existimos nós.'],
]

function MissYouPopup({ onClose, lines }) {
  useEffect(() => { document.body.classList.add('modal-open'); return () => document.body.classList.remove('modal-open') }, [])
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-5 sm:p-8" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="miss-you-card relative flex max-w-[42rem] flex-col items-center justify-center rounded-sm px-8 py-16 text-center sm:px-12 sm:py-24">
      <div className="grain" style={{ position: 'absolute', zIndex: -1, opacity: .12 }} />
      <button className="modal-button absolute right-4 top-4 z-10" onClick={onClose} aria-label="Fechar">×</button>
      <span className="miss-you-heart">♡</span>
      <div className="miss-you-text">
        {lines.map((line, i) => <span key={i}>{line}</span>)}
      </div>
    </div>
  </div>
}

const DONE_IDEAS_KEY = 'nuno-us-done-ideas'
function UsPage() {
  const [couple, setCouple] = useState({ since: '', milestones: [], songs: [], dateIdeas: [] })
  const [doneIdeas, setDoneIdeas] = useState(() => readStorage(DONE_IDEAS_KEY))
  const [surprise, setSurprise] = useState(null)
  const [missYouLines, setMissYouLines] = useState(null)
  const headingRef = useRef(null)
  useEffect(() => { fetch('./couple.json').then((r) => r.ok ? r.json() : Promise.reject()).then((data) => setCouple({ since: '', milestones: [], songs: [], dateIdeas: [], ...data })).catch(() => {}) }, [])
  useEffect(() => { localStorage.setItem(DONE_IDEAS_KEY, JSON.stringify(doneIdeas)) }, [doneIdeas])
  useEffect(() => { headingRef.current?.focus() }, [])
  const sinceDate = couple.since ? new Date(couple.since) : null
  const days = sinceDate && !Number.isNaN(sinceDate.getTime()) ? Math.max(1, Math.floor((new Date() - sinceDate) / 86400000)) : null
  const anniversary = sinceDate && !Number.isNaN(sinceDate.getTime()) ? (() => { const now = new Date(); let a = new Date(now.getFullYear(), sinceDate.getMonth(), sinceDate.getDate()); if (a < now) a = new Date(now.getFullYear() + 1, sinceDate.getMonth(), sinceDate.getDate()); return Math.round((a - now) / 86400000) })() : null
  const undone = couple.dateIdeas.filter((idea) => !doneIdeas.includes(idea))
  const pickSurprise = () => { if (!undone.length) return; setSurprise(undone[Math.floor(Math.random() * undone.length)]) }
  const toggleIdea = (idea) => setDoneIdeas((current) => current.includes(idea) ? current.filter((i) => i !== idea) : [...current, idea])
  const upcomingMilestone = couple.milestones.map((m) => ({ ...m, date: new Date(m.date) })).filter((m) => !Number.isNaN(m.date.getTime())).sort((a, b) => a.date - b.date).find((m) => m.date >= new Date()) || null
  return <main id="us" className="events-page us-page"><div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-32">
    <div className="mb-12 max-w-[42rem]"><p className="label mb-5 text-amber">05 / JUST US</p><h1 ref={headingRef} tabIndex="-1" className="font-display text-[clamp(3rem,8vw,6rem)] font-semibold leading-[.94] tracking-[-.025em]">Us</h1><p className="mt-6 font-body text-base leading-[1.55] text-cream-muted">A few small things that are ours — the weather for tomorrow's plans, the count of days, and the ideas we keep for later.</p></div>
    <WeatherWidget />
    {days !== null && <section className="us-section" aria-label="Days together"><div className="us-count"><span className="us-count-number">{days}</span><span className="us-count-label">dias de nós</span></div>{anniversary !== null && <p className="us-sub">Faltam {anniversary} dias para o nosso dia.</p>}</section>}
    {upcomingMilestone && <section className="us-section" aria-label="Next milestone"><p className="label text-amber">Próximo marco</p><h2 className="font-display text-3xl font-semibold">{upcomingMilestone.label}</h2><p className="us-sub">{upcomingMilestone.date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })} · em {Math.max(1, Math.round((upcomingMilestone.date - new Date()) / 86400000))} dias</p></section>}
    {couple.dateIdeas.length > 0 && <section className="us-section" aria-label="Date ideas"><div className="us-heading-row"><p className="label text-amber">A lista de ideias</p><button type="button" className="us-action" onClick={pickSurprise} disabled={!undone.length}>Surpresa 🎲</button></div>{surprise && <div className="us-surprise"><p className="font-display text-3xl font-semibold">{surprise}</p></div>}<ul className="us-list">{couple.dateIdeas.map((idea) => <li key={idea} className={doneIdeas.includes(idea) ? 'is-done' : ''}><button type="button" onClick={() => toggleIdea(idea)} aria-pressed={doneIdeas.includes(idea)}><span className="us-check">{doneIdeas.includes(idea) ? '✓' : '○'}</span>{idea}</button></li>)}</ul>{undone.length === 0 && <button type="button" className="us-action" onClick={() => setDoneIdeas([])}>Tudo feito — recomeçar</button>}</section>}
    <section className="us-section" aria-label="Our songs"><div className="us-heading-row"><p className="label text-amber">A nossa banda sonora</p></div>{couple.songs.length > 0 ? <ul className="us-songs">{couple.songs.map((song, index) => <li key={`${song.title}-${index}`}><span className="us-song-index">{String(index + 1).padStart(2, '0')}</span>{song.url ? <a href={song.url} target="_blank" rel="noreferrer">{song.title}{song.artist ? ` — ${song.artist}` : ''}</a> : <span>{song.title}{song.artist ? ` — ${song.artist}` : ''}</span>}</li>)}</ul> : <p className="us-sub">Ainda sem banda sonora — diz ao Hermes quais são as nossas músicas.</p>}</section>
    <section className="us-section" aria-label="Miss you"><button type="button" className="miss-you-button" onClick={() => setMissYouLines(MISS_YOU_PHRASES[Math.floor(Math.random() * MISS_YOU_PHRASES.length)])}>miss you</button></section>
    {missYouLines && <MissYouPopup lines={missYouLines} onClose={() => setMissYouLines(null)} />}
  </div></main>
}

const CHAT_GREETING = 'Olá, Nuno! 👋 Sou a Hermes, a assistente da Imma — e agora também tua. Pede o que quiseres: novos tópicos nas notícias, ideias de programas, mudanças na página Us, ou outra coisa qualquer para este site.'
function ChatPage() {
  const [messages, setMessages] = useState(() => { const saved = readStorage(CHAT_STORAGE_KEY).filter((m) => m && typeof m === 'object' && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string'); return saved.length ? saved : [{ role: 'assistant', text: CHAT_GREETING }] })
  const [input, setInput] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const endRef = useRef(null); const headingRef = useRef(null)
  useEffect(() => { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-50))) }, [messages])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, busy])
  useEffect(() => { headingRef.current?.focus() }, [])
  const send = async (event) => {
    event.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setMessages((current) => [...current, { role: 'user', text }]); setInput(''); setBusy(true); setError('')
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SITE_TOKEN}` }, body: JSON.stringify({ message: text }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'request failed')
      setMessages((current) => [...current, { role: 'assistant', text: data.reply || '(sem resposta)' }])
    } catch (err) {
      setError(typeof err?.message === 'string' && err.message.length < 140 ? err.message : 'Não consegui falar com a Hermes — tenta outra vez.')
    } finally { setBusy(false) }
  }
  const clearChat = () => { setMessages([{ role: 'assistant', text: CHAT_GREETING }]) }
  return <main id="chat" className="events-page chat-page"><div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-32">
    <div className="mb-12 max-w-[42rem]"><p className="label mb-5 text-amber">06 / THE ASSISTANT</p><h1 ref={headingRef} tabIndex="-1" className="font-display text-[clamp(3rem,8vw,6rem)] font-semibold leading-[.94] tracking-[-.025em]">Hermes</h1><p className="mt-6 font-body text-base leading-[1.55] text-cream-muted">Uma linha direta para a assistente que mantém este site. Pede novos tópicos, programas, ou mudanças — ela pode demorar alguns segundos a responder.</p></div>
    <section className="chat-shell" aria-label="Chat com a Hermes"><div className="chat-window" role="log" aria-live="polite">{messages.map((msg, index) => <div key={index} className={`chat-msg ${msg.role === 'user' ? 'is-user' : 'is-hermes'}`}><div className="chat-bubble"><p>{msg.text}</p><span className="chat-meta">{msg.role === 'user' ? 'Nuno' : 'Hermes'}</span></div></div>)}{busy && <div className="chat-msg is-hermes"><div className="chat-bubble chat-typing" role="status" aria-label="A Hermes está a pensar"><span /><span /><span /></div></div>}<div ref={endRef} /></div>
      {error && <p className="chat-error" role="status">{error}</p>}
      <form className="chat-form" onSubmit={send}><label className="sr-only" htmlFor="chat-input">Mensagem para a Hermes</label><input id="chat-input" className="chat-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Pede o que quiseres…" maxLength={2000} autoComplete="off" disabled={busy} /><button type="submit" className="chat-send" disabled={busy || !input.trim()}>{busy ? '…' : 'Enviar'}</button></form>
      <div className="chat-footer"><button type="button" className="us-action" onClick={clearChat}>Recomeçar conversa</button><span className="label text-cream-dim">Os pedidos entram diretamente na assistente.</span></div>
    </section>
  </div></main>
}

function App() {
  const [photos, setPhotos] = useState([]); const [quotes, setQuotes] = useState([]); const [active, setActive] = useState(null); const [view, setView] = useState('gallery'); const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCKED_STORAGE_KEY) === SITE_PIN)
  const refreshPhotos = () => { fetch('./manifest.json').then(r => r.json()).then(setPhotos).catch(console.error) }
  useEffect(() => { Promise.all([fetch('./manifest.json').then(r => r.json()), fetch('./quotes.json').then(r => r.json())]).then(([p, q]) => { setPhotos(p); setQuotes(q) }).catch(console.error) }, [])
  useEffect(() => { if (active !== null) { const pre = new Image(); pre.src = photos[(active + 1) % photos.length]?.src } }, [active, photos])
  const switchView = (nextView) => { setView(nextView); window.scrollTo(0, 0) }
  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />
  return <div className="min-h-screen bg-ink text-cream"><header className="site-header"><button className="wordmark" onClick={() => switchView('gallery')}>NUNO <span className="text-amber">/</span> IMMA</button><nav aria-label="Primary navigation"><button className={`nav-link ${view === 'gallery' ? 'is-active' : ''}`} onClick={() => switchView('gallery')} aria-pressed={view === 'gallery'}>The archive</button><button className={`nav-link ${view === 'events' ? 'is-active' : ''}`} onClick={() => switchView('events')} aria-pressed={view === 'events'}>Events</button><button className={`nav-link ${view === 'news' ? 'is-active' : ''}`} onClick={() => switchView('news')} aria-pressed={view === 'news'}>News</button><button className={`nav-link ${view === 'us' ? 'is-active' : ''}`} onClick={() => switchView('us')} aria-pressed={view === 'us'}>Us</button><button className={`nav-link ${view === 'chat' ? 'is-active' : ''}`} onClick={() => switchView('chat')} aria-pressed={view === 'chat'}>Hermes</button></nav></header>{view === 'gallery' ? <Gallery photos={photos} quotes={quotes} onPhoto={setActive} onUploaded={refreshPhotos} /> : view === 'events' ? <EventsPage /> : view === 'news' ? <NewsPage /> : view === 'us' ? <UsPage /> : <ChatPage />}<footer className="border-t border-cream/15 px-5 py-12 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1440px] items-end justify-between"><p className="label text-cream">Nuno + Imma</p><p className="label text-right text-cream-dim">A small archive of us<br />2024 — now</p></div></footer><div className="grain" />{active !== null && <Lightbox photos={photos} index={active} onClose={() => setActive(null)} onChange={setActive} />}</div>
}
createRoot(document.getElementById('root')).render(<App />)
