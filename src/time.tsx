import { Action, ActionPanel, Form, Icon, List, PopToRootType, showHUD, showToast, Toast } from "@raycast/api";
import { showFailureToast, useCachedPromise, useForm } from "@raycast/utils";
import { useState } from "react";
import { jiraUrl, localDate, logTime, recentTickets, searchJira, Ticket, trackedSeconds } from "./api";
import { formatDuration, parseDuration } from "./duration";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const recent = useCachedPromise(recentTickets);
  const jira = useCachedPromise(searchJira, [searchText], { keepPreviousData: true });

  const sections: [string, Ticket[]][] = [];
  if (!searchText.trim()) {
    const recentKeys = new Set(recent.data?.map((t) => t.taskId));
    sections.push(["Recent", recent.data ?? []]);
    sections.push(["Assigned to Me", (jira.data ?? []).filter((t) => !recentKeys.has(t.taskId))]);
  } else {
    const results = jira.data ?? [];
    sections.push(["Assigned to Me", results.filter((t) => t.mine && !t.done)]);
    sections.push(["Other", results.filter((t) => !(t.mine && !t.done))]);
  }

  return (
    <List
      isLoading={recent.isLoading || jira.isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search Jira tickets by text or key"
      throttle
    >
      {sections.map(([title, tickets]) => (
        <List.Section key={title} title={title}>
          {tickets.map((ticket) => (
            <TicketItem key={ticket.taskId} ticket={ticket} />
          ))}
        </List.Section>
      ))}
    </List>
  );
}

function TicketItem({ ticket }: { ticket: Ticket }) {
  return (
    <List.Item
      title={ticket.key || ticket.summary}
      subtitle={ticket.key ? ticket.summary : undefined}
      icon={ticket.done ? Icon.CheckCircle : Icon.Circle}
      accessories={[{ tag: ticket.status }]}
      actions={
        <ActionPanel>
          <Action.Push title="Log Time" icon={Icon.Clock} target={<LogTimeForm ticket={ticket} />} />
          {ticket.key && <Action.OpenInBrowser title="Open in Jira" url={jiraUrl(ticket.key)} />}
          {ticket.key && <Action.CopyToClipboard title="Copy Key" content={ticket.key} />}
        </ActionPanel>
      }
    />
  );
}

type FormValues = { duration: string; comment: string; date: Date | null };

function LogTimeForm({ ticket }: { ticket: Ticket }) {
  const { handleSubmit, itemProps, values } = useForm<FormValues>({
    initialValues: { date: new Date() },
    validation: {
      duration: (value) => (parseDuration(value ?? "") ? undefined : "Try 15m, 1.5h, 1h 20m, 1:20, or minutes"),
    },
    async onSubmit({ duration, comment, date }) {
      const seconds = parseDuration(duration)!;
      await showToast({ style: Toast.Style.Animated, title: "Logging time…" });
      try {
        await logTime(ticket.taskId, seconds, date ?? new Date(), comment.trim());
        await showHUD(`Logged ${formatDuration(seconds)} to ${ticket.key || ticket.summary}`, {
          clearRootSearch: true,
          popToRootType: PopToRootType.Immediate,
        });
      } catch (error) {
        await showFailureToast(error, { title: "Couldn't log time" });
      }
    },
  });

  const day = values.date ?? new Date();
  const tracked = useCachedPromise(trackedSeconds, [localDate(day)]);
  const when =
    localDate(day) === localDate(new Date())
      ? "today"
      : `on ${day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}`;
  const trackedText =
    tracked.data === undefined
      ? "Loading…"
      : tracked.data === 0
        ? `You haven't tracked any time ${when}.`
        : `You have tracked ${formatDuration(tracked.data)} ${when === "today" ? "already today" : when}.`;

  return (
    <Form
      isLoading={tracked.isLoading}
      navigationTitle={`Log Time: ${ticket.key}`}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Log Time" icon={Icon.Clock} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description title={ticket.key} text={ticket.summary} />
      <Form.TextField title="Time" placeholder="1h 20m" autoFocus {...itemProps.duration} />
      <Form.TextField title="Description" placeholder="What did you work on?" {...itemProps.comment} />
      <Form.DatePicker title="Date" type={Form.DatePicker.Type.Date} {...itemProps.date} />
      <Form.Description title="Tracked" text={trackedText} />
    </Form>
  );
}
