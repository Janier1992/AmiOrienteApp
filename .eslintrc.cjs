module.exports = {
    root: true,
    extends: ['react-app'],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    ignorePatterns: ['dist', 'dev-dist', 'node_modules'],
};
