// AI service to generate menu item descriptions

export const generateMenuItemDescription = async (
  itemName: string,
  category: string,
  additionalInfo?: string,
): Promise<string> => {
  try {
    const API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY
    if (!API_KEY) {
      throw new Error('GROQ API key is missing')
    }

    const prompt = `Generate a short, appetizing description for a ${category.toLowerCase()} menu item called "${itemName}" for a café menu. ${
      additionalInfo ? `Additional details: ${additionalInfo}.` : ''
    } Keep it under 100 characters.`

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3-70b-8192',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 100,
        }),
      },
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to generate description')
    }

    const data = await response.json()
    return data.choices[0].message.content.trim()
  } catch (error) {
    console.error('Error generating menu item description:', error)
    return ''
  }
}
