// pages/api/chat.ts

import type { NextApiRequest, NextApiResponse } from 'next'

const GPT_API_KEY = process.env.GPT_API_KEY || ''
const ENDPOINT = 'https://api.openai.com/v1/chat/completions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { messages, memory } = req.body

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
    res.status(200).json(json)
  } catch (err: any) {
    console.error('API Error:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
