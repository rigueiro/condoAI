"use client";

import type { ReactNode } from "react";
import Icon from "@/components/icon";
import LocaleSwitcher from "@/components/locale-switcher";

const PATTERN_BG = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

interface AuthShellProps {
  children: ReactNode;
  footer?: ReactNode;
  /** Wider card for multi-step flows (e.g. onboarding). */
  wide?: boolean;
}

/**
 * Shared chrome for unauthenticated auth screens (login, forgot, reset).
 */
export function AuthShell({ children, footer, wide = false }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center px-4 py-8">
      <div className="absolute top-4 right-4 z-10">
        <LocaleSwitcher />
      </div>
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0 bg-repeat"
          style={{ backgroundImage: PATTERN_BG }}
        />
      </div>

      <div className={`relative w-full ${wide ? "max-w-xl" : "max-w-md"}`}>
        <div className="bg-surface rounded-2xl shadow-modal border border-border-light p-8">
          {children}
        </div>
        {footer}
      </div>
    </div>
  );
}

interface AuthCardHeaderProps {
  icon: string;
  title: string;
  subtitle?: ReactNode;
  className?: string;
}

export function AuthCardHeader({
  icon,
  title,
  subtitle,
  className = "text-center mb-8",
}: AuthCardHeaderProps) {
  return (
    <div className={className}>
      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon name={icon} size={32} color="white" />
      </div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">{title}</h1>
      {subtitle ? (
        <p className="text-text-secondary">{subtitle}</p>
      ) : null}
    </div>
  );
}

interface AuthStatusPanelProps {
  icon: string;
  title: string;
  body: string;
  actions: ReactNode;
}

export function AuthStatusPanel({
  icon,
  title,
  body,
  actions,
}: AuthStatusPanelProps) {
  return (
    <div className="space-y-6 text-center">
      <AuthCardHeader
        icon={icon}
        title={title}
        subtitle={body}
        className="text-center"
      />
      {actions}
    </div>
  );
}
