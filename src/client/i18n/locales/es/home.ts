export const home = {
  nameLabel: 'Tu nombre o apodo',
  namePlaceholder: 'Ej: Alex, Laura, El Crack...',
  createGame: '✨ Crear nueva partida',
  joinWithCode: '🔑 Unirse con código',
  packLabel: 'Mazo de palabras inicial',
  packOption: (name: string, category: string, wordCount: number) =>
    `${name} (${category}) · ${wordCount} palabras`,
  creating: 'Creando...',
  createRoom: 'Crear sala',
  roomCodeLabel: 'Código de sala (4 letras)',
  roomCodePlaceholder: 'ABCD',
  joining: 'Entrando...',
  joinRoom: 'Entrar a la sala',
};

export type HomeMessages = typeof home;
