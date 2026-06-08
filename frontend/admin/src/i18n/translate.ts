import type { AdminLanguage } from './language';
import { messages, type MessageKey } from './messages';

type MessageParams = Record<string, string | number>;

export function translate(
  language: AdminLanguage,
  key: MessageKey,
  params?: MessageParams
): string {
  const template = messages[language][key] ?? messages.sl[key] ?? key;

  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, token: string) => String(params[token] ?? ''));
}

export type AdminTranslator = (key: MessageKey, params?: MessageParams) => string;
