"use client";

import { useTranslations } from "next-intl";
import {
  formatDigestBody,
  type DigestCopy,
  type DigestItemLabels,
} from "./digests";

type CertificateType = "energy" | "technical-inspection" | "usage-license";

function isCertificateType(type: string): type is CertificateType {
  return (
    type === "energy" ||
    type === "technical-inspection" ||
    type === "usage-license"
  );
}

/** Localized email subject/body for compliance deadline digests. */
export function useDigestCopy(): DigestCopy {
  const t = useTranslations("compliance.digest");
  const tAttention = useTranslations("compliance.attention");
  const tCert = useTranslations("compliance.certificateTypes");

  const labels: DigestItemLabels = {
    overdue: tAttention("overdue"),
    dueSoon: tAttention("dueSoon"),
    dueToday: tAttention("dueToday"),
    daysOverdue: (count) => tAttention("daysOverdue", { count }),
    daysLeft: (count) => tAttention("daysLeft", { count }),
    insurance: (insurer) => tAttention("insuranceLabel", { insurer }),
    certificate: (type) => tAttention("certificateLabel", { type }),
    certificateTypeLabel: (type) =>
      isCertificateType(type) ? tCert(type) : type,
  };

  return {
    subject: (count) => t("email.subject", { count }),
    body: (items) =>
      formatDigestBody(
        items,
        labels,
        t("email.intro", { count: items.length }),
        t("email.outro"),
      ),
  };
}
