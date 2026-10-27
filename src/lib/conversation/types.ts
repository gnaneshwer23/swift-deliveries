import type { TurnInput, UnderstoodCard } from "./interpret";

/** How long a conversation is kept after its last line, chosen by the founder. */
export const RETENTION_DAYS = [1, 7, 30, 90] as const;
export type RetentionDays = (typeof RETENTION_DAYS)[number];
export const DEFAULT_RETENTION_DAYS: RetentionDays = 30;

export type Conversation = {
  id: string;
  retentionDays: RetentionDays;
  createdAt: string;
  lastTurnAt: string;
  retainUntil: string;
};

/** A line of a conversation. Founder lines never carry a card; assistant lines always do. */
export type ConversationTurn = { id: string; text: string; createdAt: string } & (
  | { speaker: "founder"; input: TurnInput; card: null }
  | { speaker: "assistant"; input: "assistant"; card: UnderstoodCard }
);
