"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";
import Select from "@/components/ui/select";
import { apiFetch } from "@/lib/api/client";
import { useUser } from "@/lib/auth";
import {
  deliverAnnouncement,
  type Announcement,
  type AnnouncementAudience,
} from "@/lib/announcements";

type SendResponse = {
  announcement: Announcement;
  recipients: { email: string; name: string }[];
};

export default function ComposeModal({
  condominiumId,
  onClose,
  onSent,
}: {
  condominiumId: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const t = useTranslations("announcements");
  const user = useUser();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<AnnouncementAudience>("all");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!subject.trim()) {
      setError(t("form.subjectRequired"));
      return;
    }
    if (!body.trim()) {
      setError(t("form.bodyRequired"));
      return;
    }
    setSending(true);
    setError(null);
    try {
      const result = await apiFetch<SendResponse>("/api/announcements", {
        method: "POST",
        body: JSON.stringify({ condominiumId, subject, body, audience }),
      });
      if (user?.email) {
        deliverAnnouncement(
          user.email,
          result.recipients,
          subject.trim(),
          body.trim(),
          result.announcement.id,
        );
      }
      onSent();
      onClose();
    } catch (err) {
      const code = err instanceof Error ? err.message : "sendFailed";
      setError(
        code === "noRecipients" ? t("form.noRecipients") : t("form.sendFailed"),
      );
    } finally {
      setSending(false);
    }
  }, [audience, body, condominiumId, onClose, onSent, subject, t, user?.email]);

  return (
    <div className="fixed inset-0 z-2000 flex items-center justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-lg rounded-xl border border-border-light bg-surface shadow-lg"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-border-light px-5 py-4">
          <h2 className="text-base font-semibold text-text-primary">
            {t("modal.title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-text-secondary hover:bg-secondary-50"
            aria-label={t("form.cancel")}
          >
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <label className="block text-sm">
            <span className="mb-1 block text-text-secondary">
              {t("audience.label")}
            </span>
            <Select
              value={audience}
              onChange={(e) =>
                setAudience(e.target.value as AnnouncementAudience)
              }
            >
              <option value="all">{t("audience.all")}</option>
              <option value="owners">{t("audience.owners")}</option>
              <option value="board">{t("audience.board")}</option>
            </Select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-text-secondary">
              {t("form.subject")}
            </span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("form.subjectPlaceholder")}
              className="w-full rounded-lg border border-border-light bg-background px-3 py-2 text-text-primary"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-text-secondary">
              {t("form.body")}
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("form.bodyPlaceholder")}
              rows={6}
              className="w-full rounded-lg border border-border-light bg-background px-3 py-2 text-text-primary"
            />
          </label>
          {error && <p className="text-sm text-error">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-border-light px-5 py-4">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            {t("form.cancel")}
          </Button>
          <Button iconName="Send" onClick={handleSubmit} disabled={sending}>
            {sending ? t("form.sending") : t("form.send")}
          </Button>
        </div>
      </div>
    </div>
  );
}
