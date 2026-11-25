export function formatPollDeadlineInput(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const pad = (number: number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parsePollDeadlineInput(value: string): Date | null {
  const input = value.trim().replace(' ', 'T');
  if (!input) return null;
  const date = new Date(input);
  if (!Number.isFinite(date.getTime()) || formatPollDeadlineInput(date.toISOString()) !== input) {
    return null;
  }
  return date;
}

export function hasPollEnded(poll: { isClosed: boolean; deadline?: string | null }, now = Date.now()): boolean {
  return poll.isClosed || (poll.deadline != null && Date.parse(poll.deadline) <= now);
}

export function nextPollDeadlineDelay(
  polls: readonly { isClosed: boolean; deadline?: string | null }[],
  now: number,
): number | null {
  let next = Infinity;
  for (const poll of polls) {
    const deadline = poll.deadline ? Date.parse(poll.deadline) : NaN;
    if (!poll.isClosed && deadline > now) next = Math.min(next, deadline);
  }
  return Number.isFinite(next) ? Math.max(0, Math.min(next - Date.now(), 2_147_483_647)) : null;
}
