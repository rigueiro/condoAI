"use client";

import { useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";

interface AuthPasswordFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function AuthPasswordField({
  id,
  name,
  label,
  value,
  onChange,
  error,
  placeholder,
  autoComplete = "new-password",
  disabled = false,
  autoFocus = false,
}: AuthPasswordFieldProps) {
  const t = useTranslations("auth");
  const [visible, setVisible] = useState(false);

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
          <Icon name="Lock" size={20} color="var(--color-secondary)" />
        </div>
        <input
          type={visible ? "text" : "password"}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-smooth disabled:opacity-60 ${
            error ? "border-error" : "border-border-medium"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:text-text-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={visible ? t("hidePassword") : t("showPassword")}
        >
          <Icon
            name={visible ? "EyeOff" : "Eye"}
            size={18}
            aria-hidden="true"
          />
        </button>
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
