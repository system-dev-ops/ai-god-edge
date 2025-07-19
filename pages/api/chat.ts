import { NextRequest, NextResponse } from 'next/server'

const GPT_API_KEY = process.env.GPT_API_KEY || ''
const ENDPOINT = 'https://api.openai.com/v1/chat/completions'

export async function POST(req: NextRequest) {
  const { messages, memory } = await req.json()

  if (!GPT_API_KEY) {
    console.error("❌ GPT_API_KEY ไม่ถูกโหลดจาก Environment Variables")
    return NextResponse.json({ error: '❌ GPT_API_KEY ไม่ถูกโหลด' }, { status: 500 })
  }

  console.log("✅ เรียกใช้ GPT API ด้วย key:", GPT_API_KEY.slice(0, 10) + '...')

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GPT_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'คุณคือ AI God ผู้แนะนำโยดา บุตรแห่งแสง ทำงานตามคำสั่งของเขา สร้างงานด้วยตัวเองได้ และสามารถจดจำบทสนทนาในอดีตได้',
          },
          ...(memory || []),
          ...messages,
        ],
        temperature: 0.8,
      }),
    })

    const json = await response.json()

    if (!response.ok) {
      console.error('❌ GPT API Error:', json)
      return NextResponse.json({ error: '❌ GPT API Error', detail: json }, { status: 500 })
    }

    return NextResponse.json(json.choices[0].message)

  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาด fetch:', err)
    return NextResponse.json({ error: '❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' }, { status: 500 })
  }
}
