"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";
import type { ZodType } from "zod";
import { validate, type FieldErrors } from "@/lib/validation";
import { toUserMessage } from "@/utils/errors";

interface UseFormOptions<TValues, TData> {
  initial: TValues;
  schema: ZodType<TData>;
  /** Converts raw form values into the shape the schema expects (for example strings to numbers). */
  prepare?: (values: TValues) => unknown;
  onSubmit: (data: TData) => Promise<void>;
}

export interface FormApi<TValues> {
  values: TValues;
  errors: FieldErrors;
  formError: string | null;
  submitting: boolean;
  setValue: <K extends keyof TValues>(name: K, value: TValues[K]) => void;
  setValues: (next: TValues) => void;
  /** For server-side rule violations that should appear next to specific fields. */
  setErrors: (errors: FieldErrors) => void;
  setFormError: (message: string | null) => void;
  /** Props for a text-like control: value, change handler and its validation message. */
  bind: (name: keyof TValues & string) => { value: string; error: string | undefined; onChange: (event: { target: { value: string } }) => void };
  submit: (event?: FormEvent<HTMLFormElement>) => Promise<void>;
  reset: () => void;
}

/**
 * Form state with schema validation. It also blocks double submission (the
 * handler ignores a second submit while the first is running) and moves focus
 * to the first invalid field so keyboard and screen-reader users land on it.
 */
export function useForm<TValues extends Record<string, unknown>, TData>({ initial, schema, prepare, onSubmit }: UseFormOptions<TValues, TData>): FormApi<TValues> {
  const [values, setValuesState] = useState<TValues>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);

  const setValue = useCallback(<K extends keyof TValues>(name: K, value: TValues[K]) => {
    setValuesState((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!(name as string in current)) return current;
      const { [name as string]: _removed, ...rest } = current;
      return rest;
    });
  }, []);

  const setValues = useCallback((next: TValues) => {
    setValuesState(next);
    setErrors({});
    setFormError(null);
  }, []);

  const bind = useCallback(
    (name: keyof TValues & string) => ({
      value: String(values[name] ?? ""),
      error: errors[name],
      onChange: (event: { target: { value: string } }) => setValue(name, event.target.value as TValues[typeof name]),
    }),
    [values, errors, setValue],
  );

  const submit = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (inFlight.current) return;
      const form = event?.currentTarget ?? null;

      const result = validate(schema, prepare ? prepare(values) : values);
      if (!result.ok) {
        setErrors(result.errors);
        setFormError(result.errors._form ?? null);
        requestAnimationFrame(() => form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
        return;
      }

      inFlight.current = true;
      setSubmitting(true);
      setFormError(null);
      try {
        await onSubmit(result.data);
      } catch (error) {
        setFormError(toUserMessage(error));
      } finally {
        inFlight.current = false;
        setSubmitting(false);
      }
    },
    [schema, prepare, values, onSubmit],
  );

  const reset = useCallback(() => {
    setValuesState(initial);
    setErrors({});
    setFormError(null);
    // `initial` is intentionally read once: reset returns to the values the form started with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { values, errors, formError, submitting, setValue, setValues, setErrors, setFormError, bind, submit, reset };
}
