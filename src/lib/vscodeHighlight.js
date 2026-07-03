/**
 * Lightweight VS Code Dark+ style highlighter for overview code blocks.
 * Supports javascript / json-ish snippets without a full parser dependency.
 */

const KEYWORDS =
    /\b(const|let|var|function|async|await|return|if|else|for|while|of|in|new|class|import|from|export|default|try|catch|throw|typeof|instanceof|true|false|null|undefined|this)\b/g;
const CONTROL = /\b(await|return|throw|if|else|for|while|try|catch)\b/g;
const NUMBERS = /\b(\d+\.?\d*)\b/g;
const STRINGS = /(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g;
const COMMENTS = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g;
const FUNCS = /\b([A-Za-z_$][\w$]*)\s*(?=\()/g;
const PROPS = /([{\s,])([A-Za-z_$][\w$]*)(\s*:)/g;

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function wrap(className, value) {
    return `<span class="${className}">${value}</span>`;
}

/**
 * @param {string} code
 * @param {string} [language]
 * @returns {string} HTML with token spans
 */
export function highlightCode(code, language = 'javascript') {
    if (!code) return '';

    // Protect strings and comments first so keywords inside them are not colored.
    const slots = [];
    const park = (className, match) => {
        const token = `@@TL${slots.length}@@`;
        slots.push(wrap(className, escapeHtml(match)));
        return token;
    };

    let src = code;
    src = src.replace(COMMENTS, (m) => park('tok-comment', m));
    src = src.replace(STRINGS, (m) => park('tok-string', m));

    // Escape remaining plain text, then color tokens.
    src = escapeHtml(src);

    if (language === 'json') {
        src = src.replace(PROPS, (_, a, prop, c) => `${a}${wrap('tok-property', prop)}${c}`);
        src = src.replace(NUMBERS, (m) => wrap('tok-number', m));
        src = src.replace(/\b(true|false|null)\b/g, (m) => wrap('tok-keyword', m));
    } else {
        src = src.replace(FUNCS, (m, name) => {
            if (/^(if|for|while|switch|catch|function)$/.test(name)) return m;
            return wrap('tok-function', name);
        });
        src = src.replace(CONTROL, (m) => wrap('tok-control', m));
        src = src.replace(KEYWORDS, (m) => wrap('tok-keyword', m));
        src = src.replace(NUMBERS, (m) => wrap('tok-number', m));
        src = src.replace(PROPS, (_, a, prop, c) => `${a}${wrap('tok-property', prop)}${c}`);
    }

    src = src.replace(/@@TL(\d+)@@/g, (_, i) => slots[Number(i)]);
    return src;
}
