import type { SelectFieldOption } from "./fields";
import { humanize } from "@/utils/text";

/** Turns a list of enum values into select options with readable labels. */
export function toOptions(values: readonly string[], labels: Record<string, string> = {}): SelectFieldOption[] {
  return values.map((value) => ({ value, label: labels[value] ?? humanize(value) }));
}
