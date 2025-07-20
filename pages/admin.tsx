'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('chat_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) console.error('❌ Error fetching logs:', error)
      else setLogs(data || [])
      setLoading(false)
    }

    fetchLogs()
  }, [])

  return (
    <main style={{ padding: 20 }}>
      <h1>🔐 Admin Chat Logs</h1>
      {loading ? <p>⏳ Loading...</p> : null}
      {logs.map((log) => (
        <div key={log.id} style={{ marginBottom: 10 }}>
          <strong>{log.role}</strong>: {log.content}
        </div>
      ))}
    </main>
  )
}
