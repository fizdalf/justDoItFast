// Panel de administración de mazos.
export const admin = {
  title: 'Panel de Administración de Mazos',

  login: {
    intro: 'Introduce el token secreto de administrador para gestionar los mazos del catálogo.',
    tokenLabel: 'Admin Token',
    tokenPlaceholder: 'Token de acceso...',
    submit: 'Acceder al Panel',
    submitting: 'Autenticando...',
  },

  list: {
    newPack: '➕ Nuevo Mazo',
    columns: {
      name: 'Nombre',
      category: 'Categoría',
      words: 'Palabras',
      type: 'Tipo',
      actions: 'Acciones',
    },
    premium: 'PREMIUM',
    free: 'GRATIS',
    edit: 'Editar',
    delete: 'Borrar',
    empty: 'No hay mazos registrados',
  },

  importExport: {
    exportJson: '📥 Exportar JSON',
    importJson: '📤 Importar JSON',
  },

  form: {
    createTitle: 'Crear Nuevo Mazo de Palabras',
    editTitle: 'Editar Mazo de Palabras',
    name: 'Nombre',
    namePlaceholder: 'Ej: Deportes Extremos',
    category: 'Categoría',
    categoryPlaceholder: 'Ej: Deportes',
    tier: 'Tier',
    tiers: {
      FREE: 'Gratis (FREE)',
      TIER_1: 'Tier 1 (Prémium Básico)',
      TIER_2: 'Tier 2 (Prémium Plus)',
    },
    description: 'Descripción',
    descriptionPlaceholder: 'Breve descripción del mazo...',
    words: 'Palabras (separadas por comas o saltos de línea, mín. 5)',
    wordsPlaceholder: 'FÚTBOL, BALONCESTO, SURF, TENIS, BOXEO...',
    save: 'Guardar Mazo',
    saving: 'Guardando...',
  },

  messages: {
    confirmDelete: (id: string) => `¿Seguro que deseas eliminar el mazo ${id}?`,
    deleted: 'Mazo eliminado con éxito',
    created: 'Mazo creado',
    updated: 'Mazo actualizado',
    imported: (n: number) => `Importados: ${n}`,
    tooFewWords: 'El mazo debe contener al menos 5 palabras',
    connectionError: 'Error de conexión',
    deleteFailed: 'Error al eliminar',
    saveFailed: 'Error al guardar el mazo',
    exportFailed: 'Error al exportar',
    importNotArray: 'El archivo debe contener un array JSON de mazos',
    importFailed: (detail: string) => `Error de importación: ${detail}`,
  },
};

export type AdminMessages = typeof admin;
