# Skill: Secrets Incident

Emergency procedure for accidental credential, API key, or token leaks.

---

## When to Use
- Whenever a password, JWT secret, database connection string, or Cloudflare key is accidentally committed.

---

## Steps

1. **Immediate Revocation:**
   - Immediately rotate or revoke the compromised key on the third-party provider (Neon, Upstash, Cloudflare).
2. **Remove Secret from Git History:**
   - If unpushed: reset or amend the commit (`git reset HEAD~1` or `git commit --amend`).
   - If pushed to remote: use `git-filter-repo` or BFG Repo-Cleaner to rewrite history cleanly.
3. **Verify Git History:**
   - Search the entire git log for the leaked string:
     ```bash
     git log -S "<compromised_string>"
     ```
4. **Post-Mortem Record:**
   - Record the incident, root cause, and remediation under [`agentic/learning/lessons.md`](../learning/lessons.md) and notify both developers.
