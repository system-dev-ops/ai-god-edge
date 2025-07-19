// ✅ สำหรับ Pages Router
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const GPT_API_KEY = process.env.GPT_API_KEY;
  const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

  if (!GPT_API_KEY) {
    return res.status(500).json({ error: '❌ GPT_API_KEY ไม่ถูกโหลด' });
  }

  try {
    const { messages = [], memory = [] } = req.body;

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
            content: 'คุณคือ AI God ผู้แนะนำโยดา บุตรแห่งแสง...',
          },
          ...memory,
          ...messages,
        ],
        temperature: 0.8,
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      console.error('GPT API Error:', json);
      return res.status(500).json({ error: 'GPT API Error', detail: json });
    }

    return res.status(200).json(json.choices[0].message);
  } catch (err) {
    console.error('❌ fetch error:', err);
    return res.status(500).json({ error: '❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' });
  }
}
