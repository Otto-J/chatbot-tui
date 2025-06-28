import Conf from 'conf';

// 定义配置的数据结构
interface ConfigSchema {
  apiKey: string;
  defaultModel: string;
  apiEndpoint: string;
}

// 创建一个类型安全的 ConfigManager
export class ConfigManager {
  private conf: Conf<ConfigSchema>;

  constructor() {
    this.conf = new Conf<ConfigSchema>({
      // 项目名称，用于决定配置文件的存放位置
      projectName: 'chatbot-tui',
      // 配置项的默认值
      defaults: {
        apiKey: '',
        defaultModel: 'gpt-4o',
        apiEndpoint: 'https://api.openai.com/v1',
      },
    });
  }

  get<K extends keyof ConfigSchema>(key: K): ConfigSchema[K] {
    return this.conf.get(key);
  }

  set<K extends keyof ConfigSchema>(key: K, value: ConfigSchema[K]): void {
    this.conf.set(key, value);
  }
  
  // 提供一个方便的路径属性，用于在UI中显示配置文件的位置
  get configPath(): string {
    return this.conf.path;
  }
}
