import {beforeEach, describe, expect, it} from 'vitest';
import {DeckEngine} from '../../src/core/DeckEngine.js';
import {WordPack} from '../../src/core/types.js';

describe('Specification: Virtual Deck Generation & Word Pack Catalog', () => {
  let deckEngine: DeckEngine;

  beforeEach(() => {
    deckEngine = new DeckEngine();
  });

  it('GIVEN built-in packs WHEN initialized THEN default categories (Clásico 1996, Pop, Cine, Fiesta) are available', () => {
    const packs = deckEngine.listPacks();

    expect(packs.length).toBeGreaterThanOrEqual(4);
    const packIds = packs.map((p) => p.id);
    expect(packIds).toContain('classic-1996');
    expect(packIds).toContain('pop-culture');
    expect(packIds).toContain('movies-series');
    expect(packIds).toContain('party-chaos');
  });

  it('GIVEN a selected word pack WHEN drawing words in sequence THEN words do not repeat until pack is exhausted', () => {
    const testPack: WordPack = {
      id: 'small-pack',
      name: 'Small Pack',
      description: 'Test pack',
      category: 'Test',
      isPremium: false,
      words: ['PERRO', 'GATO', 'LEÓN', 'TIGRE', 'LOBO'],
    };

    deckEngine.registerPack(testPack);
    const sessionDeck = deckEngine.createSessionDeck('small-pack');

    const drawnWords = [
      sessionDeck.drawNextWord().word,
      sessionDeck.drawNextWord().word,
      sessionDeck.drawNextWord().word,
      sessionDeck.drawNextWord().word,
      sessionDeck.drawNextWord().word,
    ];

    expect(new Set(drawnWords).size).toBe(5);
    expect(drawnWords).toEqual(expect.arrayContaining(['PERRO', 'GATO', 'LEÓN', 'TIGRE', 'LOBO']));

    // Drawing a 6th word triggers an automatic reshuffle and does not fail
    const sixthWord = sessionDeck.drawNextWord();
    expect(testPack.words).toContain(sixthWord.word);
  });

  it('GIVEN premium and free packs WHEN queried THEN price tiers and premium flags are properly structured for monetization', () => {
    const packs = deckEngine.listPacks();
    const premiumPacks = packs.filter((p) => p.isPremium);

    premiumPacks.forEach((p) => {
      expect(p.priceTier).toMatch(/^(TIER_1|TIER_2)$/);
      expect(p.words.length).toBeGreaterThan(0);
    });
  });

  it('GIVEN an administrator WHEN adding or updating a custom word pack THEN pack is validated and persisted in catalog', () => {
    const customPack = deckEngine.createCustomPack({
      name: 'Navidad y Fiestas',
      description: 'Palabras temáticas navideñas',
      category: 'Estacional',
      isPremium: false,
      words: ['TURRÓN', 'CAMPANADAS', 'REGALOS', 'ÁRBOL', 'GUIRNALDA'],
    });

    expect(customPack.id).toBeDefined();
    expect(deckEngine.getPack(customPack.id)).toEqual(customPack);
  });

  it('GIVEN invalid pack data (less than 5 words) WHEN creating a pack THEN validation error is raised', () => {
    expect(() => {
      deckEngine.createCustomPack({
        name: 'Incompleto',
        description: 'Pocas palabras',
        category: 'Test',
        isPremium: false,
        words: ['UNO', 'DOS'],
      });
    }).toThrow(/A word pack must contain at least 5/);
  });

  it('GIVEN duplicate words and spaces WHEN registering a pack THEN words are sanitized and deduplicated', () => {
    const pack = deckEngine.createCustomPack({
      name: 'Duplicados Pack',
      description: 'Test duplicates',
      category: 'Test',
      isPremium: false,
      words: ['perro ', 'GATO', ' PERRO', 'ratón', 'PÁJARO', 'león'],
    });

    expect(pack.words).toContain('PERRO');
    expect(pack.words).toContain('RATÓN');
    expect(pack.words.filter((w) => w === 'PERRO').length).toBe(1);
    expect(pack.words.length).toBe(5);
  });

  it('GIVEN an existing pack WHEN updated THEN changes are reflected and validated', () => {
    const updated = deckEngine.updatePack('classic-1996', {
      name: 'Expresión Clásica Remastered',
    });

    expect(updated.name).toBe('Expresión Clásica Remastered');
    expect(deckEngine.getPack('classic-1996')?.name).toBe('Expresión Clásica Remastered');
  });

  it('GIVEN a pack id WHEN deleted THEN it is removed from catalog', () => {
    const custom = deckEngine.createCustomPack({
      name: 'Temporal',
      description: 'Para borrar',
      category: 'Temp',
      isPremium: false,
      words: ['UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO'],
    });

    expect(deckEngine.getPack(custom.id)).toBeDefined();
    const deleted = deckEngine.deletePack(custom.id);
    expect(deleted).toBe(true);
    expect(deckEngine.getPack(custom.id)).toBeUndefined();
  });

  it('GIVEN catalog WHEN querying categories and filters THEN correct subsets are returned', () => {
    const categories = deckEngine.getCategories();
    expect(categories).toContain('Clásico');
    expect(categories).toContain('Cultura Pop');

    const classicOnly = deckEngine.listPacks({ category: 'Clásico' });
    expect(classicOnly.every((p) => p.category === 'Clásico')).toBe(true);

    const premiumOnly = deckEngine.listPacks({ isPremium: true });
    expect(premiumOnly.every((p) => p.isPremium)).toBe(true);
  });

  it('GIVEN packs WHEN exported and imported THEN catalog is synchronized', () => {
    const exported = deckEngine.exportPacks();
    expect(exported.length).toBeGreaterThanOrEqual(4);

    const newEngine = new DeckEngine();
    const imported = newEngine.importPacks(exported, true);
    expect(imported.imported).toBe(exported.length);
  });

  describe('combining several packs in one game deck', () => {
    const animals: WordPack = {
      id: 'animals',
      name: 'Animales',
      description: 'Test',
      category: 'Animales',
      isPremium: false,
      words: ['PERRO', 'GATO', 'LEÓN', 'TIGRE', 'LOBO'],
    };
    const food: WordPack = {
      id: 'food',
      name: 'Comida',
      description: 'Test',
      category: 'Comida',
      isPremium: false,
      words: ['PAN', 'QUESO', 'Gato', 'SOPA', 'ARROZ'],
    };

    beforeEach(() => {
      deckEngine.registerPack(animals);
      deckEngine.registerPack(food);
    });

    function drawAll(packIds: string | string[]) {
      const deck = deckEngine.createSessionDeck(packIds);
      const total = deck.getTotalWordsCount();
      return { total, cards: Array.from({ length: total }, () => deck.drawNextWord()) };
    }

    it('GIVEN two packs WHEN a deck is created THEN it contains the words of both, each with the category of its pack', () => {
      const { total, cards } = drawAll(['animals', 'food']);

      expect(total).toBe(9);
      expect(cards.find((c) => c.word === 'PERRO')?.category).toBe('Animales');
      expect(cards.find((c) => c.word === 'QUESO')?.category).toBe('Comida');
      expect(new Set(cards.map((c) => c.word)).size).toBe(9);
    });

    it('GIVEN a word repeated across packs (written in different case) WHEN combined THEN it appears once, from the first pack', () => {
      const { cards } = drawAll(['animals', 'food']);

      const gatos = cards.filter((c) => c.word.toLowerCase() === 'gato');
      expect(gatos).toHaveLength(1);
      expect(gatos[0]).toEqual({ word: 'GATO', category: 'Animales' });

      const reversed = drawAll(['food', 'animals']).cards.filter((c) => c.word.toLowerCase() === 'gato');
      expect(reversed).toHaveLength(1);
      expect(reversed[0].category).toBe('Comida');
    });

    it('GIVEN no packs WHEN creating a deck THEN NO_PACKS_SELECTED is raised', () => {
      expect(() => deckEngine.createSessionDeck([])).toThrow(expect.objectContaining({ code: 'NO_PACKS_SELECTED' }));
    });

    it('GIVEN an unknown pack among valid ones WHEN creating a deck THEN PACK_NOT_FOUND is raised', () => {
      expect(() => deckEngine.createSessionDeck(['animals', 'does-not-exist'])).toThrow(
        expect.objectContaining({ code: 'PACK_NOT_FOUND' })
      );
    });
  });
});
