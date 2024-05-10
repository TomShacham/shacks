import {expect} from "chai";
import {Query} from "../src/query";

describe('query', () => {
    it('parse a simple query string with key-value pairs', () => {
        const queryString = "name=John&age=30&city=New%20York";
        const expectedParams = {
            name: "John",
            age: "30",
            city: "New York"
        };
        const parsedParams = Query.parse(queryString);
        expect(parsedParams).to.deep.equal(expectedParams);
    });

    it('parse a query string with special characters', () => {
        console.log(new TextDecoder().decode(Buffer.from("foo%21%40%A3%24%25%5E%26*bar")));

        console.log(encodeURIComponent('foo!@£$%^&*bar'));
        const queryString = "name=John%20Doe&email=john%40example.com&plop=foo!%40%C2%A3%24%25%5E%26*bar";
        const expectedParams = {
            name: "John Doe",
            email: "john@example.com"
        };
        const parsedParams = Query.parse(queryString);
        expect(parsedParams).to.deep.equal(expectedParams);
    });

    it('handle undefined', () => {
        const parsedParams = Query.parse(undefined);
        expect(parsedParams).to.deep.equal({});
    });

    it('handle duplicate keys by taking the last occurrence', () => {
        const queryString = "name=John&age=30&name=Jane";
        const expectedParams = {
            name: "Jane",
            age: "30"
        };
        const parsedParams = Query.parse(queryString);
        expect(parsedParams).to.deep.equal(expectedParams);
    });

    it('stringify a parsed query object into a query string', () => {
        const parsedParams = {
            name: "John",
            age: "30",
            city: "New York"
        };
        const expectedQueryString = "name=John&age=30&city=New%20York";
        const queryString = Query.stringify(parsedParams);
        expect(queryString).to.equal(expectedQueryString);
    });

    it('handle special characters in values correctly', () => {
        const parsedParams = {
            name: "John Doe",
            email: "john@example.com"
        };
        const expectedQueryString = "name=John%20Doe&email=john%40example.com";
        const queryString = Query.stringify(parsedParams);
        expect(queryString).to.equal(expectedQueryString);
    });

    it('handle duplicate keys correctly', () => {
        const parsedParams = {
            name: "John",
            age: "30",
            hobby: "Reading"
        };
        const expectedQueryString = "name=John&age=30&hobby=Reading";
        const queryString = Query.stringify(parsedParams);
        expect(queryString).to.equal(expectedQueryString);
    });
});

