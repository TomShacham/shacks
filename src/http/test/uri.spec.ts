import {assert} from "chai";
import {uri, uriString} from "../src/uri";

describe('uri', () => {
    it('should parse URI with protocol, hostname, and path', () => {
        const uriString = 'http://example.com/path/to/resource';
        const match = uri(uriString);

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
        const match = uri(uriString);

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
        const match = uri(uriString);

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
        const match = uri(uriString);

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
        const match = uri(uriString);

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
        const match = uri(uriString);

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
        assert.strictEqual(uriString(uri(string)), string);
    })

    it('should be reversible without path', () => {
        const string = 'http://user:password@example.com:8080?param1=value1&param2=value2#section';
        assert.strictEqual(uriString(uri(string)), string);
    })

    it('should be reversible without query', () => {
        const string = 'http://example.com:8080/path/to/resource#section';
        assert.strictEqual(uriString(uri(string)), string);
    })

    it('should be reversible without fragment', () => {
        const string = 'http://example.com:8080/path/to/resource?param1=value1&param2=value2';
        assert.strictEqual(uriString(uri(string)), string);
    })

    it('should be reversible with trailing slash', () => {
        const string = 'http://example.com:8080/path/to/resource/?param1=value1&param2=value2';
        assert.strictEqual(uriString(uri(string)), string);
    })

    it('should be reversible', () => {
        const string = 'http://user:password@example.com:8080/path/to/resource?param1=value1&param2=value2#section';
        assert.strictEqual(uriString(uri(string)), string);
    })
})