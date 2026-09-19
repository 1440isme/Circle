# Media & Storage Capabilities

Capabilities governing object storage on Cloudflare R2, image transformations, and presigned upload URLs.

---

## Capabilities in this Cluster

| ID | Title | Actor | Status |
|---|---|---|---|
| `CAP-MEDIA-01` | Presigned Upload URL Generation | Authenticated User | Planned |
| `CAP-MEDIA-02` | Media Delivery via CDN | Public / Authenticated | Planned |

---

## CAP-MEDIA-01 — Presigned Upload URL Generation

| Actor | Where | Personal Data | E2E Coverage |
|---|---|---|---|
| Authenticated User | Web / Mobile file upload triggers | ❌ No | 🚧 WIP |

### Description
As an authenticated user, I can request a presigned upload URL so that my client can upload images or audio files directly to Cloudflare R2 without routing heavy binaries through the API server.

### Acceptance Criteria
- Request specifies file type, file size, and upload category (`AVATAR`, `POST_MEDIA`, `CHAT_ATTACHMENT`).
- Server validates allowed MIME types (`image/jpeg`, `image/png`, `image/webp`, `audio/mpeg`) and max size (10MB for images).
- Returns presigned PUT URL expiring in 5 minutes.

### API Contract
- `POST /api/v1/media/upload-url` (Bearer Auth) → `200 OK` `{ uploadUrl, fileKey, publicUrl }`
