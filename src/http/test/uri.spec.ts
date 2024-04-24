import {assert} from "chai";
import {URI} from "../src/uri";

describe('uri', () => {
    it('should parse path by itself', () => {
        const uriString = '/path/to/resource?query1=value1&query2=value2#fragment';
        const match = URI.of(uriString);

        assert.ok(match);
        assert.strictEqual(match.protocol, undefined);
        assert.strictEqual(match.hostname, undefined);
        assert.strictEqual(match.port, undefined);
        assert.strictEqual(match.path, '/path/to/resource');
        assert.strictEqual(match.query, '?query1=value1&query2=value2');
        assert.strictEqual(match.fragment, '#fragment');
    });

    it('should parse URI with protocol, hostname, and path', () => {
        const uriString = 'http://example.com/path/to/resource';
        const match = URI.of(uriString);

        assert.ok(match);
        assert.strictEqual(match.protocol, 'http:');
        assert.strictEqual(match.hostname, 'example.com');
        assert.strictEqual(match.port, undefined);
        assert.strictEqual(match.path, '/path/to/resource');
        assert.strictEqual(match.query, undefined);
        assert.strictEqual(match.fragment, undefined);
    });

    it('should parse URI with protocol, hostname, port, and path', () => {
        const uriString = 'https://example.com:8080/path/to/resource';
        const match = URI.of(uriString);

        assert.ok(match);
        assert.strictEqual(match.protocol, 'https:');
        assert.strictEqual(match.hostname, 'example.com');
        assert.strictEqual(match.port, '8080');
        assert.strictEqual(match.path, '/path/to/resource');
        assert.strictEqual(match.query, undefined);
        assert.strictEqual(match.fragment, undefined);
    });

    it('should parse URI with query string', () => {
        const uriString = 'http://example.com/path/to/resource?param1=value1&param2=value2';
        const match = URI.of(uriString);

        assert.ok(match);
        assert.strictEqual(match.protocol, 'http:');
        assert.strictEqual(match.hostname, 'example.com');
        assert.strictEqual(match.port, undefined);
        assert.strictEqual(match.path, '/path/to/resource');
        assert.strictEqual(match.query, '?param1=value1&param2=value2');
        assert.strictEqual(match.fragment, undefined);
    });

    it('should parse URI with fragment', () => {
        const uriString = 'http://example.com/path/to/resource#section';
        const match = URI.of(uriString);

        assert.ok(match);
        assert.strictEqual(match.protocol, 'http:');
        assert.strictEqual(match.hostname, 'example.com');
        assert.strictEqual(match.port, undefined);
        assert.strictEqual(match.path, '/path/to/resource');
        assert.strictEqual(match.query, undefined);
        assert.strictEqual(match.fragment, '#section');
    });


    it('should parse URI with authority', () => {
        const uriString = 'http://user:pass@example.com/path/to/resource#section';
        const match = URI.of(uriString);

        assert.ok(match);
        assert.strictEqual(match.protocol, 'http:');
        assert.strictEqual(match.username, 'user');
        assert.strictEqual(match.password, 'pass');
        assert.strictEqual(match.hostname, 'example.com');
        assert.strictEqual(match.port, undefined);
        assert.strictEqual(match.path, '/path/to/resource');
        assert.strictEqual(match.query, undefined);
        assert.strictEqual(match.fragment, '#section');
    });

    it('should parse URI with all components', () => {
        const uriString = 'http://user:password@example.com:8080/path/to/resource?param1=value1&param2=value2#section';
        const match = URI.of(uriString);

        assert.strictEqual(match.protocol, 'http:');
        assert.strictEqual(match.username, 'user');
        assert.strictEqual(match.password, 'password');
        assert.strictEqual(match.protocol, 'http:');
        assert.strictEqual(match.hostname, 'example.com');
        assert.strictEqual(match.port, '8080');
        assert.strictEqual(match.path, '/path/to/resource');
        assert.strictEqual(match.query, '?param1=value1&param2=value2');
        assert.strictEqual(match.fragment, '#section');
    });

    it('should be reversible without authority', () => {
        const string = 'http://example.com:8080/path/to/resource?param1=value1&param2=value2#section';
        assert.strictEqual(URI.toString(URI.of(string)), string);
    })

    it('should be reversible without path', () => {
        const string = 'http://user:password@example.com:8080?param1=value1&param2=value2#section';
        assert.strictEqual(URI.toString(URI.of(string)), string);
    })

    it('should be reversible without query', () => {
        const string = 'http://example.com:8080/path/to/resource#section';
        assert.strictEqual(URI.toString(URI.of(string)), string);
    })

    it('should be reversible without fragment', () => {
        const string = 'http://example.com:8080/path/to/resource?param1=value1&param2=value2';
        assert.strictEqual(URI.toString(URI.of(string)), string);
    })

    it('should be reversible with trailing slash', () => {
        const string = 'http://example.com:8080/path/to/resource/?param1=value1&param2=value2';
        assert.strictEqual(URI.toString(URI.of(string)), string);
    })

    it('should be reversible', () => {
        const string = 'http://user:password@example.com:8080/path/to/resource?param1=value1&param2=value2#section';
        assert.strictEqual(URI.toString(URI.of(string)), string);
    })

    it('foo', () => {

    })
})