export const DateTimeService = Symbol('DateTimeService');

export interface DateTimeService {
    now(): Date;
}
