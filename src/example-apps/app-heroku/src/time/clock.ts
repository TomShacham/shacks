export interface Clock {
    now(): Date
}

export class TickingClock implements Clock {
    constructor(private start: number = 0) {
    }

    now(): Date {
        return new Date(this.start);
    }

    tick(ms: number = 1) {
        this.start += ms;
    }
}

export class SystemClock implements Clock {
    now(): Date {
        return new Date()
    }

}