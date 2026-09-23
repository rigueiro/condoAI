"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import Icon from "@/components/icon";
import { useAuth } from "@/lib/auth";
import { usePlayground } from "@/lib/playground";

type Variant = "nav" | "hero" | "cta" | "footer";

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-primary font-medium text-white transition-smooth hover:bg-primary-700";
const secondaryBtn =
  "inline-flex items-center justify-center rounded-lg border border-border-medium bg-surface font-medium text-text-primary transition-smooth hover:bg-secondary-50";
const ghostBtn =
  "inline-flex items-center rounded-lg font-medium text-text-primary transition-smooth hover:bg-secondary-100";
const ctaPrimaryBtn =
  "inline-flex items-center gap-2 rounded-lg bg-white font-medium text-primary-900 transition-smooth hover:bg-primary-50";
const ctaSecondaryBtn =
  "inline-flex items-center rounded-lg border border-white/30 font-medium text-white transition-smooth hover:bg-white/10";
const footerLink =
  "text-xs font-medium text-text-primary transition-smooth hover:text-primary";

function EnterPlaygroundButton({
  className,
  label,
  icon,
}: {
  className: string;
  label: string;
  icon?: boolean;
}) {
  const t = useTranslations("home");
  const { enterPlayground } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await enterPlayground();
      router.push("/dashboard");
    } catch {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={busy}
      className={`${className} disabled:opacity-60`}
    >
      {busy ? t("nav.enteringPlayground") : label}
      {icon && !busy ? <Icon name="ArrowRight" size={18} /> : null}
    </button>
  );
}

/** Login / signup (or dashboard) entry points for the landing page. */
export default function AuthActions({
  variant,
  showDashboard,
}: {
  variant: Variant;
  showDashboard: boolean;
}) {
  const t = useTranslations("home");
  const playground = usePlayground();

  if (variant === "nav") {
    if (showDashboard) {
      return (
        <Link href="/dashboard" className={`${primaryBtn} px-3.5 py-2 text-sm`}>
          {t("nav.goToDashboard")}
        </Link>
      );
    }
    if (playground) {
      return (
        <>
          <Link href="/login" className={`${ghostBtn} px-3 py-2 text-sm`}>
            {t("nav.login")}
          </Link>
          <EnterPlaygroundButton
            className={`${primaryBtn} px-3.5 py-2 text-sm`}
            label={t("nav.enterPlayground")}
          />
        </>
      );
    }
    return (
      <>
        <Link href="/login" className={`${ghostBtn} px-3 py-2 text-sm`}>
          {t("nav.login")}
        </Link>
        <Link href="/signup" className={`${primaryBtn} px-3.5 py-2 text-sm`}>
          {t("nav.signup")}
        </Link>
      </>
    );
  }

  if (variant === "hero") {
    if (showDashboard) {
      return (
        <Link
          href="/dashboard"
          className={`${primaryBtn} w-full px-6 py-3 text-base sm:w-auto`}
        >
          <Icon name="LayoutDashboard" size={18} />
          {t("hero.ctaDashboard")}
        </Link>
      );
    }
    if (playground) {
      return (
        <>
          <EnterPlaygroundButton
            className={`${primaryBtn} w-full px-6 py-3 text-base sm:w-auto`}
            label={t("hero.ctaPlayground")}
            icon
          />
          <Link
            href="/login"
            className={`${secondaryBtn} w-full px-6 py-3 text-base sm:w-auto`}
          >
            {t("hero.ctaSecondary")}
          </Link>
        </>
      );
    }
    return (
      <>
        <Link
          href="/signup"
          className={`${primaryBtn} w-full px-6 py-3 text-base sm:w-auto`}
        >
          {t("hero.ctaPrimary")}
          <Icon name="ArrowRight" size={18} />
        </Link>
        <Link
          href="/login"
          className={`${secondaryBtn} w-full px-6 py-3 text-base sm:w-auto`}
        >
          {t("hero.ctaSecondary")}
        </Link>
      </>
    );
  }

  if (variant === "cta") {
    if (showDashboard) {
      return (
        <Link href="/dashboard" className={`${ctaPrimaryBtn} px-6 py-3 text-base`}>
          {t("cta.dashboard")}
          <Icon name="ArrowRight" size={18} />
        </Link>
      );
    }
    if (playground) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <EnterPlaygroundButton
            className={`${ctaPrimaryBtn} px-6 py-3 text-base`}
            label={t("cta.playground")}
            icon
          />
          <Link href="/login" className={`${ctaSecondaryBtn} px-6 py-3 text-base`}>
            {t("cta.login")}
          </Link>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/signup" className={`${ctaPrimaryBtn} px-6 py-3 text-base`}>
          {t("cta.button")}
          <Icon name="ArrowRight" size={18} />
        </Link>
        <Link href="/login" className={`${ctaSecondaryBtn} px-6 py-3 text-base`}>
          {t("cta.login")}
        </Link>
      </div>
    );
  }

  if (showDashboard) {
    return (
      <Link href="/dashboard" className={footerLink}>
        {t("nav.goToDashboard")}
      </Link>
    );
  }

  if (playground) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/login" className={footerLink}>
          {t("nav.login")}
        </Link>
        <EnterPlaygroundButton
          className={footerLink}
          label={t("nav.enterPlayground")}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/login" className={footerLink}>
        {t("nav.login")}
      </Link>
      <Link href="/signup" className={footerLink}>
        {t("nav.signup")}
      </Link>
    </div>
  );
}
