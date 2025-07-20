import { v4 as uuidv4 } from 'uuid'
import { useEffect, useRef, useState } from 'react'

export default function Home() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [loading, setLoading] = useState(false)

  const sessionIdRef = useRef<string>('')

  useEffect(() => {
    sessionIdRef.current = uuidv4() // กำหนด session id ครั้งเดียว
  }, [])

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
        body: JSON.stringify({
          messages: newMessages,
          session_id: sessionIdRef.current,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        if (data && typeof data.content === 'string' && typeof data.role === 'string') {
          setMessages((prev) => [...prev, data])
        } else {
          console.error('Unexpected response:', data)
          setMessages((prev) => [...prev, { role: 'assistant', content: '❌ โครงสร้างคำตอบจาก AI ไม่ถูกต้อง' }])
        }
      } else {
        const apiErrorDetail = data.detail || data.error || 'ไม่ทราบข้อผิดพลาด';
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `❌ เกิดข้อผิดพลาดจาก GPT API: ${apiErrorDetail}` },
        ])
      }
    } catch (err) {
      console.error('Fetch or JSON parsing error:', err)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ หรือข้อมูลตอบกลับไม่ถูกต้อง' },
      ])
    } finally {
      setLoading(false)
    }
  }

  // JSX ส่วนอื่นเหมือนเดิม
}
