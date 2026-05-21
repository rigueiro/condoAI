"use client";

import React, { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";

interface ProfileAvatarProps {
  name: string;
  avatar: string | null | undefined;
  onChange: (next: string | null) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg"];

const getInitials = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

function ProfileAvatar({
  name,
  avatar,
  onChange,
  disabled = false,
}: ProfileAvatarProps) {
  const t = useTranslations("profile.avatar");
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(t("invalidType"));
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(t("tooLarge"));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setError(null);
          onChange(reader.result);
        }
      };
      reader.readAsDataURL(file);
    },
    [onChange, t],
  );

  const handleRemove = useCallback(() => {
    setError(null);
    onChange(null);
  }, [onChange]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-semibold overflow-hidden border border-border-light">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{getInitials(name) || "?"}</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSelectClick}
          disabled={disabled}
          aria-label={t("upload")}
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-surface border border-border-medium shadow-sm text-text-secondary hover:text-primary hover:border-primary transition-smooth flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name="Camera" size={16} />
        </button>
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-medium text-text-primary">{t("title")}</h3>
        <p className="text-xs text-text-secondary mt-1">{t("description")}</p>

        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            iconName="Upload"
            onClick={handleSelectClick}
            disabled={disabled}
          >
            {t("upload")}
          </Button>
          {avatar && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconName="Trash2"
              onClick={handleRemove}
              disabled={disabled}
              className="text-error hover:text-error"
            >
              {t("remove")}
            </Button>
          )}
        </div>

        {error && (
          <p className="mt-2 text-xs text-error flex items-center gap-1">
            <Icon name="AlertCircle" size={14} />
            <span>{error}</span>
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

export default ProfileAvatar;
