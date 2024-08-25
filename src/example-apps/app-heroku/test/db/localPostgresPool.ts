import {Pool} from "pg";

export function localPostgresPool() {
    const connectionString = 'postgresql://db_user_rw:db_password_rw@localhost:5432/h22p'
    return new Pool({connectionString});
}