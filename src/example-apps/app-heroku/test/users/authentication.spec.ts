import {beforeEach, describe} from "mocha";
import {expect} from "chai";
import {randomBytes, scryptHash, UserRegistration} from "../../src/user/registration";
import {PostgresStore} from "../../src/store/store";
import {DbMigrations} from "../../src/store/migrations";
import {localPostgresPool} from "../db/localPostgresPool";
import {TickingClock} from "../../src/time/clock";
import {PostgresUserStore} from "../../src/user/userStore";


describe('authentication', function () {
    this.timeout(5_000);
    /*
     following https://thecopenhagenbook.com/password-authentication
    */

    const database = new PostgresStore(localPostgresPool());
    const tickingClock = new TickingClock();
    const userStore = new PostgresUserStore(database, tickingClock);
    const userRegistration = new UserRegistration(userStore, scryptHash, tickingClock);
    const dbMigrations = new DbMigrations(database);

    before(async () => {
        await dbMigrations.migrate();
    })

    beforeEach(() => {
        tickingClock.reset();
    })

    after(async () => {
        await database.close()
    });

    it('hashing is repeatable', async () => {
        const fst = scryptHash("password", "salt").value;
        const snd = scryptHash("password", "salt").value;
        expect(fst).eq(snd)
    });

    it('saving a token - expiry is in 1 hour from now', async () => {
        const email = 'tom-' + randomBytes(3, 'hex') + '@example.com';
        const register = await userRegistration.register(email, 'password');
        const token = await userStore.findConfirmationToken(email);
        expect(token?.expires_at).deep.eq(tickingClock.now().plusHours(1));
    })

    it('register and login', async () => {
        const email = 'tom-' + randomBytes(3, 'hex') + '@example.com';
        const register = await userRegistration.register(email, 'password');
        expect(register).to.deep.equal({value: 'OK', error: undefined})

        const token = await userStore.findConfirmationToken(email);
        const confirm = await userRegistration.confirm(email, token!)
        expect(confirm).deep.equal({value: 'Confirmed', error: undefined})

        const login = await userRegistration.login(email, 'password');
        expect(login.value.email).to.deep.eq(email)
    });

    it('register fails if password is not 8 or more chars', async () => {
        const email = 'tom-' + randomBytes(3, 'hex') + '@example.com';
        const register = await userRegistration.register(email, 'passwor');
        expect(register.error).to.equal('Password must be at least 8 characters long');
    });

    it('login fails with generic message if password is not correct', async () => {
        const email = 'tom-' + randomBytes(3, 'hex') + '@example.com';
        const register = await userRegistration.register(email, 'password');
        expect(register.value).to.equal('OK')

        const login = await userRegistration.login(email, 'password-different');
        expect(login.error).to.eq('Email or password is incorrect')
    });

    it('emails are lowercased and trimmed and whitespace removed', async () => {
        const uppercaseEmail = ' T O M - ' + randomBytes(3, 'hex') + '@example.com';
        const cleaned = uppercaseEmail.toLowerCase().replace(/\s+/g, '');
        const register = await userRegistration.register(uppercaseEmail, 'password');
        expect(register.value).to.equal('OK')

        const token = await userStore.findConfirmationToken(cleaned);
        const confirm = await userRegistration.confirm(cleaned, token!)
        expect(confirm).deep.equal({value: 'Confirmed', error: undefined})

        const login = await userRegistration.login(cleaned, 'password');
        expect(login.value.email).to.deep.eq(cleaned)
    });

    it('if table is stolen, passwords are hashed and salted so unrecoverable', async () => {
        const email = 'tom-' + randomBytes(3, 'hex') + '@example.com';
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

    it('can only attempt 5 times per user per minute', async () => {
        /*
            this is to prevent brute-force attacks on one user
            IP throttling is not enough to prevent a DOS attack on one particular account,
            but this is pretty sufficient
         */
        const email = 'tom-' + randomBytes(3, 'hex') + '@example.com';
        const register = await userRegistration.register(email, 'password');
        expect(register).to.deep.equal({value: 'OK', error: undefined})

        const login1 = await userRegistration.login(email, 'wrong-password');
        expect(login1.error).to.deep.eq("Email or password is incorrect")
        const login2 = await userRegistration.login(email, 'wrong-password');
        expect(login2.error).to.deep.eq("Email or password is incorrect")
        const login3 = await userRegistration.login(email, 'wrong-password');
        expect(login3.error).to.deep.eq("Email or password is incorrect")
        const login4 = await userRegistration.login(email, 'wrong-password');
        expect(login4.error).to.deep.eq("Email or password is incorrect")
        const login5 = await userRegistration.login(email, 'wrong-password');
        expect(login5.error).to.deep.eq("Email or password is incorrect")

        // attempt now results in error too many attempts
        const login6 = await userRegistration.login(email, 'wrong-password');
        expect(login6.error).to.deep.eq("Too many attempts, you have 5 per minute")

        // even correct password does not work
        const correct1 = await userRegistration.login(email, 'password');
        expect(correct1.error).to.deep.eq("Too many attempts, you have 5 per minute")

        tickingClock.tick(59_999)

        // now it's been 59.999 secs still fails
        const correct2 = await userRegistration.login(email, 'password');
        expect(correct2.error).to.deep.eq("Too many attempts, you have 5 per minute")

        // now it's been 60s
        // we just need to confirm the email
        tickingClock.tick(1)
        const correct3 = await userRegistration.login(email, 'password');
        expect(correct3.error).to.eq("Email not confirmed yet")

        // confirm reg
        const token = await userStore.findConfirmationToken(email);
        const confirm = await userRegistration.confirm(email, token!)
        expect(confirm).deep.equal({value: 'Confirmed', error: undefined})

        // now it works
        const correct4 = await userRegistration.login(email, 'password');
        expect(correct4.error).to.eq(undefined)
    });

    it('need to confirm email on registration', async () => {
        const email = 'tom-' + randomBytes(3, 'hex') + '@example.com';
        const register = await userRegistration.register(email, 'password');
        expect(register).to.deep.equal({value: 'OK', error: undefined})

        const login = await userRegistration.login(email, 'password');
        expect(login.error).to.eq('Email not confirmed yet')

        const token = await userStore.findConfirmationToken(email);
        const confirm = await userRegistration.confirm(email, token!)
        expect(confirm).deep.equal({value: 'Confirmed', error: undefined})

        const loginPostConfirm = await userRegistration.login(email, 'password');
        expect(loginPostConfirm.value.email).equal(email)
    })

    it('token expires after a while', async () => {
        const email = 'tom-' + randomBytes(3, 'hex') + '@example.com';
        const tickingClock = new TickingClock();
        const userRegistration = new UserRegistration(new PostgresUserStore(database, tickingClock), scryptHash, tickingClock)
        const register = await userRegistration.register(email, 'password');
        expect(register).to.deep.equal({value: 'OK', error: undefined})

        const token = await userStore.findConfirmationToken(email);

        const oneHour = 60 * 60 * 1_000;
        tickingClock.tick(oneHour);
        tickingClock.tick(1);
        const confirm = await userRegistration.confirm(email, token!)
        expect(confirm).deep.equal({value: undefined, error: 'Token expired'})

        const loginPostConfirm = await userRegistration.login(email, 'password');
        expect(loginPostConfirm.error).equal("Email not confirmed yet");
    })

    it('token is single use', async () => {
        const email = 'tom-' + randomBytes(3, 'hex') + '@example.com';
        const tickingClock = new TickingClock();
        const userRegistration = new UserRegistration(new PostgresUserStore(database, tickingClock), scryptHash, tickingClock)
        const register = await userRegistration.register(email, 'password');
        expect(register).to.deep.equal({value: 'OK', error: undefined})

        const token = await userStore.findConfirmationToken(email);
        const confirm = await userRegistration.confirm(email, token!)
        expect(confirm.value).deep.equal('Confirmed');

        const used = await userRegistration.confirm(email, token!)
        expect(used.error).deep.equal('Failed to find token for email')
    })

    it('requests MFA if it has been a while', async () => {
        const email = 'tom-' + randomBytes(3, 'hex') + '@example.com';
        const tickingClock = new TickingClock();
        const userRegistration = new UserRegistration(new PostgresUserStore(database, tickingClock), scryptHash, tickingClock)
        const register = await userRegistration.register(email, 'password');
        expect(register).to.deep.equal({value: 'OK', error: undefined})

        const token = await userStore.findConfirmationToken(email);
        const confirm = await userRegistration.confirm(email, token!)
        expect(confirm.value).deep.equal('Confirmed');

        const login = await userRegistration.login(email, 'password');
        expect(login.value.email).equal(email)

        const usedToken = await userStore.findConfirmationToken(email);
        expect(usedToken).equal(undefined);

        const oneWeek = 7 * 24 * 60 * 60 * 1_000;
        tickingClock.tick(oneWeek)

        const login1WeekLater = await userRegistration.login(email, 'password');
        expect(login1WeekLater.error).equal("MFA required")

        const newToken = await userStore.findConfirmationToken(email);
        const reconfirm = await userRegistration.confirm(email, newToken!)
        expect(reconfirm.value).deep.equal('Confirmed');
    })

    xit('doesn\'t allow for timing attacks', async () => {
        // this is to show that timing attacks are not possible,
        //   but it's slow, so we don't want to run it continually
        const email = 'tom-' + randomBytes(3, 'hex') + '@example.com';
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
