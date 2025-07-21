'use client'

import { useEffect, useState } from 'react'
import { createClient, User } from '@supabase/supabase-js'

interface ChatLog {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null) 
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

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user || null);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe(); 
    };

  }, [])

  useEffect(() => {
    if (!user) return

    const fetchLogs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_logs')
        .select('*')
        .order('created_at', { ascending: true })

      if (!error) {
        setLogs(data as ChatLog[] || [])
      } else {
        console.error('❌ Error fetching logs:', error)
        alert('❌ ไม่สามารถดึงข้อมูล Logs ได้: ' + error.message);
      }
      setLoading(false);
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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert('❌ ไม่สามารถออกจากระบบได้: ' + error.message);
    } else {
      alert('✅ ออกจากระบบสำเร็จ');
      setUser(null);
    }
  };

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

  if (loading) return <div>🔄 กำลังโหลด...</div>

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

  const grouped = logs.reduce((acc, log) => {
    if (!acc[log.session_id]) acc[log.session_id] = []
    acc[log.session_id].push(log)
    return acc
  }, {} as Record<string, ChatLog[]>)

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: 'auto' }}>
      <h1>🧠 Admin - ประวัติแชต AI God</h1>
      <p>👤 ผู้ใช้: {user.email}</p>
      <button onClick={exportToCSV} style={{ margin: '10px 0' }}>
        📄 Export เป็น CSV
      </button>
      <button onClick={handleLogout} style={{ margin: '10px 0 10px 10px', background: '#dc2626', color: 'white' }}>
        🚪 ออกจากระบบ
      </button>

      {Object.keys(grouped).length === 0 ? (
        <p>🤖 ยังไม่มีข้อความที่บันทึก</p>
      ) : (
        <div style={{ maxHeight: 600, overflowY: 'auto', border: '1px solid #ccc', padding: 10 }}>
          {(Object.entries(grouped) as [string, ChatLog[]][]).map(([sessionId, sessionLogs]) => (
            <div key={sessionId} style={{ marginBottom: 30 }}>
              <h3>🧬 Session: {sessionId}</h3>
              {sessionLogs.map((log) => (
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
