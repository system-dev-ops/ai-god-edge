'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'

// ✅ ใส่ ENV จาก .env.local หรือ Vercel Environment
// Make sure to set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local or Vercel Environment Variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  // ✅ เช็ก Secret Key ผ่าน URL Query
  // Check for a secret key in the URL query parameters for authorization
  useEffect(() => {
    const checkAuth = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const secret = urlParams.get('secret')

      // IMPORTANT: Replace 'YOUR_SECRET_KEY' with an actual environment variable
      // (e.g., process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY) for production use.
      // This hardcoded key is for demonstration purposes only.
      if (secret === 'YOUR_SECRET_KEY') { // TODO: เปลี่ยน YOUR_SECRET_KEY เป็นค่าจาก Environment Variable
        setAuthorized(true)
      } else {
        alert('⛔️ ไม่ได้รับอนุญาตให้เข้าถึงหน้าแอดมิน') // Access denied message
        window.location.href = '/' // Redirect to home page
      }
    }

    checkAuth()
  }, [])

  // ✅ ดึงข้อมูลเมื่อได้รับอนุญาต
  // Fetch chat logs from Supabase when authorized
  useEffect(() => {
    const fetchLogs = async () => {
      if (!authorized) return // Only fetch if authorized

      const { data, error } = await supabase
        .from('chat_logs') // Assuming your table name is 'chat_logs'
        .select('*') // Select all columns
        .order('created_at', { ascending: false }) // Order by creation time, newest first

      if (error) {
        console.error('❌ Error fetching logs:', error) // Log any errors during fetching
        return
      }

      setLogs(data || []) // Set the fetched logs to state
      setLoading(false) // Stop loading state
    }

    fetchLogs()
  }, [authorized]) // Re-run effect when authorization status changes

  // ✅ ฟังก์ชัน Export JSON
  // Function to export logs as a JSON file
  const exportToJSON = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'chat_logs.json' // Filename for download
    link.click() // Trigger download
  }

  // If not authorized, render nothing (or a loading spinner)
  if (!authorized) return null

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: 'auto' }}>
      <h1>🧠 Admin: ประวัติการแชต</h1> {/* Admin page title */}

      <button onClick={exportToJSON} style={{ marginBottom: 20 }}>
        📁 Export ข้อมูลเป็น JSON {/* Export button */}
      </button>

      {loading ? (
        <p>⏳ กำลังโหลดข้อมูล...</p> // Loading indicator
      ) : logs.length === 0 ? (
        <p>🤖 ยังไม่มีข้อความที่บันทึก</p> // No logs message
      ) : (
        <div style={{ maxHeight: 600, overflowY: 'auto', border: '1px solid #ccc', padding: 10 }}>
          {logs.map((log) => (
            <div key={log.id} style={{ marginBottom: 12 }}>
              <div><strong>🧬 Session:</strong> {log.session_id}</div> {/* Session ID */}
              <div><strong>{log.role === 'user' ? '🙋‍♂️ User' : '🤖 AI'}:</strong> {log.content}</div> {/* User/AI message */}
              <hr /> {/* Separator */}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
