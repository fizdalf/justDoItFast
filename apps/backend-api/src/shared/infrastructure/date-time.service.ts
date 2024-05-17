import {DateTimeService} from '../domain/date-time.service';

export class SystemDateDateTimeService implements DateTimeService {

    public now(): Date {
        return new Date();
    }
}
