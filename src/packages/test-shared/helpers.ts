import util from "node:util";
import {exec} from "node:child_process";

export const doesNotTypeCheck = (result: false) => result
export const typeChecks = (result: true) => result
export const command = util.promisify(exec);