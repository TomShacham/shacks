export interface Clock {
    now(): DateTime
}

export class TickingClock implements Clock {
    constructor(private start: number = 0) {
    }

    now(): DateTime {
        return new DateTime(this.start);
    }

    tick(ms: number = 1) {
        this.start += ms;
    }

    reset() {
        this.start = 0;
    }
}

export class SystemClock implements Clock {
    constructor(public timezone: string = 'UTC') {
    }

    now(): DateTime {
        return new DateTime()
    }
}

class DateTime extends Date {
    constructor(init: string | number | Date = new Date()) {
        super(init);
    }

    plusHours(hours: number): DateTime {
        const date = this;
        this.setHours(this.getHours() + hours);
        return date
    }

    minusHours(hours: number): DateTime {
        const date = this;
        this.setHours(this.getHours() - hours);
        return date
    }

    plusDays(days: number) {
        const date = this;
        this.setDate(this.getDate() + days);
        return date
    }

    minusDays(days: number) {
        const date = this;
        this.setDate(this.getDate() - days);
        return date
    }
}