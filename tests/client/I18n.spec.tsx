// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import React from 'react';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {
    DEFAULT_LANGUAGE,
    detectLanguage,
    errorText,
    I18nProvider,
    Language,
    LANGUAGES,
} from '../../src/client/i18n/index.js';
import {GameProvider} from '../../src/client/context/GameContext.js';
import {Header} from '../../src/client/components/Header.js';
import {ActiveGiverView} from '../../src/client/components/views/ActiveGiverView.js';

/** Describes the shape of a dictionary: keys, value kinds and list lengths. */
function shapeOf(value: unknown): unknown {
  if (typeof value === 'function') return 'function';
  if (Array.isArray(value)) return { array: value.length };
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, shapeOf((value as Record<string, unknown>)[key])])
    );
  }
  return typeof value;
}

/** Collects every string leaf to make sure none was left empty. */
function emptyStrings(value: unknown, path = ''): string[] {
  if (typeof value === 'string') return value.trim() ? [] : [path];
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => emptyStrings(v, `${path}.${k}`));
  }
  return [];
}

const languages = Object.keys(LANGUAGES) as Language[];

describe('i18n dictionaries', () => {
  it.each(languages)('"%s" has exactly the same structure as the reference language', (lang) => {
    expect(shapeOf(LANGUAGES[lang].messages)).toEqual(shapeOf(LANGUAGES[DEFAULT_LANGUAGE].messages));
  });

  it.each(languages)('"%s" has no empty texts', (lang) => {
    expect(emptyStrings(LANGUAGES[lang].messages)).toEqual([]);
  });

  it('translates error codes and falls back to a generic error', () => {
    const { messages } = LANGUAGES.en;
    expect(errorText(messages, { code: 'ROOM_NOT_FOUND' })).toBe(messages.errors.ROOM_NOT_FOUND);
    expect(errorText(messages, { code: 'NOT_A_REAL_CODE' as any })).toBe(messages.errors.INTERNAL);
  });
});

describe('language detection', () => {
  const originalLanguages = Object.getOwnPropertyDescriptor(window.navigator, 'languages');

  function setBrowserLanguages(langs: string[]) {
    Object.defineProperty(window.navigator, 'languages', { value: langs, configurable: true });
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => {
    if (originalLanguages) Object.defineProperty(window.navigator, 'languages', originalLanguages);
  });

  it('uses the browser language when supported', () => {
    setBrowserLanguages(['en-US', 'es']);
    expect(detectLanguage()).toBe('en');
  });

  it('falls back to the default language for unsupported browsers', () => {
    setBrowserLanguages(['ja-JP']);
    expect(detectLanguage()).toBe(DEFAULT_LANGUAGE);
  });

  it('prefers the language the player chose before', () => {
    setBrowserLanguages(['en-US']);
    localStorage.setItem('sdr_language', 'es');
    expect(detectLanguage()).toBe('es');
  });
});

describe('translated UI', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('renders the game screens in the selected language', () => {
    render(
      <I18nProvider initialLanguage="en">
        <GameProvider>
          <ActiveGiverView />
        </GameProvider>
      </I18nProvider>
    );

    expect(screen.getByText(LANGUAGES.en.messages.game.holder.cutWire)).toBeDefined();
    expect(screen.queryByText(LANGUAGES.es.messages.game.holder.cutWire)).toBeNull();
  });

  it('switches language from the header, remembers it and updates the document', () => {
    render(
      <I18nProvider initialLanguage="es">
        <GameProvider>
          <Header />
        </GameProvider>
      </I18nProvider>
    );

    expect(screen.getByText(LANGUAGES.es.messages.common.gameName)).toBeDefined();

    fireEvent.change(screen.getByLabelText(LANGUAGES.es.messages.common.header.language), {
      target: { value: 'en' },
    });

    expect(screen.getByText(LANGUAGES.en.messages.common.gameName)).toBeDefined();
    expect(localStorage.getItem('sdr_language')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(document.title).toBe(LANGUAGES.en.messages.common.gameName);
  });
});
