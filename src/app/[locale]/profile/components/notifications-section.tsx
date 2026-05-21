"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";

type NotificationKey = "email" | "payments" | "occurrences" | "weeklyDigest";

interface ToggleProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

function ToggleRow({ id, label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex-1">
        <label
          htmlFor={id}
          className="text-sm font-medium text-text-primary block cursor-pointer"
        >
          {label}
        </label>
        <p className="text-xs text-text-secondary mt-1">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          checked ? "bg-primary" : "bg-secondary-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function NotificationsSection() {
  const t = useTranslations("profile.notifications");

  const [settings, setSettings] = useState<Record<NotificationKey, boolean>>({
    email: true,
    payments: true,
    occurrences: true,
    weeklyDigest: false,
  });

  const toggle = (key: NotificationKey) => (value: boolean) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="divide-y divide-border-light">
      <ToggleRow
        id="notif-email"
        label={t("email")}
        description={t("emailDesc")}
        checked={settings.email}
        onChange={toggle("email")}
      />
      <ToggleRow
        id="notif-payments"
        label={t("payments")}
        description={t("paymentsDesc")}
        checked={settings.payments}
        onChange={toggle("payments")}
      />
      <ToggleRow
        id="notif-occurrences"
        label={t("occurrences")}
        description={t("occurrencesDesc")}
        checked={settings.occurrences}
        onChange={toggle("occurrences")}
      />
      <ToggleRow
        id="notif-weekly-digest"
        label={t("weeklyDigest")}
        description={t("weeklyDigestDesc")}
        checked={settings.weeklyDigest}
        onChange={toggle("weeklyDigest")}
      />
    </div>
  );
}

export default NotificationsSection;
