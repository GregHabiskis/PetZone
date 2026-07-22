'use client'

import { ArrowUp, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

export function GlobalActions() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight)
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return <>
    {visible && <button className="go-top" aria-label="Go to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><ArrowUp /></button>}
    <a className="whatsapp" href="https://wa.me/88001787101001" target="_blank" rel="noreferrer" aria-label="Chat with Pet Zone on WhatsApp"><MessageCircle /></a>
  </>
}
