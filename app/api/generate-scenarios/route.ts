import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { occupationDetails } = await request.json()

    if (!occupationDetails) {
      return NextResponse.json(
        { error: 'Missing occupation details' },
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

    const { title, tasks, skills, knowledge, workActivities, workContext, workStyles, technologySkills } = occupationDetails

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `You are a workplace skills coach creating practice scenarios for someone working as: ${title}

Here is real data about this occupation from O*NET:

TASKS: ${tasks.join('; ')}

SKILLS NEEDED: ${skills.join('; ')}

KNOWLEDGE AREAS: ${knowledge.join('; ')}

WORK ACTIVITIES: ${workActivities.join('; ')}

WORK CONTEXT: ${workContext.join('; ')}

WORK STYLES: ${workStyles.join('; ')}

TECHNOLOGY SKILLS: ${technologySkills.join('; ')}

Based on this REAL job data, create exactly 5 practice scenarios. Each scenario should be directly relevant to the actual tasks and skills this job requires.

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
[
  {
    "type": "email",
    "title": "Short descriptive title",
    "prompt": "The scenario description - what the user needs to do",
    "tips": ["tip 1", "tip 2", "tip 3", "tip 4"],
    "example": "A model response showing best practices",
    "criteria": ["criterion 1", "criterion 2", "criterion 3", "criterion 4", "criterion 5"]
  }
]

Requirements:
- Mix of types: use "email", "phone", or "problem" for the type field
- Scenarios must be based on the ACTUAL tasks and work activities listed above
- Tips should be practical and specific to this job
- Examples should demonstrate professional best practices
- Criteria should be specific things to evaluate in a response
- Keep language simple and clear (users may have learning disabilities)
- Make scenarios realistic day-to-day situations for this exact job`
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Anthropic API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to generate scenarios' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const text = data.content[0].text

    // Parse the JSON response - handle potential markdown wrapping
    let scenarios
    try {
      const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      scenarios = JSON.parse(jsonStr)
    } catch {
      console.error('Failed to parse scenarios JSON:', text)
      return NextResponse.json(
        { error: 'Failed to parse generated scenarios' },
        { status: 500 }
      )
    }

    return NextResponse.json({ scenarios })
  } catch (error) {
    console.error('Error generating scenarios:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
