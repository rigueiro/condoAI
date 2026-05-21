"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";

type SupportCategory = "billing" | "technical" | "feature" | "other";
type SupportPriority = "low" | "normal" | "high" | "urgent";

interface FormState {
  subject: string;
  category: SupportCategory;
  priority: SupportPriority;
  message: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const INITIAL_STATE: FormState = {
  subject: "",
  category: "technical",
  priority: "normal",
  message: "",
};

const CATEGORIES: SupportCategory[] = ["billing", "technical", "feature", "other"];
const PRIORITIES: SupportPriority[] = ["low", "normal", "high", "urgent"];

function ContactSupportSection() {
  const t = useTranslations("help.contact");
  const tCat = useTranslations("help.contact.categories");
  const tPri = useTranslations("help.contact.priorities");
  const tVal = useTranslations("help.contact.validation");
  const tChannels = useTranslations("help.contact.channels");

  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (sent) setSent(false);
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!form.subject.trim()) {
      next.subject = tVal("subjectRequired");
    }
    const trimmedMessage = form.message.trim();
    if (!trimmedMessage) {
      next.message = tVal("messageRequired");
    } else if (trimmedMessage.length < 20) {
      next.message = tVal("messageTooShort");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setIsSending(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSent(true);
      setForm(INITIAL_STATE);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="lg:col-span-2 space-y-5"
      >
        <div>
          <label
            htmlFor="support-subject"
            className="block text-sm font-medium text-text-primary mb-2"
          >
            {t("subject")} <span className="text-error">*</span>
          </label>
          <input
            id="support-subject"
            type="text"
            value={form.subject}
            onChange={(event) => handleField("subject", event.target.value)}
            placeholder={t("subjectPlaceholder")}
            disabled={isSending}
            className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60 ${
              errors.subject ? "border-error" : "border-border-medium"
            }`}
          />
          {errors.subject && (
            <p className="mt-1 text-xs text-error flex items-center gap-1">
              <Icon name="AlertCircle" size={14} />
              <span>{errors.subject}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="support-category"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              {t("category")}
            </label>
            <select
              id="support-category"
              value={form.category}
              onChange={(event) =>
                handleField("category", event.target.value as SupportCategory)
              }
              disabled={isSending}
              className="w-full rounded-lg border border-border-medium bg-surface px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60"
            >
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {tCat(option)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="support-priority"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              {t("priority")}
            </label>
            <select
              id="support-priority"
              value={form.priority}
              onChange={(event) =>
                handleField("priority", event.target.value as SupportPriority)
              }
              disabled={isSending}
              className="w-full rounded-lg border border-border-medium bg-surface px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60"
            >
              {PRIORITIES.map((option) => (
                <option key={option} value={option}>
                  {tPri(option)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="support-message"
            className="block text-sm font-medium text-text-primary mb-2"
          >
            {t("message")} <span className="text-error">*</span>
          </label>
          <textarea
            id="support-message"
            rows={6}
            value={form.message}
            onChange={(event) => handleField("message", event.target.value)}
            placeholder={t("messagePlaceholder")}
            disabled={isSending}
            className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60 resize-y ${
              errors.message ? "border-error" : "border-border-medium"
            }`}
          />
          {errors.message && (
            <p className="mt-1 text-xs text-error flex items-center gap-1">
              <Icon name="AlertCircle" size={14} />
              <span>{errors.message}</span>
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <Icon name="Paperclip" size={14} />
            <span>{t("attachmentsHint")}</span>
          </span>
        </div>

        {sent && (
          <div className="p-3 bg-success-50 border border-success-100 rounded-lg flex items-center gap-2">
            <Icon
              name="CheckCircle2"
              size={16}
              color="var(--color-success)"
            />
            <span className="text-sm text-success">{t("success")}</span>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            loading={isSending}
            iconName="Send"
            className="text-white"
          >
            {isSending ? t("sending") : t("submit")}
          </Button>
        </div>
      </form>

      <aside className="space-y-3">
        <a
          href={`mailto:${tChannels("emailValue")}`}
          className="block p-4 rounded-lg border border-border-light hover:border-primary hover:shadow-card transition-smooth"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center flex-shrink-0">
              <Icon name="Mail" size={20} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-medium text-text-primary">
                {tChannels("email")}
              </h4>
              <p className="text-xs text-text-secondary mt-0.5 truncate">
                {tChannels("emailValue")}
              </p>
            </div>
          </div>
        </a>

        <a
          href={`tel:${tChannels("phoneValue").replace(/\s/g, "")}`}
          className="block p-4 rounded-lg border border-border-light hover:border-primary hover:shadow-card transition-smooth"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-50 text-accent flex items-center justify-center flex-shrink-0">
              <Icon name="Phone" size={20} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-medium text-text-primary">
                {tChannels("phone")}
              </h4>
              <p className="text-xs text-text-primary mt-0.5 font-medium">
                {tChannels("phoneValue")}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {tChannels("phoneHours")}
              </p>
            </div>
          </div>
        </a>

        <button
          type="button"
          className="block w-full text-left p-4 rounded-lg border border-border-light hover:border-primary hover:shadow-card transition-smooth"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-50 text-success flex items-center justify-center flex-shrink-0">
              <Icon name="MessageCircle" size={20} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-medium text-text-primary">
                {tChannels("chat")}
              </h4>
              <p className="text-xs text-primary mt-0.5 font-medium">
                {tChannels("chatValue")}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {tChannels("chatHours")}
              </p>
            </div>
          </div>
        </button>
      </aside>
    </div>
  );
}

export default ContactSupportSection;
