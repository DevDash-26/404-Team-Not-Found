"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import type { ZodType } from "zod";
import { Button } from "@/components/ui/Button";
import { Checkbox, SelectInput, TextArea, TextInput } from "@/components/ui/Field";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { InlineError } from "@/components/ui/States";
import { useForm } from "@/hooks/useForm";
import { cn } from "@/utils/cn";
import { AudiencePicker } from "./AudiencePicker";
import { FilesField } from "./FilesField";
import { emptyRow, initialValues, toPayload, type FieldDef, type FormValues, type SimpleField } from "./fields";

function renderSimple(field: SimpleField, value: unknown, error: string | undefined, onChange: (value: unknown) => void): ReactNode {
  const common = { label: field.label, error, hint: field.hint, required: field.required };
  switch (field.type) {
    case "textarea":
      return <TextArea {...common} rows={field.rows ?? 4} maxLength={field.maxLength} placeholder={field.placeholder} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "select":
      return (
        <SelectInput
          {...common}
          options={field.options}
          placeholder={field.placeholder ?? (field.required ? "Choose…" : undefined)}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "checkbox":
      return <Checkbox label={field.label} description={field.description ?? field.hint} checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />;
    case "number":
      return <TextInput {...common} type="number" min={field.min} max={field.max} inputMode="numeric" placeholder={field.placeholder} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "datetime":
      return <TextInput {...common} type="datetime-local" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "date":
      return <TextInput {...common} type="date" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "color":
      return <TextInput {...common} type="color" className="h-10 p-1" value={String(value ?? "#2c4e8c") || "#2c4e8c"} onChange={(e) => onChange(e.target.value)} />;
    case "tags":
      return <TextInput {...common} hint={field.hint ?? "Separate with commas."} placeholder={field.placeholder} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    default:
      return <TextInput {...common} type={field.type === "tel" ? "tel" : field.type} maxLength={field.maxLength} placeholder={field.placeholder} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
  }
}

interface DynamicFormProps<TInput> {
  fields: readonly FieldDef[];
  schema: ZodType<TInput>;
  /** Existing record when editing; null/undefined when creating. */
  item?: Record<string, unknown> | null;
  /** Starting values for a new record. */
  defaults?: FormValues;
  submitLabel: string;
  onSubmit: (input: TInput) => Promise<void>;
  onCancel: () => void;
}

export function DynamicForm<TInput>({ fields, schema, item, defaults, submitLabel, onSubmit, onCancel }: DynamicFormProps<TInput>) {
  const form = useForm<FormValues, TInput>({
    initial: initialValues(fields, item, defaults),
    schema,
    prepare: (values) => toPayload(fields, values),
    onSubmit,
  });

  return (
    <form onSubmit={form.submit} noValidate className="space-y-4">
      <InlineError message={form.formError} />
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const span = field.span === 1 ? "" : "sm:col-span-2";
          const value = form.values[field.name];
          switch (field.type) {
            case "audience":
              return (
                <div key={field.name} className={span || "sm:col-span-2"}>
                  <AudiencePicker label={field.label} value={value as never} onChange={(v) => form.setValue(field.name, v)} />
                </div>
              );
            case "image":
              return (
                <div key={field.name} className="sm:col-span-2">
                  <ImageUpload label={field.label} folder={field.folder} value={value as never} onChange={(v) => form.setValue(field.name, v)} hint={field.hint} />
                </div>
              );
            case "files":
              return (
                <div key={field.name} className="sm:col-span-2">
                  <FilesField label={field.label} folder={field.folder} max={field.max} value={value as never} onChange={(v) => form.setValue(field.name, v)} />
                  {form.errors[field.name] && <p role="alert" className="mt-1 text-xs font-medium text-red-700">{form.errors[field.name]}</p>}
                </div>
              );
            case "list": {
              const rows = (value as Record<string, unknown>[]) ?? [];
              return (
                <fieldset key={field.name} className="space-y-3 sm:col-span-2">
                  <legend className="mb-1 text-sm font-medium text-slate-800">{field.label}</legend>
                  {rows.map((row, index) => (
                    <div key={index} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {field.itemLabel} {index + 1}
                        </p>
                        <Button variant="ghost" size="sm" aria-label={`Remove ${field.itemLabel} ${index + 1}`} onClick={() => form.setValue(field.name, rows.filter((_, i) => i !== index))} icon={<Trash2 className="size-4" aria-hidden="true" />}>
                          Remove
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {field.itemFields.map((sub) => (
                          <div key={sub.name} className={cn(sub.span === 2 && "sm:col-span-2")}>
                            {renderSimple(
                              sub,
                              row[sub.name],
                              form.errors[`${field.name}.${index}.${sub.name}`],
                              (v) => form.setValue(field.name, rows.map((r, i) => (i === index ? { ...r, [sub.name]: v } : r))),
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {form.errors[field.name] && <p role="alert" className="text-xs font-medium text-red-700">{form.errors[field.name]}</p>}
                  {rows.length < (field.max ?? 20) && (
                    <Button variant="secondary" size="sm" icon={<Plus className="size-4" aria-hidden="true" />} onClick={() => form.setValue(field.name, [...rows, emptyRow(field)])}>
                      {field.addLabel}
                    </Button>
                  )}
                </fieldset>
              );
            }
            default:
              return (
                <div key={field.name} className={span}>
                  {renderSimple(field, value, form.errors[field.name], (v) => form.setValue(field.name, v))}
                </div>
              );
          }
        })}
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button variant="secondary" onClick={onCancel} disabled={form.submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={form.submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
