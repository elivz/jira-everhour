# Jira + Everhour

A Raycast command for logging time to Jira tickets in Everhour.

`⌘Space` → `Log Time` → search or pick a ticket → `⌘T` (or `⌘↵`) → enter time and description → `⌘↵`. Press `↵` on a ticket to open it in Jira instead.

- With an empty search: tickets you've logged time to in the last 14 days (from Everhour), then your open assigned tickets (from Jira).
- Type a key (`HAM-2180`) to jump to that ticket, or words to search ticket summaries.
- Time formats: `15m`, `1.5h`, `1h 20m`, `1:20`, or a bare number of minutes (`90`).
- Logging twice to the same ticket on the same day adds to one Everhour entry and joins the comments.

## Setup

```bash
npm install
npm run dev
```

Raycast asks for these settings on first run:

| Setting | Where to get it |
|---|---|
| Jira Site | `happycog.atlassian.net` (default) |
| Jira Email | Your Atlassian login email |
| Jira API Token | id.atlassian.com → Security → API tokens |
| Everhour API Key | Everhour → My Profile → Application Access |

Everhour task IDs for Jira tickets are `jr:<connection id>-<numeric Jira issue id>`, e.g. HAM-2212 is `jr:8558-169381`. The extension reads the connection ID off your Jira-linked Everhour projects on first run and caches it.

## Checks

```bash
npm run check
```

Runs `tsc --noEmit`, `ray lint`, and the duration parser tests.
