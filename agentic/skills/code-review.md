# Skill: Code Review

Self-review protocol before requesting peer review or opening a PR.

---

## When to Use
- When implementation is complete and before committing or asking the peer engineer (Bình ↔ Hạnh) to review.

---

## Self-Review Checklist

- [ ] **Acceptance Criteria:** Are all `AC-xxx` requirements met?
- [ ] **Edge Cases:** Are negative inputs, null values, expired tokens, and network drops handled gracefully?
- [ ] **No Dead Code:** Are temporary debugging `console.log`, commented-out blocks, or unused imports removed?
- [ ] **Type Safety:** 0 TypeScript `any` types; strictly typed inputs and return values.
- [ ] **Error Handling:** No empty `try {} catch {}` blocks; errors logged with context.
- [ ] **Security:** No hardcoded tokens, passwords, or API keys. Auth guards applied to protected routes.
- [ ] **Definition of Done:** Meets all DoD criteria defined in [`agentic/RULES.md`](../RULES.md).
- [ ] **AI Log:** Has an entry been drafted in [`docs/ai-usage/log.md`](../../docs/ai-usage/log.md)?

---

## Exit Criteria
- Diff is clean, focused, and under 400 lines where practical.
- Peer reviewer can understand the rationale easily.

---

## Automated Peer Review & Auto-Merge Protocol (AI Agent)

Quy trình tự động hóa khi kỹ sư (**Bình ↔ Hạnh**) yêu cầu AI Agent review và xử lý PR:

### 1. Fetch & Verify
- Kiểm tra remote branches và fetch commit mới nhất: `git fetch origin`.
- Đối soát `git diff` giữa nhánh PR và nhánh đích (`develop`).
- Kiểm tra đối chiếu với Acceptance Criteria và Business Rules trong GitHub Issue tương ứng.
- Chạy script kiểm tra tính toàn vẹn liên kết: `./scripts/check-agent-map.sh`.
- Kiểm tra linter / test / build nếu có mã nguồn thay đổi.

### 2. Review & Comment
- Soạn thảo báo cáo Peer Review chi tiết: Đánh giá điểm mạnh, phát hiện sai sót, đề xuất cải tiến cụ thể kèm vị trí dòng.
- Đăng nhận xét review trực tiếp lên GitHub:
  ```bash
  gh pr review <pr-number> --comment -F <review-report-path>
  ```

### 3. Track Feedback & Re-verify
- Khi tác giả commit bổ sung hoặc trả lời phản hồi, Agent tự động fetch mã mới và kiểm tra lại toàn bộ các điểm đã lưu ý.

### 4. Formal Approve
- Khi tác giả đã giải quyết thỏa đáng 100% các góp ý và đạt chuẩn DoD:
  ```bash
  gh pr review <pr-number> --approve -F <approval-message-path>
  ```

### 5. Auto-Merge upon Approval
- Sau khi PR đã được phê duyệt hợp lệ (Approved bởi kỹ sư đối tác thông qua Agent):
  ```bash
  gh pr merge <pr-number> --merge --delete-branch --subject "<commit-title>" --body "<commit-body>"
  ```
- Đồng bộ cập nhật mã nguồn mới nhất về nhánh `develop` cục bộ:
  ```bash
  git checkout develop && git pull origin develop
  ```
