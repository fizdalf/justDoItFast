// @vitest-environment jsdom
import {describe, expect, it} from 'vitest';
import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {GameProvider} from '../../src/client/context/GameContext.js';
import {Header} from '../../src/client/components/Header.js';
import {ActiveGiverView} from '../../src/client/components/views/ActiveGiverView.js';
import {OpponentRefereeView} from '../../src/client/components/views/OpponentRefereeView.js';
import {TeamMateView} from '../../src/client/components/views/TeamMateView.js';
import {GameOverView} from '../../src/client/components/views/GameOverView.js';

describe('Client React Views & Components', () => {
  it('Header renders the title and keeps the controls in the menu', () => {
    render(
      <GameProvider>
        <Header />
      </GameProvider>
    );

    expect(screen.getByText(/Solo desactívala rápido/i)).toBeDefined();
    expect(screen.queryByText(/Silenciar sonido/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Menú/i }));
    expect(screen.getByRole('menu')).toBeDefined();
    expect(screen.getByText(/Silenciar sonido/i)).toBeDefined();
  });

  it('ActiveGiverView renders the artificiero role and cut-wire button', () => {
    render(
      <GameProvider>
        <ActiveGiverView />
      </GameProvider>
    );

    expect(screen.getByText(/¡tienes la bomba!/i)).toBeDefined();
    expect(screen.getByText(/¡CABLE CORTADO!/i)).toBeDefined();
  });

  it('OpponentRefereeView renders the saboteador role and foul button', () => {
    render(
      <GameProvider>
        <OpponentRefereeView />
      </GameProvider>
    );

    expect(screen.getByText(/ROL: Saboteador/i)).toBeDefined();
    expect(screen.getByText(/^¡FALTA!$/i)).toBeDefined();
  });

  it('TeamMateView renders the ayudante role and hidden word message', () => {
    render(
      <GameProvider>
        <TeamMateView />
      </GameProvider>
    );

    expect(screen.getByText(/ROL: Ayudante/i)).toBeDefined();
    expect(screen.getByText(/¡ADIVINA EN VOZ ALTA!/i)).toBeDefined();
  });

  it('GameOverView renders victory celebration and score cards', () => {
    render(
      <GameProvider>
        <GameOverView />
      </GameProvider>
    );

    expect(screen.getByText(/¡VICTORIA FINAL!/i)).toBeDefined();
    expect(screen.getByText(/Marcador Final/i)).toBeDefined();
  });
});
