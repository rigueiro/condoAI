"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

function RecordsTable({
  headers,
  colSpan,
  empty,
  children,
}: {
  headers: string[];
  colSpan: number;
  empty: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("compliance");

  return (
    <div className="overflow-x-auto rounded-xl border border-border-light bg-surface">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border-light bg-secondary-50 text-xs uppercase text-text-secondary">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light">
          {empty ? (
            <tr>
              <td
                colSpan={colSpan}
                className="px-4 py-8 text-center text-text-secondary"
              >
                {t("table.empty")}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export default RecordsTable;
