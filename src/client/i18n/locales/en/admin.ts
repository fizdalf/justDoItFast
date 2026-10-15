import type {AdminMessages} from '../es/admin.js';

export const admin: AdminMessages = {
  title: 'Deck Administration Panel',

  login: {
    intro: 'Enter the secret admin token to manage the catalog decks.',
    tokenLabel: 'Admin Token',
    tokenPlaceholder: 'Access token...',
    submit: 'Open Panel',
    submitting: 'Authenticating...',
  },

  list: {
    newPack: '➕ New Deck',
    columns: {
      name: 'Name',
      category: 'Category',
      words: 'Words',
      type: 'Type',
      actions: 'Actions',
    },
    premium: 'PREMIUM',
    free: 'FREE',
    edit: 'Edit',
    delete: 'Delete',
    empty: 'No decks yet',
  },

  importExport: {
    exportJson: '📥 Export JSON',
    importJson: '📤 Import JSON',
  },

  form: {
    createTitle: 'Create New Word Deck',
    editTitle: 'Edit Word Deck',
    name: 'Name',
    namePlaceholder: 'e.g. Extreme Sports',
    category: 'Category',
    categoryPlaceholder: 'e.g. Sports',
    tier: 'Tier',
    tiers: {
      FREE: 'Free (FREE)',
      TIER_1: 'Tier 1 (Premium Basic)',
      TIER_2: 'Tier 2 (Premium Plus)',
    },
    description: 'Description',
    descriptionPlaceholder: 'Short description of the deck...',
    words: 'Words (separated by commas or line breaks, min. 5)',
    wordsPlaceholder: 'FOOTBALL, BASKETBALL, SURFING, TENNIS, BOXING...',
    save: 'Save Deck',
    saving: 'Saving...',
  },

  messages: {
    confirmDelete: (id: string) => `Are you sure you want to delete the deck ${id}?`,
    deleted: 'Deck deleted successfully',
    created: 'Deck created',
    updated: 'Deck updated',
    imported: (n: number) => `Imported: ${n}`,
    tooFewWords: 'The deck must contain at least 5 words',
    connectionError: 'Connection error',
    deleteFailed: 'Error deleting the deck',
    saveFailed: 'Error saving the deck',
    exportFailed: 'Error exporting',
    importNotArray: 'The file must contain a JSON array of decks',
    importFailed: (detail: string) => `Import error: ${detail}`,
  },
};
