'use client'

import { v4 as uuidv4 } from 'uuid' // ตรวจสอบให้แน่ใจว่ามีการ import uuidv4
import { useEffect, useRef, useState } from 'react'

export default function Home() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [loading, setLoading] = useState(false)

  const sessionIdRef = useRef<string>('') // ใช้ useRef สำหรับเก็บ session id

  useEffect(() => {
    // กำหนด session id เพียงครั้งเดียวเมื่อ component ถูก mount
    if (!sessionIdRef.current) {
      sessionIdRef.current = uuidv4()
    }
  }, [])

  const handleSend = async () => {
    if (!input.trim()) return
    const userMessage = { role: 'user', content: input.trim() }

    // เพิ่มข้อความผู้ใช้ลงใน state ทันทีเพื่อแสดงผลบน UI
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('') // เคลียร์ input field
    setLoading(true) // ตั้งค่าสถานะโหลด

    try {
      const res = await fetch('/api/chat', {
        method: 'POST', // ตรวจสอบให้แน่ใจว่า HTTP Method เป็น POST
        headers: {
          'Content-Type': 'application/json',
        },
        // ส่งข้อความทั้งหมดในแชทไปเพื่อให้ AI มีบริบท และส่ง session_id ไปด้วย
        body: JSON.stringify({
          messages: newMessages,
          session_id: sessionIdRef.current, // ส่ง session_id ไปยัง API
        }),
      })

      const data = await res.json() // รับ JSON response จาก API Route

      // ตรวจสอบว่า HTTP response เป็น OK (สถานะ 200) หรือไม่
      if (res.ok) {
        // ตรวจสอบโครงสร้างของข้อมูลที่ได้รับกลับมาอย่างละเอียด
        if (data && typeof data.content === 'string' && typeof data.role === 'string') {
          const aiMessage = data // data คือ object ข้อความของ AI โดยตรง
          setMessages((prev) => [...prev, aiMessage]) // เพิ่มข้อความ AI ลงใน state
        } else {
          // กรณีที่ API ตอบกลับ 200 OK แต่โครงสร้าง JSON ไม่ตรงตามที่คาดหวัง
          console.error('Unexpected successful API response structure:', data)
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: '❌ โครงสร้างคำตอบจาก AI ไม่ถูกต้อง' },
          ])
        }
      } else {
        // กรณีที่ API Route ตอบกลับสถานะอื่นที่ไม่ใช่ 200 OK (เช่น 401, 405, 500)
        console.error('API error (non-200 status):', data)
        const apiErrorDetail = data.detail || data.error || 'ไม่ทราบข้อผิดพลาด';
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `❌ เกิดข้อผิดพลาดจาก GPT API: ${apiErrorDetail}` },
        ])
      }
    } catch (err) {
      // กรณีเกิดข้อผิดพลาดในการ Fetch (เช่น Network Error) หรือการแปลง JSON
      console.error('Fetch or JSON parsing error:', err)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ หรือข้อมูลตอบกลับไม่ถูกต้อง' },
      ])
    } finally {
      setLoading(false) // หยุดแสดงสถานะโหลด
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
