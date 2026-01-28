import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get('q')

  if (!keyword) {
    return NextResponse.json({ error: 'Missing search query' }, { status: 400 })
  }

  const apiKey = process.env.ONET_API_KEY

  // Try the official API first
  if (apiKey) {
    try {
      const res = await fetch(
        `https://services.onetcenter.org/ws/online/search?keyword=${encodeURIComponent(keyword)}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(apiKey).toString('base64')}`,
            'Accept': 'application/json',
          },
        }
      )

      if (res.ok) {
        const data = await res.json()
        const occupations = (data.occupation || []).slice(0, 10).map((occ: any) => ({
          code: occ.code,
          title: occ.title,
        }))
        return NextResponse.json({ occupations })
      }
    } catch (error) {
      console.error('O*NET API error, falling back to scraping:', error)
    }
  }

  // Fallback: fetch the public search page
  try {
    const res = await fetch(
      `https://www.onetonline.org/find/result?s=${encodeURIComponent(keyword)}&a=1`,
      {
        headers: {
          'User-Agent': 'WorkplaceSkillsCoach/1.0 (educational tool)',
        },
      }
    )

    const html = await res.text()

    // Parse occupation results from HTML
    // Links follow pattern: /link/summary/XX-XXXX.XX with the title as link text
    const occupations: { code: string; title: string }[] = []
    const pattern = /\/link\/summary\/([\d-]+\.[\d]+)"[^>]*>([^<]+)/g
    let match

    while ((match = pattern.exec(html)) !== null && occupations.length < 10) {
      const code = match[1]
      const title = match[2].trim()
      if (!occupations.some(o => o.code === code)) {
        occupations.push({ code, title })
      }
    }

    return NextResponse.json({ occupations })
  } catch (error) {
    console.error('O*NET scrape error:', error)
    return NextResponse.json(
      { error: 'Failed to search occupations' },
      { status: 500 }
    )
  }
}
