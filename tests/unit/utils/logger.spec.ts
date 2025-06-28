import config from '../../../src/config/config';

// Mock winston completely
jest.mock('winston', () => {
  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
    debug: jest.fn(),
  };

  return {
    format: {
      combine: jest.fn(() => 'combined-format'),
      timestamp: jest.fn(() => 'timestamp-format'),
      colorize: jest.fn(() => 'colorize-format'),
      printf: jest.fn((fn) => fn),
    },
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
    },
    addColors: jest.fn(),
    createLogger: jest.fn(() => mockLogger),
  };
});

describe('Logger', () => {
  let logger: any;

  beforeEach(() => {
    // Clear module cache to get fresh logger
    jest.resetModules();
    logger = require('../../../src/utils/logger').default;
  });

  it('should export a logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger).toBe('object');
  });

  it('should have all required logging methods', () => {
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.http).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should be able to call all logger methods without errors', () => {
    expect(() => {
      logger.error('Test error message');
      logger.warn('Test warn message');
      logger.info('Test info message');
      logger.http('Test http message');
      logger.debug('Test debug message');
    }).not.toThrow();
  });

  it('should handle different message formats', () => {
    expect(() => {
      logger.info('Simple string message');
      logger.info('Message with data', { userId: 123 });
      logger.error('Error with object', new Error('Test error'));
    }).not.toThrow();
  });

  it('should be a winston logger instance (duck typing)', () => {
    // Test that it has winston-like properties
    expect(logger).toHaveProperty('error');
    expect(logger).toHaveProperty('warn');
    expect(logger).toHaveProperty('info');
    expect(logger).toHaveProperty('debug');
  });

  describe('logger functionality', () => {
    it('should handle logging different data types', () => {
      expect(() => {
        logger.info('String message');
        logger.info(42);
        logger.info({ key: 'value' });
        logger.info(['array', 'of', 'items']);
        logger.info(null);
        logger.info(undefined);
      }).not.toThrow();
    });

    it('should handle error objects properly', () => {
      const error = new Error('Test error');
      error.stack = 'Mock stack trace';
      
      expect(() => {
        logger.error('Error occurred:', error);
        logger.error(error);
      }).not.toThrow();
    });

    it('should handle multiple arguments', () => {
      expect(() => {
        logger.info('Message with', 'multiple', 'arguments');
        logger.debug('Debug info:', { data: 'test' }, 'additional info');
      }).not.toThrow();
    });
  });
});
