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

export type ConversationTurn = {
  id: string;
  speaker: "founder" | "assistant";
  input: TurnInput | "assistant";
  text: string;
  card: UnderstoodCard | null;
  createdAt: string;
};
