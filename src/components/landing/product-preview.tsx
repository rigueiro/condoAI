"use client";

import { useTranslations } from "next-intl";
import Icon from "@/components/icon";

const PREVIEW_NAV = [
  { key: "navDashboard", icon: "LayoutDashboard", active: true },
  { key: "navProperties", icon: "Building", active: false },
  { key: "navPayments", icon: "Wallet", active: false },
] as const;

const PREVIEW_ROWS = ["row1", "row2", "row3"] as const;

/** Decorative dashboard mock for the landing hero. */
export default function ProductPreview() {
  const t = useTranslations("home.preview");

  return (
    <div className="landing-preview relative mx-auto w-full max-w-6xl" aria-hidden>
      <div className="overflow-hidden rounded-t-2xl border border-b-0 border-border-light bg-surface shadow-modal">
        <div className="flex items-center gap-2 border-b border-border-light bg-secondary-50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-secondary-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-secondary-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-secondary-300" />
          <div className="ml-3 flex-1 rounded-md bg-secondary-100 px-3 py-1.5 text-xs text-text-secondary">
            app.condoai.com
          </div>
        </div>

        <div className="grid grid-cols-[9rem_1fr] sm:grid-cols-[11rem_1fr]">
          <aside className="border-r border-border-light bg-secondary-50/80 px-3 py-4 sm:px-4">
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Icon name="Building2" size={16} color="white" />
              </div>
              <span className="text-sm font-semibold text-text-primary">CondoAI</span>
            </div>
            <nav className="space-y-1 text-xs sm:text-sm">
              {PREVIEW_NAV.map((item) => (
                <div
                  key={item.key}
                  className={`flex items-center gap-2 px-2.5 py-2 ${
                    item.active
                      ? "rounded-md bg-primary-50 font-medium text-primary"
                      : "text-text-secondary"
                  }`}
                >
                  <Icon name={item.icon} size={14} />
                  {t(item.key)}
                </div>
              ))}
            </nav>
          </aside>

          <div className="space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Metric label={t("collectionRate")} value={t("collectionValue")} accent />
              <Metric label={t("properties")} value={t("propertiesValue")} />
              <Metric label={t("outstanding")} value={t("outstandingValue")} />
            </div>

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-secondary sm:text-sm sm:normal-case sm:tracking-normal">
                {t("upcomingTitle")}
              </p>
              <ul className="divide-y divide-border-light border-t border-border-light">
                {PREVIEW_ROWS.map((row) => (
                  <li
                    key={row}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-text-primary sm:text-sm">
                        {t(`${row}Unit`)}
                      </p>
                      <p className="text-[11px] text-text-secondary sm:text-xs">
                        {t(`${row}Due`)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-text-primary sm:text-sm">
                      {t(`${row}Amount`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--background)] to-transparent sm:h-32" />
    </div>
  );
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border-light bg-secondary-50/50 px-2.5 py-3 sm:px-3">
      <p className="truncate text-[10px] text-text-secondary sm:text-xs">{label}</p>
      <p
        className={`mt-1 text-sm font-semibold sm:text-lg ${
          accent ? "text-primary" : "text-text-primary"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
