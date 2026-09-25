/**
 * Everhour IDs Jira items as `jr:<connection id>-<Jira id>` (e.g. jr:8558-10201), so the prefix can be read
 * off any Jira-linked Everhour project.
 */
export function jiraPrefixFrom(everhourIds: string[]): string {
  const prefixes = new Set(everhourIds.flatMap((id) => id.match(/^(jr:\d+)-\d+$/)?.[1] ?? []));
  if (prefixes.size === 0) throw new Error("No Jira-connected projects found in Everhour.");
  // ponytail: one Jira connection per Everhour workspace; map by Jira project ID if someone has several.
  if (prefixes.size > 1) throw new Error(`Multiple Everhour Jira connections found (${[...prefixes].join(", ")}).`);
  return [...prefixes][0];
}
