import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import type {ApiErrorCode} from '../../server/protocol.js';
import {es, Messages} from './locales/es/index.js';
import {en} from './locales/en/index.js';

export type { Messages } from './locales/es/index.js';

export const LANGUAGES = {
  es: { label: 'Español', messages: es },
  en: { label: 'English', messages: en },
} satisfies Record<string, { label: string; messages: Messages }>;

export type Language = keyof typeof LANGUAGES;

export const DEFAULT_LANGUAGE: Language = 'es';
const STORAGE_KEY = 'sdr_language';

function isLanguage(value: string | null | undefined): value is Language {
  return !!value && value in LANGUAGES;
}

/** Idioma guardado por el jugador; si no hay, el del navegador; si no, el por defecto. */
export function detectLanguage(): Language {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLanguage(stored)) return stored;
  }
  if (typeof navigator !== 'undefined') {
    for (const tag of navigator.languages ?? [navigator.language]) {
      const base = tag?.toLowerCase().split('-')[0];
      if (isLanguage(base)) return base;
    }
  }
  return DEFAULT_LANGUAGE;
}

interface I18nContextValue {
  lang: Language;
  t: Messages;
  setLang: (lang: Language) => void;
}

// Sin proveedor (p. ej. en tests) se usa el idioma por defecto.
const I18nContext = createContext<I18nContextValue>({
  lang: DEFAULT_LANGUAGE,
  t: LANGUAGES[DEFAULT_LANGUAGE].messages,
  setLang: () => {},
});

export const I18nProvider: React.FC<{ children: React.ReactNode; initialLanguage?: Language }> = ({
  children,
  initialLanguage,
}) => {
  const [lang, setLangState] = useState<Language>(() => initialLanguage ?? detectLanguage());
  const t = LANGUAGES[lang].messages;

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.title = t.common.gameName;
    }
  }, [lang, t]);

  const value = useMemo(() => ({ lang, t, setLang }), [lang, t, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => useContext(I18nContext);

/** Texto traducido para un error recibido del servidor o de la conexión. */
export function errorText(t: Messages, error: { code: ApiErrorCode }): string {
  return t.errors[error.code] ?? t.errors.INTERNAL;
}
