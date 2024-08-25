import {describe} from "mocha";
import {PostgresUserStore, randomChars, scryptHash, UserRegistration} from "../../src/user/registration";
import {expect} from "chai";
import {PostgresStore} from "../../src/store/store";
import {localPostgresPool} from "./localPostgresPool";
import {DbMigrations} from "../../src/store/migrations";

describe('authentication', function () {
    this.timeout(5_000);
    /*
     following https://thecopenhagenbook.com/password-authentication
    */

    const database = new PostgresStore(localPostgresPool());
    const userStore = new PostgresUserStore(database);
    const userRegistration = new UserRegistration(userStore);
    const dbMigrations = new DbMigrations(database);

    before(async () => {
        await dbMigrations.migrate();
    })

    it('hashing is repeatable', async () => {
        const fst = scryptHash("password", "salt").value;
        const snd = scryptHash("password", "salt").value;
        expect(fst).eq(snd)
    });

    it('register and login', async () => {
        const email = 'tom-' + randomChars(3, 'hex') + '@example.com';
        const register = await userRegistration.register(email, 'password');
        expect(register).to.deep.equal({value: 'OK', error: undefined})

        const login = await userRegistration.login(email, 'password');
        expect(login.value.email).to.deep.eq(email)
    });

    it('register fails if password is not 8 or more chars', async () => {
        const email = 'tom-' + randomChars(3, 'hex') + '@example.com';
        const register = await userRegistration.register(email, 'passwor');
        expect(register.error.message).to.equal('Password must be at least 8 characters long');
    });

    it('login fails with generic message if password is not correct', async () => {
        const email = 'tom-' + randomChars(3, 'hex') + '@example.com';
        const register = await userRegistration.register(email, 'password');
        expect(register.value).to.equal('OK')

        const login = await userRegistration.login(email, 'password-different');
        expect(login.error.message).to.eq('Email or password is incorrect')
    });

    it('emails are lowercased and trimmed and whitespace removed', async () => {
        const uppercaseEmail = ' T O M - ' + randomChars(3, 'hex') + '@example.com';
        const register = await userRegistration.register(uppercaseEmail, 'password');
        expect(register.value).to.equal('OK')

        const cleaned = uppercaseEmail.toLowerCase().replace(/\s+/g, '');
        const login = await userRegistration.login(cleaned, 'password');
        expect(login.value.email).to.deep.eq(cleaned)
    });

    it('if table is stolen, passwords are hashed and salted so unrecoverable', async () => {
        const email = 'tom-' + randomChars(3, 'hex') + '@example.com';
        const register = await userRegistration.register(email, 'password');
        expect(register).to.deep.equal({value: 'OK', error: undefined})

        // password is hashed so if I have the users table I cannot do much.
        const users = await database.query(`
            select *
            from users
            where email = $1`, [email])
        const user = users[0];
        expect(user.password).not.eq('password')
        expect(user.password.length).eq(128)
        expect(user.salt.length).eq(32)
    })

    // this is to show that timing attacks are not possible, but it's slow, so we don't want to run it continually
    xit('doesn\'t allow for timing attacks', async () => {
        const email = 'tom-' + randomChars(3, 'hex') + '@example.com';
        const register = await userRegistration.register(email, 'password');
        expect(register).to.deep.equal({value: 'OK', error: undefined})

        const correctPasswordTimings = [];
        const wrongEmailTimings = [];
        const wrongPasswordTimings = [];
        const iterations = 10;
        for (let i = 0; i < iterations; i++) {
            const start = process.hrtime()
            const login = await userRegistration.login(email, 'password');
            const elapsedMs = process.hrtime(start)[1] / 1000000;
            correctPasswordTimings.push(elapsedMs)
        }
        for (let i = 0; i < iterations; i++) {
            const start = process.hrtime()
            const login = await userRegistration.login("some-other-email", 'password');
            const elapsedMs = process.hrtime(start)[1] / 1000000;
            wrongEmailTimings.push(elapsedMs)
        }
        for (let i = 0; i < iterations; i++) {
            const start = process.hrtime()
            const login = await userRegistration.login(email, 'wrong password');
            const elapsedMs = process.hrtime(start)[1] / 1000000;
            wrongPasswordTimings.push(elapsedMs)
        }
        console.log(correctPasswordTimings.reduce((acc, next) => acc += next, 0) / iterations);
        console.log(wrongPasswordTimings.reduce((acc, next) => acc += next, 0) / iterations);
        console.log(wrongEmailTimings.reduce((acc, next) => acc += next, 0) / iterations);
    })

});