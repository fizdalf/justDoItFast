import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {GameSessionModule} from '../game-session/game-session.module';
import {ScheduleModule} from '@nestjs/schedule';

@Module({
    imports: [
        GameSessionModule,
        ScheduleModule.forRoot(),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
}

