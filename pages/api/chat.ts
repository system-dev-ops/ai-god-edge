import type { NextApiRequest, NextApiResponse } from 'next'
import { Configuration, OpenAIApi } from 'openai'
import { createClient } from '@supabase/supabase-js'

// กำหนด Interface สำหรับ Message เพื่อความชัดเจนของ Type
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// กำหนด Interface สำหรับ Request Body
interface ChatRequestBody {
  messages: Message[];
  session_id: string; // เพิ่ม session_id
}

// ✅ ใส่ ENV จาก .env.local หรือ Vercel Environment
// Make sure to set GPT_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
const configuration = new Configuration({
  apiKey: process.env.GPT_API_KEY,
})
const openai = new OpenAIApi(configuration)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ✅ ตรวจสอบ HTTP Method: ต้องเป็น POST เท่านั้น
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', detail: 'Only POST requests are allowed for this API route.' });
  }

  // ✅ ดึงข้อมูลจาก Request Body
  const { messages, session_id } = req.body as ChatRequestBody;

  // ตรวจสอบว่ามี messages และ session_id หรือไม่
  if (!messages || !Array.isArray(messages) || messages.length === 0 || !session_id) {
    return res.status(400).json({ error: 'Bad Request', detail: 'Messages array and session_id are required in the request body.' });
  }

  try {
    // ✅ เรียกใช้ OpenAI GPT-4o API
    const completion = await openai.createChatCompletion({
      model: 'gpt-4o', // ใช้ gpt-4o ตามที่ระบุ
      messages: messages,
    });

    const aiResponseContent = completion.data.choices[0]?.message?.content;

    if (!aiResponseContent) {
      return res.status(500).json({ error: 'Internal Server Error', detail: 'No content received from OpenAI API.' });
    }

    // ✅ บันทึกข้อความแชทลง Supabase
    // บันทึกข้อความผู้ใช้
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage && lastUserMessage.role === 'user') {
      const { error: userLogError } = await supabase
        .from('chat_logs')
        .insert({ session_id: session_id, role: 'user', content: lastUserMessage.content });
      if (userLogError) console.error('Supabase user log error:', userLogError);
    }

    // บันทึกข้อความ AI
    const { error: aiLogError } = await supabase
      .from('chat_logs')
      .insert({ session_id: session_id, role: 'assistant', content: aiResponseContent });
    if (aiLogError) console.error('Supabase AI log error:', aiLogError);

    // ✅ ส่งคำตอบของ AI กลับไปยัง Frontend
    res.status(200).json({ role: 'assistant', content: aiResponseContent });

  } catch (error: any) {
    console.error('Error in API route:', error);

    // จัดการข้อผิดพลาดจาก OpenAI API โดยเฉพาะ
    if (error.response) {
      console.error('OpenAI API Error Response:', error.response.status, error.response.data);
      res.status(error.response.status).json({
        error: 'OpenAI API Error',
        detail: error.response.data.error?.message || 'Unknown error from OpenAI API',
      });
    } else if (error.request) {
      console.error('OpenAI API No Response:', error.request);
      res.status(500).json({ error: 'Network Error', detail: 'No response received from OpenAI API.' });
    } else {
      console.error('General Error:', error.message);
      res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
  }
}
