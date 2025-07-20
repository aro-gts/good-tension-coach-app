app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, history, userMessage } = req.body;

    if (!prompt || !history) {
      return res.status(400).json({ error: 'Prompt and history are required.' });
    }

    let tag = '';
    let messages = [];

    if (history.length === 1 && history[0].role === 'user') {
      tag = 'first-turn';
      const initialPrompt = `System: Your new user has just started the session. Their opening message is: "${userMessage}". You must now begin the coaching process by asking your scripted first question as instructed in your rules.`;

      messages = [
        { role: 'system', content: initialPrompt },
        ...history,
      ];
    } else {
      tag = 'follow-up';
      messages = [
        { role: 'system', content: prompt },
        ...history,
      ];
    }

    // Debug logs
    console.log('🟢 USER MESSAGE FOR TAGGING:', userMessage || 'UNKNOWN');
    console.log('🏷️ TAG SELECTED:', tag);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
    });

    const reply = completion.choices[0].message.content;

    await logConversationToSupabase({
      sessionId: 'anonymous',
      userMessage: userMessage || 'UNKNOWN',
      aiResponse: reply,
      tags: tag,
    });

    res.json({ reply });
  } catch (error) {
    console.error('⚠️ Error:', error);
    res.status(500).json({ error: 'Failed to get response from AI.' });
  }
});
