"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button";
import Select from "@/components/ui/select";
import { apiFetch } from "@/lib/api/client";
import {
  CONDO_ASSIGNABLE_ROLES,
  roleDisplayKey,
  type CondoAssignableRole,
  type CondoMembership,
} from "@/lib/memberships";
import type { Owner } from "@/types";
import { UserRole } from "@/app/types";

type Props = {
  condominiumId: string;
  owners: Owner[];
};

const INVITE_ERROR_KEYS = [
  "inviteFailed",
  "membershipExists",
  "badRequest",
  "condominiumNotFound",
  "notFound",
] as const;

type InviteErrorKey = (typeof INVITE_ERROR_KEYS)[number];

function inviteErrorKey(code: string): InviteErrorKey {
  return (INVITE_ERROR_KEYS as readonly string[]).includes(code)
    ? (code as InviteErrorKey)
    : "inviteFailed";
}

function AccessSection({ condominiumId, owners }: Props) {
  const t = useTranslations("propertiesManagement.access");
  const tRoles = useTranslations("portal.roles");
  const [memberships, setMemberships] = useState<CondoMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<CondoAssignableRole>(UserRole.Resident);
  const [ownerId, setOwnerId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{ memberships: CondoMembership[] }>(
          `/api/memberships?condominiumId=${encodeURIComponent(condominiumId)}`,
        );
        if (!cancelled) setMemberships(data.memberships);
      } catch {
        if (!cancelled) setError(t("loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [condominiumId, t]);

  const needsOwnerLink =
    role === UserRole.Resident || role === UserRole.Tenant;

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const data = await apiFetch<{ membership: CondoMembership }>(
        "/api/memberships",
        {
          method: "POST",
          body: JSON.stringify({
            memberEmail: email,
            condominiumId,
            role,
            ownerId: needsOwnerLink ? ownerId || null : null,
            displayName,
          }),
        },
      );
      setMemberships((prev) => [...prev, data.membership]);
      setEmail("");
      setDisplayName("");
      setOwnerId("");
      setRole(UserRole.Resident);
    } catch (err) {
      const code = err instanceof Error ? err.message : "inviteFailed";
      setError(t(`errors.${inviteErrorKey(code)}`));
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (membership: CondoMembership) => {
    if (!window.confirm(t("confirmRevoke", { name: membership.displayName }))) {
      return;
    }
    try {
      await apiFetch(
        `/api/memberships?id=${encodeURIComponent(membership.id)}`,
        { method: "DELETE" },
      );
      setMemberships((prev) => prev.filter((m) => m.id !== membership.id));
    } catch {
      setError(t("errors.revokeFailed"));
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">{t("title")}</h2>
        <p className="mt-1 text-sm text-text-secondary">{t("subtitle")}</p>
      </div>

      <form
        onSubmit={handleInvite}
        className="space-y-4 rounded-lg border border-border-light bg-surface p-6"
      >
        <h3 className="text-sm font-semibold text-text-primary">
          {t("inviteTitle")}
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-text-secondary">
              {t("fields.name")}
            </span>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text-primary"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-text-secondary">
              {t("fields.email")}
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text-primary"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-text-secondary">
              {t("fields.role")}
            </span>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as CondoAssignableRole)}
            >
              {CONDO_ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {tRoles(roleDisplayKey(r))}
                </option>
              ))}
            </Select>
          </label>
          {needsOwnerLink && (
            <label className="block text-sm">
              <span className="mb-1 block text-text-secondary">
                {t("fields.owner")}
              </span>
              <Select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
              >
                <option value="">{t("fields.ownerOptional")}</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.fullName}
                  </option>
                ))}
              </Select>
            </label>
          )}
        </div>
        {error && (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? t("inviting") : t("invite")}
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-border-light bg-surface">
        <div className="border-b border-border-light px-6 py-4">
          <h3 className="text-sm font-semibold text-text-primary">
            {t("listTitle")}
          </h3>
        </div>
        {loading ? (
          <p className="px-6 py-8 text-sm text-text-secondary">{t("loading")}</p>
        ) : memberships.length === 0 ? (
          <p className="px-6 py-8 text-sm text-text-secondary">{t("empty")}</p>
        ) : (
          <table className="min-w-full divide-y divide-border-light">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {t("columns.person")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {t("columns.role")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {t("columns.status")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-secondary">
                  {t("columns.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {memberships.map((membership) => {
                const owner = owners.find((o) => o.id === membership.ownerId);
                return (
                  <tr key={membership.id}>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-text-primary">
                        {membership.displayName}
                      </div>
                      <div className="text-text-secondary">
                        {membership.memberEmail}
                      </div>
                      {owner && (
                        <div className="mt-0.5 text-xs text-text-secondary">
                          {t("linkedOwner", { name: owner.fullName })}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary">
                      {tRoles(roleDisplayKey(membership.role))}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {t(`status.${membership.status}`)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleRevoke(membership)}
                        className="text-sm text-error hover:underline"
                      >
                        {t("revoke")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default AccessSection;
