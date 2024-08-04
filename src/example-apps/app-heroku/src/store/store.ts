import {Pool} from "pg";

export interface DbStore {
    transaction<T>(f: (...args: any[]) => Promise<T>): Promise<any>

    query(query: string): Promise<any>

    close(): Promise<any>
}

export class PostgresStore implements DbStore {
    constructor(private pool: Pool) {
    }

    async transaction<T>(f: (...args: any[]) => Promise<T>) {
        const client = await this.pool.connect();
        let result;
        try {
            await client.query('BEGIN')
            result = await f();
            await client.query('COMMIT')
        } catch (e) {
            await client.query('ROLLBACK')
            throw e;
        } finally {
            client.release()
        }
        return result
    }

    async query(query: string) {
        const result = await this.pool.query(query)
        return result.rows
    }

    async close() {
        await this.pool.end()
    }

}