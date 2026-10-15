import {WordPack} from './types.js';
import {CardPayload} from './TurnManager.js';

import {GameError} from './errors.js';

export interface SessionDeck {
  drawNextWord(): CardPayload;
  getRemainingWordsCount(): number;
  getTotalWordsCount(): number;
  reset(): void;
}

export interface DeckEngineOptions {
  customPacks?: WordPack[];
}

export class DeckEngine {
  private packs: Map<string, WordPack> = new Map();

  constructor(options?: DeckEngineOptions) {
    this.seedDefaultPacks();
    if (options?.customPacks) {
      for (const pack of options.customPacks) {
        this.registerPack(pack);
      }
    }
  }

  listPacks(filter?: { category?: string; isPremium?: boolean }): WordPack[] {
    let result = Array.from(this.packs.values());
    if (filter) {
      if (filter.category) {
        const cat = filter.category.toLowerCase();
        result = result.filter((p) => p.category.toLowerCase() === cat);
      }
      if (filter.isPremium !== undefined) {
        result = result.filter((p) => p.isPremium === filter.isPremium);
      }
    }
    return result;
  }

  getCategories(): string[] {
    const categories = new Set<string>();
    for (const pack of this.packs.values()) {
      if (pack.category) {
        categories.add(pack.category);
      }
    }
    return Array.from(categories);
  }

  getPack(id: string): WordPack | undefined {
    return this.packs.get(id);
  }

  registerPack(pack: WordPack): void {
    this.validatePack(pack);
    this.packs.set(pack.id, {
      ...pack,
      words: this.sanitizeWords(pack.words),
    });
  }

