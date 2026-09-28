Display the full reference of all /aaid-* slash commands, grouped by category, with CLI equivalents.

---

## 🛠 Utility & Navigation

| Command | What it does |
|---|---|
| `/aaid-help` | Show this command reference |
| `/aaid-tutorial` | **New here? Start with this.** A guided, step-by-step walkthrough — asks whether you're on a new or existing (brownfield) project, then lists exactly which commands to run, where (chat vs terminal), and why. |
| `/aaid-chat` | Open a conversation with a specialist agent — PM, Architect, Dev, QA, Security, DevOps, Reviewer, Marketing, or Docs writer — loaded with your project context. No file saved. |

---

## 📋 Planning & Discovery

Run these early in a project to produce the documents that feed every other command.

| Command | What it produces |
|---|---|
| `/aaid-migrate` | **Start here for existing projects.** Reads your codebase, interviews you, generates requirements + architecture + backlog. |
| `/aaid-requirements` | Interview-driven requirements document. |
| `/aaid-brd` | Formal Business Requirements Document — objectives, scope, stakeholders, risks. |
| `/aaid-prd` | Product Requirements Document — personas, user journeys, functional specs, open questions. |
| `/aaid-backlog` | Full prioritised backlog with epics, stories, and Fibonacci story point estimates. |
| `/aaid-competitor-analysis` | Market landscape, competitor matrix, positioning opportunities. |
| `/aaid-gtm` | Go-to-market strategy — ICP, pricing, channels, launch phases, risk register. |
| `/aaid-marketing` | Full marketing content pack — positioning, landing page copy, Product Hunt kit, launch email sequence, social posts, SEO briefs, content calendar. |

---

## 🏗 Architecture & Design

| Command | What it produces |
|---|---|
| `/aaid-architecture` | System architecture, Mermaid diagrams, ADRs, API contracts, data model. |
| `/aaid-scaffold` | Apply a design pattern layer (clean-arch, hexagonal, CQRS, event-driven, repository…) on top of your project structure. Generates folders and starter files. |
| `/aaid-pattern-audit` | Audit existing codebase against its target architecture pattern. Scores 6 dimensions, lists every violation, produces a migration roadmap. |

---

## 💻 Development

| Command | What it produces |
|---|---|
| `/aaid-write-story` | Write a single user story card with acceptance criteria. |
| `/aaid-dev-story` | Implement a story end-to-end — source files + test files + implementation record. |
| `/aaid-generate-tests` | Generate a complete, runnable test suite for a source file or component. |

---

## 🔒 Quality & Security

| Command | What it produces |
|---|---|
| `/aaid-review [target]` | Adversarial review — dispatches on the target: a planning artifact (`prd`, `architecture`, `backlog`…) gets a severity-tagged review written to its `review.md`; a file/dir/STORY-ID gets a code review. Asks what to review if no target is given. |
| `/aaid-review-code` | PR-style code review — inline findings, quality scores, final verdict (APPROVED / CHANGES_REQUESTED). |
| `/aaid-threat-model` | OWASP Top 10 + STRIDE threat model, secret detection, auth review, remediation priority list. |

---

## 🚀 DevOps & Infrastructure

| Command | What it produces |
|---|---|
| `/aaid-devops` | CI/CD pipeline (GitHub Actions), Dockerfile, docker-compose, .env.example, branch protection guidance. Real deploy steps for Fly.io, Railway, AWS ECS, Kubernetes, DigitalOcean, Render, or bare VPS. |
| `/aaid-k8s` | Full Kubernetes manifest set — Namespace, Deployment, Service, Ingress, HPA, PDB, NetworkPolicy, ConfigMap, Secret template, kustomization.yaml. |

---

## 📊 Sprint & Tracking

Use these daily to manage your sprint board, epics, and story lifecycle.

