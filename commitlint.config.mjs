export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 100],
    'scope-enum': [
      2,
      'always',
      ['api', 'auth', 'ci', 'db', 'deps', 'docs', 'incidents', 'orders', 'repo', 'sensors', 'web'],
    ],
  },
};
