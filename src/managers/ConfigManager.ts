import Conf from "conf";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Define the configuration schema
interface ConfigSchema {
  apiKey: string;
  defaultModel: string;
  apiEndpoint: string;
}

// Hardcoded fallback values
const FALLBACK_DEFAULTS: ConfigSchema = {
  apiKey: "",
  defaultModel: "qwen-turbo-latest",
  apiEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/",
};

// Create a type-safe ConfigManager
export class ConfigManager {
  private conf: Conf<ConfigSchema>;

  constructor() {
    // Initialize conf without defaults, as we are handling them manually.
    this.conf = new Conf<ConfigSchema>({ projectName: "chatbot-tui" });
  }

  /**
   * Gets a configuration value by checking sources in the correct priority:
   * 1. User-configured value (from JSON file)
   * 2. Environment variable (from .env file)
   * 3. Hardcoded fallback value
   */
  get<K extends keyof ConfigSchema>(key: K): ConfigSchema[K] {
    if (key === "apiKey") {
      return process.env.AI_API_KEY as ConfigSchema[K];
    }
    if (key === "apiEndpoint") {
      return process.env.AI_BASE_URL as ConfigSchema[K];
    }
    if (key === "defaultModel") {
      return process.env.AI_MODEL as ConfigSchema[K];
    }
  }

  set<K extends keyof ConfigSchema>(key: K, value: ConfigSchema[K]): void {
    this.conf.set(key, value);
    // 1. Check for a value saved in the user's config file
    const savedValue = this.conf.get(key);
    if (savedValue) {
      return savedValue;
    }

    // 2. If not found, check the corresponding environment variable
    const envMap: Record<keyof ConfigSchema, string | undefined> = {
      apiKey: process.env.AI_API_KEY,
      apiEndpoint: process.env.AI_BASE_URL,
      defaultModel: process.env.AI_MODEL,
    };
    const envValue = envMap[key];
    if (envValue) {
      return envValue as ConfigSchema[K];
    }

    // 3. If still not found, use the hardcoded fallback
    return FALLBACK_DEFAULTS[key];
  }

  set<K extends keyof ConfigSchema>(key: K, value: ConfigSchema[K]): void {
    this.conf.set(key, value);
  }

  get configPath(): string {
    return this.conf.path;
  }
}
