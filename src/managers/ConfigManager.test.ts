import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigManager } from './ConfigManager';
import Conf from 'conf';

// Mock the Conf class so we don't write to the actual file system during tests
vi.mock('conf');

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    configManager = new ConfigManager();
  });

  it('should retrieve default values correctly', () => {
    const mockConfInstance = Conf.mock.instances[0];
    mockConfInstance.get.mockReturnValue('gpt-4o'); // Mock the return value

    const model = configManager.get('defaultModel');
    
    expect(mockConfInstance.get).toHaveBeenCalledWith('defaultModel');
    expect(model).toBe('gpt-4o');
  });

  it('should set and get a value correctly', () => {
    const mockConfInstance = Conf.mock.instances[0];
    const newApiKey = 'test-api-key';

    configManager.set('apiKey', newApiKey);
    expect(mockConfInstance.set).toHaveBeenCalledWith('apiKey', newApiKey);

    // To test the 'get' part
    mockConfInstance.get.mockReturnValue(newApiKey);
    const apiKey = configManager.get('apiKey');
    expect(mockConfInstance.get).toHaveBeenCalledWith('apiKey');
    expect(apiKey).toBe(newApiKey);
  });

  it('should return the configuration file path', () => {
    const mockConfInstance = Conf.mock.instances[0];
    const mockPath = '/mock/path/to/config.json';
    
    // Manually set the path property on the mocked instance
    Object.defineProperty(mockConfInstance, 'path', {
        get: vi.fn(() => mockPath),
    });

    const path = configManager.configPath;
    expect(path).toBe(mockPath);
  });
});
