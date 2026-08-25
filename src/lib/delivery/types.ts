/** Client-local outbound delivery until a real email/SMS provider exists. */

export type DeliveryChannel = "email" | "sms";

export type DeliveryKind =
  | "payment-reminder"
  | "payment-escalation"
  | "collections-digest"
  | "compliance-digest"
  | "assembly-summons"
  | "owner-mailing";

export type OutboundMessage = {
  id: string;
  channel: DeliveryChannel;
  to: string;
  subject?: string;
  body: string;
  kind: DeliveryKind;
  relatedIds: string[];
  createdAt: string;
  status: "sent";
};

export type DeliverInput = {
  channel: DeliveryChannel;
  to: string;
  subject?: string;
  body: string;
  kind: DeliveryKind;
  relatedIds?: string[];
};
