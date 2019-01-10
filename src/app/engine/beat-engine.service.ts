import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AudioBackendService, InstrumentPlayer, PropertyWatcher } from './audio-backend.service';
import { INoteSpec } from './beat-engine.service';

import { IInstrument, IMachine } from './machine-interfaces';

export interface INoteSpec {
  beatOffset: number;
  sampleName: string;
  velocity?: number;
}

@Injectable()
export class BeatEngineService {
  private nextBeatIndex: number;

  private interval: number | null;
  private animationFrameRequest: number | null;
  private instrumentPlayers: { [key: string]: InstrumentPlayer };
  private _machine: IMachine;
  private _beatSubject = new Subject<number>();

  constructor(private zone: NgZone, private mixer: AudioBackendService) {
    this.mixer.init();
    this.nextBeatIndex = 0;
    this.instrumentPlayers = {};

    this.machine = {
      bpm: 60,
      keyNote: 1,
      duration: 60,
      instruments: [
        {
          activeProgram: 0,
          enabled: true,
          id: 'boom',
          keyedInstrument: false,
          leftHandPitchOffset: 0,
          pitchOffset: 0,
          volume: 1,
          title: 'yay',
          playBothHands: false,
          respectsClave: false,
          programs: [
            {
              title: 'boom',
              length: 60,
              notes: [
                {
                  index: 59,
                  pitch: 0
                },]
            }]
        },
        {
          activeProgram: 0,
          enabled: true,
          id: 'beep',
          keyedInstrument: false,
          leftHandPitchOffset: 0,
          pitchOffset: 0,
          volume: 1,
          title: 'yay',
          playBothHands: false,
          respectsClave: false,
          programs: [
            {
              title: 'beep',
              length: 60,
              notes: [
                {
                  index: 1,
                  pitch: 0
                },
                {
                  index: 5,
                  pitch: 0
                },
                {
                  index: 9,
                  pitch: 0
                },
                {
                  index: 13,
                  pitch: 0
                },
                {
                  index: 17,
                  pitch: 0
                },
                {
                  index: 20,
                  pitch: 0
                },
                {
                  index: 23,
                  pitch: 0
                },
                {
                  index: 26,
                  pitch: 0
                },
                {
                  index: 29,
                  pitch: 0
                },
                {
                  index: 32,
                  pitch: 0
                },
                {
                  index: 35,
                  pitch: 0
                },
                {
                  index: 38,
                  pitch: 0
                },
                {
                  index: 40,
                  pitch: 0
                },
                {
                  index: 42,
                  pitch: 0
                },
                {
                  index: 44,
                  pitch: 0
                },
                {
                  index: 46,
                  pitch: 0
                },
                {
                  index: 48,
                  pitch: 0
                },
                {
                  index: 50,
                  pitch: 0
                },
                {
                  index: 52,
                  pitch: 0
                },
                {
                  index: 54,
                  pitch: 0
                },
                { index: 56, pitch: 0 },
                { index: 58, pitch: 0 },

              ]
            }
          ]
        }
      ],
      flavor: 'Salsa'
    };

  }

  get machine() {
    return this._machine;
  }

  set machine(value: IMachine) {
    if ( value !== this._machine ) {
      this._machine = value;
      if ( this.machine ) {
        if ( this.playing ) {
          this.stop();
          this.start();
        }
        new PropertyWatcher(this.machine, 'bpm')
          .register(newValue => {
            if ( this.playing ) {
              if ( this.interval ) {
                clearTimeout(this.interval);
              }
              this.stopAllInstruments();
              this.mixer.reset();
              this.nextBeatIndex = 0;
              this.scheduleBuffers();
            }
          });

        new PropertyWatcher(this.machine, 'keyNote')
          .register(newValue => {
            if ( this.playing ) {
              this.machine.instruments
                .filter(instrument => instrument.keyedInstrument)
                .map(instrument => this.rescheduleInstrument(instrument));
            }
          });
      }
    }
  }

  public start() {
    this.mixer.context.resume();
    this.scheduleBuffers();
    this.zone.runOutsideAngular(() => {
      this.beatTick();
    });
  }

