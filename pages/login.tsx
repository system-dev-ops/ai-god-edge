'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) {
      setStatus('❌ ไม่สามารถส่งลิงก์เข้าสู่ระบบได้: ' + error.message)
    } else {
      setStatus('✅ ส่งลิงก์เข้าสู่ระบบไปยังอีเมลแล้ว กรุณาตรวจสอบ Inbox หรือ Junk Mail')
    }
  }

  return (
    <main style={{ padding: 20 }}>
      <h2>🔐 เข้าสู่ระบบ</h2>
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
      {status && <p>{status}</p>}
    </main>
  )
}
