export class Result<R, U> {
    constructor(public value: R, public error: U) {
    }

    map<S>(f: (t: R) => S): Result<S, U> {
        return new Result(f(this.value), this.error);
    }
}

export function Ok<R>(value: R): Result<R, any> {
    return new Result(value, undefined);
}

export function Err<E>(err: E): Result<any, E> {
    return new Result(undefined, err);
}