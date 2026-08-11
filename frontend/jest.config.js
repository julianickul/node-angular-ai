/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  testEnvironment: 'jsdom',

  modulePaths: ['<rootDir>'],
  moduleDirectories: ['node_modules', '<rootDir>'],

  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@core/(.*)$': '<rootDir>/src/app/core/$1',
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
    '^@features/(.*)$': '<rootDir>/src/app/features/$1',
    '^@environments/(.*)$': '<rootDir>/src/environments/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@nnaai/shared-types$': '<rootDir>/../shared-types/src/index.ts',
    '^@nnaai/shared-types/(.*)$': '<rootDir>/../shared-types/src/$1',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/__mocks__/file-mock.js',
    '\\.(css|scss|less|sass)$': 'identity-obj-proxy',
  },

  testMatch: ['<rootDir>/src/**/*.spec.ts', '<rootDir>/src/**/*.test.ts'],

  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/e2e/'],

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.routes.ts',
    '!src/main.ts',
    '!src/setup-jest.ts',
    '!src/**/*.d.ts',
    '!src/environments/**',
    '!src/**/index.ts',
  ],

  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['html', 'lcov', 'text-summary'],

  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },

  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],

  verbose: true,
  bail: false,
  maxWorkers: '50%',
  testTimeout: 10000,

  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
};
