/* Dashboard Widget Restorer shared ES3 runtime. SPDX-License-Identifier: MIT */
function twJSON(text) {
    var i = 0;
    function fail() { throw new Error("Invalid weather JSON at " + i); }
    function space() { while (/\s/.test(text.charAt(i)) && i < text.length) i++; }
    function string() {
        var out = "", c, h, escapes = {'"':'"', '\\':'\\', '/':'/', b:'\b', f:'\f', n:'\n', r:'\r', t:'\t'};
        if (text.charAt(i++) != '"') fail();
        while (i < text.length) {
            c = text.charAt(i++);
            if (c == '"') return out;
            if (c == '\\') {
                c = text.charAt(i++);
                if (c == 'u') {
                    h = text.substr(i, 4); if (!/^[0-9a-fA-F]{4}$/.test(h)) fail();
                    out += String.fromCharCode(parseInt(h, 16)); i += 4;
                } else { if (!escapes.hasOwnProperty(c)) fail(); out += escapes[c]; }
            } else { if (c.charCodeAt(0) < 32) fail(); out += c; }
        }
        fail();
    }
    function value(depth) {
        if (depth > 40) fail();
        space(); var c = text.charAt(i), out, key, m;
        if (c == '"') return string();
        if (c == '[' || c == '{') {
            var array = c == '[', end = array ? ']' : '}'; out = array ? [] : {}; i++; space();
            if (text.charAt(i) == end) { i++; return out; }
            while (i < text.length) {
                space();
                if (!array) { key = string(); if (key == '__proto__' || key == 'constructor' || key == 'prototype') fail(); space(); if (text.charAt(i++) != ':') fail(); }
                var v = value(depth + 1); if (array) out[out.length] = v; else out[key] = v;
                space(); c = text.charAt(i++); if (c == end) return out; if (c != ',') fail();
            }
            fail();
        }
        m = /^(true|false|null|-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/.exec(text.substring(i));
        if (!m) fail(); i += m[0].length;
        if (m[0] == 'true') return true; if (m[0] == 'false') return false; if (m[0] == 'null') return null;
        out = Number(m[0]); if (!isFinite(out)) fail(); return out;
    }
    var result = value(0); space(); if (i != text.length) fail(); return result;
}

