import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { itemName, category, additionalInfo } = await request.json()

    if (!itemName || !category) {
      return NextResponse.json(
        { error: 'Item name and category are required' },
        { status: 400 },
      )
    }

    const API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'GROQ API key is not configured' },
        { status: 500 },
      )
    }

    const prompt = `Generate a long explaining a dish appetizing description for a ${category.toLowerCase()} menu item called "${itemName}" for a café menu provide description minimum in 40 words ${
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
          model: 'llama-3.3-70b-versatile',
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
      console.error('AI response error:', error)
      return NextResponse.json(
        { error: error.error?.message || 'Failed to generate description' },
        { status: response.status },
      )
    }

    const data = await response.json()
    const description = data.choices[0].message.content.trim()

    return NextResponse.json({ description })
  } catch (error) {
    console.error('Error in AI description generation:', error)
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 },
    )
  }
}
