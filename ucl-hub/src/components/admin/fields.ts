/**
 * Field descriptions for the config-driven management screens. A screen lists
 * its fields once and `DynamicForm` renders, validates and converts them, so
 * ten different admin forms share one implementation.
 */

import { EVERYONE, type Audience } from "@/types";
import { fromDateTimeLocalValue, toDateTimeLocalValue } from "@/utils/dates";
import { splitList } from "@/utils/text";

interface BaseField {
  name: string;
  label: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  /** Grid columns the field spans on wide screens (default 2 = full width). */
  span?: 1 | 2;
  /** Empty input is stored as null instead of an empty string. */
  nullable?: boolean;
}

export interface SelectFieldOption {
  value: string;
  label: string;
}

export type SimpleField =
  | (BaseField & { type: "text" | "email" | "password" | "url" | "tel" | "date" | "color"; maxLength?: number })
  | (BaseField & { type: "textarea"; rows?: number; maxLength?: number })
  | (BaseField & { type: "number"; min?: number; max?: number })
  | (BaseField & { type: "datetime" })
  | (BaseField & { type: "select"; options: readonly SelectFieldOption[]; placeholder?: string })
  | (BaseField & { type: "checkbox"; description?: string })
  | (BaseField & { type: "tags" });

export type FieldDef =
  | SimpleField
  | (BaseField & { type: "audience" })
  /** An image stored as two document fields: the URL (this field's name) and its storage path. */
  | (BaseField & { type: "image"; pathName: string; folder: string })
  | (BaseField & { type: "files"; folder: string; max?: number })
  | (BaseField & { type: "list"; itemFields: SimpleField[]; addLabel: string; itemLabel: string; max?: number });

export type FormValues = Record<string, unknown>;

function simpleInitial(field: SimpleField, raw: unknown): unknown {
  switch (field.type) {
    case "number":
      return raw === undefined || raw === null ? "" : String(raw);
    case "datetime":
      return typeof raw === "string" ? toDateTimeLocalValue(raw) : "";
    case "checkbox":
      return raw === undefined ? false : Boolean(raw);
    case "tags":
      return Array.isArray(raw) ? raw.join(", ") : "";
    default:
      return typeof raw === "string" ? raw : "";
  }
}

/** Raw form values for a field set, from an existing record (editing) plus defaults (creating). */
export function initialValues(fields: readonly FieldDef[], item?: Record<string, unknown> | null, defaults: FormValues = {}): FormValues {
  const values: FormValues = {};
  for (const field of fields) {
    const raw = item ? item[field.name] : defaults[field.name];
    switch (field.type) {
      case "audience": {
        const audience = (raw as Audience | undefined) ?? EVERYONE;
        values[field.name] = { faculties: [...audience.faculties], programmes: [...audience.programmes], years: [...audience.years] };
        break;
      }
      case "image": {
        const url = item ? item[field.name] : defaults[field.name];
        const path = item ? item[field.pathName] : defaults[field.pathName];
        values[field.name] = typeof url === "string" && typeof path === "string" ? { url, path } : null;
        break;
      }
      case "files":
        values[field.name] = Array.isArray(raw) ? [...raw] : [];
        break;
      case "list":
        values[field.name] = (Array.isArray(raw) ? raw : []).map((row: Record<string, unknown>) =>
          Object.fromEntries(field.itemFields.map((sub) => [sub.name, simpleInitial(sub, row[sub.name])])),
        );
        break;
      default:
        values[field.name] = simpleInitial(field, raw ?? defaults[field.name]);
    }
  }
  return values;
}

function simplePayload(field: SimpleField, value: unknown): unknown {
  switch (field.type) {
    case "number": {
      const text = String(value ?? "").trim();
      return text === "" ? Number.NaN : Number(text);
    }
    case "datetime": {
      const iso = fromDateTimeLocalValue(String(value ?? ""));
      return iso === "" ? (field.nullable ? null : "") : iso;
    }
    case "checkbox":
      return Boolean(value);
    case "tags":
      return splitList(String(value ?? ""));
    default: {
      const text = String(value ?? "");
      return field.nullable && text.trim() === "" ? null : text;
    }
  }
}

/** Converts raw form values into the object the zod schema validates. */
export function toPayload(fields: readonly FieldDef[], values: FormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const value = values[field.name];
    switch (field.type) {
      case "audience":
      case "files":
        payload[field.name] = value;
        break;
      case "image": {
        const image = value as { url: string; path: string } | null;
        payload[field.name] = image?.url ?? null;
        payload[field.pathName] = image?.path ?? null;
        break;
      }
      case "list":
        payload[field.name] = ((value as Record<string, unknown>[]) ?? []).map((row) =>
          Object.fromEntries(field.itemFields.map((sub) => [sub.name, simplePayload(sub, row[sub.name])])),
        );
        break;
      default:
        payload[field.name] = simplePayload(field, value);
    }
  }
  return payload;
}

/** An empty row for a `list` field. */
export function emptyRow(field: Extract<FieldDef, { type: "list" }>): Record<string, unknown> {
  return Object.fromEntries(field.itemFields.map((sub) => [sub.name, simpleInitial(sub, undefined)]));
}
