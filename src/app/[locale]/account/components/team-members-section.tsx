"use client";

import React, { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";
import Select from "@/components/ui/select";
import type { TeamMember, TeamRole, TeamStatus } from "../types";

interface TeamMembersSectionProps {
  members: TeamMember[];
  onInvite?: (input: { email: string; role: TeamRole }) => Promise<void> | void;
  onRemove?: (member: TeamMember) => Promise<void> | void;
  onChangeRole?: (member: TeamMember, role: TeamRole) => Promise<void> | void;
}

const ROLE_OPTIONS: TeamRole[] = ["admin", "manager", "staff", "viewer"];

const ROLE_BADGE: Record<TeamRole, string> = {
  owner: "bg-primary-50 text-primary",
  admin: "bg-accent-50 text-accent",
  manager: "bg-success-50 text-success",
  staff: "bg-warning-50 text-warning",
  viewer: "bg-secondary-100 text-text-secondary",
};

const STATUS_STYLES: Record<TeamStatus, string> = {
  active: "bg-success-50 text-success",
  invited: "bg-warning-50 text-warning",
  inactive: "bg-secondary-100 text-text-secondary",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getInitials = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { email: string; role: TeamRole }) => Promise<void> | void;
}

function InviteModal({ open, onClose, onSubmit }: InviteModalProps) {
  const t = useTranslations("account.team.inviteModal");
  const tRoles = useTranslations("account.team.roles");
  const tVal = useTranslations("account.team.inviteModal.validation");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("manager");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (!open) {
      setEmail("");
      setRole("manager");
      setError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError(tVal("emailRequired"));
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setError(tVal("emailInvalid"));
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({ email: trimmed, role });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-1001 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface bg-white rounded-lg shadow-xl w-full max-w-md">
        <header className="p-6 border-b border-border-light">
          <h2 className="text-lg font-semibold text-text-primary">
            {t("title")}
          </h2>
          <p className="text-sm text-text-secondary mt-1">{t("subtitle")}</p>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="invite-email"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              {t("emailLabel")} <span className="text-error">*</span>
            </label>
            <input
              id="invite-email"
              type="email"
              autoFocus
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError(null);
              }}
              placeholder={t("emailPlaceholder")}
              disabled={isSubmitting}
              className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60 ${
                error ? "border-error" : "border-border-medium"
              }`}
            />
            {error && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <Icon name="AlertCircle" size={14} />
                <span>{error}</span>
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="invite-role"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              {t("roleLabel")}
            </label>
            <Select
              id="invite-role"
              value={role}
              onChange={(event) => setRole(event.target.value as TeamRole)}
              disabled={isSubmitting}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {tRoles(option)}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              iconName="Send"
              className="text-white"
            >
              {isSubmitting ? t("sending") : t("send")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TeamMembersSection({
  members,
  onInvite,
  onRemove,
  onChangeRole,
}: TeamMembersSectionProps) {
  const t = useTranslations("account.team");
  const tRoles = useTranslations("account.team.roles");
  const tStatuses = useTranslations("account.team.statuses");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [locale],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members;
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query),
    );
  }, [members, search]);

  const handleInvite = async (input: { email: string; role: TeamRole }) => {
    await onInvite?.(input);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Icon
            name="Search"
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("search")}
            className="w-full rounded-lg border border-border-medium bg-surface pl-9 pr-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <Button
          type="button"
          iconName="UserPlus"
          onClick={() => setInviteOpen(true)}
          className="text-white"
        >
          {t("invite")}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-text-secondary border-b border-border-light">
              <th className="font-medium py-3 pr-4">{t("name")}</th>
              <th className="font-medium py-3 pr-4">{t("role")}</th>
              <th className="font-medium py-3 pr-4">{t("status")}</th>
              <th className="font-medium py-3 pr-4">{t("lastActive")}</th>
              <th className="font-medium py-3 pr-4 sr-only">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {filtered.map((member) => (
              <tr
                key={member.id}
                className="hover:bg-secondary-50 transition-smooth"
              >
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">
                      {getInitials(member.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary">
                          {member.name}
                        </span>
                        {member.isCurrentUser && (
                          <span className="text-[10px] uppercase font-semibold bg-secondary-100 text-text-secondary px-1.5 py-0.5 rounded">
                            {t("you")}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {member.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  {member.role === "owner" || !onChangeRole ? (
                    <span
                      className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[member.role]}`}
                    >
                      {tRoles(member.role)}
                    </span>
                  ) : (
                    <Select
                      value={member.role}
                      onChange={(event) =>
                        onChangeRole(member, event.target.value as TeamRole)
                      }
                      selectSize="sm"
                    >
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {tRoles(option)}
                        </option>
                      ))}
                    </Select>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[member.status]}`}
                  >
                    {tStatuses(member.status)}
                  </span>
                </td>
                <td className="py-3 pr-4 text-text-secondary text-xs">
                  {member.status === "invited"
                    ? "—"
                    : member.lastActiveAt
                      ? dateFormatter.format(new Date(member.lastActiveAt))
                      : "—"}
                </td>
                <td className="py-3 pr-4 text-right">
                  {!member.isCurrentUser && member.role !== "owner" && (
                    <div className="flex items-center justify-end gap-2">
                      {member.status === "invited" && (
                        <button
                          type="button"
                          className="text-xs font-medium text-text-secondary hover:text-text-primary transition-smooth"
                        >
                          {t("resend")}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onRemove?.(member)}
                        className="text-xs font-medium text-error hover:text-error transition-smooth"
                      >
                        {t("remove")}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={handleInvite}
      />
    </div>
  );
}

export default TeamMembersSection;
