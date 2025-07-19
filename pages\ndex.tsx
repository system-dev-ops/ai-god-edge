import { useState } from 'react'

export default function Home() {
  const [input, setInput] = useState('')
  const [chat, setChat] = useState<any[]>([])

  const sendMessage = async () => {
    const newChat = [...chat, { role: 'user', content: input }]
    setChat(newChat)
    setInput('')

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: input }], memory: newChat.slice(-5) }),
    })
    const data = await res.json()
    const reply = data.choices?.[0]?.message
    if (reply) {
      setChat([...newChat, reply])
    }
  }

  return (
    <main style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>AI God Chat (GPT-4o)</h1>
      <div style={{ marginBottom: 20 }}>
        {chat.map((c, i) => (
          <div key={i}><b>{c.role}:</b> {c.content}</div>
        ))}
      </div>
      <input value={input} onChange={(e) => setInput(e.target.value)} style={{ width: '80%' }} />
      <button onClick={sendMessage}>Send</button>
    </main>
  )
}
