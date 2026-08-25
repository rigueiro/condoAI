"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Header from "@/components/ui/header";
import Breadcrumb from "@/components/ui/breadcrumb";
import Button from "@/components/ui/button";
import Icon from "@/components/icon";
import Toast from "@/components/ui/toast";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { usePortfolio } from "@/lib/portfolio";
import {
  useCompliance,
  useDigestCopy,
  type AttentionItem,
  type ComplianceKind,
  type ComplianceTab,
} from "@/lib/compliance";
import AttentionPanel from "./components/attention-panel";
import ComplianceModal, {
  type ComplianceRecord,
} from "./components/compliance-modal";
import DocumentCell from "./components/document-cell";
import RecordsTable from "./components/records-table";

function filterBySearch<T>(
  items: T[],
  searchLower: string,
  textFor: (item: T) => string,
): T[] {
  if (!searchLower) return items;
  return items.filter((item) =>
    textFor(item).toLowerCase().includes(searchLower),
  );
}

function CompliancePage() {
  const t = useTranslations("compliance");
  const { formatCurrency } = useFormatCurrency();
  const { portfolio } = usePortfolio();
  const condominiums = portfolio.condominiums;
  const preferredId = condominiums[0]?.id ?? "";

  const {
    policies,
    certificates,
    assemblies,
    summons,
    attentionItems,
    digestSentToday,
    upsertInsurance,
    removeInsurance,
    markInsuranceRenewed,
    upsertCert,
    removeCert,
    markCertificateRenewed,
    upsertAssemblyMinutes,
    removeAssemblyMinutes,
    upsertSummonsDoc,
    removeSummonsDoc,
    sendDeadlineDigest,
  } = useCompliance();
  const digestCopy = useDigestCopy();

  const [tab, setTab] = useState<ComplianceTab>("attention");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ComplianceRecord | null>(null);
  const [flash, setFlash] = useState<{
    message: string;
    tone: "success" | "warning";
  } | null>(null);

  const dismissFlash = useCallback(() => setFlash(null), []);

  const condoOptions = useMemo(
    () => condominiums.map((c) => ({ id: c.id, name: c.name })),
    [condominiums],
  );

  const condoNameById = useMemo(
    () => new Map(condoOptions.map((c) => [c.id, c.name])),
    [condoOptions],
  );

  const nameOf = (id: string) => condoNameById.get(id) ?? id;
  const searchLower = search.trim().toLowerCase();

  const filteredPolicies = useMemo(
    () =>
      filterBySearch(
        policies,
        searchLower,
        (p) => `${p.insurer} ${p.number} ${nameOf(p.condominiumId)}`,
      ),
    [policies, searchLower, condoNameById],
  );

  const filteredCertificates = useMemo(
    () =>
      filterBySearch(
        certificates,
        searchLower,
        (c) => `${c.type} ${nameOf(c.condominiumId)}`,
      ),
    [certificates, searchLower, condoNameById],
  );

  const filteredAssemblies = useMemo(
    () =>
      filterBySearch(
        assemblies,
        searchLower,
        (a) => `${a.type} ${nameOf(a.condominiumId)}`,
      ),
    [assemblies, searchLower, condoNameById],
  );

  const filteredSummons = useMemo(
    () =>
      filterBySearch(
        summons,
        searchLower,
        (s) => `${s.title} ${s.content} ${nameOf(s.condominiumId)}`,
      ),
    [summons, searchLower, condoNameById],
  );

  const tabs: { key: ComplianceTab; count: number }[] = [
    { key: "attention", count: attentionItems.length },
    { key: "insurance", count: filteredPolicies.length },
    { key: "certificate", count: filteredCertificates.length },
    { key: "assembly", count: filteredAssemblies.length },
    { key: "summons", count: filteredSummons.length },
  ];

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (record: ComplianceRecord) => {
    setEditing(record);
    setModalOpen(true);
  };

  const handleSave = (record: ComplianceRecord) => {
    if (record.kind === "insurance") upsertInsurance(record.data);
    else if (record.kind === "certificate") upsertCert(record.data);
    else if (record.kind === "assembly") upsertAssemblyMinutes(record.data);
    else upsertSummonsDoc(record.data);
    setModalOpen(false);
    setEditing(null);
    setFlash({ message: t("flash.saved"), tone: "success" });
    if (
      tab === "attention" &&
      record.kind !== "insurance" &&
      record.kind !== "certificate"
    ) {
      setTab(record.kind);
    }
  };

  const handleDelete = (kind: ComplianceKind, id: string) => {
    if (!window.confirm(t("confirmDelete"))) return;
    if (kind === "insurance") removeInsurance(id);
    else if (kind === "certificate") removeCert(id);
    else if (kind === "assembly") removeAssemblyMinutes(id);
    else removeSummonsDoc(id);
    setFlash({ message: t("flash.deleted"), tone: "success" });
  };

  const handleRenew = (item: AttentionItem) => {
    if (item.kind === "insurance") markInsuranceRenewed(item.id);
    else markCertificateRenewed(item.id);
    setFlash({ message: t("flash.renewed"), tone: "success" });
  };

  const handleSendDigest = () => {
    const result = sendDeadlineDigest(attentionItems, digestCopy);
    if (!result.sent) {
      setFlash({
        message:
          result.reason === "empty"
            ? t("flash.digestEmpty")
            : t("flash.digestFailed"),
        tone: "warning",
      });
      return;
    }
    setFlash({
      message: t("flash.digestSent", { count: result.count }),
      tone: "success",
    });
  };

  const defaultKind: ComplianceKind =
    tab === "attention" ? "insurance" : tab;

  const actionCell = (record: ComplianceRecord) => (
    <td className="px-4 py-3 text-right">
      <div className="flex justify-end gap-1">
        <button
          type="button"
          className="rounded-lg p-2 text-text-secondary hover:bg-secondary-50 hover:text-text-primary"
          title={t("table.edit")}
          onClick={() => openEdit(record)}
        >
          <Icon name="Edit2" size={16} />
        </button>
        <button
          type="button"
          className="rounded-lg p-2 text-text-secondary hover:bg-error-50 hover:text-error"
          title={t("table.delete")}
          onClick={() => handleDelete(record.kind, record.data.id)}
        >
          <Icon name="Trash2" size={16} />
        </button>
      </div>
    </td>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-7xl px-6 py-8">
          <Breadcrumb />

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
                {t("title")}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-text-secondary sm:text-base">
                {t("subtitle")}
              </p>
            </div>
            <Button variant="primary" iconName="Plus" onClick={openAdd}>
              {t("add")}
            </Button>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                label: t("stats.attention"),
                value: attentionItems.length,
                icon: "AlertTriangle",
              },
              {
                label: t("stats.policies"),
                value: filteredPolicies.length,
                icon: "ShieldCheck",
              },
              {
                label: t("stats.certificates"),
                value: filteredCertificates.length,
                icon: "BadgeCheck",
              },
              {
                label: t("stats.assemblies"),
                value: filteredAssemblies.length,
                icon: "Users",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border-light bg-surface px-4 py-3"
              >
                <div className="flex items-center gap-2 text-text-secondary">
                  <Icon name={stat.icon} size={16} />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    {stat.label}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-text-primary">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <div className="relative">
              <Icon
                name="Search"
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("filters.search")}
                className="w-full rounded-lg border border-border-medium bg-surface py-2 pl-9 pr-3 text-sm text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-1 border-b border-border-light">
            {tabs.map(({ key, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-smooth ${
                  tab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {t(`tabs.${key}`)}
                <span className="ml-1.5 text-xs text-text-secondary">
                  ({count})
                </span>
              </button>
            ))}
          </div>

          {tab === "attention" && (
            <AttentionPanel
              items={attentionItems}
              digestSentToday={digestSentToday}
              onRenew={handleRenew}
              onSendDigest={handleSendDigest}
            />
          )}

          {tab === "insurance" && (
            <RecordsTable
              headers={[
                t("table.condominium"),
                t("table.insurer"),
                t("table.policyNumber"),
                t("table.premium"),
                t("table.renewal"),
                t("table.actions"),
              ]}
              colSpan={6}
              empty={filteredPolicies.length === 0}
            >
              {filteredPolicies.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-text-primary">
                    {nameOf(p.condominiumId)}
                  </td>
                  <td className="px-4 py-3">{p.insurer}</td>
                  <td className="px-4 py-3 text-text-secondary">{p.number}</td>
                  <td className="px-4 py-3">
                    {formatCurrency(p.annualPremium)}
                  </td>
                  <td className="px-4 py-3">
                    {String(p.renewalDate).slice(0, 10)}
                  </td>
                  {actionCell({ kind: "insurance", data: p })}
                </tr>
              ))}
            </RecordsTable>
          )}

          {tab === "certificate" && (
            <RecordsTable
              headers={[
                t("table.condominium"),
                t("table.type"),
                t("table.validity"),
                t("table.document"),
                t("table.actions"),
              ]}
              colSpan={5}
              empty={filteredCertificates.length === 0}
            >
              {filteredCertificates.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">{nameOf(c.condominiumId)}</td>
                  <td className="px-4 py-3">
                    {t(`certificateTypes.${c.type}`)}
                  </td>
                  <td className="px-4 py-3">
                    {String(c.validity).slice(0, 10)}
                  </td>
                  <DocumentCell value={c.file} />
                  {actionCell({ kind: "certificate", data: c })}
                </tr>
              ))}
            </RecordsTable>
          )}

          {tab === "assembly" && (
            <RecordsTable
              headers={[
                t("table.condominium"),
                t("table.date"),
                t("table.assemblyType"),
                t("table.document"),
                t("table.actions"),
              ]}
              colSpan={5}
              empty={filteredAssemblies.length === 0}
            >
              {filteredAssemblies.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">{nameOf(a.condominiumId)}</td>
                  <td className="px-4 py-3">{String(a.date).slice(0, 10)}</td>
                  <td className="px-4 py-3">{t(`assemblyTypes.${a.type}`)}</td>
                  <DocumentCell value={a.file} />
                  {actionCell({ kind: "assembly", data: a })}
                </tr>
              ))}
            </RecordsTable>
          )}

          {tab === "summons" && (
            <RecordsTable
              headers={[
                t("table.condominium"),
                t("table.title"),
                t("table.sent"),
                t("table.method"),
                t("table.document"),
                t("table.actions"),
              ]}
              colSpan={6}
              empty={filteredSummons.length === 0}
            >
              {filteredSummons.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">{nameOf(s.condominiumId)}</td>
                  <td className="max-w-xs truncate px-4 py-3">{s.title}</td>
                  <td className="px-4 py-3">
                    {String(s.sentDate).slice(0, 10)}
                  </td>
                  <td className="px-4 py-3">
                    {t(`summonsMethods.${s.method}`)}
                  </td>
                  <DocumentCell value={s.proof} />
                  {actionCell({ kind: "summons", data: s })}
                </tr>
              ))}
            </RecordsTable>
          )}
      </div>

      {modalOpen && (
        <ComplianceModal
          record={editing}
          defaultKind={defaultKind}
          condominiums={condoOptions}
          defaultCondominiumId={preferredId}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}

      {flash && (
        <Toast
          message={flash.message}
          tone={flash.tone}
          onDismiss={dismissFlash}
        />
      )}
    </div>
  );
}

export default CompliancePage;
