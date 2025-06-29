import { EventEmitter } from 'events'
import { streamText } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { Message } from '../managers/ChatManager'
import type { ConfigManager } from '../managers/ConfigManager'

export class LLMServiceV2 extends EventEmitter {
  private configManager: ConfigManager
  private provider: any

  constructor(configManager: ConfigManager) {
    super()
    this.configManager = configManager
    this.initializeProvider()
  }

  private initializeProvider() {
    const apiKey = this.configManager.get('apiKey')
    const apiEndpoint = this.configManager.get('apiEndpoint')

    this.provider = createOpenAICompatible({
      name: 'custom-llm',
      apiKey: apiKey || process.env['AI_API_KEY'] || '',
      baseURL:
        apiEndpoint ||
        process.env['AI_BASE_URL'] ||
        'https://dashscope.aliyuncs.com/compatible-mode/v1',
    })
  }

  async getCompletion(messages: Message[]) {
    this.emit('start')

    const apiKey = this.configManager.get('apiKey')
    const model =
      this.configManager.get('defaultModel') || process.env['AI_MODEL'] || 'qwen-turbo-latest'

    if (!apiKey && !process.env['AI_API_KEY']) {
      this.emit('error', 'API key is not set. Please configure it in the settings.')
      this.emit('end', null)
      return
    }

    try {
      // 重新初始化provider以确保使用最新配置
      this.initializeProvider()

      const { textStream } = await streamText({
        model: this.provider(model),
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      })

      let fullResponse = ''

      // 使用 for await 来处理流式数据
      for await (const delta of textStream) {
        if (delta) {
          fullResponse += delta
          this.emit('data', delta)
        }
      }

      this.emit('end', fullResponse)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'

      // 处理常见错误
      if (errorMessage.includes('401')) {
        this.emit('error', 'Authentication error (401). Please check your API key.')
      } else if (errorMessage.includes('404')) {
        this.emit(
          'error',
          'API endpoint not found (404). Please check your API endpoint configuration.',
        )
      } else {
        this.emit('error', `AI SDK error: ${errorMessage}`)
      }

      this.emit('end', null)
    }
  }

  // 额外的便捷方法：获取非流式响应
  async getSimpleCompletion(messages: Message[]): Promise<string> {
    const apiKey = this.configManager.get('apiKey')
    const model =
      this.configManager.get('defaultModel') || process.env['AI_MODEL'] || 'qwen-turbo-latest'

    if (!apiKey && !process.env['AI_API_KEY']) {
      throw new Error('API key is not set. Please configure it in the settings.')
    }

    this.initializeProvider()

    const { generateText } = await import('ai')

    const { text } = await generateText({
      model: this.provider(model),
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    })

    return text
  }
}
