import { NextRequest, NextResponse } from 'next/server'

const GPT_API_KEY = process.env.GPT_API_KEY || ''
const ENDPOINT = 'https://api.openai.com/v1/chat/completions'

export async function POST(req: NextRequest) {
  const { messages, memory } = await req.json()

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
  return NextResponse.json(json)
}
