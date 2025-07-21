// /pages/api/chat.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages, session_id } = req.body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid messages' })
  }

  const userMessage = messages[messages.length - 1]?.content

  try {
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.7
      })
    })

    const json = await aiResponse.json()

    const reply = json?.choices?.[0]?.message?.content?.trim()

    if (!reply) {
      return res.status(500).json({ error: 'AI ไม่ตอบกลับ' })
    }

    // ✅ บันทึกลง Supabase
    await supabase.from('chat_logs').insert([
      {
        user_message: userMessage,
        assistant_reply: reply
      }
    ])

    return res.status(200).json({
      role: 'assistant',
      content: reply
    })

  } catch (err: any) {
    console.error('❌ ERROR:', err)
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' })
  }
}
