import {Pool} from 'pg';
import {before, describe} from "mocha";
import {expect} from "chai";
import {DbStore, PostgresStore} from "../../src/store/store";

describe("transactions", function () {
    this.timeout(2_000);

    const connectionString = 'postgresql://db_user_rw:db_password_rw@localhost:5432/h22p'
    const database: DbStore = new PostgresStore(new Pool({connectionString}));

    before(() => {
        const env = process.env.NODE_ENV;
        if (env !== undefined && env != 'local') {
            process.exit(0);
        }
    })

    after(async () => {
        await database.close()
    });

    it('run a query', async () => {
        const result = await database.query(`SELECT NOW()`);
        expect(result?.[0]?.now).not.eq(undefined)
    });

    it('transactions roll back', async () => {
        await database.query(`CREATE TABLE IF NOT EXISTS names (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);`);
        await database.query(`TRUNCATE names`);
        const firstInserts = [
            `INSERT INTO names values(default, 'TOM')`,
            `INSERT INTO names values(default, 'MATT')`,
        ].join(';')
        const secondInserts = [
            `INSERT INTO names values(default, 'DAN')`,
            `INSERT INTO names values(default, 'BARRY')`,
        ].join(';')
        await database.transaction(() => database.query(firstInserts));
        try {
            await database.transaction(() => {
                database.query(secondInserts);
                throw new Error('some error')
            }); // should fail
            expect(1).eq(2) // shouldn't reach this point <---
        } catch (e: any) {
            expect((e as Error).message).eq('some error')
        }
        const result = await database.query('SELECT * FROM names')
        const storedNames = result.map((it: any) => it.name.toLowerCase());
        expect(storedNames.length).eq(2)
        expect(storedNames).contains("tom")
        expect(storedNames).contains("matt")
        expect(storedNames).not.contains("dan")
        expect(storedNames).not.contains("barry")
    });

    it('throws errors', async () => {
        try {
            await database.query(`SELECT FOO)`);
            expect(1).eq(2) // shouldn't reach this point <---
        } catch (e: any) {
            expect(e.message).eq('syntax error at or near ")"')
        }
    });

})