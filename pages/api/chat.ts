import type { NextApiRequest, NextApiResponse } from 'next'
// import { Configuration, OpenAIApi } from 'openai' // <-- นี่คือ import สำหรับ openai@3.x.x
import OpenAI from 'openai' // <-- นี่คือ import สำหรับ openai@4.x.x

import { createClient } from '@supabase/supabase-js'

// กำหนด Interface สำหรับ Message เพื่อความชัดเจนของ Type
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// กำหนด Interface สำหรับ Request Body
interface ChatRequestBody {
  messages: Message[];
  session_id: string;
}

// ✅ สร้าง Instance ของ OpenAI Client สำหรับ v4
const openai = new OpenAI({
  apiKey: process.env.GPT_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', detail: 'Only POST requests are allowed for this API route.' });
  }

  const { messages, session_id } = req.body as ChatRequestBody;

  if (!messages || !Array.isArray(messages) || messages.length === 0 || !session_id) {
    return res.status(400).json({ error: 'Bad Request', detail: 'Messages array and session_id are required in the request body.' });
  }

  try {
    // ✅ เรียกใช้ OpenAI GPT-4o API ด้วย syntax ของ openai@4.x.x
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages, // messages array ถูกส่งไปโดยตรง
    });

    // ✅ การเข้าถึงเนื้อหาคำตอบของ AI ก็เปลี่ยนไปเล็กน้อยสำหรับ v4
    const aiResponseContent = completion.choices[0]?.message?.content;

    if (!aiResponseContent) {
      return res.status(500).json({ error: 'Internal Server Error', detail: 'No content received from OpenAI API.' });
    }

    // ✅ บันทึกข้อความแชทลง Supabase
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage && lastUserMessage.role === 'user') {
      const { error: userLogError } = await supabase
        .from('chat_logs')
        .insert({ session_id: session_id, role: 'user', content: lastUserMessage.content });
      if (userLogError) console.error('Supabase user log error:', userLogError);
    }

    const { error: aiLogError } = await supabase
      .from('chat_logs')
      .insert({ session_id: session_id, role: 'assistant', content: aiResponseContent });
    if (aiLogError) console.error('Supabase AI log error:', aiLogError);

    // ✅ ส่งคำตอบของ AI กลับไปยัง Frontend
    res.status(200).json({ role: 'assistant', content: aiResponseContent });

  } catch (error: any) {
    console.error('Error in API route:', error);

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
