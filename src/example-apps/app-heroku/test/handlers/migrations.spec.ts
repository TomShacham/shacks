import {Pool} from 'pg';
import {beforeEach, describe} from "mocha";
import {expect} from "chai";
import {DbStore, PostgresStore} from "../../src/store/store";
import {DbMigrations} from "../../src/store/migrations";
import fs from "node:fs";

describe("migrations", function () {
    this.timeout(200_000);

    const connectionString = 'postgresql://db_user_rw:db_password_rw@localhost:5432/h22p'
    const database: DbStore = new PostgresStore(new Pool({connectionString}));

    beforeEach(async () => {
        const env = process.env.NODE_ENV;
        if (env !== undefined && env != 'local') {
            process.exit(0);
        }
        await database.query(`
            DROP TABLE IF EXISTS automated_migrations;
            DROP TABLE IF EXISTS tokens;
            DROP TABLE IF EXISTS users;
            DROP TABLE IF EXISTS bar;
        `)
    })

    after(async () => {
        await database.close()
    });

    it('run some migrations', async () => {
        const dbMigrations = new DbMigrations(database, `${__dirname}/../resources/migrations-example`);
        await dbMigrations.migrate()
        const users = await database.query('SELECT * FROM users');
        const tokens = await database.query('SELECT * FROM tokens');
        try {
            const doesntExist = await database.query('SELECT * FROM doesnt_exist');
            expect(1).eq(2) // should not get here
        } catch (e: any) {
            expect(e.message).deep.eq('relation "doesnt_exist" does not exist')
        }
        expect(users).deep.eq([])
        expect(tokens).deep.eq([])
    });

    it('run some migrations and then add a new one', async () => {
        const dbMigrations = new DbMigrations(database, `${__dirname}/../resources/migrations-example`);
        await dbMigrations.migrate()
        const newMigrationFile = `${__dirname}/../resources/migrations-example/003_create_new_migration.sql`;
        fs.writeFileSync(newMigrationFile, 'CREATE TABLE IF NOT EXISTS bar(id INT PRIMARY KEY)', 'utf-8')
        try {
            await dbMigrations.migrate()
            const result = await database.query(`SELECT *
                                                 FROM bar`)
            expect(result).deep.eq([])
        } finally {
            fs.rmSync(newMigrationFile, {force: true})
        }
    });

    it('doesnt let you create a new migration between existing ones', async () => {
        const dbMigrations = new DbMigrations(database, `${__dirname}/../resources/migrations-example`);
        await dbMigrations.migrate()
        const newMigrationFile = `${__dirname}/../resources/migrations-example/001b_not_allowed.sql`;
        fs.writeFileSync(newMigrationFile, 'SELECT NOW()', 'utf-8')
        try {
            await dbMigrations.migrate()
            expect(1).eq(2); // should not reach here
        } catch (e: any) {
            expect(e.message).eq('New migration shoved in between existing alphabetical order');
        } finally {
            fs.rmSync(newMigrationFile, {force: true})
        }
    });

    it('doesnt let change the contents of existing migrations', async () => {
        const dbMigrations = new DbMigrations(database, `${__dirname}/../resources/migrations-example`);
        await dbMigrations.migrate()
        const existingMigrationFile = `${__dirname}/../resources/migrations-example/001_create_user.sql`;
        const initialContents = fs.readFileSync(existingMigrationFile, 'utf-8');
        fs.writeFileSync(existingMigrationFile, 'SELECT NOW()', 'utf-8')
        try {
            await dbMigrations.migrate()
            expect(1).eq(2); // should not reach here
        } catch (e: any) {
            expect(e.message).eq('Contents of existing migration cannot be changed');
        } finally {
            fs.writeFileSync(existingMigrationFile, initialContents, 'utf-8')
        }
    });

})