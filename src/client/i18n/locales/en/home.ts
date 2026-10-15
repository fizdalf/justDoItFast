import type {HomeMessages} from '../es/home.js';

export const home: HomeMessages = {
  nameLabel: 'Your name or nickname',
  namePlaceholder: 'e.g. Alex, Laura, The Champ...',
  createGame: '✨ Create new game',
  joinWithCode: '🔑 Join with a code',
  packLabel: 'Starting word deck',
  packOption: (name: string, category: string, wordCount: number) =>
    `${name} (${category}) · ${wordCount} words`,
  creating: 'Creating...',
  createRoom: 'Create room',
  roomCodeLabel: 'Room code (4 letters)',
  roomCodePlaceholder: 'ABCD',
  joining: 'Joining...',
  joinRoom: 'Join room',
};
