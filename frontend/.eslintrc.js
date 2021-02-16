{
    plugins: ['eslint-plugin-import-helpers'],
        rules: {
    'import-helpers/order-imports': [
        'warn',
        {
            newlinesBetween: 'always',
            groups: [
                'module',
                '/^@shared/',
                ['parent', 'sibling', 'index'],
            ],
            alphabetize: { order: 'asc', ignoreCase: true },
        },
    ],
}
}