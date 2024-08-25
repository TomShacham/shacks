import {Err, Ok, Result} from "../result/result";
import crypto, {scryptSync, timingSafeEqual} from "node:crypto";
import {DbStore} from "../store/store";

type Error = { type: string, message: string };

interface PasswordLengthError extends Error {
    type: 'PASSWORD',
    message: 'Password must be at least 8 characters long'
}

interface PasswordHashError extends Error {
    type: 'PASSWORD',
    message: 'Failed to hash password'
}

type DatabaseError = { type: 'DATABASE', message: string };
type RegistrationError = PasswordLengthError | PasswordHashError | DatabaseError;

interface LoginError extends Error {
    type: 'LOGIN',
    message: 'Email or password is incorrect'
}


type User = {
    id: string,
    email: string,
    password: string,
    salt: string,
}

interface UserStore {
    register(email: string, password: string, salt: string): Promise<Result<'OK', RegistrationError>>;

    find(email: string): Promise<User | undefined>;
}

export class PostgresUserStore implements UserStore {
    constructor(private store: DbStore) {
    }

    async find(email: string): Promise<User | undefined> {
        const user = await this.store.query(`
            SELECT id, email, password, salt
            from users
            WHERE email = $1::text
        `, [email]);
        return user ? user[0] : undefined;
    }

    async register(email: string, password: string, salt: string): Promise<Result<"OK", RegistrationError>> {
        const tx = await this.store.transaction(async () => {
            return this.store.query(`
                INSERT INTO users
                values (default, $1::text, $2::text, $3::text, $4, $4)
                returning *`, [email, password, salt, (new Date().toUTCString())]);
        });
        return Ok('OK')
    }
}


export class UserRegistration {
    constructor(
        private readonly userStore: UserStore,
        private readonly hash: (password: string, salt: string) => Result<string, any> = scryptHash) {
    }

    /*
        We use a "USER_IF_NONE_FOUND" user so that timing attacks cannot be performed whereby an attacker can infer
        from response times that a user's email exists or not because our response time would be much faster if we
        were to return immediately after "find user" fails to find a user
     */
    private someSalt = randomChars(16, 'hex');
    private USER_IF_NONE_FOUND: User = {
        email: 'tom@example.com',
        salt: this.someSalt,
        password: this.hash('password', this.someSalt).value,
        id: "77d0b0e8-ae61-4a2b-98f0-186569785438"
    };

    private MIN_PASSWORD_LENGTH = 8;

    async register(email: string, password: string): Promise<Result<'OK', RegistrationError>> {
        if (password.length < this.MIN_PASSWORD_LENGTH) {
            return Err({type: 'PASSWORD', message: 'Password must be at least 8 characters long'});
        }
        const salt = randomChars(16, 'hex');
        try {
            const emailCleaned = this.clean(email);
            const saltedAndHashed = await this.hash(password, salt);
            if (saltedAndHashed.error) return Err({type: 'PASSWORD', message: 'Failed to hash password'})
            await this.userStore.register(emailCleaned, saltedAndHashed.value, salt)
        } catch (e) {
            return Err({type: 'DATABASE', message: `Database errored: ${(e as Error).message}`})
        }
        return Ok('OK')
    }

    async login(email: string, password: string): Promise<Result<User, LoginError>> {
        const emailCleaned = this.clean(email);
        const user = await this.userStore.find(emailCleaned) ?? this.USER_IF_NONE_FOUND;
        const result = await this.hash(password, user.salt);
        if (!timingSafeEqual(
            Buffer.from(user.password, 'hex'),
            Buffer.from(result.value, 'hex'))
        ) {
            return Err({type: 'LOGIN', message: 'Email or password is incorrect'});
        }
        return Ok(user)
    }

    private clean(email: string) {
        return email.toLowerCase().replace(/\s+/g, '');
    }
}

export const scryptHash = (password: string, salt: string): Result<string, string> => {
    try {
        return Ok(scryptSync(password, salt, 64, {N: 16384, p: 16, r: 1}).toString('hex'))
    } catch (e) {
        return Err('Failed to hash password')
    }
};


export function randomChars(length: number, encoding: BufferEncoding) {
    return crypto.randomBytes(length).toString(encoding);
}