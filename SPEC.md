# SendPilot.ai Clone - Technical Specification

## Project Overview
- **Project Name**: LeadgenJ - LinkedIn Outreach Automation Platform
- **Project Type**: Full-stack SaaS Web Application
- **Core Functionality**: LinkedIn-first outreach automation with AI-powered message generation, ICP scoring, campaign management, and unified inbox
- **Target Users**: Sales teams, recruiters, B2B marketers, and growth hackers

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes (full-stack Next.js)
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Queue**: Redis with BullMQ
- **Auth**: NextAuth.js with JWT
- **AI**: OpenAI API (GPT-4)
- **Payments**: Stripe
- **Email**: Resend (transactional only)

## UI/UX Specification

### Color Palette
- **Primary**: #0A0F1C (Deep Navy - backgrounds)
- **Secondary**: #1A2235 (Card backgrounds)
- **Accent**: #00D4AA (Teal - CTAs, success states)
- **Accent Secondary**: #6366F1 (Indigo - interactive elements)
- **Warning**: #F59E0B (Amber - caution states)
- **Error**: #EF4444 (Red - error states)
- **Text Primary**: #F8FAFC (White-ish)
- **Text Secondary**: #94A3B8 (Muted gray)
- **Border**: #2D3748 (Subtle borders)

### Typography
- **Font Family**: "Outfit" (headings), "DM Sans" (body)
- **Headings**:
  - H1: 48px, 700 weight
  - H2: 36px, 600 weight
  - H3: 24px, 600 weight
  - H4: 18px, 600 weight
- **Body**: 16px, 400 weight
- **Small**: 14px, 400 weight
- **Caption**: 12px, 400 weight

### Spacing System
- Base unit: 4px
- Common spacings: 4, 8, 12, 16, 24, 32, 48, 64px

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Visual Effects
- Card shadows: 0 4px 20px rgba(0, 0, 0, 0.3)
- Hover transitions: 150ms ease
- Button hover: scale(1.02) with glow effect
- Glassmorphism on cards: backdrop-blur-md

## Database Schema

### Models to Implement (Prisma)
All models as specified in the requirements:
- User, Workspace, WorkspaceMember
- LinkedInAccount, Campaign, Sequence
- Lead, CampaignLead, Message
- UniboxConversation, CreditTransaction
- ApiKey, Webhook

## API Endpoints

### Authentication (/api/auth/)
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout

### Workspaces (/api/workspaces)
- CRUD operations + member management

### LinkedIn Accounts (/api/linkedin-accounts)
- Full CRUD + validate + warmup endpoints

### Leads (/api/leads)
- Full CRUD + search + bulk-import + ICP scoring

### Campaigns (/api/campaigns)
- Full CRUD + sequence management + activate/pause/resume

### Unibox (/api/unibox)
- Conversations + messages + replies

### AI Features (/api/ai)
- Message generation, ICP calculation, lead enrichment

### Developer APIs
- API keys management
- Webhooks configuration

### Billing (/api/billing)
- Credits, transactions, Stripe integration

## Frontend Pages

### Public
- / - Landing page

### Protected Dashboard
- /dashboard - Main analytics dashboard
- /dashboard/leads - Lead management
- /dashboard/leads/[id] - Lead detail
- /dashboard/leads/search - Lead search
- /dashboard/campaigns - Campaign list
- /dashboard/campaigns/builder/[id] - Campaign builder
- /dashboard/campaigns/[id]/analytics - Campaign analytics
- /dashboard/unibox - Unified inbox
- /dashboard/unibox/[conversationId] - Conversation detail
- /dashboard/linkedin-accounts - LinkedIn account management
- /dashboard/workspaces - Workspace management
- /dashboard/settings/profile - Profile settings
- /dashboard/settings/billing - Billing & credits
- /dashboard/settings/api-keys - API keys
- /dashboard/settings/webhooks - Webhooks

## Components to Build
1. LeadTable - Sortable/filterable with ICP badges
2. CampaignBuilder - Visual sequence editor
3. MessageEditor - Rich text with AI assistant
4. UniboxChat - Real-time chat interface
5. ICPScoreCard - Radar chart scoring
6. CreditUsageChart - Line chart
7. AnalyticsDashboard - Metrics + funnel
8. LinkedInAccountCard - Health status
9. WorkspaceSwitcher - Workspace dropdown
10. CreditBalanceDisplay - Credits + purchase

## Critical Features Implementation

### 1. AI Message Generation
- OpenAI GPT-4 integration
- Personalization based on lead data
- 300 char limit for connection requests
- 3 variations generation

### 2. ICP Scoring System
- 0-100 score based on title, company, industry
- Breakdown visualization
- Score caching

### 3. Credit System
- ICP scoring: 1 credit
- Lead enrichment: 1 credit
- Export: 1 credit
- 10 messages: 1 credit

### 4. LinkedIn Safety
- Daily limits: 80-120 messages
- Warmup: 20/day, +10/day over 8 days
- Random delays: 2-5 minutes

### 5. Campaign Auto-Stop
- Stop on reply
- Cancel pending messages
- Move to Unibox

### 6. Queue System
- BullMQ with Redis
- Scheduled message processing
- Exponential backoff retry

### 7. Webhook System
- Event types supported
- 5x retry delivery
- Delivery logging

### 8. API Authentication
- API keys with rate limiting
- Scoped permissions

## Stripe Integration
- Credit packs: 100/$10, 500/$40, 2000/$150
- Subscriptions: Free (50/mo), Pro ($49/500 credits), Business ($149/2000 credits)
- Webhook handler for payments

## Deployment
- Dockerfile + docker-compose.yml
- .env.example
- Vercel configuration
- GitHub Actions CI/CD

## Acceptance Criteria
1. User can register/login
2. User can create workspaces and invite members
3. User can add LinkedIn accounts (mock or real)
4. User can import leads with ICP scoring
5. User can create campaigns with sequences
6. User can view analytics
7. User can purchase credits
8. User can manage API keys and webhooks
9. Messages are queued and sent (simulated)
10. Replies appear in Unibox
