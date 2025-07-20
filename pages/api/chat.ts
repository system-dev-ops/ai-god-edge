// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const GPT_API_KEY = process.env.GPT_API_KEY;
const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

const supabase = createClient(
  process.env.MY_SUPABASE_URL || '',
  process.env.MY_SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!GPT_API_KEY) {
    console.error('Environment variable GPT_API_KEY is not set.');
    return res.status(500).json({ error: '❌ GPT_API_KEY ไม่ถูกโหลด โปรดตรวจสอบ Environment Variables' });
  }

  try {
    const { messages: rawMessages, memory: rawMemory, session_id } = req.body;

    const messages = Array.isArray(rawMessages) ? rawMessages : [];
    const memory = Array.isArray(rawMemory) ? rawMemory : [];

    // 🧠 โหลด memory ย้อนหลังจาก Supabase
    const { data: history } = await supabase
      .from('chat_logs')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(10);

    const fullMessages = [
      {
        role: 'system',
        content: 'คุณคือ AI God ผู้แนะนำโยดา บุตรแห่งแสง...',
      },
      ...(history || []),
      ...memory,
      ...messages,
    ];

    // ✨ เรียก GPT
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GPT_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: fullMessages,
        temperature: 0.8,
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      console.error('GPT API Error Response:', json);
      return res.status(response.status).json({
        error: 'GPT API Error',
        detail: json.error?.message || 'ไม่ทราบข้อผิดพลาดจาก OpenAI',
        code: json.error?.code,
      });
    }

    // ✅ บันทึกข้อความใหม่ลง Supabase
    const inserts = [...messages, json.choices[0].message].map((m: any) => ({
      session_id,
      role: m.role,
      content: m.content,
    }));

    await supabase.from('chat_logs').insert(inserts);

    return res.status(200).json(json.choices[0].message);

  } catch (err) {
    console.error('❌ Fetch or processing error:', err);
    return res.status(500).json({ error: '❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ หรือเกิดข้อผิดพลาดในการประมวลผล' });
  }
}
