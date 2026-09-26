# Software Requirements Specifications (SRS)

Formal software requirements, user stories, use case models, and business rules for CIRCLE.

---

## 1. Use Case Model & Specifications

- [**Tài liệu Đặc tả 26 Use Case chi tiết (Use Case Specifications)**](./use-cases.md) — Chi tiết 26 use case (UC01 đến UC26) gồm mô tả, tác nhân, tiền/hậu điều kiện, luồng chính và luồng thay thế.
- [**Sơ đồ Use Case tổng quát (draw.io / XML)**](./diagrams/usecase.xml) — Mô hình trực quan các tác nhân và chức năng hệ thống theo chuẩn mxGraphModel.

---

## 2. Epics & Capability Alignment

The 26 Use Cases map directly to the platform capability epics:

| Epic Key | Domain Area | Related Use Cases |
|---|---|---|
| `EPIC-AUTH` | Authentication & Identity | UC01 (Register), UC02 (Sign In), UC03 (Recover Password), UC04 (Manage Profile), UC05 (Change Password & Notifications), UC06 (Manage Friends) |
| `EPIC-CIRCLE` | Circles & Governance | UC07 (Create Circle), UC08 (Join Circle), UC20 (Circle Nickname), UC22 (Leave Circle), UC23 (Update Metadata), UC24 (Manage Members), UC25 (Transfer Ownership), UC26 (Dissolve Circle) |
| `EPIC-CHAT` | Real-time Messaging & Media | UC09 (Publish Moment), UC10 (React Moments), UC11 (Multimedia Messaging), UC13 (Pin Message), UC14 (Shared Album) |
| `EPIC-RTC` | Real-time Communication & Collaboration | UC12 (Group Call), UC15 (Group Poll), UC16 (Spin Wheel), UC17 (Calendar & Reminders), UC18 (Planning Sheet), UC19 (Live Location), UC21 (Submit Anonymous Post) |
| `EPIC-ADMIN` | Moderation & Administration | Administrative controls, moderation, and system audit logs |
