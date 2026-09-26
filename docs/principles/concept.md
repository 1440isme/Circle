# Platform Architectural Concepts

Core conceptual pillars underpinning the CIRCLE platform.

---

## 1. Circle-Centric (Group-First)
The Circle is the core atom of data, state, and interaction. Every feature in the platform exists solely to empower group activities and collaboration. Rather than designing for isolated individual broadcasting, CIRCLE ensures that messages, files, calls, moments, calendars, and polls always resolve within an explicit group context.

## 2. Spaces over Streams
Traditional social networks force users into algorithmic streams. CIRCLE organizes communication around explicit **Spaces (Circles)** and scoped **Channels**, giving users control over their digital community boundaries.

## 3. Multi-Modal Interaction
Every circle space natively supports text discussion, persistent async posts, and synchronous low-latency voice/video rooms without switching external tools.

## 4. Modular Monolith Architecture
Backend functionality is co-located in a single deployable repository but logically isolated by domain modules to ensure high developer velocity without the latency and operational complexity of distributed microservices.
