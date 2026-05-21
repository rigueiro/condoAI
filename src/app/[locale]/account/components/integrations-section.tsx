"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import Button from "@/components/ui/button";
import type { Integration, IntegrationId } from "../types";

interface IntegrationsSectionProps {
  integrations: Integration[];
  onToggle?: (id: IntegrationId, connected: boolean) => void;
}

const ICON_BG: Record<IntegrationId, string> = {
  stripe: "bg-accent-50 text-accent",
  sepa: "bg-primary-50 text-primary",
  google: "bg-warning-50 text-warning",
  slack: "bg-success-50 text-success",
  zapier: "bg-error-50 text-error",
};

function IntegrationsSection({
  integrations,
  onToggle,
}: IntegrationsSectionProps) {
  const t = useTranslations("account.integrations");
  const tItems = useTranslations("account.integrations.items");
  const [state, setState] = useState<Integration[]>(integrations);

  React.useEffect(() => {
    setState(integrations);
  }, [integrations]);

  const handleToggle = (id: IntegrationId) => {
    setState((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, connected: !item.connected } : item,
      ),
    );
    const next = !state.find((i) => i.id === id)?.connected;
    onToggle?.(id, next);
  };

  return (
    <div className="space-y-3">
      {state.map((integration) => (
        <div
          key={integration.id}
          className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border-light hover:border-border-medium transition-smooth"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${ICON_BG[integration.id]}`}
            >
              <Icon name={integration.icon} size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-text-primary truncate">
                  {tItems(integration.id)}
                </h3>
                <span
                  className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                    integration.connected
                      ? "bg-success-50 text-success"
                      : "bg-secondary-100 text-text-secondary"
                  }`}
                >
                  {integration.connected ? t("connected") : t("disconnected")}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1 truncate">
                {tItems(`${integration.id}Desc`)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {integration.connected && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                iconName="Settings"
                className="text-text-secondary hover:text-text-primary"
              >
                {t("configure")}
              </Button>
            )}
            <Button
              type="button"
              variant={integration.connected ? "outline" : "primary"}
              size="sm"
              iconName={integration.connected ? "Unlink" : "Link"}
              onClick={() => handleToggle(integration.id)}
              className={!integration.connected ? "text-white" : undefined}
            >
              {integration.connected ? t("disconnect") : t("connect")}
            </Button>
          </div>
        </div>
      ))}

      <div className="mt-6 pt-6 border-t border-border-light">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-text-primary">
              {t("apiKeys")}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              {t("apiKeysDesc")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            iconName="KeyRound"
          >
            {t("generateKey")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default IntegrationsSection;
