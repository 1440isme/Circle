# Tree Map

Compact overview of CIRCLE repository directories with one-line descriptions.

```text
circle/
├── AGENTS.md                          # Vendor-neutral entry point for AI agents and human engineers
├── CLAUDE.md                          # Thin adapter for Claude Code (@path imports)
├── PROJECT_GOD.md                     # Hiến pháp Single Source of Truth của toàn bộ dự án
├── README.md                          # Project overview, tech stack, and setup summary
├── CONTRIBUTING.md                    # GitFlow, PR peer-review rules, code quality standards
├── SECURITY.md                        # Security policy, reporting protocol, and secret hygiene
├── .env.example                       # Canonical environment variable template
│
├── agentic/                           # Repo-resident Agentic Coding Framework (Bosch AutoWRX standard)
│   ├── README.md                      # Framework design, token efficiency, usage contract
│   ├── RULES.md                       # 10 Hard Gates, SoT hierarchy, AI logging, Definition of Done
│   ├── CONVENTIONS.md                 # Coding standards, naming, commit format, PR review rules
│   ├── SETUP.md                       # Assistant setup guides (Antigravity, Claude, Cursor, etc.)
│   ├── map/                           # Navigation pointers and compact trees
│   │   ├── INDEX.md                   # Navigational pointers table
│   │   └── TREE.md                    # This file
│   ├── memory/                        # Repo-resident durable facts & knowledge base
│   │   ├── MEMORY.md                  # Index of durable knowledge
│   │   ├── architecture.md            # Structural decisions and modular monolith boundaries
│   │   ├── gotchas.md                 # Traps, known pitfalls, and framework quirks
│   │   ├── verified-facts.md          # Facts confirmed by code examination
│   │   └── decisions.md               # Summary of key architectural decisions (ADRs)
│   ├── learning/                      # Continuous learning across development sprints
│   │   ├── README.md                  # Continuous learning process guide
│   │   ├── best-practices.md          # Proven engineering patterns in this codebase
│   │   ├── trends.md                  # Evolving codebase patterns and refactoring trends
│   │   └── lessons.md                 # Post-mortems, bug analyses, and lessons learned
│   └── skills/                        # Load-on-demand procedural playbooks
│       ├── README.md                  # Skills catalog and selection guide
│       └── *.md                       # Individual task execution playbooks
│
├── .agents/                           # Living maps and end-to-end testing specifications
│   ├── SITEMAP.md                     # Web pages & Mobile screens feature and test status
│   └── TESTING.md                     # Multi-tier testing strategy and execution guide
│
├── apps/                              # Core applications (Monorepo)
│   ├── backend/                       # NestJS Modular Monolith API, Prisma ORM, Socket.IO gateway
│   │   └── docs/                      # Backend-specific architecture & deep-dives
│   ├── api/                           # Alias trỏ về apps/backend (chuẩn PROJECT_GOD.md)
│   ├── web/                           # Next.js Web Application & integrated Admin Dashboard (/admin)
│   └── mobile/                        # React Native + Expo mobile application (iOS & Android)
│
├── packages/                          # Shared libraries and packages
│   ├── types/                         # Shared TypeScript types, DTOs, socket event contracts
│   ├── shared/                        # Shared utility functions, formatters, and validators
│   └── config/                        # Shared ESLint, Prettier, TypeScript, and Tailwind configs
│
├── docs/                              # Comprehensive project documentation and thesis evidence
│   ├── README.md                      # Master documentation index
│   ├── capabilities/                  # Living code-grounded capability catalog by cluster
│   ├── getting-started/               # Developer onboarding and local development guides
│   ├── principles/                    # Engineering design principles and system philosophy
│   ├── ai-usage/                      # Automated AI Usage Log (AI-XXXX)
│   ├── architecture/                  # Architecture specifications, diagrams, and ADRs
│   ├── requirements/                  # SRS, user stories, business rules
│   ├── testing/                       # Test plans, coverage reports, test matrix
│   ├── security/                      # Threat models, security audits, auth mechanisms
│   ├── deployment/                    # VPS, Docker, Traefik, Cloudflare deployment docs
│   ├── operations/                    # Runbooks, monitoring, backup procedures
│   ├── experiments/                   # User experiment protocols and evaluation datasets
│   ├── evidence/                      # Weekly reports and Rubric Level 5 audit records
│   └── thesis/                        # Academic thesis manuscript and presentation slides
│
├── tests/                             # Root testing directories
│   ├── unit/                          # Isolated unit test suites
│   ├── integration/                   # Cross-module integration tests
│   ├── api/                           # HTTP and WebSocket API contracts tests
│   ├── e2e/                           # End-to-end automated flows (Playwright)
│   └── performance/                   # k6 / Artillery load testing scripts
│
└── scripts/                           # Engineering automation and integrity check scripts
    └── check-agent-map.sh             # Link integrity check preventing agent map drift
```