  createCustomPack(data: Omit<WordPack, 'id'>): WordPack {
    const id = `pack_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newPack: WordPack = {
      ...data,
      id,
      words: this.sanitizeWords(data.words),
    };

    this.validatePack(newPack);
    this.packs.set(id, newPack);
    return newPack;
  }

  updatePack(id: string, data: Partial<Omit<WordPack, 'id'>>): WordPack {
    const existing = this.packs.get(id);
    if (!existing) {
      throw new GameError('PACK_NOT_FOUND', `Word pack with id '${id}' not found`);
    }

    const updatedPack: WordPack = {
      ...existing,
      ...data,
      id: existing.id,
      words: data.words ? this.sanitizeWords(data.words) : existing.words,
    };

    this.validatePack(updatedPack);
    this.packs.set(id, updatedPack);
    return updatedPack;
  }

  deletePack(id: string): boolean {
    return this.packs.delete(id);
  }

  exportPacks(): WordPack[] {
    return Array.from(this.packs.values());
  }

  importPacks(packs: WordPack[], overwrite = true): { imported: number; skipped: number } {
    let imported = 0;
    let skipped = 0;

    for (const pack of packs) {
      if (!overwrite && this.packs.has(pack.id)) {
        skipped++;
        continue;
      }
      this.registerPack(pack);
      imported++;
    }

    return { imported, skipped };
  }

  /**
   * Mazo de una partida: uno o varios packs combinados. Las palabras repetidas entre
   * packs aparecen una sola vez (gana el primer pack) y cada una conserva su categoría.
   */
  createSessionDeck(packIds: string | string[]): SessionDeck {
    const ids = Array.isArray(packIds) ? packIds : [packIds];
    if (ids.length === 0) {
      throw new GameError('NO_PACKS_SELECTED', `At least one word pack is required`);
    }

    const cardsByWord = new Map<string, CardPayload>();
    for (const id of ids) {
      const pack = this.packs.get(id);
      if (!pack) {
        throw new GameError('PACK_NOT_FOUND', `Word pack ${id} not found`);
      }
      for (const word of pack.words) {
        const key = word.toLocaleLowerCase();
        if (!cardsByWord.has(key)) cardsByWord.set(key, { word, category: pack.category });
      }
    }

    const allCards = [...cardsByWord.values()];
    let currentPool: CardPayload[] = this.shuffle([...allCards]);

    return {
      drawNextWord: (): CardPayload => {
        if (currentPool.length === 0) {
          currentPool = this.shuffle([...allCards]);
        }
        return { ...currentPool.pop()! };
      },
      getRemainingWordsCount: (): number => currentPool.length,
      getTotalWordsCount: (): number => allCards.length,
      reset: (): void => {
        currentPool = this.shuffle([...allCards]);
      },
    };
  }

  private sanitizeWords(words: string[]): string[] {
    if (!words) return [];
    const cleaned = words
      .map((w) => (typeof w === 'string' ? w.trim().toUpperCase() : ''))
      .filter((w) => w.length > 0);

    // Eliminar duplicados
    return Array.from(new Set(cleaned));
  }

  private validatePack(pack: WordPack): void {
    if (!pack.name || pack.name.trim().length === 0) {
      throw new GameError('PACK_NAME_REQUIRED', `Pack name cannot be empty`);
    }
    if (!pack.category || pack.category.trim().length === 0) {
      throw new GameError('PACK_CATEGORY_REQUIRED', `Pack category cannot be empty`);
    }
    const sanitized = this.sanitizeWords(pack.words);
    if (sanitized.length < 5) {
      throw new GameError('PACK_TOO_FEW_WORDS', `A word pack must contain at least 5 unique valid words`);
    }
  }

  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private seedDefaultPacks(): void {
    const defaultPacks: WordPack[] = [
      {
        id: 'classic-1996',
        name: 'Clásicos de Siempre',
        description: 'La selección original de conceptos y palabras del juego físico de 1996.',
        category: 'Clásico',
        isPremium: false,
        priceTier: 'FREE',
        words: [
          'BICICLETA', 'GUITARRA', 'ASTRONAUTA', 'PIRÁMIDE', 'SUBMARINO',
          'TRAMPOLÍN', 'VOLCÁN', 'DINOSAURIO', 'MICROONDAS', 'LABERINTO',
          'MARIONETA', 'ESCALERA', 'TELEFÉRICO', 'BRÚJULA', 'ACORDEÓN',
          'HEMISFERIO', 'HURACÁN', 'SEMÁFORO', 'MURCIÉLAGO', 'HORMIGUERO',
          'PARACAÍDAS', 'ESFINGE', 'HELICÓPTERO', 'METEORITO', 'SUBE Y BAJA',
          'MALETÍN', 'CALEIDOSCOPIO', 'TERMÓMETRO', 'FERROCARRIL', 'CATARATA'
        ],
      },
      {
        id: 'pop-culture',
        name: 'Cultura Pop & Memes',
        description: 'Iconos modernos, expresiones virales y cultura popular contemporánea.',
        category: 'Cultura Pop',
        isPremium: false,
        priceTier: 'FREE',
        words: [
          'TIKTOK', 'STREAMER', 'SPOILER', 'EMOJI', 'SELFIE',
          'MULTIVERSO', 'INFLUENCER', 'PODCAST', 'VIRAL', 'HASHTAG',
          'AVATAR', 'HACKATHON', 'ALGORITMO', 'MARVEL', 'NETFLIX',
          'TREND', 'CHALLENGE', 'POSTUREO', 'STALKER', 'CRINGE',
          'MEME', 'CHISME', 'STORIES', 'COSPLAY', 'FOLLOWER'
        ],
      },
      {
        id: 'movies-series',
        name: 'Cine & Series de Culto',
        description: 'Películas legendarias, personajes inolvidables y momentos del cine.',
        category: 'Entretenimiento',
        isPremium: true,
        priceTier: 'TIER_1',
        words: [
          'GLADIADOR', 'MATRIX', 'TITANIC', 'HARRY POTTER', 'STAR WARS',
          'EL PADRINO', 'JURASSIC PARK', 'AVENGERS', 'CASABLANCA', 'PULP FICTION',
          'STRANGER THINGS', 'BREAKING BAD', 'GAME OF THRONES', 'INTERSTELLAR', 'INCEPTION',
          'FORREST GUMP', 'EL SEÑOR DE LOS ANILLOS', 'SHREK', 'BACK TO THE FUTURE', 'COCO'
        ],
      },
      {
        id: 'party-chaos',
        name: 'Fiesta & Caos',
        description: 'Palabras delirantes y situaciones embarazosas para noches de fiesta.',
        category: 'Fiesta',
        isPremium: true,
        priceTier: 'TIER_2',
        words: [
          'RESACA', 'KARAOKE', 'DISFRAZ', 'CONFETI', 'CHUPITO',
          'DESPEDIDA', 'PIÑATA', 'DISCOTECA', 'FESTIVAL', 'DJ',
          'BARRA LIBRE', 'AFTERPARTY', 'PERREO', 'ANÉCDOTA', 'GUIRNALDA',
          'BOTELLÓN', 'TARIMA', 'KILOMBO', 'FIESTERO', 'BRINDIS'
        ],
      },
    ];

    defaultPacks.forEach((p) => this.registerPack(p));
  }
}
