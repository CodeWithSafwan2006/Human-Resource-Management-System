exports.chat = async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;

    const groqMessages = [];

    // Add system prompt
    if (systemPrompt) {
      groqMessages.push({ role: 'system', content: systemPrompt });
    }

    // Add user messages
    if (messages && messages.length > 0) {
      for (const msg of messages) {
        groqMessages.push({ role: msg.role || 'user', content: msg.content });
      }
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Groq API Error:', data.error);
      return res.status(500).json({ message: data.error.message || 'Groq API error' });
    }

    const reply = data.choices?.[0]?.message?.content || 'No response';
    res.json({ reply });
  } catch (err) {
    console.error('AI Chat Error:', err.message);
    res.status(500).json({ message: err.message });
  }
};