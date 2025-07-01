import Conf from 'conf'
// import dotenv from 'dotenv'

// Load environment variables from .env file
// dotenv.config()

// Define the configuration schema
interface ConfigSchema {
  apiKey: string
  defaultModel: string
  apiEndpoint: string
  contextLength: number
}

// Hardcoded fallback values
const FALLBACK_DEFAULTS: ConfigSchema = {
  apiKey: '',
  defaultModel: 'qwen-turbo-latest',
  apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/',
  contextLength: 20,
}

// Create a type-safe ConfigManager
export class ConfigManager {
  private conf: Conf<ConfigSchema>

  constructor() {
    // Initialize conf without defaults, as we are handling them manually.
    this.conf = new Conf<ConfigSchema>({
      projectName: 'chatbot-tui',
      rootSchema: {
        additionalProperties: false,
      },
    })
  }

  /**
   * Gets a configuration value by checking sources in the correct priority:
   * 1. User-configured value (from JSON file)
   * 2. Environment variable (from .env file)
   * 3. Hardcoded fallback value
   */
  get<K extends keyof ConfigSchema>(key: K): ConfigSchema[K] {
    const listKeys = Object.keys(FALLBACK_DEFAULTS) as (keyof ConfigSchema)[]
    // 1. Check for a value saved in the user's config file
    const savedValue = this.conf.get(key)
    if (savedValue !== undefined) {
      return savedValue
    }
    if (listKeys.includes(key)) {
      const envMap: Record<keyof ConfigSchema, string | undefined> = {
        apiKey: process.env['AI_API_KEY'],
        apiEndpoint: process.env['AI_BASE_URL'],
        defaultModel: process.env['AI_MODEL'],
        contextLength: process.env['AI_CONTEXT_LENGTH'],
      }
      const envValue = envMap[key]
      if (envValue !== undefined) {
        // Convert string to number for contextLength
        if (key === 'contextLength') {
          const num = parseInt(envValue, 10)
          // save to config
          return (isNaN(num) ? FALLBACK_DEFAULTS[key] : num) as ConfigSchema[K]
        }
        // save to config
        return envValue as ConfigSchema[K]
      }
    }

    // 2. If not found, check the corresponding environment variable

    // 3. If still not found, use the hardcoded fallback
    return FALLBACK_DEFAULTS[key]
  }

  set<K extends keyof ConfigSchema>(key: K, value: ConfigSchema[K]): void {
    this.conf.set(key, value)
  }

  get configPath(): string {
    return this.conf.path
  }
}
