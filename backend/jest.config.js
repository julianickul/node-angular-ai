/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.(t|j)s',
    '!**/*.module.(t|j)s',
    '!**/main.(t|j)s',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/migrations/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@module/(.*)$': '<rootDir>/modules/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@database/(.*)$': '<rootDir>/infrastructure/database/$1',
    '^@core/(.*)$': '<rootDir>/core/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@nnaai/shared-types$': '<rootDir>/../../shared-types/src/index.ts',
    '^@nnaai/shared-types/(.*)$': '<rootDir>/../../shared-types/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/../tests/setup.ts'],
};
