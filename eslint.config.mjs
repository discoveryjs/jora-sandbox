import globals from 'globals';
import stylistic from '@stylistic/eslint-plugin';

export default [
    {
        files: ['**/*.js'],
        plugins: {
            '@stylistic': stylistic
        },
        languageOptions: {
            ecmaVersion: 2018,
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
                ...globals.mocha,
                ...globals.es6
            }
        },
        rules: {
            'no-duplicate-case': 'error',
            'no-undef': 'error',
            'no-unused-vars': ['error', { vars: 'all', args: 'after-used' }],
            'no-empty': ['error', { allowEmptyCatch: true }],
            'no-implicit-coercion': ['error', { boolean: true, string: true, number: true }],
            'no-with': 'error',
            'no-multi-str': 'error',
            'camelcase': ['error', { properties: 'never' }],
            'curly': ['error', 'all'],
            'dot-notation': 'error',
            'one-var': ['error', 'never'],
            'yoda': ['error', 'never'],

            '@stylistic/brace-style': 'error',
            '@stylistic/no-mixed-spaces-and-tabs': 'error',
            '@stylistic/no-multiple-empty-lines': 'error',
            '@stylistic/dot-location': ['error', 'property'],
            '@stylistic/operator-linebreak': ['error', 'after', {
                overrides: { '?': 'before', ':': 'before' }
            }],
            '@stylistic/key-spacing': ['error', { beforeColon: false, afterColon: true }],
            '@stylistic/space-unary-ops': ['error', { words: true, nonwords: false }],
            '@stylistic/function-call-spacing': 'error',
            '@stylistic/space-before-function-paren': ['error', {
                anonymous: 'ignore',
                named: 'never'
            }],
            '@stylistic/array-bracket-spacing': ['error', 'never'],
            '@stylistic/space-in-parens': ['error', 'never'],
            '@stylistic/comma-dangle': ['error', 'never'],
            '@stylistic/no-trailing-spaces': 'error',
            '@stylistic/comma-style': ['error', 'last'],
            '@stylistic/eol-last': 'error',
            '@stylistic/wrap-iife': 'error',
            '@stylistic/space-infix-ops': 'error',
            '@stylistic/keyword-spacing': ['error', {
                overrides: {
                    else: { before: true },
                    while: { before: true },
                    catch: { before: true },
                    finally: { before: true }
                }
            }],
            '@stylistic/spaced-comment': ['error', 'always'],
            '@stylistic/space-before-blocks': ['error', 'always'],
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/indent': ['error', 4, { SwitchCase: 1 }],
            '@stylistic/linebreak-style': ['error', 'unix'],
            '@stylistic/quotes': ['error', 'single', { avoidEscape: true }]
        }
    },
    {
        files: ['src/page/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.browser,
                discovery: 'readonly'
            }
        }
    }
];
