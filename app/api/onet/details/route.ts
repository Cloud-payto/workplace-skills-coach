import { NextRequest, NextResponse } from 'next/server'

interface OccupationDetails {
  title: string
  code: string
  tasks: string[]
  skills: string[]
  knowledge: string[]
  workActivities: string[]
  workContext: string[]
  workStyles: string[]
  technologySkills: string[]
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'Missing occupation code' }, { status: 400 })
  }

  const apiKey = process.env.ONET_API_KEY

  // Try the official API first
  if (apiKey) {
    try {
      const authHeader = `Basic ${Buffer.from(apiKey).toString('base64')}`
      const headers = {
        'Authorization': authHeader,
        'Accept': 'application/json',
      }

      const baseUrl = `https://services.onetcenter.org/ws/online/occupations/${code}`

      const [tasksRes, skillsRes, knowledgeRes, activitiesRes, contextRes, stylesRes, techRes] =
        await Promise.all([
          fetch(`${baseUrl}/details/tasks`, { headers }),
          fetch(`${baseUrl}/details/skills`, { headers }),
          fetch(`${baseUrl}/details/knowledge`, { headers }),
          fetch(`${baseUrl}/details/work_activities`, { headers }),
          fetch(`${baseUrl}/details/work_context`, { headers }),
          fetch(`${baseUrl}/summary/work_styles`, { headers }),
          fetch(`${baseUrl}/summary/technology_skills`, { headers }),
        ])

      if (tasksRes.ok) {
        const [tasks, skills, knowledge, activities, context, styles, tech] = await Promise.all([
          tasksRes.json(),
          skillsRes.json(),
          knowledgeRes.json(),
          activitiesRes.json(),
          contextRes.json(),
          stylesRes.json(),
          techRes.json(),
        ])

        const details: OccupationDetails = {
          title: tasks.title || code,
          code,
          tasks: (tasks.task || []).slice(0, 10).map((t: any) => t.statement),
          skills: (skills.element || []).slice(0, 10).map((s: any) => s.name),
          knowledge: (knowledge.element || []).slice(0, 10).map((k: any) => k.name),
          workActivities: (activities.element || []).slice(0, 10).map((a: any) => a.name),
          workContext: (context.element || []).slice(0, 10).map((c: any) => c.name),
          workStyles: (styles.element || []).slice(0, 10).map((w: any) => w.name),
          technologySkills: (tech.element || []).slice(0, 10).map((t: any) => t.name || t.title?.name || ''),
        }

        return NextResponse.json({ details })
      }
    } catch (error) {
      console.error('O*NET API error, falling back to scraping:', error)
    }
  }

  // Fallback: fetch the public summary page
  try {
    const res = await fetch(
      `https://www.onetonline.org/link/summary/${code}`,
      {
        headers: {
          'User-Agent': 'WorkplaceSkillsCoach/1.0 (educational tool)',
        },
      }
    )

    const html = await res.text()
    const details = parseOccupationPage(html, code)

    return NextResponse.json({ details })
  } catch (error) {
    console.error('O*NET scrape error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch occupation details' },
      { status: 500 }
    )
  }
}

function parseOccupationPage(html: string, code: string): OccupationDetails {
  const titleMatch = html.match(/<h1[^>]*class="title"[^>]*>([^<]+)</)
    || html.match(/<title>([^<]+)</)
  const title = titleMatch
    ? titleMatch[1].replace(' - O*NET OnLine', '').trim()
    : code

  return {
    title,
    code,
    tasks: extractListItems(html, 'Tasks'),
    skills: extractListItems(html, 'Skills'),
    knowledge: extractListItems(html, 'Knowledge'),
    workActivities: extractListItems(html, 'Work Activities'),
    workContext: extractListItems(html, 'Work Context'),
    workStyles: extractListItems(html, 'Work Styles'),
    technologySkills: extractListItems(html, 'Technology Skills'),
  }
}

function extractListItems(html: string, sectionName: string): string[] {
  const items: string[] = []

  // Find section by heading text
  const headingPattern = new RegExp(
    `>\\s*${sectionName}\\s*</`,
    'i'
  )
  const headingMatch = headingPattern.exec(html)
  if (!headingMatch) return items

  // Get a chunk of HTML after the heading
  const startIdx = headingMatch.index
  const chunk = html.slice(startIdx, startIdx + 5000)

  // Extract text from list items
  const liPattern = /<li[^>]*>([^<]*(?:<[^/][^>]*>[^<]*)*)<\/li>/gi
  let match

  while ((match = liPattern.exec(chunk)) !== null && items.length < 10) {
    const text = match[1].replace(/<[^>]+>/g, '').trim()
    if (text.length > 5 && text.length < 300) {
      items.push(text)
    }
  }

  // If no li items, try table cells with report content
  if (items.length === 0) {
    const cellPattern = /class="[^"]*report2[^"]*"[^>]*>([^<]+)/gi
    while ((match = cellPattern.exec(chunk)) !== null && items.length < 10) {
      const text = match[1].trim()
      if (text.length > 5 && text.length < 300) {
        items.push(text)
      }
    }
  }

  return items
}
