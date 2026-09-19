# Skill: AI Log Entry

Automated protocol for AI agents to log usage records into `docs/ai-usage/log.md`.

---

## When to Use
- **Mandatory:** Whenever an AI agent writes code, creates architecture plans, conducts refactoring, writes tests, or generates documentation.
- **Rule:** The human engineer does NOT write this log by hand. The AI agent appends the record automatically.

---

## Steps

1. Open [`docs/ai-usage/log.md`](../../docs/ai-usage/log.md).
2. Determine the next identifier: `AI-<NUM>` (e.g. `AI-0002`, `AI-0003`).
3. Append a new record adhering strictly to this format:

```markdown
## AI-XXXX: [Tóm tắt mục đích sử dụng AI]

- **Date:** YYYY-MM-DD HH:mm:ss
- **Developer:** [Trương Công Bình / Ninh Thị Mỹ Hạnh]
- **Tool:** [Antigravity IDE / Claude Code / Cursor / Copilot]
- **Model:** [Gemini 3.8 Flash / Claude 3.7 Sonnet / GPT-4o / ...]
- **Related Issue:** #... (e.g. #42)
- **Purpose:** [Mục tiêu cụ thể của prompt: giải thuật, boilerplate, viết test, debug...]
- **Prompt Summary:** [Tóm tắt nội dung prompt yêu cầu — Tuyệt đối không chứa secret/credential]
- **Files Affected:**
  - `path/to/file1.ts`
  - `path/to/file2.test.ts`
- **AI-Generated Portion:** [Ước tính tỷ lệ % hoặc phạm vi hàm do AI sinh ra]
- **Human Modifications:** [Những điểm kỹ sư con người đã can thiệp, chỉnh sửa logic...]
- **Verification Method:** [Chạy unit test, typecheck, review thủ công, verify với docs thư viện]
- **Official Source Checked:** [Link tài liệu chính thức được dùng để đối chứng]
- **Security & License Check:** [Xác nhận không dính GPL vi phạm bản quyền, không leak credentials]
- **AI Errors / Hallucinations Found:**
  - **Error Description:** [Mô tả chi tiết lỗi AI đã tạo ra nếu có, hoặc `None`]
  - **Root Cause:** [Nguyên nhân gốc rễ]
  - **Resolution / Fix:** [Cách khắc phục cụ thể]
- **Commit:** [Hash commit tương ứng hoặc Pending]
- **PR:** [Link Pull Request tương ứng hoặc Pending]

---
```

4. Verify that the entry contains **zero secrets, credentials, or personal tokens**.
