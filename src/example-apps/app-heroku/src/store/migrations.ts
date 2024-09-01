import {DbStore} from "./store";
import * as fs from "node:fs";
import * as crypto from "node:crypto";

export class DbMigrations {
    constructor(private database: DbStore, private directory: string = `${__dirname}/migrations`) {
    }

    private migrationsTableName = `AUTOMATED_MIGRATIONS`;

    async migrate() {
        const tables = await this.database.query('SELECT * from pg_tables');
        const tableNames = tables.map((it: TableSchema) => it.tablename);
        const migrationsTableExists = tableNames.find((it: string) => it === 'automated_migrations') !== undefined;
        if (!migrationsTableExists) {
            await this.createAutomatedMigrationsTable();
        }
        await this.runMigrations();
    }

    private async runMigrations() {
        const existingMigrations = await this.database.query(`
            SELECT *
            FROM ${this.migrationsTableName}
            ORDER BY name ASC
        `);
        let sortedAlphanumerically = fs.readdirSync(this.directory);
        sortedAlphanumerically = sortedAlphanumerically.sort((a, b) => a.localeCompare(b))
        if (existingMigrations.length === 0) {
            for (const migrationFile of sortedAlphanumerically) {
                await this.runMigration(migrationFile);
            }
        } else {
            for (let i = 0; i < existingMigrations.length; i++) {
                this.checkOrderAndContents(sortedAlphanumerically, i, existingMigrations);
            }
            const newMigrations = sortedAlphanumerically.slice(existingMigrations.length)
            for (const newMigration of newMigrations) {
                await this.runMigration(newMigration);
            }
        }
    }

    private checkOrderAndContents(sortedAlphanumerically: string[], i: number, existingMigrations) {
        const migrationFile = sortedAlphanumerically[i];
        if (existingMigrations[i].name != migrationFile) {
            throw new Error('New migration shoved in between existing alphabetical order');
        }
        if (existingMigrations[i].hash != this.hash(migrationFile)) {
            throw new Error('Contents of existing migration cannot be changed');
        }
    }

    private async runMigration(migrationFile: string) {
        const queryString = this.contentsOf(migrationFile);
        const result = await this.database.query(queryString) ?? ''
        const hash = this.hash(migrationFile);
        await this.database.query(
            `INSERT INTO ${this.migrationsTableName}
             values ($1, $2, $3, $4)`,
            [migrationFile, hash, new Date().toUTCString(), result]
        )
    }

    private contentsOf(migrationFile: string) {
        return fs.readFileSync(`${this.directory}/${migrationFile}`, 'utf-8');
    }

    private hash(migrationFile: string) {
        const contents = fs.readFileSync(`${this.directory}/${migrationFile}`, 'utf-8');
        const c = crypto.createHash('MD5')
        c.update(contents)
        return c.digest('hex')
    }

    private async createAutomatedMigrationsTable() {
        return await this.database.query(`CREATE TABLE ${this.migrationsTableName}
                                          (
                                              name      TEXT UNIQUE NOT NULL,
                                              hash      TEXT        NOT NULL,
                                              createdAt TIMESTAMP   NOT NULL,
                                              result    TEXT        NOT NULL
                                          )`);
    }
}

type TableSchema = {
    schemaname: string // 'pg_catalog'
    tablename: string //'pg_range'
    tableowner: string //'db_user_rw'
    tablespace: string | null // 'pg_global'
    hasindexes: boolean,
    hasrules: boolean,
    hastriggers: boolean,
    rowsecurity: boolean
}