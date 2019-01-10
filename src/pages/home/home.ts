import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { NavController } from 'ionic-angular';
import { BeatEngineService } from '../../app/engine/beat-engine.service';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit {


  beep: HTMLAudioElement;
  beepBuffer: AudioBuffer;
  beepSource: AudioBufferSourceNode;
  audioCtx = new AudioContext();
  private counter: number;
  private timer: number;
  private boom: HTMLAudioElement;

  constructor(public navCtrl: NavController, private http: HttpClient,
              private beatMachine: BeatEngineService
  ) {
    this.beep = new Audio('assets/sounds/beep-02.wav');
    this.boom = new Audio('assets/sounds/airHorn.wav');
    const audioCtx = new AudioContext();

    this.beepSource = audioCtx.createBufferSource();

    this.http.get('assets/sounds/beep.wav', {
      observe: 'response',
      responseType: 'arraybuffer'
    }).subscribe((response) => {
      audioCtx.decodeAudioData(response.body).then((result) => {
        this.beepBuffer = result;
      });
    });


  }

  startCountDown() {


  }


  playAudio() {
    //   let thing = performance.now();
    //   const source = this.audioCtx.createBufferSource();
    //   source.buffer = this.beepBuffer;
    //   source.connect(this.audioCtx.destination);
    //   source.start(0, 0, 1.5);
    //   source.onended = () => {
    //     console.log(performance.now() - thing);
    //     console.log('this has stopped');
    //   };
    // this.beatMachine.start();

    // duración entre 5 y 10 segundos

    const duration = Math.floor((Math.random() * 20) + 15);
    // console.log(duration);
    this.counter = 0;

    this.timer = setInterval(() => {
      if ( this.counter < (duration * 1000) / 2 ) {
        // console.log('first third');
        if ( this.counter % 1000 == 0 ) {
          this.beep.play();
        }
      }

      if ( this.counter > (duration * 1000) / 2 && this.counter < (duration * 1000 / 3 + duration * 1000 / 2) ) {
        // console.log('second third');
        if ( this.counter % 250 == 0 ) {
          this.beep.play();
        }
      }

      if ( this.counter > ((duration * 1000 / 3 + duration * 1000 / 2)) && this.counter < duration * 1000 ) {
        // console.log('third third');
        if ( this.counter % 5 == 0 ) {
          this.beep.play();
        }
      }

      if ( this.counter >= (duration * 1000) ) {
        this.boom.play();
        clearInterval(this.timer);
      }

      this.counter += 10;
      // console.log(this.counter);


    }, 10);


  }

  stopAudio() {
    clearInterval(this.timer);
    // this.beatMachine.stop();
  }

  private drawBuffer(width, height, context, buffer) {
    let data = buffer.getChannelData(0);
    let step = Math.ceil(data.length / width);
    let amp = height / 2;
    for ( let i = 0; i < width; i++ ) {
      let min = 1.0;
      let max = -1.0;
      for ( let j = 0; j < step; j++ ) {
        let datum = data[(i * step) + j];
        if ( datum < min )
          min = datum;
        if ( datum > max )
          max = datum;
      }
      context.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }
  }

  ngOnInit(): void {
    let canvas = <HTMLCanvasElement>document.getElementById('testCanvas');
    this.beatMachine.getBuffer().subscribe(buffer => {
        this.drawBuffer(canvas.width, canvas.height, canvas.getContext('2d'), buffer);
      }
    );
  }
}
