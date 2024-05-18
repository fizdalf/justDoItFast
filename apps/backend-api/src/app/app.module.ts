import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {RoomModule} from '../room/room.module';
import {ScheduleModule} from '@nestjs/schedule';

@Module({
    imports: [
        RoomModule,
        ScheduleModule.forRoot(),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
}

