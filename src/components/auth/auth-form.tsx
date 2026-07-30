"use client";

import type { ChangeEvent, ReactNode } from "react";
import Icon from "@/components/icon";

const INPUT_CLASS =
  "w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth disabled:opacity-60";

interface AuthAlertProps {
  children: ReactNode;
}

export function AuthAlert({ children }: AuthAlertProps) {
  return (
    <div className="bg-error-50 border border-error-100 rounded-lg p-4 flex items-center space-x-3">
      <Icon name="AlertCircle" size={20} color="var(--color-error)" />
      <span className="text-error text-sm">{children}</span>
    </div>
  );
}

interface AuthEmailFieldProps {
  id?: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function AuthEmailField({
  id = "email",
  label,
  value,
  onChange,
  error,
  placeholder,
  disabled = false,
  autoFocus = false,
}: AuthEmailFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-text-primary mb-2"
      >
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon name="Mail" size={20} color="var(--color-secondary)" />
        </div>
        <input
          type="email"
          id={id}
          name="email"
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="email"
          placeholder={placeholder}
          className={`${INPUT_CLASS} ${
            error ? "border-error" : "border-border-medium"
          }`}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-error flex items-center space-x-1">
          <Icon name="AlertCircle" size={16} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

interface AuthSubmitButtonProps {
  busy: boolean;
  busyLabel: string;
  label: string;
  icon: string;
}

export function AuthSubmitButton({
  busy,
  busyLabel,
  label,
  icon,
}: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
    >
      {busy ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>{busyLabel}</span>
        </>
      ) : (
        <>
          <Icon name={icon} size={20} />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

interface AuthTextLinkProps {
  href: string;
  children: ReactNode;
  /** Show a leading arrow for “back” style links. */
  back?: boolean;
  className?: string;
}

export function AuthTextLink({
  href,
  children,
  back = false,
  className = "",
}: AuthTextLinkProps) {
  return (
    <a
      href={href}
      className={
        className ||
        (back
          ? "w-full text-sm text-text-secondary hover:text-text-primary transition-smooth flex items-center justify-center space-x-2"
          : "text-sm text-primary hover:text-primary-700 transition-smooth")
      }
    >
      {back && <Icon name="ArrowLeft" size={16} />}
      <span>{children}</span>
    </a>
  );
}

interface AuthPrimaryLinkProps {
  href: string;
  children: ReactNode;
  icon?: string;
}

export function AuthPrimaryLink({
  href,
  children,
  icon,
}: AuthPrimaryLinkProps) {
  return (
    <a
      href={href}
      className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-smooth flex items-center justify-center space-x-2"
    >
      {icon ? <Icon name={icon} size={20} /> : null}
      <span>{children}</span>
    </a>
  );
}

interface AuthNoticeProps {
  children: ReactNode;
  icon?: string;
}

export function AuthNotice({ children, icon = "MailCheck" }: AuthNoticeProps) {
  return (
    <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 flex items-start space-x-3">
      <Icon
        name={icon}
        size={20}
        color="var(--color-primary)"
        className="mt-0.5 shrink-0"
      />
      <p className="text-sm text-text-secondary">{children}</p>
    </div>
  );
}

interface AuthLoadingProps {
  label?: string;
}

export function AuthLoading({ label }: AuthLoadingProps) {
  return (
    <div className="flex flex-col items-center space-y-4 py-8">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      {label ? (
        <p className="text-text-secondary text-sm">{label}</p>
      ) : null}
    </div>
  );
}
