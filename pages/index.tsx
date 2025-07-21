// ✅ index.tsx - หน้า Chat หลัก พร้อมตรวจสอบ session
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Home() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [loading, setLoading] = useState(false)
  const sessionIdRef = useRef('')
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    sessionIdRef.current = uuidv4()
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session?.user) {
        router.push('/login')
      } else {
        setUser(data.session.user)
      }
      setAuthChecked(true)
    }
    checkSession()
  }, [router])

  const handleSend = async () => {
    if (!input.trim()) return
    const userMessage = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, session_id: sessionIdRef.current }),
      })
      const data = await res.json()
      if (res.ok && typeof data.content === 'string') {
        setMessages((prev) => [...prev, data])
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: '❌ โครงสร้างคำตอบจาก AI ไม่ถูกต้อง' }])
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: '❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' }])
    } finally {
      setLoading(false)
    }
  }

  if (!authChecked) return <p>Loading...</p>

  return (
    <main style={{ padding: 20, maxWidth: 600, margin: 'auto' }}>
      <h1>AI God Chat (GPT-4o)</h1>
      <div style={{ marginBottom: 20 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <strong>{msg.role === 'user' ? 'You' : 'AI God'}:</strong> {msg.content}
          </div>
        ))}
        {loading && <div>⏳ กำลังประมวลผล...</div>}
      </div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
          }
        }}
        rows={4}
        placeholder="พิมพ์ข้อความแล้วกด Enter หรือคลิก Send"
        style={{ width: '100%', padding: 10 }}
      />
      <button onClick={handleSend} disabled={loading} style={{ marginTop: 10, padding: '10px 20px', background: '#111', color: '#fff' }}>
        Send
      </button>
    </main>
  )
}
