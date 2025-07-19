'use client'

import { useState } from 'react'

export default function Home() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [loading, setLoading] = useState(false)

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
        }),
      })

      const data = await res.json()

      if (res.ok && data.choices?.[0]?.message?.content) {
        const aiMessage = data.choices[0].message
        setMessages((prev) => [...prev, aiMessage])
      } else {
        console.error('API error:', data)
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '❌ เกิดข้อผิดพลาดจาก GPT API' },
        ])
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: 20, maxWidth: 600, margin: 'auto' }}>
      <h1>AI God Chat (GPT-4o)</h1>

      <div style={{ marginBottom: 20 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <strong>{msg.role === 'user' ? 'You' : 'AI God'}:</strong>{' '}
            {msg.content}
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

      <button
        onClick={handleSend}
        disabled={loading}
        style={{
          marginTop: 10,
          padding: '10px 20px',
          cursor: 'pointer',
          background: '#111',
          color: '#fff',
        }}
      >
        Send
      </button>
    </main>
  )
}
