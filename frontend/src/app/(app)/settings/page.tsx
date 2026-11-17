"use client";

import { useMemo, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccountCard } from "@/components/settings/AccountCard";
import { ChangePasswordModal } from "@/components/settings/ChangePasswordModal";
import { PricesCard } from "@/components/settings/PricesCard";
import { ReminderSettingsCard } from "@/components/settings/ReminderSettingsCard";
import { SETTINGS_CARD_CLASS } from "@/components/settings/SettingsCard";
import { TemplatesCard } from "@/components/settings/TemplatesCard";
import { Button } from "@/components/ui/Button";
import { useSettings } from "@/hooks/useSettings";
import { useTimezone } from "@/hooks/useTimezone";
import { useToast } from "@/hooks/useToast";
import { ApiError, updateSettings } from "@/lib/api";
import {
  applyEdits,
  buildSettingsPatch,
  hasSettingsErrors,
  isSettingsDirty,
  settingsToFormValues,
  validateSettingsForm,
} from "@/lib/settings";
import type {
  PriceKey,
  ReminderChannel,
  SettingsFormErrors,
  SettingsFormValues,
  TemplateKey,
  ToggleKey,
} from "@/types";

const NO_ERRORS: SettingsFormErrors = {};
const GENERIC_ERROR = "Something went wrong. Please try again.";

function SettingsSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading settings">
      {[0, 1, 2].map((item) => (
        <div key={item} className={`${SETTINGS_CARD_CLASS} animate-pulse space-y-3`}>
          <div className="h-5 w-40 rounded bg-neutral-100" />
          <div className="h-4 w-3/4 rounded bg-neutral-100" />
          <div className="h-10 w-full rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { show } = useToast();
  const { settings, failed, retry, replace } = useSettings();
  const timezone = useTimezone();

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [edits, setEdits] = useState<Partial<SettingsFormValues>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  // Form = saved settings + the fields the user changed. No effects needed.
  const values = useMemo(
    () => (settings ? applyEdits(settingsToFormValues(settings), edits) : null),
    [settings, edits],
  );
  // Errors only show after the first Save click, then update live.
  const errors = useMemo(
    () => (submitted && values ? validateSettingsForm(values) : NO_ERRORS),
    [submitted, values],
  );
  const dirty = settings !== null && values !== null && isSettingsDirty(settings, values);

  function setToggle(key: ToggleKey, value: boolean) {
    setEdits((previous) => ({ ...previous, [key]: value }));
  }

  function setChannel(channel: ReminderChannel, checked: boolean) {
    if (!values) return;
    const channels = { ...values.channels, [channel]: checked };
    setEdits((previous) => ({ ...previous, channels }));
  }

  function setSendHour(sendHour: string) {
    setEdits((previous) => ({ ...previous, sendHour }));
  }

  function setTemplate(key: TemplateKey, text: string) {
    if (!values) return;
    const templates = { ...values.templates, [key]: text };
    setEdits((previous) => ({ ...previous, templates }));
  }

  function setPrice(key: PriceKey, text: string) {
    if (!values) return;
    const prices = { ...values.prices, [key]: text };
    setEdits((previous) => ({ ...previous, prices }));
  }

  function discard() {
    setEdits({});
    setSubmitted(false);
  }

  async function handleSave() {
    if (!settings || !values || savingRef.current) return;

    setSubmitted(true);
    if (hasSettingsErrors(validateSettingsForm(values))) {
      show({
        type: "error",
        title: "Could not save settings",
        message: "Please check the highlighted fields.",
      });
      return;
    }

    const patch = buildSettingsPatch(settings, values);
    if (Object.keys(patch).length === 0) return;

    savingRef.current = true;
    setSaving(true);
    try {
      const saved = await updateSettings(patch);
      replace(saved);
      setEdits({});
      setSubmitted(false);
      show({ type: "success", title: "Settings saved" });
    } catch (error) {
      show({
        type: "error",
        title: "Could not save settings",
        message: error instanceof ApiError ? error.message : GENERIC_ERROR,
      });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your account, password and reminders." />

      <div className="max-w-[700px] space-y-5">
        <AccountCard />

        <section className={`${SETTINGS_CARD_CLASS} flex flex-wrap items-center justify-between gap-4`}>
          <div>
            <h2 className="text-[18px] font-semibold leading-[26px] text-neutral-900">Password</h2>
            <p className="text-sm leading-[22px] text-neutral-500">
              Use a strong password that only you know.
            </p>
          </div>
          <Button
            variant="outline"
            leftIcon={<Lock className="size-4" aria-hidden="true" />}
            onClick={() => setPasswordOpen(true)}
          >
            Change password
          </Button>
        </section>

        {settings && values ? (
          <>
            <ReminderSettingsCard
              values={values}
              timezone={timezone}
              disabled={saving}
              onToggle={setToggle}
              onChannelChange={setChannel}
              onSendHourChange={setSendHour}
            />
            <TemplatesCard
              values={values}
              errors={errors}
              disabled={saving}
              onChange={setTemplate}
            />
            <PricesCard values={values} errors={errors} disabled={saving} onChange={setPrice} />

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              {dirty && (
                <p role="status" className="text-sm leading-[22px] text-neutral-500 sm:mr-auto">
                  You have unsaved changes.
                </p>
              )}
              <Button variant="outline" onClick={discard} disabled={!dirty || saving}>
                Discard
              </Button>
              <Button variant="primary" onClick={handleSave} loading={saving} disabled={!dirty}>
                Save settings
              </Button>
            </div>
          </>
        ) : failed ? (
          <section className={`${SETTINGS_CARD_CLASS} flex flex-wrap items-center justify-between gap-4`}>
            <div>
              <h2 className="text-[18px] font-semibold leading-[26px] text-neutral-900">
                Reminder settings
              </h2>
              <p role="alert" className="text-sm leading-[22px] text-danger-700">
                Could not load your reminder settings.
              </p>
            </div>
            <Button variant="outline" onClick={retry}>
              Try again
            </Button>
          </section>
        ) : (
          <SettingsSkeleton />
        )}
      </div>

      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </>
  );
}