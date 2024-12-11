import {expect} from "chai";
import {Query} from "../src/query";

describe('query', () => {

    describe('parse', function() {
        it('should parse a simple query string into an object', function() {
            const queryString = 'name=John&age=30';
            const result = Query.parse(queryString);
            expect(result).to.deep.equal({ name: 'John', age: '30' });
        });

        it('should handle an empty query string', function() {
            const queryString = '';
            const result = Query.parse(queryString);
            expect(result).to.deep.equal({});
        });

        it('should handle query strings with special characters', function() {
            const queryString = 'city=New+York&greeting=hello%20world';
            const result = Query.parse(queryString);
            expect(result).to.deep.equal({ city: 'New York', greeting: 'hello world' });
        });

        it('should handle query strings with multiple values for the same key', function() {
            const queryString = 'color=blue&color=red';
            const result = Query.parse(queryString);
            expect(result).to.deep.equal({ color: 'red' }); // Should return last occurrence
        });
    });

    describe('stringifyQuery()', function() {
        it('should convert a simple object into a query string', function() {
            const queryObject = { name: 'John', age: '30' };
            const result = Query.toString(queryObject);
            expect(result).to.equal('name=John&age=30');
        });

        it('should handle an empty object', function() {
            const queryObject = {};
            const result = Query.toString(queryObject);
            expect(result).to.equal('');
        });

        it('should handle objects with special characters', function() {
            const queryObject = { city: 'New York', greeting: 'hello world' };
            const result = Query.toString(queryObject);
            expect(result).to.equal('city=New%20York&greeting=hello%20world');
        });

        it('should handle multiple values for the same key', function() {
            const queryObject = { color: 'blue', shade: 'light' };
            const result = Query.toString(queryObject);
            expect(result).to.equal('color=blue&shade=light');
        });
    });

})