| Command | What it does |
|---|---|
| `/aaid-sprint-board` | Render the current sprint Kanban board — stories by column, blockers highlighted, sprint health summary. Offer to update story statuses inline. |
| `/aaid-standup` | Daily standup report — what completed yesterday, what's in progress today, what's blocked. Offer to record status updates conversationally. |
| `/aaid-epic-status` | Epic progress dashboard — per-epic progress bars, story breakdown by status, risk flags, recommended focus. |
| `/aaid-story-update` | Conversational story lifecycle transitions — "I finished STORY-003", "STORY-005 is blocked on X". Reads current state and applies changes. |
| `/aaid-backlog-groom` | AI-assisted backlog grooming session — re-scores estimates, splits large stories, identifies gaps, re-prioritizes. Updates backlog.md. |

---

## 🔧 Daily Workflow

| Command | What it does |
|---|---|
| `/aaid-debug` | Structured root cause analysis for any error or unexpected behaviour. |
| `/aaid-explain-code` | Step-by-step walkthrough of any code — WHY it works, hidden invariants, gotchas. Chat response only. |
| `/aaid-remember` | Record a decision, gotcha, pattern, or domain fact to `.aaid/memory.md` — persists across sessions and auto-loads into future ones. |

---

## 📄 Docs & Publishing

| Command | What it produces |
|---|---|
| `/aaid-generate-docs` | README, API reference, CHANGELOG, CONTRIBUTING guide, component deep-dives. |
| `/aaid-publish` | Convert any artifact markdown to a formatted HTML document ready to share. |

---

## Recommended Flows

**New project:**
```
/aaid-requirements → /aaid-architecture → /aaid-scaffold → /aaid-backlog → /aaid-dev-story (per story)
Daily: /aaid-standup → /aaid-story-update → /aaid-sprint-board
```

**Existing / legacy project:**
```
/aaid-migrate → /aaid-pattern-audit → /aaid-scaffold → /aaid-dev-story (new features)
```

**Launch preparation:**
```
/aaid-gtm → /aaid-marketing → /aaid-devops → /aaid-generate-docs
```

**Architecture health check:**
```
/aaid-pattern-audit → /aaid-review-code → /aaid-threat-model
```

**Not sure where to start?** Use `/aaid-chat` to think it through with a specialist first.

---

## CLI Commands (terminal)

Install: `npm install -g aaidlc` — then use `aaid`. Or `npx aaidlc` without installing.

**Project setup**
```bash
aaid init                                         # Full init wizard (single-app or workspace)
aaid init --hook-only                             # Install pre-commit hook only
aaid init --add-service                           # Add an app to an existing workspace
aaid status                                       # Project health dashboard
aaid migrate                                      # Brownfield onboarding (CLI)
```

**Agents**
```bash
aaid run pm                                       # PM agent
aaid run architect                                # Architect agent
aaid run dev --story STORY-001                    # Dev agent
aaid run qa | security | reviewer | docs | devops
```

**Quality gates**
```bash
aaid gate run all                                 # Run all 4 gates
aaid gate run code-standards --staged             # Staged-only (pre-commit)
aaid gate run code-standards --app frontend       # Workspace: scope to one app
aaid gate skip design-review -r "spike" -e 2026-08-01
aaid gate list-bypasses
```

**Sprint & tracking**
```bash
aaid sprint plan                                  # Create + activate sprint from backlog
aaid sprint status                                # Kanban board
aaid sprint progress                              # Progress % by epic and sprint
aaid sprint velocity                              # Velocity history across all sprints
aaid sprint complete                              # Close sprint, record velocity
aaid sprint defer STORY-001 "reason"
aaid story add                                    # Add a single story to backlog
aaid story start STORY-001
aaid story review STORY-001
aaid story done STORY-001
aaid story block STORY-001 "blocked on X"
aaid epic list                                    # List all epics with progress
aaid epic add                                     # Create a new epic
aaid epic update EPIC-001 in-progress
```

> **Tip:** Type `/aaid-` in Claude Code chat to see all commands as autocomplete suggestions.