import { enMessages } from './en';
import { slMessages } from './sl';

export const messages = {
  en: enMessages,
  sl: slMessages,
} as const;

export type MessageKey = keyof typeof slMessages;
