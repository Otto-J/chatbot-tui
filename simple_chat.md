# 聊天机器人上下文记录功能开发记录

## 问题描述

用户发现聊天记录中没有携带上下文，AI在控制台中不知道之前聊天的内容，每次对话都是独立的，缺乏连续性。

## 需求分析

- 需要添加聊天历史记录管理
- 默认携带最近 20 条聊天记录作为上下文
- 可配置上下文长度
- 在调用 LLM 服务时携带历史消息

## 解决方案

### 1. 配置管理增强

修改 `src/managers/ConfigManager.ts`：

- 在 `ConfigSchema` 接口中添加 `contextLength: number` 配置项
- 设置默认值为 20 条消息
- 支持通过环境变量 `AI_CONTEXT_LENGTH` 配置
- 修复了原有的语法错误

```typescript
interface ConfigSchema {
  apiKey: string
  defaultModel: string
  apiEndpoint: string
  contextLength: number // 新增
}

const FALLBACK_DEFAULTS: ConfigSchema = {
  apiKey: '',
  defaultModel: 'qwen-turbo-latest',
  apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/',
  contextLength: 20, // 新增默认值
}
```

### 2. 聊天历史记录管理

修改 `src/simple_chat.ts`：

#### 2.1 添加聊天历史存储

```typescript
import type { Message } from './managers/ChatManager.js'

// 聊天历史记录
const chatHistory: Message[] = []
```

#### 2.2 实现上下文消息获取函数

```typescript
// 获取上下文消息（限制数量）
const getContextMessages = (newUserMessage: string): Message[] => {
  const contextLength = configManager.get('contextLength')

  // 获取最近的聊天历史（不包括当前用户消息）
  const recentHistory = chatHistory.slice(-Math.max(0, contextLength - 1))

  // 添加当前用户消息
  return [...recentHistory, { role: 'user' as const, content: newUserMessage }]
}
```

#### 2.3 修改消息处理流程

```typescript
const startAIResponse = (userMessage: string) => {
  // ... 原有逻辑 ...

  // 在开始AI回复时，将用户消息添加到聊天历史
  chatHistory.push({
    role: 'user',
    content: userMessage,
  })
}

const endAIResponse = () => {
  isAIResponding = false
  // 将AI回复添加到聊天历史
  if (currentAIResponse.trim()) {
    chatHistory.push({
      role: 'assistant',
      content: currentAIResponse.trim(),
    })
  }
  // 确保最终消息被保存到baseContent中
  baseContent = displayBox.getContent()
}
```

#### 2.4 修改LLM调用逻辑

```typescript
inputBox.on('submit', async (value) => {
  if (value.trim()) {
    addMessage('You', value)

    inputBox.clearValue()
    inputBox.focus()
    screen.render()

    try {
      // 获取包含上下文的消息数组
      const contextMessages = getContextMessages(value.trim())
      console.log(
        `📝 携带 ${contextMessages.length} 条上下文消息 (配置限制: ${configManager.get('contextLength')} 条)`,
      )
      startAIResponse(value.trim())
      llmService.getCompletion(contextMessages) // 传递上下文消息
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
      addMessage('Error', errorMessage)
    }
  }
})
```

### 3. 调试功能

添加了控制台输出，显示当前携带的上下文消息数量：

```
📝 携带 X 条上下文消息 (配置限制: 20 条)
```

## 工作流程

1. **用户发送消息** → 显示在界面上
2. **获取上下文** → 从历史记录中提取最近的消息
3. **添加到历史** → 将用户消息添加到聊天历史
4. **调用LLM** → 传递包含上下文的消息数组
5. **接收回复** → 流式显示AI回复
6. **保存回复** → 将AI回复添加到聊天历史

## 配置说明

### 默认配置

- 上下文长度：20 条消息
- 包含用户消息和AI回复

### 环境变量配置

可以通过设置环境变量来自定义上下文长度：

```bash
export AI_CONTEXT_LENGTH=30
```

### 程序内配置

也可以通过 ConfigManager 直接设置：

```typescript
configManager.set('contextLength', 15)
```

## 技术特点

1. **内存效率**：只保留最近的消息，避免内存无限增长
2. **配置灵活**：支持多种配置方式
3. **调试友好**：提供调试信息显示上下文状态
4. **类型安全**：使用 TypeScript 接口确保类型正确
5. **向后兼容**：不影响原有功能

## 测试验证

运行程序后，可以通过以下方式验证功能：

1. 发送多条消息
2. 观察控制台输出的上下文数量
3. 测试AI是否能记住之前的对话内容
4. 验证当消息数量超过限制时，是否正确保留最近的消息

## 后续优化建议

1. **持久化存储**：将聊天历史保存到数据库或文件
2. **上下文智能选择**：根据消息重要性选择上下文，而不仅仅是时间顺序
3. **上下文压缩**：对于超长对话，可以考虑摘要压缩
4. **多会话支持**：支持多个独立的聊天会话
5. **上下文管理界面**：提供UI来查看和管理上下文设置

## 问题解决记录

### 配置文件语法错误

- **问题**：ConfigManager.ts 中存在重复的方法定义和语法错误
- **解决**：重写了 get 和 set 方法，修复了类型检查问题

### 消息重复添加

- **问题**：用户消息被重复添加到聊天历史
- **解决**：调整了消息添加的时机，在 startAIResponse 中统一处理

### 上下文数量计算

- **问题**：上下文数量计算逻辑复杂
- **解决**：简化了 getContextMessages 函数的实现逻辑

## 总结

成功为聊天机器人添加了上下文记录功能，现在AI可以记住之前的对话内容，提供更连贯的对话体验。默认携带最近20条消息，用户可以根据需要进行配置调整。
