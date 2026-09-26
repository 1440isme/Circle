# Architecture & Design Diagrams

Visual models for CIRCLE software architecture, data design, interaction flows, and deployment topology.

---

## 1. Static Architecture & Data Design

- [`class-diagram.md`](./class-diagram.md) — Domain Class Model Specification ([`classdiagram.puml`](./classdiagram.puml))
- [`erd.md`](./erd.md) — Entity Relationship Diagram (PostgreSQL 16 & Prisma)
- [`c4-model.md`](./c4-model.md) — C4 Architecture Model (Context, Container, Component Diagrams)

---

## 2. Dynamic Interaction Flows

- `chat-sequence.md` — Socket.IO Realtime Chat Message Flow
- `webrtc-signaling.md` — WebRTC Audio/Video Call Signaling Sequence
- `deployment-topology.md` — VPS, Docker, Traefik, Cloudflare Topology

---

## 3. Related Requirements Diagrams

- **Use Case Diagram (Draw.io / XML):** Đã được chuyển về thư mục Phân tích yêu cầu tại [`docs/requirements/diagrams/usecase.xml`](../../requirements/diagrams/usecase.xml).  
  Xem tài liệu đặc tả 26 Use Case chi tiết tại [`docs/requirements/use-cases.md`](../../requirements/use-cases.md).
