import {expect} from "chai";
import {UrlEncodedMessage} from "../src/urlEncodedMessage";

describe('query', () => {
    it('parse a simple query string with key-value pairs', () => {
        const queryString = "name=John&age=30&city=New%20York";
        const expectedParams = {
            name: "John",
            age: "30",
            city: "New York"
        };
        const parsedParams = UrlEncodedMessage.parse(queryString);
        expect(parsedParams).to.deep.equal(expectedParams);
    });

    it('parse a query string with special characters', () => {
        const queryString = "name=John%20Doe&email=john%40example.com";
        const expectedParams = {
            name: "John Doe",
            email: "john@example.com"
        };
        const parsedParams = UrlEncodedMessage.parse(queryString);
        expect(parsedParams).to.deep.equal(expectedParams);
    });

    it('handle undefined', () => {
        const parsedParams = UrlEncodedMessage.parse(undefined);
        expect(parsedParams).to.deep.equal({});
    });

    it('handle duplicate keys by taking the last occurrence', () => {
        const queryString = "name=John&age=30&name=Jane";
        const expectedParams = {
            name: "Jane",
            age: "30"
        };
        const parsedParams = UrlEncodedMessage.parse(queryString);
        expect(parsedParams).to.deep.equal(expectedParams);
    });

    it('stringify a parsed query object into a query string', () => {
        const parsedParams = {
            name: "John",
            age: "30",
            city: "New York"
        };
        const expectedQueryString = "name=John&age=30&city=New%20York";
        const queryString = UrlEncodedMessage.stringify(parsedParams);
        expect(queryString).to.equal(expectedQueryString);
    });

    it('handle special characters in values correctly', () => {
        const parsedParams = {
            name: "John Doe",
            email: "john@example.com"
        };
        const expectedQueryString = "name=John%20Doe&email=john%40example.com";
        const queryString = UrlEncodedMessage.stringify(parsedParams);
        expect(queryString).to.equal(expectedQueryString);
    });

    it('plus gets turned into space', () => {
        const queryString = "foo=ba+r&baz=q%20uux%2B";
        const parsedParams = {
            foo: "ba r",
            baz: "q uux+"
        };
        expect(UrlEncodedMessage.parse(queryString)).deep.eq(parsedParams);
        const stringify = UrlEncodedMessage.stringify(parsedParams);
        expect(stringify).to.equal("foo=ba%20r&baz=q%20uux%2B");
    });

    it('handle duplicate keys correctly', () => {
        const parsedParams = {
            name: "John",
            age: "30",
            hobby: "Reading"
        };
        const expectedQueryString = "name=John&age=30&hobby=Reading";
        const queryString = UrlEncodedMessage.stringify(parsedParams);
        expect(queryString).to.equal(expectedQueryString);
    });
});

