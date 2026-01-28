import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userText, scenario } = await request.json()

    if (!userText || !scenario) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set')
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `You are a supportive workplace skills coach. Analyze this response to a workplace scenario and provide constructive, encouraging feedback.

Scenario: ${scenario.prompt}

Key criteria to look for: ${scenario.criteria.join(', ')}

User's response:
${userText}

Provide feedback in this format:
STRENGTHS: [2-3 specific things they did well]
AREAS TO DEVELOP: [2-3 specific, actionable suggestions for improvement]
OVERALL: [1-2 encouraging sentences about their effort and progress]

Be specific, positive, and constructive. Focus on building confidence while offering practical improvements.`
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Anthropic API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to get feedback from AI' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const feedbackText = data.content[0].text

    return NextResponse.json({ feedback: feedbackText })
  } catch (error) {
    console.error('Error in feedback API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
