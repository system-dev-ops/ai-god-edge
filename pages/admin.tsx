'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// กำหนด Interface สำหรับ Chat Log เพื่อความชัดเจนของ Type
interface ChatLog {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
}

// ✅ ใส่ ENV จาก .env.local หรือ Vercel Environment
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  // ใช้ ChatLog[] สำหรับ logs เพื่อให้ Type ชัดเจนขึ้น
  const [logs, setLogs] = useState<ChatLog[]>([]) 
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
      }

      setLoading(false)
    }

    getSession()
  }, [])

  useEffect(() => {
    if (!user) return

    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('chat_logs')
        .select('*')
        .order('created_at', { ascending: true })

      if (!error) {
        // Cast data to ChatLog[] เพื่อให้ Type ตรงกัน
        setLogs(data as ChatLog[] || []) 
      } else {
        console.error('❌ Error fetching logs:', error)
      }
    }

    fetchLogs()
  }, [user])

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) {
      alert('❌ ไม่สามารถส่งลิงก์เข้าสู่ระบบได้: ' + error.message)
    } else {
      alert('✅ ส่งลิงก์เข้าสู่อีเมลแล้ว กรุณาตรวจสอบ Inbox หรือ Junk Mail')
    }
  }

  const exportToCSV = () => {
    const header = 'session_id,role,content\n'
    const rows = logs.map(
      (log) =>
        `"${log.session_id}","${log.role}","${log.content.replace(/"/g, '""')}"`
    )
    const csvContent = header + rows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'chat_logs.csv'
    link.click()
  }

  if (loading) return <div>🔄 Loading...</div>

  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h2>🔐 เข้าสู่ระบบผู้ดูแล</h2>
        <input
          type="email"
          placeholder="กรอกอีเมลของคุณ"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, width: '300px' }}
        />
        <br />
        <button onClick={handleLogin} style={{ marginTop: 10, padding: '10px 20px' }}>
          ส่งลิงก์เข้าสู่ระบบ
        </button>
      </div>
    )
  }

  // จัดกลุ่ม logs ตาม session_id เพื่อแสดงผล
  const grouped = logs.reduce((acc, log) => {
    if (!acc[log.session_id]) acc[log.session_id] = []
    acc[log.session_id].push(log)
    return acc
  }, {} as Record<string, ChatLog[]>) // ใช้ ChatLog[] ตรงนี้

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: 'auto' }}>
      <h1>🧠 Admin - ประวัติแชต AI God</h1>
      <p>👤 ผู้ใช้: {user.email}</p>
      <button onClick={exportToCSV} style={{ margin: '10px 0' }}>
        📄 Export เป็น CSV
      </button>

      {loading ? (
        <p>⏳ กำลังโหลดข้อมูล...</p>
      ) : Object.keys(grouped).length === 0 ? (
        <p>🤖 ยังไม่มีข้อความที่บันทึก</p>
      ) : (
        <div style={{ maxHeight: 600, overflowY: 'auto', border: '1px solid #ccc', padding: 10 }}>
          {/* ทำการ Type Casting ที่ Object.entries(grouped) โดยตรง */}
          {(Object.entries(grouped) as [string, ChatLog[]][]).map(([sessionId, sessionLogs]) => (
            <div key={sessionId} style={{ marginBottom: 30 }}>
              <h3>🧬 Session: {sessionId}</h3>
              {sessionLogs.map((log) => ( // ตอนนี้ log จะมี Type เป็น ChatLog แล้ว
                <div key={log.id}>
                  <strong>{log.role === 'user' ? '🙋‍♂️ User' : '🤖 AI'}:</strong> {log.content}
                </div>
              ))}
              <hr />
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
