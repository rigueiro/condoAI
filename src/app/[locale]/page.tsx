"use client";

import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import LocaleSwitcher from "@/components/locale-switcher";
import AuthActions from "@/components/landing/auth-actions";
import ProductPreview from "@/components/landing/product-preview";
import { useAuth } from "@/lib/auth";

const FEATURES = [
  { key: "properties", icon: "Building2" },
  { key: "owners", icon: "Users" },
  { key: "payments", icon: "Wallet" },
  { key: "occurrences", icon: "Wrench" },
  { key: "reports", icon: "BarChart3" },
] as const;

const STEPS = ["step1", "step2", "step3"] as const;

const TRUST = [
  { key: "secure", icon: "ShieldCheck" },
  { key: "clarity", icon: "Eye" },
  { key: "local", icon: "Landmark" },
] as const;

const SECTION =
  "mx-auto max-w-6xl px-4 sm:px-6";
const SECTION_PAD = "py-20 sm:py-28";
const HEADING =
  "text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl";
const LEDE = "mt-3 text-base text-text-secondary sm:text-lg";

export default function HomePage() {
  const t = useTranslations("home");
  const { isAuthenticated, isLoading } = useAuth();
  // Prefer guest CTAs until auth resolves so entry points never flash empty.
  const showDashboard = !isLoading && isAuthenticated;
  const year = new Date().getFullYear();

  return (
    <div className="landing-page relative min-h-screen bg-[var(--background)] text-text-primary">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(100vh,52rem)] overflow-hidden"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50 via-[var(--background)] to-[var(--background)]" />
        <div className="absolute -left-1/4 top-0 h-[28rem] w-[70%] rounded-full bg-accent-50/60 blur-3xl" />
        <div className="absolute -right-1/4 top-24 h-[22rem] w-[55%] rounded-full bg-primary-100/50 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='72' height='72' viewBox='0 0 72 72' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M36 2 L70 36 L36 70 L2 36 Z' fill='none' stroke='%231E293B' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: "72px 72px",
          }}
        />
      </div>

      <header className="anim-nav relative z-20">
        <div className={`${SECTION} flex items-center justify-between gap-4 py-5`}>
          <a href="#top" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Icon name="Building2" size={18} color="white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              {t("brand")}
            </span>
          </a>

          <nav className="hidden items-center gap-6 text-sm text-text-secondary md:flex">
            <a href="#features" className="transition-smooth hover:text-text-primary">
              {t("nav.features")}
            </a>
            <a href="#how-it-works" className="transition-smooth hover:text-text-primary">
              {t("nav.howItWorks")}
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LocaleSwitcher />
            <AuthActions variant="nav" showDashboard={showDashboard} />
          </div>
        </div>
      </header>

      <main id="top" className="relative z-10">
        <section className={`${SECTION} pt-10 sm:pt-16 lg:pt-20`}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="anim-fade-up mb-4 text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
              {t("brand")}
            </p>
            <h1 className="anim-fade-up-delay text-2xl font-semibold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
              {t("hero.headline")}
            </h1>
            <p className="anim-fade-up-delay-2 mx-auto mt-4 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
              {t("hero.subtitle")}
            </p>
            <div className="anim-fade-up-delay-2 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <AuthActions variant="hero" showDashboard={showDashboard} />
            </div>
          </div>

          <div className="anim-preview mt-12 sm:mt-16">
            <ProductPreview />
          </div>
        </section>

        <section id="features" className={`${SECTION} ${SECTION_PAD}`}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={HEADING}>{t("features.title")}</h2>
            <p className={LEDE}>{t("features.subtitle")}</p>
          </div>
          <ul className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <li key={feature.key} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
                  <Icon name={feature.icon} size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold">
                    {t(`features.${feature.key}.title`)}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                    {t(`features.${feature.key}.description`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section
          id="how-it-works"
          className="border-y border-border-light bg-secondary-50/60"
        >
          <div className={`${SECTION} ${SECTION_PAD}`}>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className={HEADING}>{t("howItWorks.title")}</h2>
              <p className={LEDE}>{t("howItWorks.subtitle")}</p>
            </div>
            <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
              {STEPS.map((step, index) => (
                <li key={step} className="text-center md:text-left">
                  <span className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary-50 text-sm font-semibold text-primary md:mx-0">
                    {index + 1}
                  </span>
                  <h3 className="text-base font-semibold">
                    {t(`howItWorks.${step}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {t(`howItWorks.${step}.description`)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={`${SECTION} ${SECTION_PAD}`}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={HEADING}>{t("trust.title")}</h2>
          </div>
          <ul className="mt-14 grid gap-10 sm:grid-cols-3">
            {TRUST.map((item) => (
              <li key={item.key} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-accent">
                  <Icon name={item.icon} size={22} />
                </div>
                <h3 className="text-base font-semibold">
                  {t(`trust.${item.key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {t(`trust.${item.key}.description`)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${SECTION} pb-20 sm:pb-28`}>
          <div className="relative overflow-hidden rounded-2xl bg-primary-900 px-6 py-14 text-center sm:px-12 sm:py-16">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-700/40 blur-2xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-accent-700/30 blur-2xl"
              aria-hidden
            />
            <div className="relative">
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {t("cta.title")}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base text-primary-100">
                {t("cta.subtitle")}
              </p>
              <div className="mt-8">
                <AuthActions variant="cta" showDashboard={showDashboard} />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border-light">
        <div
          className={`${SECTION} flex flex-col items-center justify-between gap-4 py-8 text-center sm:flex-row sm:text-left`}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Icon name="Building2" size={14} color="white" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("brand")}</p>
              <p className="text-xs text-text-secondary">{t("footer.tagline")}</p>
            </div>
          </div>
          <AuthActions variant="footer" showDashboard={showDashboard} />
          <p className="text-xs text-text-secondary">
            {t("footer.copyright", { year })}
          </p>
        </div>
      </footer>
    </div>
  );
}
