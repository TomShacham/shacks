import {DbStore} from "../store/store";
import {Ok, Result} from "../result/result";
import {RegistrationError} from "../../dist/user/userStore";
import {Clock} from "../time/clock";


export type User = {
    id: string,
    email: string,
    password: string,
    salt: string,
    confirmed_at: Date | undefined,
    attempts_at: number[] | undefined
}

export type Token = {
    token: string;
    expires_at: Date,
    user_id: string
}

export interface UserStore {
    register(email: string, password: string, salt: string): Promise<Result<User, RegistrationError>>;

    find(email: string): Promise<User | undefined>;

    loginAttempt(userId: string, time: number): Promise<any>;

    findConfirmationToken(email: string): Promise<Token | undefined>;

    deleteConfirmationToken(token: string): Promise<any>;

    confirmUser(email: string): Promise<any>;

    saveToken(userId: string, token: string): Promise<any>;
}

export class PostgresUserStore implements UserStore {
    constructor(private store: DbStore, private clock: Clock) {
    }

    async find(email: string): Promise<User | undefined> {
        const user = await this.store.query(`
            SELECT id, email, password, salt, attempts_at, confirmed_at
            from users
            WHERE email = $1::text
        `, [email]);
        return user ? user[0] : undefined;
    }

    async register(email: string, password: string, salt: string): Promise<Result<User, RegistrationError>> {
        const tx = await this.store.transaction(async () => {
            return this.store.query(`
                INSERT INTO users
                values (default, $1::text, $2::text, $3::text, null, $4, $4, default)
                returning *`, [email, password, salt, (new Date().toUTCString())]);
        });
        return Ok(tx[0])
    }

    async loginAttempt(userId: string, time: number): Promise<any> {
        await this.store.transaction(async () => {
            return this.store.query(`
                update users
                set attempts_at = array_prepend($1, attempts_at[1:4])
                where id = $2::uuid`, [time, userId])
        })
    }

    async confirmUser(email: string): Promise<any> {
        await this.store.transaction(async () => {
            return this.store.query(`
                update users
                set confirmed_at = $2::Date
                where email = $1::text`, [email, this.clock.now().toISOString()])
        })
    }

    async findConfirmationToken(email: string): Promise<Token | undefined> {
        const user = await this.find(email)
        if (!user) return undefined;
        const tokens = await this.store.query(`
            select *
            from tokens
            where user_id = $1`, [user.id]);
        return tokens[0];
    }

    async deleteConfirmationToken(token: string): Promise<any> {
        return this.store.query(`
            delete
            from tokens
            where token = $1::text`, [token]);
    }

    async saveToken(userId: string, token: string): Promise<Token> {
        const plus1Hour = this.clock.now().plusHours(1).toUTCString();
        // you cannot cast like $2::date otherwise the process timezone skews the date
        return this.store.query(`
            insert into tokens
            values ($1, $2, $3)
            returning *`, [
            token, plus1Hour, userId
        ])
    }
}
