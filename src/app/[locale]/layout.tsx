import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import "../globals.css";
import { AuthProvider } from "@/lib/auth";
import { PortfolioProvider } from "@/lib/portfolio";
import { CollectionsProvider } from "@/lib/collections";
import { ComplianceProvider } from "@/lib/compliance";
import { FinanceProvider } from "@/lib/finance";
import { OccurrencesProvider } from "@/lib/occurrences";
import { AssembliesProvider } from "@/lib/assemblies";
import { OperationsProvider } from "@/lib/operations";
import { WorksProvider } from "@/lib/works";
import { MembershipsProvider } from "@/lib/memberships";
import { ThemeProvider, ThemeScript } from "@/lib/theme";
import { routing } from "@/i18n/routing";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });

  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeScript />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <AuthProvider>
              <MembershipsProvider>
                <PortfolioProvider>
                  <CollectionsProvider>
                    <ComplianceProvider>
                      <FinanceProvider>
                        <OccurrencesProvider>
                          <AssembliesProvider>
                            <OperationsProvider>
                              <WorksProvider>{children}</WorksProvider>
                            </OperationsProvider>
                          </AssembliesProvider>
                        </OccurrencesProvider>
                      </FinanceProvider>
                    </ComplianceProvider>
                  </CollectionsProvider>
                </PortfolioProvider>
              </MembershipsProvider>
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
