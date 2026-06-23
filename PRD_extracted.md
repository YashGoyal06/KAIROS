PRODUCT REQUIREMENTS DOCUMENT
Hackathon Project 
Coach Agent
From Idea to Demo — Intelligently Coached
Document Version
v1.0 — Initial Release
Status
Draft
Submission Deadline
July 18, 2025 (PPT)
Stack
React + Node.js / Python + FastAPI
Team
TBD
1. Product Overview
1.1 Problem Statement
Hackathon teams consistently face the same bottleneck: they have a compelling idea but lack structured support to turn it into a shippable product within the event window. Teams lose hours to scope creep, unclear ownership, untracked blockers, and poor pitch preparation — often arriving at demo time with an incomplete build and a weak narrative.
Core Problem
There is no intelligent, always-on coaching layer that helps hackathon teams translate a raw idea into a build plan, track real execution risk, and prepare a compelling pitch — all in one place.
1.2 Solution
The Hackathon Project Coach Agent is an AI-powered coaching platform that acts as a proactive, intelligent co-founder for hackathon teams. It critiques scope, generates build roadmaps, produces pitch outlines, and actively monitors team progress — surfacing blockers and risks before they become failures.
Unlike passive chat tools, the agent has its own initiative: it watches the team's project state and speaks up without being asked. Teams can work collaboratively in real-time, share a read-only view with mentors, or work solo — the agent adapts to all three modes.
1.3 Product Vision
Vision Statement
To be the unfair advantage every hackathon team deserves — an AI coach that turns ambiguous ideas into executable plans, keeps teams honest about their scope, and prepares them to win.
1.4 Target Users
Feature / Capability
Priority
Owner Layer
Notes
Hackathon teams (primary)
P0
All layers
2–5 members, mixed technical skill levels
Solo hackers
P0
All layers
Single user per session, same capabilities
Mentors / Judges (observers)
P1
Frontend only
Read-only shareable link, no edit access
Hackathon organizers
P2
Frontend + DB
Optional: overview of all teams' progress
2. Goals & Success Metrics
2.1 Primary Goals
Enable a team to go from raw idea to structured build plan within 10 minutes of onboarding
Provide proactive coaching — the agent flags scope issues, risks, and slipping tasks without being prompted
Generate a pitch-ready outline automatically from the project state
Support real-time multi-user collaboration, solo use, and read-only sharing — all from one session
Win the hackathon on coaching quality, practical planning, and workflow simplicity
2.2 Success Metrics
Onboarding to Plan
Team has a roadmap generated within 10 minutes of submitting their idea
Proactive Interventions
Agent surfaces at least 1 unsolicited risk/blocker flag per active session hour
Pitch Output
One-click pitch outline generated from project state, no manual input required
Collab Sync Latency
Multi-user state sync under 300ms for all connected clients
Read-only Share
Shareable link generated and accessible without authentication in < 2 seconds
Judge Score Target
Top score on coaching quality and practical planning categories
3. Scope & Constraints
3.1 In Scope
Project concept intake (free-form text + guided prompts)
AI-powered scope critique — flags overengineering, missing pieces, and assumptions
Automated milestone and build roadmap generation
Pitch deck outline generator (problem, solution, demo flow, tech stack slide)
Blocker and risk tracker — manual input + AI-inferred from conversation
Proactive agent nudges (configurable: on / off / frequency)
Real-time multi-user collaboration via WebSockets
Read-only share link with token-based access
Session persistence (project state saved across browser refreshes)
Streaming LLM responses for responsive feel
3.2 Out of Scope (for PPT submission)
Native mobile app (responsive web only)
Third-party integrations (GitHub, Jira, Notion, Slack) — future phase
Voice interface
Multi-team / organizer dashboard
Billing or authentication system beyond session tokens
Scope Philosophy
The agent's coaching quality matters more than feature breadth. Every feature included must directly serve the goal of helping a team move from idea to demo. Anything that complicates the workflow is cut.
4. System Architecture
4.1 High-Level Architecture
The system is composed of three layers: a React frontend, a Node.js BFF (Backend For Frontend), and a Python/FastAPI core backend. The LLM (Claude API) is called exclusively from the FastAPI layer. Real-time sync is handled via WebSockets managed by FastAPI with Redis pub/sub.
Layer
Technology
Responsibility
Frontend
React 18 + Vite + TailwindCSS
UI, WebSocket client, state rendering, share link view
BFF (Node.js)
Express + ws library
Session management, WS proxy, REST forwarding to FastAPI, CORS
Core Backend
Python 3.11 + FastAPI
Agent logic, LLM calls, roadmap generation, pitch builder, nudge scheduler
LLM
Anthropic Claude API (claude-sonnet-4-6)
Scope critique, milestone gen, pitch outline, proactive coaching
Real-time Sync
WebSockets (FastAPI native) + Redis pub/sub
Multi-user broadcast, session state sync
Persistence
Redis (session state) + PostgreSQL (optional long-term)
Project state, task/blocker store, nudge config
Scheduler
APScheduler (Python)
Proactive nudge triggers, configurable frequency per session
4.2 Data Flow
User submits project concept via frontend input field
React sends POST /session/concept to Node BFF
BFF forwards to FastAPI POST /api/v1/session/{id}/concept
FastAPI calls Claude API with coach system prompt + concept
Claude streams back: scope critique + initial milestone suggestions
FastAPI streams response chunks to BFF via SSE
BFF broadcasts to all WebSocket clients in the session
Frontend renders agent cards in real-time as chunks arrive
Project state (tasks, milestones, blockers) stored in Redis keyed by session ID
APScheduler checks session activity and fires proactive nudges on schedule
4.3 Session & Collaboration Model
Solo Mode
Single WebSocket client per session. Full read/write. Default mode.
Multi-user Collab
Multiple clients connect to same session ID. All edits broadcast via Redis pub/sub. Presence indicators shown per connected user.
Read-only Share
Shareable token generated server-side. Token resolves to session state. No WebSocket write access. Suitable for mentors/judges.
Session Persistence
Session state serialized to Redis on every state change. Survives browser refresh. TTL: 48 hours from last activity.
5. Agent Design & Capabilities
5.1 Agent Persona & System Prompt Design
The agent is designed as a pragmatic, direct, and experienced hackathon coach — not a generic assistant. Its system prompt enforces the following behaviors:
Always evaluates feasibility relative to hackathon constraints, not ideal-world conditions
Proactively asks clarifying questions when the scope is ambiguous
Flags over-engineering immediately and recommends the simplest path to a working demo
Produces structured output (milestones, pitch outlines) in a consistent JSON schema that the frontend can render as structured cards
Never lectures — gives short, actionable, opinionated responses
5.2 Agent Modes
Feature / Capability
Priority
Owner Layer
Notes
Scope Critique Mode
P0
FastAPI + Claude
Analyzes the project concept, identifies gaps, flags risky assumptions, suggests cuts
Roadmap Generation Mode
P0
FastAPI + Claude
Generates phased milestones with deliverables, time estimates, and dependencies
Pitch Outline Mode
P0
FastAPI + Claude
Produces structured pitch: problem, solution, demo flow, tech stack, ask
Blocker Tracking Mode
P0
FastAPI + Redis
Maintains blocker/risk list, agent infers new risks from conversation context
Proactive Nudge Mode
P1
APScheduler + FastAPI
Time-triggered check-ins, slippage alerts, motivational pushes — all configurable
Check-in Mode
P1
FastAPI + Claude
Team manually triggers a status review — agent summarizes progress and re-prioritizes
Freeform Chat Mode
P0
FastAPI + Claude
General Q&A with project context injected — team can ask anything
5.3 Structured Output Schema
The agent returns structured JSON for renderable outputs. Key schemas:
Milestone Schema
{ "phase": "string", "title": "string", "deliverable": "string", "duration_estimate": "string", "dependencies": ["string"], "risk_level": "low|medium|high" }
Blocker Schema
{ "id": "uuid", "type": "technical|scope|resource|unknown", "description": "string", "severity": "low|medium|high|critical", "suggested_resolution": "string", "status": "open|in_progress|resolved" }
Pitch Outline Schema
{ "problem": "string", "solution": "string", "demo_flow": ["string"], "tech_stack_summary": "string", "differentiator": "string", "ask": "string" }
5.4 Proactive Nudge Configuration
Nudge Types
Milestone slippage alert, idle session warning, blocker unresolved reminder, pitch readiness check, pre-demo countdown
Trigger Mechanism
APScheduler job per session, checks state delta vs. last nudge timestamp
User Control
Per-session toggle (on/off), frequency setting (low/medium/high), quiet hours config
Delivery
Agent card pushed via WebSocket to all active clients in session
6. Frontend Specification
6.1 Technology Stack
Framework
React 18 with Vite build tooling
Styling
TailwindCSS + custom design tokens
State Management
Zustand (lightweight, no Redux overhead)
WebSocket Client
Native browser WebSocket API, with reconnect logic
HTTP Client
Axios with interceptors for session token injection
Routing
React Router v6 — session routes + share link routes
Streaming Render
Custom hook: useStreamingText — renders LLM tokens as they arrive
Component Library
Radix UI primitives (accessible, unstyled — styled with Tailwind)
6.2 Core Views
Feature / Capability
Priority
Owner Layer
Notes
Onboarding / Concept Intake
P0
Frontend
Guided form to capture project idea, team size, target demo. Feeds agent context.
Main Workspace (primary view)
P0
Frontend + WS
Live agent feed + interactive project state. The core experience.
Roadmap Panel
P0
Frontend
Rendered milestone cards from agent JSON. Editable inline.
Blocker & Risk Panel
P0
Frontend + FastAPI
List of open blockers. Agent can add, team can update status.
Pitch Outline View
P1
Frontend
Rendered pitch outline card, exportable as text/markdown.
Session Settings
P1
Frontend
Nudge toggle, frequency, quiet hours, session name.
Read-only Share View
P1
Frontend
Full project state rendered in read-only mode. No agent interaction.
Presence Indicators
P1
Frontend + WS
Show connected team members in multi-user session with initials/color.
6.3 Key Frontend Behaviors
Agent responses stream token-by-token — no waiting for full response before display
Structured outputs (milestones, blockers, pitch) render as interactive cards, not raw text
State changes from any user broadcast immediately to all session clients
Read-only share view auto-refreshes via polling (every 10s) — no WebSocket needed for observers
Nudge cards appear as dismissible overlay cards, not disruptive modals
All views are responsive — usable on laptop and tablet
7. Backend API Specification
7.1 Technology Stack
Framework
FastAPI 0.110+ with async/await throughout
Python Version
3.11+
LLM SDK
Anthropic Python SDK (anthropic>=0.25.0) with streaming
WebSocket
FastAPI native WebSocket support
Task Scheduler
APScheduler 3.x with AsyncIOScheduler
Cache / State
Redis 7.x via redis-py (async)
Database
PostgreSQL 15 via asyncpg + SQLAlchemy 2.0 (async) — optional for persistence
Validation
Pydantic v2 models for all request/response schemas
CORS
FastAPI CORSMiddleware — configured for BFF origin only
7.2 API Endpoints
Session Management
Method
Endpoint
Description
Request / Response
POST
/api/v1/sessions
Create new coaching session
Body: { project_name, team_size } → { session_id, share_token }
GET
/api/v1/sessions/{id}
Get session state
→ { concept, milestones, blockers, nudge_config, pitch_outline }
DELETE
/api/v1/sessions/{id}
End and clean up session
→ { deleted: true }
GET
/api/v1/sessions/share/{token}
Read-only session access
→ Full session state (read-only, no auth required)
Agent Actions
Method
Endpoint
Description
Request / Response
POST
/api/v1/sessions/{id}/concept
Submit / update project concept
Body: { concept_text } → Streaming: scope critique + initial milestones
POST
/api/v1/sessions/{id}/critique
Request scope critique
Body: { focus_area? } → Streaming: critique cards
POST
/api/v1/sessions/{id}/roadmap
Generate / regenerate roadmap
Body: { constraints? } → Streaming: milestone JSON array
POST
/api/v1/sessions/{id}/pitch
Generate pitch outline
→ Streaming: pitch outline JSON
POST
/api/v1/sessions/{id}/checkin
Trigger manual check-in
→ Streaming: progress summary + re-prioritized tasks
POST
/api/v1/sessions/{id}/chat
Freeform chat with agent
Body: { message, history } → Streaming: agent reply
Blockers & Tasks
Method
Endpoint
Description
Request / Response
GET
/api/v1/sessions/{id}/blockers
List all blockers
→ [ Blocker[] ]
POST
/api/v1/sessions/{id}/blockers
Add a blocker manually
Body: { description, severity } → Blocker
PATCH
/api/v1/sessions/{id}/blockers/{bid}
Update blocker status
Body: { status } → Updated Blocker
DELETE
/api/v1/sessions/{id}/blockers/{bid}
Remove a blocker
→ { deleted: true }
Nudge Configuration
Method
Endpoint
Description
Request / Response
GET
/api/v1/sessions/{id}/nudges/config
Get nudge settings
→ { enabled, frequency, quiet_hours }
PATCH
/api/v1/sessions/{id}/nudges/config
Update nudge settings
Body: { enabled?, frequency?, quiet_hours? } → Updated config
WebSocket
Method
Endpoint
Description
Request / Response
WS
/ws/{session_id}?token={auth_token}
Main collab WebSocket
Bidirectional: agent broadcasts + client state updates
WS
/ws/share/{share_token}
Read-only observer WebSocket
Server → client only. No client messages accepted.
7.3 Streaming Pattern
All LLM-backed endpoints use Server-Sent Events (SSE) for streaming. The FastAPI endpoint uses StreamingResponse with the Anthropic SDK's stream context manager. Each chunk is yielded as a data: JSON event. The BFF forwards these chunks directly to the WebSocket clients.
Streaming Event Format
data: { "type": "text_delta", "content": "...", "agent_mode": "critique|roadmap|pitch|checkin|chat" }
data: { "type": "structured_block", "block_type": "milestone|blocker|pitch_outline", "data": { ... } }
data: { "type": "done" }
8. Node.js BFF Specification
8.1 Responsibilities
The Node.js BFF sits between the React frontend and the FastAPI backend. It is intentionally thin — its job is plumbing, not logic.
Session token management — issues and validates short-lived JWT session tokens
WebSocket connection management — maintains persistent WS connections to FastAPI, fans out to multiple browser clients
SSE-to-WebSocket bridge — converts FastAPI streaming SSE responses into WebSocket messages for the frontend
CORS management — single origin policy, frontend only
Rate limiting — prevents abuse of the agent endpoints
Environment variable management — API keys never exposed to frontend
8.2 Technology Stack
Runtime
Node.js 20 LTS
Framework
Express 4.x
WebSocket
ws library (not Socket.io — lower overhead)
Auth / Tokens
jsonwebtoken for session token signing
HTTP Proxy
http-proxy-middleware for FastAPI forwarding
Rate Limiting
express-rate-limit
Environment
dotenv — ANTHROPIC_API_KEY, FASTAPI_URL, JWT_SECRET never sent to client
8.3 WebSocket Fan-out Logic
Browser client connects to BFF WS endpoint with session ID + token
BFF validates token, adds client to session room (Map<sessionId, Set<ws>>)
When FastAPI sends a broadcast event to BFF, BFF iterates the room and sends to all live clients
Disconnected clients are pruned from the room on ws close event
For read-only observers, BFF connects them to share-token WS — no write path
9. Build Milestones & Roadmap
9.1 Phased Delivery Plan
Phase
Milestone
Deliverable
Status
Phase 0
Project Setup & Scaffolding
Monorepo, React app, FastAPI app, Node BFF, Redis, env config
To Do
Phase 1
Core Agent — Concept Intake + Critique
POST /concept endpoint, Claude integration, streaming to frontend
To Do
Phase 2
Roadmap & Milestone Generation
Roadmap endpoint, milestone JSON schema, rendered roadmap cards
To Do
Phase 3
Blocker & Risk Tracker
Blocker CRUD API, agent-inferred blockers, blocker cards in UI
To Do
Phase 4
Pitch Outline Generator
Pitch endpoint, pitch outline card, markdown export
To Do
Phase 5
Real-time Collab + Share Link
WebSocket multi-user sync, read-only share token, presence UI
To Do
Phase 6
Proactive Nudge System
APScheduler integration, nudge config API, nudge card UI
To Do
Phase 7
Polish + PPT Preparation
UI polish, demo script, PowerPoint presentation prep
To Do
9.2 Critical Path
Must-have for PPT submission
Phase 0 → Phase 1 → Phase 2 → Phase 4 must be complete for a compelling demo. Phases 5 and 6 are the differentiators. Phase 3 is table-stakes for judge credibility.
10. Risks & Mitigations
Risk
Severity
Description
Mitigation
LLM latency degrades UX
Medium
Slow Claude responses break the 'live coaching' feel
Streaming + skeleton loaders; cache repeated patterns
Scope creep in our own build
High
We build too many features and ship nothing polished
Ruthlessly enforce Phase 0–4 before touching anything else
WebSocket complexity
Medium
Multi-user sync introduces race conditions
Redis pub/sub as single source of truth; optimistic UI updates
Proactive nudges feel annoying
Medium
Overly frequent agent interruptions hurt UX
Default to low frequency; clear dismiss + snooze controls
Agent produces generic output
High
Coaching quality is judged — generic responses fail
Deeply engineered system prompt with hackathon-specific context
Redis not available in demo env
Low
State management fails without Redis
In-memory fallback store for demo; Redis for production path
11. Open Questions & Decisions Needed
Frontend UX Design
War Room concept approved in spirit — exact visual design (layout, color, interaction model) to be decided. Does not block backend work.
Auth Strategy
Session tokens sufficient for hackathon? Or do we need lightweight user auth (Google OAuth) for multi-user collab?
LLM Model
claude-sonnet-4-6 proposed as balance of speed + quality. Confirm API access and rate limits.
Persistence Layer
Redis-only vs. Redis + PostgreSQL. PostgreSQL adds resume-session capability but adds infra complexity.
Demo Environment
Local Docker Compose or deploy to cloud (Railway / Render / Fly.io)? Affects demo reliability.
Team Roles
Who owns frontend, backend, agent prompt engineering, and PPT? Define before Phase 1 kick-off.
12. Appendix
12.1 Folder Structure
Proposed Monorepo Layout
/hackathon-coach/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/         # useWebSocket, useStreamingText
│   │   ├── stores/        # Zustand stores
│   │   ├── views/         # Workspace, Roadmap, Pitch, Share
│   │   └── api/           # Axios client
│   └── package.json
├── bff/               # Node.js Express BFF
│   ├── src/
│   │   ├── routes/
│   │   ├── ws/            # WebSocket fan-out logic
│   │   └── middleware/
│   └── package.json
├── backend/           # Python FastAPI
│   ├── app/
│   │   ├── api/           # Route handlers
│   │   ├── agent/         # LLM logic, prompts, streaming
│   │   ├── scheduler/     # APScheduler nudge jobs
│   │   ├── models/        # Pydantic schemas
│   │   └── store/         # Redis + DB layer
│   ├── requirements.txt
│   └── main.py
├── docker-compose.yml
└── README.md
12.2 Environment Variables
ANTHROPIC_API_KEY
Claude API key — backend only, never exposed to frontend
REDIS_URL
Redis connection string (default: redis://localhost:6379)
DATABASE_URL
PostgreSQL connection string (optional)
JWT_SECRET
BFF session token signing secret
FASTAPI_URL
BFF → FastAPI internal URL (default: http://localhost:8000)
FRONTEND_ORIGIN
CORS allowed origin for BFF
VITE_BFF_URL
Frontend → BFF base URL (injected at build time)
End of Document
Hackathon Project Coach Agent  •  PRD v1.0