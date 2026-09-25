# Jira + Everhour

A Raycast command for finding Jira tickets and logging time to them in Everhour.

`⌘Space` → `Find Jira Ticket` → search or pick a ticket, then:

| Key | Action |
|---|---|
| `↵` | Open the ticket in Jira |
| `⌘T` or `⌘↵` | Log time: enter time and description, then `⌘↵` |
| `⌘C` | Copy the ticket number |
| `⌘⇧C` | Copy a link to the ticket |

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
| Jira Site | Your Jira Cloud hostname, e.g. `your-company.atlassian.net` |
| Jira Link URL | Optional. Base URL for ticket links if your Jira uses a custom domain, e.g. `https://jira.example.com/jira` |
| Jira Email | Your Atlassian login email |
| Jira API Token | id.atlassian.com → Security → API tokens |
| Everhour API Key | Everhour → My Profile → Application Access |

Everhour task IDs for Jira tickets are `jr:<connection id>-<numeric Jira issue id>`, e.g. HAM-2212 is `jr:8558-169381`. The extension reads the connection ID off your Jira-linked Everhour projects on first run and caches it.

## Checks

```bash
npm run check
```

Runs `tsc --noEmit`, `ray lint`, and the duration parser tests.
