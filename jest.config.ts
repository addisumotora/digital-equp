module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^services/(.*)$': '<rootDir>/src/services/$1',
    '^models/(.*)$': '<rootDir>/src/models/$1',
    '^utils/(.*)$': '<rootDir>/src/utils/$1',
    '^types/(.*)$': '<rootDir>/src/types/$1'
  },
  roots: ['<rootDir>/src', '<rootDir>/tests']
};
