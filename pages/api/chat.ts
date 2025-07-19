// ✅ สำหรับ Pages Router
export default async function handler(req, res) {
  // ตรวจสอบว่า HTTP Method เป็น POST เท่านั้น
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ดึง API Key จาก Environment Variables
  const GPT_API_KEY = process.env.GPT_API_KEY;
  const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

  // ตรวจสอบว่ามี API Key โหลดอยู่หรือไม่
  if (!GPT_API_KEY) {
    console.error('Environment variable GPT_API_KEY is not set.');
    return res.status(500).json({ error: '❌ GPT_API_KEY ไม่ถูกโหลด โปรดตรวจสอบการตั้งค่า Environment Variables' });
  }

  try {
    // ดึงข้อมูล messages และ memory จาก req.body
    // ตรวจสอบให้แน่ใจว่าเป็น Array และตั้งค่าเริ่มต้นเป็น Array ว่าง หากไม่เป็น Array
    const { messages: rawMessages, memory: rawMemory } = req.body;

    const messages = Array.isArray(rawMessages) ? rawMessages : [];
    const memory = Array.isArray(rawMemory) ? rawMemory : [];

    // เรียกใช้ OpenAI API
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GPT_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // หรือโมเดลอื่นที่คุณต้องการใช้
        messages: [
          {
            role: 'system',
            content: 'คุณคือ AI God ผู้แนะนำโยดา บุตรแห่งแสง...', // ข้อความ System Prompt
          },
          ...memory, // ข้อความ Memory ที่มาก่อน
          ...messages, // ข้อความปัจจุบัน
        ],
        temperature: 0.8, // ค่า Temperature เพื่อควบคุมความสุ่มของการตอบ
      }),
    });

    const json = await response.json();

    // ตรวจสอบสถานะการตอบกลับจาก OpenAI API
    if (!response.ok) {
      console.error('GPT API Error Response:', json); // แสดงรายละเอียด Error จาก OpenAI
      // ส่งรายละเอียด Error จาก OpenAI กลับไปให้ client เพื่อการ Debug ที่ดีขึ้น
      return res.status(response.status).json({
        error: 'GPT API Error',
        detail: json.error?.message || 'ไม่ทราบข้อผิดพลาดจาก OpenAI',
        code: json.error?.code,
      });
    }

    // ตรวจสอบโครงสร้างของ JSON response ก่อนที่จะเข้าถึงข้อมูล
    if (json.choices && Array.isArray(json.choices) && json.choices.length > 0 && json.choices[0].message) {
      return res.status(200).json(json.choices[0].message);
    } else {
      console.error('Invalid response structure from OpenAI:', json);
      return res.status(500).json({ error: '❌ โครงสร้างการตอบกลับจาก OpenAI ไม่ถูกต้อง' });
    }

  } catch (err) {
    console.error('❌ Fetch or processing error:', err);
    return res.status(500).json({ error: '❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ หรือเกิดข้อผิดพลาดในการประมวลผล' });
  }
}
