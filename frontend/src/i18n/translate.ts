import type { AppLanguage } from './language';
import { messages, type MessageKey } from './messages';

type MessageParams = Record<string, string | number>;

export function translate(
  language: AppLanguage,
  key: MessageKey,
  params?: MessageParams
): string {
  const template = messages[language][key] ?? messages.sl[key] ?? key;

  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, token: string) => String(params[token] ?? ''));
}

export type Translator = (key: MessageKey, params?: MessageParams) => string;
