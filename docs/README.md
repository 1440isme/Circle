# CIRCLE Documentation

Welcome to the CIRCLE documentation. CIRCLE is a social platform for group connectivity and interaction built with a **NestJS Modular Monolith** backend, **Next.js** web application with integrated **Admin Dashboard**, **React Native + Expo** mobile application, and **Socket.IO + WebRTC** realtime communications.

This page is the index for everything in `docs/`. Start with **Getting Started** if you're new, or jump to **Architecture** for how the system is built.

---

## 🚀 Getting Started

New to the project? **Start with the [Getting Started path](./getting-started/README.md)** — a guided onboarding from zero to productive.

- [**Getting Started (start here)**](./getting-started/README.md) — the onboarding hub
  - [Concepts & Glossary](./getting-started/concepts.md) ·
    [Local Development](./getting-started/local-development.md) ·
    [Codebase Tour](./getting-started/codebase-tour.md) ·
    [Contributing](./getting-started/contributing.md) ·
    [Development Guide](./getting-started/development-guide.md)
- [Project README](../README.md) — top-level overview
- [Backend Dev Setup](../apps/backend/README.md) — run the backend on its own
- [Web Dev Setup](../apps/web/README.md) — run the web and admin application
- [Mobile Dev Setup](../apps/mobile/README.md) — run the mobile application

---

## 🏛️ Architecture

Comprehensive, code-verified deep-dive into how CIRCLE is built. Start with the overview, then drill into a subsystem.

- [**Architecture Overview**](./architecture/README.md) — system context, tech stack, repo layout
- [Canonical Hiến Pháp](../PROJECT_GOD.md) — Single Source of Truth for product scope, SDLC, DoD, and Rubric Level 5 criteria
- [Backend Architecture](./architecture/backend.md) — NestJS Modular Monolith request pipeline, modules, Prisma ORM
- [Frontend Architecture](./architecture/frontend.md) — Next.js App Router, server/client components, integrated admin
- [Mobile Architecture](./architecture/mobile.md) — React Native Expo, file-based routing, native WebRTC
- [Auth & Security](./architecture/auth-security.md) — Dual-token JWT, refresh token rotation, RBAC, threat defenses
- [Data Model](./architecture/data-model.md) — PostgreSQL relational schema and Prisma entities
- [Realtime Signals](./architecture/realtime-signals.md) — Socket.IO pub/sub, Redis adapter, presence, WebRTC signaling
- [Request Lifecycle](./architecture/request-lifecycle.md) — End-to-end request traces and execution flows
- [Architectural Decision Records (ADR)](./architecture/ADR/README.md) — Record of major technical decisions
- [Architecture Diagrams](./architecture/diagrams/README.md) — Mermaid ERDs and sequence flows

---

## 🧭 Design Principles

The philosophy and conventions behind the code.

- [Platform Concepts](./principles/concept.md) — how the architectural pillars fit together
- [Design Principles](./principles/principle.md) — the rules all backend, web, and mobile code follows
- [Core vs. Domain Modules](./principles/core-vs-modules.md) — what belongs in core, what belongs in domain modules
- [Layout & Component Concepts](./principles/layout.md) — visual layout conventions across web and mobile
- [Styling Architecture](./principles/style.md) — design tokens, theming, and responsive styling
- [Project Structure](./principles/project-structure.md) — where things live in the codebase

---

## 📖 Guides

How-to material for building and deploying the platform.

- [**Development Workflow & SOP**](./guides/development-workflow.md) — end-to-end task lifecycle, commit conventions, peer review, and GitHub Project automation
- [**Deployment Guide**](./guides/deployment/README.md) — production deployment (Docker Compose, Traefik, VPS)
- [WebRTC Setup Guide](./guides/webrtc-setup.md) — STUN/TURN configuration and media debugging

---

## 📚 Reference

Configuration and technical reference.

- [Authentication & Cookie Handling](./reference/authentication-cookie-handling.md)
- [CORS Configuration](./reference/cors.md)
- [CSP Configuration](./reference/csp.md)
- [Feature Breakdown](./reference/feature-breakdown.md)

### Capability Catalog
- [**Capability Catalog**](./capabilities/README.md) — code-grounded catalog of all platform capabilities (clustered, with actor / description / acceptance / QC / security / data-processing per capability)
  - [Identity & Access](./capabilities/identity-access.md) ·
    [Circles & Membership](./capabilities/circles-membership.md) ·
    [Chat & Messaging](./capabilities/chat-messaging.md) ·
    [Realtime & Calls](./capabilities/realtime-calls.md) ·
    [Feed & Posts](./capabilities/feed-posts.md) ·
    [Media & Storage](./capabilities/media-storage.md) ·
    [Moderation & Admin](./capabilities/moderation-admin.md)

---

## 🧩 Examples

Worked examples referenced by the design docs.

- [Component: CircleCard](./examples/componentCircleCard.md) ·
  [Hook: useChatSocket](./examples/hookChatSocket.md) ·
  [Page: Feed](./examples/pageFeed.md)

---

## 🤖 Agentic Framework

Repo-resident AI coding framework modeled after Bosch AutoWRX.

- [Agentic Framework Overview](../agentic/README.md)
- [Framework Proposal & Design](./agentic-framework/PROPOSAL.md)
- [Rules (Must / Must-Not)](../agentic/RULES.md)
- [Conventions & Traceability Keys](../agentic/CONVENTIONS.md)
- [Skills Catalog](../agentic/skills/README.md)
- [Living Sitemaps & Testing](../.agents/SITEMAP.md)

---

## 📊 Academic Evidence & TLCN Governance (Rubric Level 5)

Required folders and documentation serving the graduation thesis and Rubric Level 5 evaluation.

- [**Automated AI Usage Log**](./ai-usage/log.md) — Continuous logging of AI assistance (TC2.3)
- [Weekly Progress Reports](./evidence/weekly-reports/README.md) — W01–W19 progress reports (G2, TC1)
- [Rubric Audit Records](./evidence/rubric-audits/README.md) — Self-evaluations against 12 rubric criteria
- [User Experiment Protocols](./experiments/README.md) — Real-user testing datasets and evaluation protocols (G7, TC5)
- [Graduation Thesis Manuscript](./thesis/README.md) — Thesis report draft, presentation slides, academic evidence
- [Software Requirements (SRS)](./requirements/README.md) — Formal specifications and user story catalog
- [Quality Assurance & Testing](./testing/README.md) — Multi-tier test matrices and coverage reports
- [Security Audits](./security/README.md) — Threat modeling and vulnerability assessments

---

## Backend-Specific Docs

The backend keeps its own focused docs under [`apps/backend/docs/`](../apps/backend/docs):
[authentication](../apps/backend/docs/authentication.md) ·
[db models](../apps/backend/docs/db-models.md) ·
[middlewares](../apps/backend/docs/middlewares.md) ·
[realtime gateway](../apps/backend/docs/realtime-gateway.md).
