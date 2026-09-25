import { getPreferenceValues } from "@raycast/api";

export type Ticket = {
  taskId: string; // Everhour task ID, e.g. jr:8558-169381
  key: string;
  summary: string;
  status: string;
  done: boolean;
  mine: boolean;
};

const prefs = getPreferenceValues<Preferences>();
const jiraPrefix = prefs.everhourJiraPrefix || "jr:8558";
const ISSUE_KEY = /^[a-z][a-z0-9]*-\d+$/i;

export const jiraUrl = (key: string) => `https://${prefs.jiraSite}/browse/${key}`;

async function request<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text();
    let message = body;
    try {
      const json = JSON.parse(body);
      message = json.message ?? json.errorMessages?.join(" ") ?? body;
    } catch {
      // Not JSON; use the raw body.
    }
    throw new Error(`${res.status} ${message}`.trim());
  }
  return res.json() as Promise<T>;
}

// --- Jira ---

type JiraIssue = {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: { name: string; statusCategory: { key: string } };
    assignee: { accountId: string } | null;
  };
};

const jira = <T>(path: string) =>
  request<T>(`https://${prefs.jiraSite}${path}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${prefs.jiraEmail}:${prefs.jiraToken}`).toString("base64")}`,
      Accept: "application/json",
    },
  });

let myAccountId: Promise<string> | undefined;
const getMyAccountId = () =>
  (myAccountId ??= jira<{ accountId: string }>("/rest/api/3/myself").then((me) => me.accountId));

/**
 * Empty query: my open tickets. Issue key: that ticket. Otherwise: summary search.
 * (`text ~` also matches descriptions and comments, which buries the ticket you meant.)
 */
export async function searchJira(query: string): Promise<Ticket[]> {
  const q = query.trim();
  const jql = !q
    ? "assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC"
    : ISSUE_KEY.test(q)
      ? `key = "${q.toUpperCase()}"`
      : `summary ~ "${q.replace(/["\\]/g, "\\$&")}*" ORDER BY updated DESC`;
  const params = new URLSearchParams({ jql, fields: "summary,status,assignee", maxResults: "50" });

  const [{ issues }, me] = await Promise.all([
    jira<{ issues: JiraIssue[] }>(`/rest/api/3/search/jql?${params}`),
    getMyAccountId(),
  ]);
  return issues.map((issue) => ({
    taskId: `${jiraPrefix}-${issue.id}`,
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status.name,
    done: issue.fields.status.statusCategory.key === "done",
    mine: issue.fields.assignee?.accountId === me,
  }));
}

// --- Everhour ---

type TimeRecord = {
  user: number;
  time: number;
  date: string;
  createdAt: string;
  task?: {
    id: string;
    number?: string;
    name: string;
    status?: string;
    completed?: boolean;
    assignees?: { userId?: number }[];
  };
};

const everhour = <T>(path: string, init: RequestInit = {}) =>
  request<T>(`https://api.everhour.com${path}`, {
    ...init,
    headers: { "X-Api-Key": prefs.everhourToken, "Content-Type": "application/json" },
  });

/** Local-time YYYY-MM-DD; toISOString() would give tomorrow's date on a late evening. */
export function localDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Tasks I've logged time to in the last two weeks, most recent first. */
export async function recentTickets(): Promise<Ticket[]> {
  const from = new Date();
  from.setDate(from.getDate() - 14);
  const records = await everhour<TimeRecord[]>(`/users/me/time?from=${localDate(from)}&limit=500`);

  records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const seen = new Map<string, Ticket>();
  for (const { task, user } of records) {
    if (!task || seen.has(task.id)) continue;
    seen.set(task.id, {
      taskId: task.id,
      key: task.number ?? "",
      summary: task.name,
      status: task.status ?? "",
      done: task.completed ?? false,
      mine: task.assignees?.some((a) => a.userId === user) ?? false,
    });
  }
  return [...seen.values()].slice(0, 15);
}

/** Total seconds I've tracked on a YYYY-MM-DD date. */
export async function trackedSeconds(date: string): Promise<number> {
  const records = await everhour<TimeRecord[]>(`/users/me/time?from=${date}&to=${date}`);
  return records.reduce((sum, record) => sum + record.time, 0);
}

/** Adds time. Everhour merges this into an existing entry for the same task and date, joining comments. */
export function logTime(taskId: string, seconds: number, date: Date, comment: string) {
  return everhour("/time", {
    method: "POST",
    body: JSON.stringify({ task: taskId, time: seconds, date: localDate(date), comment }),
  });
}
