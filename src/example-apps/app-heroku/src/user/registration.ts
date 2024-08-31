import {Err, Ok, Result} from "../result/result";
import crypto, {createHmac, scryptSync, timingSafeEqual} from "node:crypto";
import {Clock} from "../time/clock";
import {Token, User, UserStore} from "./userStore";


export class UserRegistration {
    constructor(
        private readonly userStore: UserStore,
        private readonly hash: (password: string, salt: string) => Result<string, any> = scryptHash,
        private readonly clock: Clock
    ) {
    }
    /*
        We use a "USER_IF_NONE_FOUND" user so that timing attacks cannot be performed whereby an attacker can infer
        from response times that a user's email exists or not because our response time would be much faster if we
        were to return immediately after "find user" fails to find a user
     */
    private someSalt = randomBytes(16, 'hex');
    private USER_IF_NONE_FOUND: User = {
        email: 'tom@example.com',
        salt: this.someSalt,
        password: this.hash('password', this.someSalt).value,
        id: "77d0b0e8-ae61-4a2b-98f0-186569785438",
        attempts_at: [],
        confirmed_at: undefined
    };
    private MIN_PASSWORD_LENGTH = 8;
    private secret = '82c45075-784f-4ec5-b777-13fcfebfd9f2';

    async register(email: string, password: string): Promise<Result<'OK', RegistrationError>> {
        if (password.length < this.MIN_PASSWORD_LENGTH) {
            return Err('Password must be at least 8 characters long');
        }
        const salt = randomBytes(16, 'hex');
        try {
            const emailCleaned = this.clean(email);
            const saltedAndHashed = await this.hash(password, salt);
            if (saltedAndHashed.error) return Err('Failed to hash password')
            const user = await this.userStore.register(emailCleaned, saltedAndHashed.value, salt)
            await this.userStore.saveToken(user.value.id, randomToken(this.secret))
        } catch (e) {
            return Err(`Database errored: ${(e as Error).message}` as const)
        }
        return Ok('OK')
    }

    async login(email: string, password: string): Promise<Result<User, LoginError>> {
        const emailCleaned = this.clean(email);
        const user = await this.userStore.find(emailCleaned) ?? this.USER_IF_NONE_FOUND;
        const attemptsWithin60s = (user.attempts_at ?? []).filter(at => (this.clock.now().getTime() - at) < 60_000);
        const tooManyAttempts = attemptsWithin60s.length >= 5;
        const result = await this.hash(password, user.salt);
        await this.userStore.loginAttempt(user.id, this.clock.now().getTime())
        if (!timingSafeEqual(
            Buffer.from(user.password, 'hex'),
            Buffer.from(result.value, 'hex'))
        ) {
            if (tooManyAttempts) return Err('Too many attempts, you have 5 per minute')
            return Err('Email or password is incorrect');
        }
        if (tooManyAttempts) return Err('Too many attempts, you have 5 per minute')
        if (user.confirmed_at === null) {
            return Err('Email not confirmed yet')
        }
        if (user.confirmed_at! <= this.clock.now().minusDays(7)) {
            await this.userStore.saveToken(user.id, randomToken(this.secret))
            return Err('MFA required')
        }
        return Ok(user)
    }

    private clean(email: string) {
        return email.toLowerCase().replace(/\s+/g, '');
    }

    async confirm(email: string, token: Token) {
        const findToken = await this.userStore.findConfirmationToken(email)
        if (!findToken) {
            return Err('Failed to find token for email');
        }
        if (findToken?.expires_at < this.clock.now()) {
            return Err('Token expired');
        }
        if (findToken?.token === token.token) {
            await this.userStore.confirmUser(email);
            await this.userStore.deleteConfirmationToken(token.token);
            return Ok('Confirmed')
        }
        return Err('Tokens do not match');
    }
}

export const randomToken = (secret: string) => {
    const salt = randomBytes(16, 'hex');
    const replaceValue = randomBytes(1, 'hex');
    // replace ambiguous character oO0 which are confusing to read
    const token = generateEmailVerificationCode(secret, salt)
        .replace(/[oO0]/g, replaceValue);
    return pickRandomChars(token, 8)
}

function pickRandomChars(token: string, steps: number) {
    let at = 0
    const random: string[] = []
    for (let i = 0; i < steps; i++) {
        at += Math.floor(1 + (Math.random() * ((token.length - 3) / steps)))
        random.push(token.slice(at, at + 1));
    }
    return random.join("")
}


export const scryptHash = (password: string, salt: string): Result<string, string> => {
    try {
        return Ok(scryptSync(password, salt, 64, {N: 16384, p: 16, r: 1}).toString('hex'))
    } catch (e) {
        return Err('Failed to hash password')
    }
};

function generateEmailVerificationCode(secret: string, salt: string): string {
    const hmac = createHmac('sha256', secret + salt);
    const hash = hmac.digest('hex');
    return Buffer.from(hash).toString('base64');
}

export function randomBytes(length: number, encoding: BufferEncoding) {
    return crypto.randomBytes(length).toString(encoding);
}

export type RegistrationError =
    'Failed to hash password'
    | 'Password must be at least 8 characters long'
    | `Database errored: ${string}`;
export type LoginError =
    | 'Email or password is incorrect'
    | 'Too many attempts, you have 5 per minute'
    | 'Email not confirmed yet'
    | 'MFA required'
