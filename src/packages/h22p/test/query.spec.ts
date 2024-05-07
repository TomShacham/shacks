import {expect} from "chai";
import {Query} from "../src/query";

describe('query', () => {
    it('should parse a simple query string with key-value pairs', () => {
        const queryString = "name=John&age=30&city=New%20York";
        const expectedParams = {
            name: "John",
            age: "30",
            city: "New York"
        };
        const parsedParams = Query.parse(queryString);
        expect(parsedParams).to.deep.equal(expectedParams);
    });

    it('should parse a query string with special characters', () => {
        const queryString = "name=John%20Doe&email=john%40example.com";
        const expectedParams = {
            name: "John Doe",
            email: "john@example.com"
        };
        const parsedParams = Query.parse(queryString);
        expect(parsedParams).to.deep.equal(expectedParams);
    });

    it('should handle undefined', () => {
        const parsedParams = Query.parse(undefined);
        expect(parsedParams).to.deep.equal({});
    });

    it('should handle duplicate keys by taking the last occurrence', () => {
        const queryString = "name=John&age=30&name=Jane";
        const expectedParams = {
            name: "Jane",
            age: "30"
        };
        const parsedParams = Query.parse(queryString);
        expect(parsedParams).to.deep.equal(expectedParams);
    });
})