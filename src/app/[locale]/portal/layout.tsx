"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useMemberships } from "@/lib/memberships";

function PortalGuard({ children }: { children: ReactNode }) {
  const t = useTranslations("portal");
  const router = useRouter();
  const { mode, isReady } = useMemberships();

  useEffect(() => {
    if (isReady && mode === "manager") {
      router.replace("/dashboard");
    }
  }, [isReady, mode, router]);

  if (!isReady || mode === "manager") {
    return (
      <div className="min-h-screen bg-background px-6 py-8 text-sm text-text-secondary">
        {t("loading")}
      </div>
    );
  }

  return children;
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("portal");
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background px-6 py-8 text-sm text-text-secondary">
          {t("loading")}
        </div>
      }
    >
      <PortalGuard>{children}</PortalGuard>
    </Suspense>
  );
}
