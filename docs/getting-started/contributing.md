# Getting Started: Contributing

Developer onboarding for contributing code, opening PRs, and participating in peer reviews.

---

## 1. Prerequisites
- Read the project constitution: [`PROJECT_GOD.md`](../../PROJECT_GOD.md).
- Read the operational rules: [`agentic/RULES.md`](../../agentic/RULES.md).
- Read the style conventions: [`agentic/CONVENTIONS.md`](../../agentic/CONVENTIONS.md).

## 2. Core Workflow & Playbook

> 📖 **Xem tài liệu chi tiết đầy đủ (SOP):** [`docs/guides/development-workflow.md`](../guides/development-workflow.md)

1. **Pick Task:** Chọn Issue được phân công trên [GitHub Project #3](https://github.com/users/1440isme/projects/3).
2. **Branch:** Tạo nhánh từ `develop`: `feat/<issue-id>-<slug>`.
3. **Develop & Test:** Code + Unit test + kiểm tra bảo mật (Gate G5, G7).
4. **Pre-commit:** Chạy `bash scripts/check-agent-map.sh` và `bash scripts/verify-ai-log.sh`.
5. **Commit:** Sử dụng Conventional Commits có sign-off: `git commit -s -m "feat(scope): message (#<issue-id>)"`.
6. **Open PR:** Target vào `develop`, điền 8 câu hỏi mẫu PR, ghi rõ `Closes #<issue-id>`.
7. **Mandatory Peer Review:** Bình duyệt PR của Hạnh; Hạnh duyệt PR của Bình. Tuyệt đối không tự merge.
8. **Auto-Done:** Khi merge, issue tự động đóng và thẻ Project tự động chuyển sang `Done`.

