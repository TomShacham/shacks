export class Result<R, E> {
    constructor(public value: R, public error: E) {
    }

    map<S>(f: (t: R) => S): Result<S, E> {
        return new Result(f(this.value), this.error);
    }

    mapFailure<F>(f: (t: E) => F): Result<R, F> {
        return new Result(this.value, f(this.error));
    }
}

export function Ok<R>(value: R): Result<R, any> {
    return new Result(value, undefined);
}

export function Err<E>(err: E): Result<any, E> {
    return new Result(undefined, err);
}