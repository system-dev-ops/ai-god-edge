// pages/login.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter();

  useEffect(() => {
    // Redirect if already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/admin'); // Redirect to admin page if session exists
      }
    };
    checkUser();

    // Listen for auth state changes (e.g., after clicking magic link)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN') {
          router.push('/admin'); // Redirect to admin page
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe(); 
    };
  }, [router]);

  const handleLogin = async () => {
    setMessage('');
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/admin' } });
    if (error) {
      setMessage('❌ ไม่สามารถส่งลิงก์เข้าสู่ระบบได้: ' + error.message);
    } else {
      setMessage('✅ ส่งลิงก์เข้าสู่อีเมลแล้ว กรุณาตรวจสอบ Inbox หรือ Junk Mail');
    }
  }

  return (
    <main style={{ padding: 20, maxWidth: 400, margin: 'auto' }}>
      <h1>🔐 เข้าสู่ระบบ</h1>
      <input
        type="email"
        placeholder="กรอกอีเมลของคุณ"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: 10, width: '100%' }}
      />
      <br />
      <button
        onClick={handleLogin}
        style={{ marginTop: 10, padding: '10px 20px', width: '100%' }}
      >
        ส่งลิงก์เข้าสู่ระบบ
      </button>
      {message && <p style={{ marginTop: 20 }}>{message}</p>}
    </main>
  )
}
