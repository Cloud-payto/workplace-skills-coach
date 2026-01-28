'use client'

import { useState } from 'react'
import { Briefcase, Mail, Phone, Lightbulb, RefreshCw, CheckCircle, Loader2, Search, LucideIcon } from 'lucide-react'

interface Occupation {
  code: string
  title: string
}

interface Scenario {
  type: string
  title: string
  prompt: string
  tips: string[]
  example: string
  criteria: string[]
}

const iconMap: Record<string, LucideIcon> = {
  email: Mail,
  phone: Phone,
  problem: Lightbulb,
}

export default function WorkplaceSkillsCoach() {
  const [jobTitle, setJobTitle] = useState('')
  const [searchResults, setSearchResults] = useState<Occupation[]>([])
  const [selectedOccupation, setSelectedOccupation] = useState<Occupation | null>(null)
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null)
  const [userResponse, setUserResponse] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'feedback' | 'example'>('feedback')
  const [error, setError] = useState<string | null>(null)

  // Step 1: Search O*NET for matching occupations
  const handleSearch = async () => {
    if (!jobTitle.trim()) return
    setError(null)
    setIsSearching(true)
    setSearchResults([])
    setSelectedOccupation(null)
    setScenarios([])
    setActiveScenario(null)
    setFeedback(null)

    try {
      const res = await fetch(`/api/onet/search?q=${encodeURIComponent(jobTitle)}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      if (data.occupations.length === 0) {
        setError('No matching jobs found. Try a different search term.')
      } else {
        setSearchResults(data.occupations)
      }
    } catch (err) {
      setError('Failed to search for jobs. Please try again.')
      console.error(err)
    } finally {
      setIsSearching(false)
    }
  }

  // Step 2: Fetch O*NET details and generate scenarios
  const handleSelectOccupation = async (occupation: Occupation) => {
    setSelectedOccupation(occupation)
    setScenarios([])
    setActiveScenario(null)
    setFeedback(null)
    setError(null)
    setIsGenerating(true)

    try {
      // Fetch real job data from O*NET
      const detailsRes = await fetch(`/api/onet/details?code=${encodeURIComponent(occupation.code)}`)
      const detailsData = await detailsRes.json()

      if (!detailsRes.ok) throw new Error(detailsData.error)

      // Generate personalized scenarios using Claude + O*NET data
      const scenariosRes = await fetch('/api/generate-scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ occupationDetails: detailsData.details }),
      })
      const scenariosData = await scenariosRes.json()

      if (!scenariosRes.ok) throw new Error(scenariosData.error)

      setScenarios(scenariosData.scenarios)
    } catch (err) {
      setError('Failed to generate scenarios. Please try again.')
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  // Step 3: Get AI feedback on user's response
  const handleGetFeedback = async () => {
    if (!activeScenario || !userResponse.trim()) return
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userText: userResponse,
          scenario: {
            prompt: activeScenario.prompt,
            criteria: activeScenario.criteria,
          },
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setFeedback(data.feedback)
    } catch (err) {
      setFeedback('Unable to generate feedback at this time. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleScenarioSelect = (scenario: Scenario) => {
    setActiveScenario(scenario)
    setUserResponse('')
    setFeedback(null)
    setViewMode('feedback')
  }

  const getIcon = (type: string) => iconMap[type] || Lightbulb

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header + Search */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Briefcase className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">Workplace Skills Coach</h1>
          </div>

          <p className="text-gray-600 mb-6">
            Search for your job title to get personalized workplace scenarios based on real job data.
          </p>

          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Type a job title (e.g., Office Clerk, Cashier, Server)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !jobTitle.trim()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              Search
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4">
              <p className="text-gray-700 font-medium mb-3">Select your job:</p>
              <div className="space-y-2">
                {searchResults.map((occ) => (
                  <button
                    key={occ.code}
                    onClick={() => handleSelectOccupation(occ)}
                    disabled={isGenerating}
                    className={`w-full text-left p-4 rounded-lg border-2 transition ${
                      selectedOccupation?.code === occ.code
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    } disabled:opacity-50`}
                  >
                    <span className="font-medium text-gray-800">{occ.title}</span>
                    <span className="text-gray-400 text-sm ml-2">({occ.code})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Loading state while generating scenarios */}
        {isGenerating && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-lg text-gray-700">
              Getting real job data and creating personalized scenarios...
            </p>
            <p className="text-gray-500 mt-2">This may take a moment.</p>
          </div>
        )}

        {/* Scenario Selection */}
        {scenarios.length > 0 && selectedOccupation && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Skills Practice for: <span className="text-indigo-600">{selectedOccupation.title}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {scenarios.map((scenario, index) => {
                const Icon = getIcon(scenario.type)
                return (
                  <button
                    key={index}
                    onClick={() => handleScenarioSelect(scenario)}
                    className={`p-4 rounded-lg border-2 transition text-left ${
                      activeScenario === scenario
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="w-6 h-6 text-indigo-600" />
                      <h3 className="font-semibold text-gray-800">{scenario.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{scenario.prompt}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Active Scenario Practice Area */}
        {activeScenario && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center gap-3 mb-4">
              {(() => {
                const Icon = getIcon(activeScenario.type)
                return <Icon className="w-7 h-7 text-indigo-600" />
              })()}
              <h3 className="text-2xl font-semibold text-gray-800">{activeScenario.title}</h3>
            </div>

            <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 mb-6">
              <p className="text-gray-800 font-medium">{activeScenario.prompt}</p>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Tips to Consider:
              </h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {activeScenario.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <label className="block font-semibold text-gray-800 mb-3">
                Your Response:
              </label>
              <textarea
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder="Type your response here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-32 text-lg"
              />
            </div>

            <div className="flex gap-3 mb-6">
              <button
                onClick={handleGetFeedback}
                disabled={!userResponse.trim() || isLoading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Get Feedback'
                )}
              </button>

              {feedback && (
                <button
                  onClick={() => setViewMode(viewMode === 'feedback' ? 'example' : 'feedback')}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  {viewMode === 'feedback' ? 'View Example' : 'View Feedback'}
                </button>
              )}
            </div>

            {feedback && viewMode === 'feedback' && (
              <div className="p-6 bg-blue-50 border-l-4 border-blue-600 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Your Personalized Feedback:</h4>
                <div className="text-gray-700 whitespace-pre-line">{feedback}</div>
              </div>
            )}

            {feedback && viewMode === 'example' && (
              <div className="p-6 bg-green-50 border-l-4 border-green-600 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Example Response:</h4>
                <p className="text-gray-700 whitespace-pre-line mb-4">{activeScenario.example}</p>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Reflection:</strong> Compare this example with your response and the feedback you received. What similarities do you notice? What could you incorporate next time?
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
