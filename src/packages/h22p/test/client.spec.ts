import {testClientContract} from "./client.contract.spec";
import {h22p} from "../src";

describe('h22p node client', () => {
    testClientContract(h22p.client);
})