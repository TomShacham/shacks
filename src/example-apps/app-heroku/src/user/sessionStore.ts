import {DbStore} from "../store/store";
import {Clock} from "../time/clock";


export type Session = {
    user_id: string,
    token: string,
    refreshed_at: Date,
    expires_at: Date
}


export interface SessionStore {
    findByUserId(userId: string): Promise<Session | undefined>;

    save(userId: string, token: string): Promise<Session>

    validate(userId: string, token: string): Promise<Session | undefined>
}

export class PostgresSessionStore implements SessionStore {
    constructor(private store: DbStore, private clock: Clock) {
    }

    async findByUserId(userId: string): Promise<Session | undefined> {
        return (await this.store.query(`
                    select *
                    from sessions
                    where user_id = $1`, [userId]
            )
        )[0]
    }

    async validate(token: string): Promise<Session | undefined> {
        const session = await this.findByToken(token)
        if (!session) return undefined
        if (session.expires_at <= this.clock.now()) return undefined
        return this.extend(token)
    }

    async save(userId: string, token: string): Promise<Session> {
        const now = this.clock.now().toUTCString();
        const plus7Days = this.clock.now().plusDays(7).toUTCString();
        return (await this.store.query(`
                            insert into sessions
                            values ($1, $2, $3, $4)
                            returning *
                `, [token, now, plus7Days, userId]
            )
        )[0]
    }

    private async findByToken(token: string): Promise<Session | undefined> {
        return (await this.store.query(`
                    select *
                    from sessions
                    where token = $1`, [token]
            )
        )[0]
    }

    private async extend(token: string) {
        const now = this.clock.now().toUTCString();
        const plus7Days = this.clock.now().plusDays(7).toUTCString();
        return (await this.store.query(`
                    update sessions
                    set expires_at   = $1,
                        refreshed_at = $2
                    where token = $3
                    returning *
                `, [plus7Days, now, token]
            )
        )[0]
    }
}
