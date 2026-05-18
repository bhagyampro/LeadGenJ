import OpenAI from 'openai'

type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function createChatCompletion(input: {
  messages: ChatMessage[]
  temperature: number
  maxTokens: number
}) {
  const provider = process.env.AI_PROVIDER || 'ollama'

  if (provider === 'ollama') {
    return createOllamaChatCompletion(input)
  }

  if (process.env.OPENROUTER_API_KEY) {
    const client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.OPENROUTER_APP_URL || 'http://localhost:3000',
        'X-Title': process.env.OPENROUTER_APP_NAME || 'LeadgenJ',
      },
    })

    const response = await client.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || 'google/gemma-4-26b-a4b-it',
      messages: input.messages,
      temperature: input.temperature,
      max_tokens: input.maxTokens,
    })

    return response.choices[0]?.message?.content || ''
  }

  if (process.env.OPENAI_API_KEY) {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: input.messages,
      temperature: input.temperature,
      max_tokens: input.maxTokens,
    })

    return response.choices[0]?.message?.content || ''
  }

  throw new Error('AI provider is not configured. Use Ollama locally or add OpenRouter/OpenAI credentials.')
}

async function createOllamaChatCompletion(input: {
  messages: ChatMessage[]
  temperature: number
  maxTokens: number
}) {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  const model = process.env.OLLAMA_MODEL || 'llama3.2:1b'

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: input.messages,
      stream: false,
      options: {
        temperature: input.temperature,
        num_predict: input.maxTokens,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Ollama request failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return data.message?.content || ''
}

export async function generateMessageVariations(
  leadData: {
    firstName?: string | null
    lastName?: string | null
    title?: string | null
    company?: string | null
    industry?: string | null
  },
  template: string,
  count: number = 3
): Promise<string[]> {
  const personalization = `
    Lead Name: ${leadData.firstName} ${leadData.lastName}
    Title: ${leadData.title}
    Company: ${leadData.company}
    Industry: ${leadData.industry}
  `

  const systemPrompt = `You are a LinkedIn outreach expert. Generate ${count} variations of a message based on the template provided.
  The message should be personalized, natural, and under 300 characters for connection requests.
  Each variation should be unique and conversational.
  Return only the message variations, one per line, with no numbering or bullet points.`

  const userPrompt = `Template: ${template}\n\n${personalization}\n\nGenerate ${count} personalized variations:`

  const content = await createChatCompletion({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    maxTokens: 500,
  })

  return content.split('\n').filter(Boolean)
}

export async function calculateICPScore(
  leadData: {
    title?: string | null
    company?: string | null
    industry?: string | null
    location?: string | null
  }
): Promise<{ score: number; breakdown: Record<string, number> }> {
  const systemPrompt = `You are an ICP (Ideal Customer Profile) scoring expert. Score a lead from 0-100 based on their fit for B2B SaaS outbound sales.
  Consider factors like:
  - Title seniority (C-level = 100, VP = 80, Director = 60, Manager = 40, IC = 20)
  - Company size (Enterprise = 100, Mid-market = 75, SMB = 50, Startup = 25)
  - Industry fit (Tech = 100, Finance = 80, Healthcare = 70, Other = 50)
  - Location (US/UK = 100, Europe = 80, Other = 60)

  Return a JSON object with:
  {
    "score": number (0-100),
    "breakdown": {
      "title": number (0-100),
      "company": number (0-100),
      "industry": number (0-100),
      "location": number (0-100)
    }
  }`

  const userPrompt = `Score this lead:
  Title: ${leadData.title || 'Unknown'}
  Company: ${leadData.company || 'Unknown'}
  Industry: ${leadData.industry || 'Unknown'}
  Location: ${leadData.location || 'Unknown'}`

  const content = await createChatCompletion({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3,
    maxTokens: 300,
  })

  try {
    const result = JSON.parse(content || '{}')
    return {
      score: result.score || 50,
      breakdown: result.breakdown || { title: 50, company: 50, industry: 50, location: 50 }
    }
  } catch {
    return {
      score: 50,
      breakdown: { title: 50, company: 50, industry: 50, location: 50 }
    }
  }
}

export async function enrichLead(
  leadData: {
    firstName?: string | null
    lastName?: string | null
    company?: string | null
    title?: string | null
  }
): Promise<{ email?: string; phone?: string }> {
  // Mock enrichment - in production, integrate with Clearbit, Apollo, etc.
  // For now, return mock data based on lead info
  const mockEmail = `${leadData.firstName?.toLowerCase() || 'john'}.${leadData.lastName?.toLowerCase() || 'doe'}@${leadData.company?.toLowerCase().replace(/\s+/g, '') || 'company'}.com`

  return {
    email: mockEmail,
    phone: '+1 (555) 123-4567',
  }
}
