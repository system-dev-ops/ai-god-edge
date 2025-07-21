'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ChatLog {
  id: string
  session_id: string
  role: string
  content: string
  created_at: string
}

export default function AdminPage() {
  const [logs, setLogs] = useState<ChatLog[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session?.user) {
        router.push('/login')
      } else {
        setUser(data.session.user)
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (!user) return
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('chat_logs')
        .select('*')
        .order('created_at', { ascending: true })

      if (!error) setLogs(data as ChatLog[])
      else console.error(error)
      setLoading(false)
    }
    fetchLogs()
  }, [user])

  const exportToCSV = () => {
    const header = 'session_id,role,content\n'
    const rows = logs.map((log) =>
      `"${log.session_id}","${log.role}","${log.content.replace(/"/g, '""')}"`
    )
    const csvContent = header + rows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'chat_logs.csv'
    link.click()
  }

  if (loading) return <p>Loading...</p>

  const grouped = logs.reduce((acc, log) => {
    if (!acc[log.session_id]) acc[log.session_id] = []
    acc[log.session_id].push(log)
    return acc
  }, {} as Record<string, ChatLog[]>)

  return (
    <main style={{ padding: 20 }}>
      <h1>Admin Dashboard</h1>
      <p>👤 {user?.email}</p>
      <button onClick={exportToCSV}>📄 Export CSV</button>
      {Object.entries(grouped).map(([session, logs]) => (
        <div key={session}>
          <h3>Session: {session}</h3>
          {logs.map((log) => (
            <p key={log.id}>
              <strong>{log.role === 'user' ? '🙋‍♂️ User' : '🤖 AI'}:</strong> {log.content}
            </p>
          ))}
          <hr />
        </div>
      ))}
    </main>
  )
}
