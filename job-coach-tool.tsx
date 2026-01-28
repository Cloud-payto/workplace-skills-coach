import React, { useState } from 'react';
import { Briefcase, Mail, Phone, Lightbulb, RefreshCw, CheckCircle, Loader2 } from 'lucide-react';

const WorkplaceSkillsCoach = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [currentJob, setCurrentJob] = useState('');
  const [scenarios, setScenarios] = useState([]);
  const [activeScenario, setActiveScenario] = useState(null);
  const [userResponse, setUserResponse] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('feedback'); // 'feedback' or 'example'

  const generateScenarios = (job) => {
    const jobLower = job.toLowerCase();
    
    // Base scenarios that work for most jobs
    const baseScenarios = [
      {
        type: 'email',
        icon: Mail,
        title: 'Email Communication',
        prompt: `You need to email your supervisor about being late tomorrow due to a doctor's appointment. Write a professional email requesting time off.`,
        tips: ['Include the date and time', 'Explain the reason briefly', 'Offer to make up the work', 'Use professional tone'],
        example: 'Subject: Request for Late Arrival - [Date]\n\nDear [Supervisor Name],\n\nI wanted to inform you that I have a doctor\'s appointment tomorrow and will need to arrive at [time] instead of my usual start time. I apologize for any inconvenience and will ensure all urgent tasks are completed. Please let me know if you need any additional information.\n\nThank you for understanding.\n\nBest regards,\n[Your Name]',
        criteria: ['professional greeting', 'specific date/time', 'brief explanation', 'willingness to accommodate', 'professional closing']
      },
      {
        type: 'phone',
        icon: Phone,
        title: 'Phone Script Practice',
        prompt: `A coworker calls in sick and you need to call them to ask about the status of an urgent project they were working on. Write a phone script for this conversation.`,
        tips: ['Start with a friendly greeting', 'Ask about their wellbeing', 'Explain the urgent need politely', 'Offer help or alternative solutions'],
        example: 'Hi [Name], this is [Your Name]. I heard you\'re not feeling well today - I hope you\'re okay and getting some rest. I\'m calling because [specific project/task] has come up as urgent. Do you know where I might find [specific information], or is there anything I should know to help move this forward? No pressure if you\'re not up to it - just want to make sure we\'re covered. Feel better soon!',
        criteria: ['friendly greeting', 'shows concern for wellbeing', 'explains urgent need', 'asks specific questions', 'offers help']
      },
      {
        type: 'problem',
        icon: Lightbulb,
        title: 'Problem Solving',
        prompt: `You notice that a process at work is taking much longer than it should. What steps would you take to address this issue?`,
        tips: ['Identify the specific problem', 'Gather information/observe', 'Consider multiple solutions', 'Decide who to involve', 'Propose a solution to your supervisor'],
        example: '1. Document what\'s taking too long and why\n2. Time how long each step takes\n3. Ask coworkers if they\'ve noticed the same issue\n4. Brainstorm 2-3 possible improvements\n5. Schedule time with supervisor to discuss findings and suggestions',
        criteria: ['identifies specific problem', 'gathers data/information', 'considers multiple solutions', 'involves others appropriately', 'proposes action plan']
      }
    ];

    // Job-specific scenarios
    let jobSpecific = [];
    
    if (jobLower.includes('clerk') || jobLower.includes('office') || jobLower.includes('admin')) {
      jobSpecific = [
        {
          type: 'email',
          icon: Mail,
          title: 'Filing System Email',
          prompt: `A coworker can't find an important document. Email them instructions on how to locate it in your office's filing system.`,
          tips: ['Be clear and specific', 'Use step-by-step instructions', 'Offer to help if needed', 'Keep it friendly'],
          example: 'Hi [Name],\n\nThe document you\'re looking for should be in the main filing cabinet. Here\'s how to find it:\n\n1. Go to Cabinet B (near the printer)\n2. Look in the drawer labeled "[Category]"\n3. Files are organized alphabetically by [client/date/project]\n4. The document should be under "[Specific Label]"\n\nIf you still can\'t find it, let me know and I\'ll help you look!\n\nBest,\n[Your Name]',
          criteria: ['clear greeting', 'numbered steps', 'specific locations', 'organized sequence', 'offers additional help']
        },
        {
          type: 'phone',
          icon: Phone,
          title: 'Scheduling Call',
          prompt: `You need to call a client to reschedule a meeting that was canceled. Write a phone script.`,
          tips: ['Apologize for the change', 'Explain briefly', 'Offer specific alternative times', 'Confirm the new time'],
          example: 'Hello, this is [Your Name] from [Company]. I\'m calling about your meeting scheduled for [date/time]. Unfortunately, we need to reschedule due to [brief reason]. Would [alternative date/time] or [alternative date/time] work better for you? I apologize for any inconvenience and appreciate your flexibility.',
          criteria: ['professional introduction', 'acknowledges original meeting', 'brief explanation', 'offers specific alternatives', 'apologizes']
        }
      ];
    } else if (jobLower.includes('retail') || jobLower.includes('sales') || jobLower.includes('cashier')) {
      jobSpecific = [
        {
          type: 'problem',
          icon: Lightbulb,
          title: 'Customer Complaint',
          prompt: `A customer is upset because an item they want is out of stock. What would you say to help resolve the situation?`,
          tips: ['Acknowledge their frustration', 'Apologize sincerely', 'Offer alternatives', 'Provide a timeline if possible'],
          example: 'I completely understand your frustration, and I apologize that we\'re out of stock. Let me check a few things for you: I can see if we have it at another location, check when our next shipment arrives, or show you similar items we have in stock. What would be most helpful for you?',
          criteria: ['acknowledges feelings', 'sincere apology', 'multiple solutions offered', 'asks for preference', 'helpful tone']
        },
        {
          type: 'phone',
          icon: Phone,
          title: 'Inventory Check Call',
          prompt: `A customer calls asking if you have a specific product in stock. Write a script for handling this call.`,
          tips: ['Greet warmly', 'Get specific details', 'Check thoroughly', 'Offer alternatives if unavailable'],
          example: 'Thank you for calling [Store Name], this is [Your Name]. How can I help you today? [Listen] I\'d be happy to check on that for you. Can you tell me the specific [product details]? [Check inventory] I do have that in stock! / Unfortunately we\'re currently out, but I can check our other location or let you know when we expect more. Would that help?',
          criteria: ['warm greeting', 'asks clarifying questions', 'indicates checking process', 'provides alternatives', 'helpful attitude']
        }
      ];
    } else if (jobLower.includes('food') || jobLower.includes('restaurant') || jobLower.includes('server')) {
      jobSpecific = [
        {
          type: 'problem',
          icon: Lightbulb,
          title: 'Order Mix-up',
          prompt: `A customer received the wrong order. How would you handle this situation to make it right?`,
          tips: ['Apologize immediately', 'Don\'t make excuses', 'Explain what you\'ll do to fix it', 'Offer something extra if appropriate'],
          example: 'I\'m so sorry about that mistake. Let me get that corrected right away. I\'ll put in the correct order immediately and make sure it\'s prioritized in the kitchen. In the meantime, please keep this [item] and the correct order will be out within [time]. Would you like a complimentary [drink/appetizer] while you wait?',
          criteria: ['immediate apology', 'takes responsibility', 'clear action plan', 'specific timeline', 'compensation offered']
        },
        {
          type: 'phone',
          icon: Phone,
          title: 'Reservation Call',
          prompt: `Someone calls to make a reservation for a party of 8. Write a script for this call.`,
          tips: ['Get key details', 'Repeat information back', 'Explain any policies', 'Confirm contact info'],
          example: 'Thank you for calling [Restaurant]. I\'d be happy to help with your reservation. What date and time were you thinking? [Listen] Perfect, party of 8 on [date] at [time]. Can I have a name for the reservation? [Get name] Great. Just so you know, for parties over 6 we do add an automatic gratuity of 18%. Is there anything else you\'d like me to note, like dietary restrictions or a special occasion? Can I get a phone number in case we need to reach you? Thank you, we look forward to seeing you!',
          criteria: ['friendly greeting', 'gathers all details', 'repeats information', 'explains policies', 'confirms contact info']
        }
      ];
    } else if (jobLower.includes('customer service') || jobLower.includes('support')) {
      jobSpecific = [
        {
          type: 'email',
          icon: Mail,
          title: 'Follow-up Email',
          prompt: `A customer contacted you yesterday about an issue. Write a follow-up email checking if their problem was resolved.`,
          tips: ['Reference the original issue', 'Show you care', 'Ask specific questions', 'Offer continued help'],
          example: 'Subject: Following up on [Issue]\n\nHi [Customer Name],\n\nI wanted to follow up on the [specific issue] we discussed yesterday. Were you able to [solution provided]? Is everything working as it should now?\n\nIf you\'re still experiencing any problems or have questions, please don\'t hesitate to reach out. I\'m here to help!\n\nBest regards,\n[Your Name]',
          criteria: ['references previous issue', 'specific follow-up questions', 'caring tone', 'offers continued support', 'professional format']
        },
        {
          type: 'problem',
          icon: Lightbulb,
          title: 'Difficult Customer',
          prompt: `A customer is getting increasingly frustrated and raising their voice. What strategies would you use to de-escalate the situation?`,
          tips: ['Stay calm', 'Listen actively', 'Validate feelings', 'Focus on solutions', 'Know when to escalate'],
          example: 'Strategy: 1) Take a breath and stay calm - don\'t match their energy. 2) Let them vent without interrupting. 3) Say "I understand why this is frustrating" to validate. 4) Lower your voice slightly - they often mirror this. 5) Focus on "Here\'s what I can do to help." 6) If needed: "I want to help resolve this. Let me get my supervisor who may have additional options."',
          criteria: ['maintains composure', 'active listening', 'validates emotions', 'solution-focused', 'knows escalation points']
        }
      ];
    }

    return [...baseScenarios, ...jobSpecific];
  };

  const analyzeFeedback = async (userText, scenario) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
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
      });

      const data = await response.json();
      const feedbackText = data.content[0].text;
      
      setFeedback(feedbackText);
      setIsLoading(false);
    } catch (error) {
      console.error('Error getting feedback:', error);
      setFeedback('Unable to generate feedback at this time. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGenerateScenarios = () => {
    if (!jobTitle.trim()) return;
    setCurrentJob(jobTitle);
    const newScenarios = generateScenarios(jobTitle);
    setScenarios(newScenarios);
    setActiveScenario(null);
    setUserResponse('');
    setFeedback(null);
  };

  const handleScenarioSelect = (scenario) => {
    setActiveScenario(scenario);
    setUserResponse('');
    setFeedback(null);
    setViewMode('feedback');
  };

  const handleGetFeedback = () => {
    analyzeFeedback(userResponse, activeScenario);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Briefcase className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">Workplace Skills Coach</h1>
          </div>
          
          <p className="text-gray-600 mb-6">
            Enter your job title to get personalized workplace scenarios and practice essential communication and problem-solving skills.
          </p>

          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGenerateScenarios()}
              placeholder="Enter job title (e.g., Office Clerk, Retail Associate, Server)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={handleGenerateScenarios}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Generate
            </button>
          </div>
        </div>

        {scenarios.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Skills Practice for: <span className="text-indigo-600">{currentJob}</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {scenarios.map((scenario, index) => {
                const Icon = scenario.icon;
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
                );
              })}
            </div>
          </div>
        )}

        {activeScenario && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center gap-3 mb-4">
              <activeScenario.icon className="w-7 h-7 text-indigo-600" />
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-32"
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
  );
};

export default WorkplaceSkillsCoach;