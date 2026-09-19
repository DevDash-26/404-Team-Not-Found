"use client";

import { RequireCapability } from "@/components/layout/RequireCapability";
import { useServices } from "@/components/providers/ServicesProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { TextArea, TextInput } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState, InlineError, LoadingRows } from "@/components/ui/States";
import { rulesFromSettings } from "@/features/classrooms/logic";
import { settingsSchema, type SettingsInput } from "@/features/settings/schema";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useForm } from "@/hooks/useForm";
import type { AppSettings } from "@/types";

type Values = {
  bookingOpenTime: string;
  bookingCloseTime: string;
  bookingMaxHours: string;
  bookingAdvanceDays: string;
  systemMessage: string;
};

function toValues(settings: AppSettings | null): Values {
  const rules = rulesFromSettings(settings);
  return {
    bookingOpenTime: rules.openTime,
    bookingCloseTime: rules.closeTime,
    bookingMaxHours: String(rules.maxHours),
    bookingAdvanceDays: String(rules.advanceDays),
    systemMessage: settings?.systemMessage ?? "",
  };
}

function SettingsForm({ settings, onSaved }: { settings: AppSettings | null; onSaved: () => void }) {
  const { settings: settingsService } = useServices();
  const toast = useToast();
  const form = useForm<Values, SettingsInput>({
    initial: toValues(settings),
    schema: settingsSchema,
    prepare: (v) => ({ ...v, bookingMaxHours: Number(v.bookingMaxHours), bookingAdvanceDays: Number(v.bookingAdvanceDays) }),
    onSubmit: async (input) => {
      await settingsService.save(input);
      toast.success("Settings saved.");
      onSaved();
    },
  });

  return (
    <form onSubmit={form.submit} noValidate className="space-y-6">
      <InlineError message={form.formError} />
      <Card>
        <CardHeader title="Classroom booking rules" description="Applied to every new booking request straight away." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Opens at" type="time" {...form.bind("bookingOpenTime")} />
          <TextInput label="Closes at" type="time" {...form.bind("bookingCloseTime")} />
          <TextInput label="Longest booking (hours)" type="number" min={1} max={8} inputMode="numeric" {...form.bind("bookingMaxHours")} />
          <TextInput label="Book up to (days ahead)" type="number" min={1} max={180} inputMode="numeric" {...form.bind("bookingAdvanceDays")} />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="System message" description="Shown as a banner at the top of every page. Leave empty to hide it, for example to announce planned maintenance." />
        <CardBody>
          <TextArea label="Message" rows={2} maxLength={200} {...form.bind("systemMessage")} />
        </CardBody>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" loading={form.submitting}>
          Save settings
        </Button>
      </div>
    </form>
  );
}

export default function AdminSettingsPage() {
  const { settings } = useServices();
  const current = useAsyncData(() => settings.get(), [settings]);

  return (
    <RequireCapability capability="settings">
      <PageHeader title="Settings" description="Rules and messages that apply across the whole platform." />
      {current.error ? (
        <ErrorState message={current.error} onRetry={current.reload} />
      ) : current.loading ? (
        <LoadingRows count={3} />
      ) : (
        <SettingsForm settings={current.data} onSaved={current.reload} />
      )}
    </RequireCapability>
  );
}
