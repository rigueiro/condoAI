"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/icon";
import { useFormatCurrency } from "@/hooks/use-format-currency";

type Activity = {
  id: number | string;
  type: "payment" | "owner" | "property" | "maintenance" | string;
  title: string;
  description: string;
  timestamp: number | Date;
  amount?: number;
  icon: string;
  iconColor: string;
};

function RecentActivity({ activities }: { activities: Activity[] }) {
  const t = useTranslations("dashboard.recentActivity");
  const { formatCurrency } = useFormatCurrency();

  const formatTimeAgo = (timestamp: number | Date) => {
    if (timestamp instanceof Date) {
      timestamp = timestamp.getTime();
    }

    const now = new Date();
    const diff = now.getTime() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return t("minutesAgo", { count: minutes });
    }
    if (hours < 24) {
      return t("hoursAgo", { count: hours });
    }
    return t("daysAgo", { count: days });
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case "payment":
        return "bg-success-50 border-success-100";
      case "owner":
        return "bg-primary-50 border-primary-100";
      case "property":
        return "bg-accent-50 border-accent-100";
      case "maintenance":
        return "bg-secondary-50 border-secondary-200";
      default:
        return "bg-secondary-50 border-secondary-200";
    }
  };

  return (
    <div className="bg-surface rounded-lg p-6 shadow-card border border-border-light">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text-primary">
          {t("title")}
        </h2>
        <button className="text-primary hover:text-primary-700 text-sm font-medium transition-smooth">
          {t("viewAll")}
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-4 p-4 rounded-lg hover:bg-secondary-50 transition-smooth"
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center border ${getActivityTypeColor(activity.type)}`}
            >
              <Icon name={activity.icon} size={20} color={activity.iconColor} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-text-primary truncate">
                  {activity.title}
                </h3>
                <span className="text-xs text-text-secondary ml-2 flex-shrink-0">
                  {formatTimeAgo(activity.timestamp)}
                </span>
              </div>

              <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                {activity.description}
              </p>

              {activity.amount && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-50 text-success-700">
                    +{formatCurrency(activity.amount)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border-light">
        <button className="w-full text-center text-primary hover:text-primary-700 text-sm font-medium py-2 transition-smooth">
          {t("viewMore")}
        </button>
      </div>
    </div>
  );
}

export default RecentActivity;
