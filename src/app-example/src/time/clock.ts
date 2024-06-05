export interface Clock {
    now(): Date
}

class ClockInMemory implements Clock {
    constructor(private start: number = 0) {
    }

    now(): Date {
        return new Date(this.start);
    }

    moveForward(by: number = 1) {
        this.start += by;
    }
}

export class SystemClock implements Clock {
    now(): Date {
        return new Date()
    }
}