  private scheduleBuffers() {
    if ( this.mixer.ready ) {
      const beatTime = this.beatTime;
      while ((this.nextBeatIndex - this.getBeatIndex()) < this.machine.duration / 2) {
        console.log(this.nextBeatIndex, this.getBeatIndex(), this.machine.duration);
        const beatIndex = this.nextBeatIndex;
        this.machine.instruments.forEach(instrument => {
          let instrumentPlayer = this.instrumentPlayers[instrument.id];
          if ( !instrumentPlayer ) {
            instrumentPlayer = new InstrumentPlayer(this.mixer.context, instrument);
            instrumentPlayer.onChange.subscribe(() => {
              this.rescheduleInstrument(instrument);
            });
            this.instrumentPlayers[instrument.id] = instrumentPlayer;
          }
          this.instrumentNotes(instrument, beatIndex).forEach(note => {
            this.mixer.play(note.sampleName, instrumentPlayer, (beatIndex + note.beatOffset) * beatTime, note.velocity);
          });
        });
        this.nextBeatIndex++;
      }
    } else {
      console.log('Mixer not ready yet');
    }
    // this.zone.runOutsideAngular(() => {
    //   this.interval = setTimeout(() => this.scheduleBuffers(), 1000);
    // });
  }

  rescheduleInstrument(instrument: IInstrument) {
    const player = this.instrumentPlayers[instrument.id];
    player.reset();
    const beatTime = this.beatTime;
    for ( let beatIndex = Math.round(this.getBeatIndex()); beatIndex < this.nextBeatIndex; beatIndex++ ) {
      this.instrumentNotes(instrument, beatIndex).forEach(note => {
        this.mixer.play(note.sampleName, player, (beatIndex + note.beatOffset) * beatTime, note.velocity);
      });
    }
  }

  private instrumentNotes(instrument: IInstrument, beatIndex: number): INoteSpec[] {
    const result: INoteSpec[] = [];
    if ( instrument.enabled ) {
      const program = instrument.programs[instrument.activeProgram];
      beatIndex = beatIndex % (program.length / 2);
      program.notes
        .filter(note => (note.index === beatIndex * 2) || (note.index === beatIndex * 2 + 1))
        .forEach(note => {
          let pitch = note.pitch;
          const beatOffset = note.index === beatIndex * 2 ? 0 : 0.5;
          if ( instrument.keyedInstrument ) {
            pitch += this.machine.keyNote;
          }
          if ( note.hand !== 'left' ) {
            result.push({
              sampleName: instrument.id + '-' + (pitch + instrument.pitchOffset),
              beatOffset,
              velocity: note.velocity
            });
            if ( note.pianoTonic ) {
              result.push({
                sampleName: instrument.id + '-' + (pitch + instrument.pitchOffset + 12),
                beatOffset,
                velocity: note.velocity
              });
            }
          }
          if ( instrument.playBothHands && note.hand !== 'right' ) {
            result.push({
              sampleName: instrument.id + '-' + (pitch + instrument.leftHandPitchOffset),
              beatOffset,
              velocity: note.velocity
            });
          }
        });
    }
    return result;
  }

  private stopAllInstruments() {
    Object.keys(this.instrumentPlayers).forEach(key => {
      this.instrumentPlayers[key].reset();
    });
  }

  public stop() {
    if ( this.interval ) {
      clearTimeout(this.interval);
      this.interval = null;
    }
    if ( this.animationFrameRequest ) {
      cancelAnimationFrame(this.animationFrameRequest);
      this.animationFrameRequest = null;
    }
    this.stopAllInstruments();
    this.mixer.reset();
    this.nextBeatIndex = 0;
  }

  get playing() {
    return this.interval != null;
  }

  get beat(): Observable<number> {
    return this._beatSubject;
  }

  get beatTime() {
    const result = 60. / this.machine.bpm;
    return this.machine.flavor === 'Merengue' ? result / 2 : result;
  }

  public getBeatIndex() {
    return this.mixer.getCurrentTime() / this.beatTime;
  }

  private timeToNextBeat() {
    return this.mixer.getCurrentTime() % this.beatTime;
  }

  private beatTick() {
    if ( this.getBeatIndex() >= (this._machine.duration + 2) / 2 ) {
      this.stop();
      return;
    }
    this._beatSubject.next(this.getBeatIndex());
    this.animationFrameRequest = requestAnimationFrame(() => this.beatTick());
  }

  getBuffer() {
    return this.mixer.getBuffer();
  }
}
