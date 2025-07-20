'use client'

import { useEffect, useState } from 'react'
// import { useRouter } from 'next/router' // ไม่ได้ใช้งาน useRouter แล้ว จึงสามารถลบออกได้
import { createClient } from '@supabase/supabase-js'

// ✅ ใส่ ENV จาก .env.local หรือ Vercel Environment
// Make sure to set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local or Vercel Environment Variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminPage() {
  const [user, setUser] = useState<any>(null) // State สำหรับเก็บข้อมูลผู้ใช้ที่ล็อกอิน
  const [logs, setLogs] = useState<any[]>([]) // State สำหรับเก็บข้อมูล logs การแชท
  const [loading, setLoading] = useState(true) // State สำหรับสถานะการโหลดข้อมูล
  const [email, setEmail] = useState('') // State สำหรับเก็บอีเมลในหน้าล็อกอิน

  // ✅ ตรวจสอบ session เมื่อ component โหลด
  // Check for an active Supabase session on component mount
  useEffect(() => {
    const getSession = async () => {
      // ดึง session ปัจจุบันจาก Supabase Auth
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // ถ้ามี session และมีข้อมูลผู้ใช้ ให้ตั้งค่า user state
      if (session?.user) {
        setUser(session.user)
      }

      setLoading(false) // หยุดสถานะการโหลดหลังจากตรวจสอบ session แล้ว
    }

    getSession()
  }, []) // รันเพียงครั้งเดียวเมื่อ component mount

  // ✅ ดึงข้อมูล logs หลัง login สำเร็จ
  // Fetch chat logs from Supabase once the user is authenticated
  useEffect(() => {
    // ถ้ายังไม่มีข้อมูลผู้ใช้ (ยังไม่ล็อกอิน) ไม่ต้องดึงข้อมูล
    if (!user) return

    const fetchLogs = async () => {
      // ดึงข้อมูลจากตาราง 'chat_logs'
      const { data, error } = await supabase
        .from('chat_logs') // ชื่อตารางใน Supabase
        .select('*') // เลือกทุกคอลัมน์
        .order('created_at', { ascending: true }) // เรียงลำดับตามเวลาสร้าง, เก่าสุดไปใหม่สุด

      // ถ้าไม่มี error ในการดึงข้อมูล ให้ตั้งค่า logs state
      if (!error) {
        setLogs(data || [])
      } else {
        console.error('❌ Error fetching logs:', error) // แสดง error ใน console หากมีปัญหาในการดึงข้อมูล
      }
    }

    fetchLogs()
  }, [user]) // รัน effect นี้เมื่อ user state มีการเปลี่ยนแปลง (เช่น เมื่อล็อกอินสำเร็จ)

  // ✅ ฟังก์ชัน Sign in ด้วย OTP (Passwordless login)
  // Handles user login via email OTP (one-time password)
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) {
      alert('❌ ไม่สามารถส่งลิงก์เข้าสู่ระบบได้: ' + error.message) // แสดง alert เมื่อเกิด error
    } else {
      alert('✅ ส่งลิงก์เข้าสู่อีเมลแล้ว กรุณาตรวจสอบ Inbox หรือ Junk Mail') // แสดง alert เมื่อส่งลิงก์สำเร็จ
    }
  }

  // ✅ ฟังก์ชัน Export ข้อมูลเป็น CSV
  // Exports the current chat logs to a CSV file
  const exportToCSV = () => {
    // กำหนด header ของไฟล์ CSV
    const header = 'session_id,role,content\n'
    // แปลงข้อมูล logs แต่ละแถวให้อยู่ในรูปแบบ CSV
    const rows = logs.map(
      (log) =>
        // ใช้ double quotes ครอบแต่ละ field และ escape double quotes ภายใน content
        `"${log.session_id}","${log.role}","${log.content.replace(/"/g, '""')}"`
    )
    // รวม header และ rows เข้าด้วยกัน
    const csvContent = header + rows.join('\n')
    // สร้าง Blob จากเนื้อหา CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    // สร้างลิงก์สำหรับดาวน์โหลด
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'chat_logs.csv' // กำหนดชื่อไฟล์ที่จะดาวน์โหลด
    link.click() // คลิกเพื่อเริ่มดาวน์โหลด
  }

  // ✅ แสดง Loading state
  // Display loading message while checking session
  if (loading) return <div>🔄 Loading...</div>

  // ✅ แสดงหน้า Login หากผู้ใช้ยังไม่ได้ล็อกอิน
  // Display login form if user is not authenticated
  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h2>🔐 เข้าสู่ระบบผู้ดูแล</h2> {/* Login page title */}
        <input
          type="email"
          placeholder="กรอกอีเมลของคุณ" // Placeholder text for email input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, width: '300px' }}
        />
        <br />
        <button onClick={handleLogin} style={{ marginTop: 10, padding: '10px 20px' }}>
          ส่งลิงก์เข้าสู่ระบบ {/* Login button */}
        </button>
      </div>
    )
  }

  // ✅ จัดกลุ่ม logs ตาม session_id เพื่อแสดงผล
  // Group logs by session_id for better readability
  const grouped = logs.reduce((acc, log) => {
    if (!acc[log.session_id]) acc[log.session_id] = []
    acc[log.session_id].push(log)
    return acc
  }, {} as Record<string, { id: string; session_id: string; role: string; content: string; created_at: string }[]>) // <--- แก้ไขตรงนี้: เพิ่ม Type ให้กับ Record

  // ✅ แสดงหน้า Admin หลักเมื่อล็อกอินสำเร็จ
  // Main Admin page content after successful authentication
  return (
    <main style={{ padding: 20, maxWidth: 800, margin: 'auto' }}>
      <h1>🧠 Admin - ประวัติแชต AI God</h1> {/* Admin page title */}
      <p>👤 ผู้ใช้: {user.email}</p> {/* Display logged-in user's email */}
      <button onClick={exportToCSV} style={{ margin: '10px 0' }}>
        📄 Export เป็น CSV {/* Export button */}
      </button>

      {/* แสดงข้อความโหลด หรือ ไม่มีข้อมูล หรือ แสดงข้อมูล logs */}
      {loading ? ( // This loading state is for initial fetchLogs, but user check is already done above
        <p>⏳ กำลังโหลดข้อมูล...</p>
      ) : Object.keys(grouped).length === 0 ? ( // Check if there are any grouped sessions
        <p>🤖 ยังไม่มีข้อความที่บันทึก</p>
      ) : (
        <div style={{ maxHeight: 600, overflowY: 'auto', border: '1px solid #ccc', padding: 10 }}>
          {Object.entries(grouped).map(([sessionId, sessionLogs]: [string, { id: string; session_id: string; role: string; content: string; created_at: string }[]]) => ( // <--- แก้ไขตรงนี้: กำหนด Type ให้ sessionLogs
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
