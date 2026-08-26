export interface Organization {
  name: string;
  legalName: string;
  taxId: string;
  email: string;
  phone: string;
  website: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  country: string;
}

export type SubscriptionPlanId = "starter" | "professional" | "enterprise";

export type BillingCycle = "monthly" | "yearly";

export interface SubscriptionLimit {
  used: number;
  limit: number | null;
}

export interface Subscription {
  planId: SubscriptionPlanId;
  cycle: BillingCycle;
  renewsAt: string;
  trialEndsAt?: string;
  usage: {
    properties: SubscriptionLimit;
    units: SubscriptionLimit;
    users: SubscriptionLimit;
    storageMb: SubscriptionLimit;
  };
}

export interface PaymentMethod {
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
}

export type InvoiceStatus = "paid" | "pending" | "failed" | "refunded";

export interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
}

import type { TeamRole, TeamStatus } from "@/lib/team/types";

export type { TeamRole, TeamStatus };

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamStatus;
  lastActiveAt?: string;
  isCurrentUser?: boolean;
}

export type IntegrationId = "stripe" | "sepa" | "google" | "slack" | "zapier";

export interface Integration {
  id: IntegrationId;
  icon: string;
  connected: boolean;
}
