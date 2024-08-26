import {DbStore} from "../store/store";
import {Ok, Result} from "../result/result";
import {RegistrationError} from "../../dist/user/userStore";


export type User = {
    id: string,
    email: string,
    password: string,
    salt: string,
    attempts_at: number[] | undefined
}

export interface UserStore {
    register(email: string, password: string, salt: string): Promise<Result<'OK', RegistrationError>>;

    find(email: string): Promise<User | undefined>;

    loginAttempt(userId: string, time: number): Promise<any>;
}

export class PostgresUserStore implements UserStore {
    constructor(private store: DbStore) {
    }

    async find(email: string): Promise<User | undefined> {
        const user = await this.store.query(`
            SELECT id, email, password, salt, attempts_at
            from users
            WHERE email = $1::text
        `, [email]);
        return user ? user[0] : undefined;
    }

    async register(email: string, password: string, salt: string): Promise<Result<"OK", RegistrationError>> {
        const tx = await this.store.transaction(async () => {
            return this.store.query(`
                INSERT INTO users
                values (default, $1::text, $2::text, $3::text, $4, $4, default)
                returning *`, [email, password, salt, (new Date().toUTCString())]);
        });
        return Ok('OK')
    }

    async loginAttempt(userId: string, time: number): Promise<any> {
        await this.store.transaction(async () => {
            return this.store.query(`
                update users
                set attempts_at = array_prepend($1, attempts_at[1:4])
                where id = $2::uuid`, [time, userId])
        })
    }
}
