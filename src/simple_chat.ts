#!/usr/bin/env node

import blessed from 'blessed'
// import { LLMService } from './services/LLMService.js'
import { LLMServiceV2 } from './services/LLMServiceV2.js'
import { ConfigManager } from './managers/ConfigManager.js'
import type { Message } from './managers/ChatManager.js'

const configManager = new ConfigManager()
// 使用新的基于ai SDK的LLMService
const llmService = new LLMServiceV2(configManager)

// 聊天历史记录
const chatHistory: Message[] = []

// Create a screen object with UTF-8 support
const screen = blessed.screen({
  smartCSR: true,
  fastCSR: true,
  fullUnicode: true,
  dockBorders: true,
  autoPadding: true,
  warnings: false,
})

screen.title = 'Simple Chat'

// Create a display box for showing entered text
const displayBox = blessed.box({
  top: 0,
  left: 0,
  width: '100%',
  height: '85%',
  content: 'Terminal ChatBot',
  tags: true,
  border: {
    type: 'line',
  },
  style: {
    fg: 'white',
    // bg: 'transparent',
    border: {
      fg: '#f0f0f0',
    },
  },
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    ch: ' ',
    track: {
      bg: 'cyan',
    },
    style: {
      inverse: true,
    },
  },
  keys: true,
  vi: true,
  mouse: true,
})

// Create an input box
const inputBox = blessed.textarea({
  top: '85%',
  left: 0,
  width: '100%',
  height: '12%',
  content: '',
  border: {
    type: 'line',
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: '#f0f0f0',
    },
    focus: {
      border: {
        fg: 'green',
      },
    },
  },
  inputOnFocus: true,
  keys: true,
})

const statusBar = blessed.text({
  top: '97%',
  left: 0,
  width: '100%',
  height: '3%',
  style: {
    fg: 'yellow',
  },
  content: 'loading...',
})

// Create a label for the input box
const inputLabel = blessed.text({
  top: 0,
  left: 1,
  width: '100%',
  height: 1,
  content: 'Enter to send | Ctrl+Enter for newline | Ctrl+C to exit | ↑↓ to scroll',
  style: {
    fg: 'yellow',
  },
  parent: inputBox,
})

// Append components to the screen
screen.append(displayBox)
screen.append(inputBox)
screen.append(inputLabel)
screen.append(statusBar)

// 用于跟踪当前AI回复的变量
let currentAIResponse = ''
let isAIResponding = false
let baseContent = ''

const updateStatus = () => {
  const contextLength = configManager.get('contextLength')
  const used = chatHistory.length
  statusBar.setContent(`Context: ${used}/${contextLength}`)
  screen.render()
}

const addMessage = (prefix: string, message: string) => {
  const now = new Date()
  const timeStr = now.toLocaleTimeString()
  let currentContent = displayBox.getContent()
  if (currentContent === 'Terminal ChatBot' || currentContent.trim() === '') {
    currentContent = '=== 聊天开始 ===\n'
  }
  const newContent = currentContent + `[${timeStr}] ${prefix}: ${message}\n`
  displayBox.setContent(newContent)
  displayBox.setScrollPerc(100)
  screen.render()
}

const updateAIMessage = (chunk: string) => {
  currentAIResponse += chunk
  const now = new Date()
  const timeStr = now.toLocaleTimeString()
  const newContent = baseContent + `[${timeStr}] AI: ${currentAIResponse}\n`
  displayBox.setContent(newContent)
  displayBox.setScrollPerc(100)
  screen.render()
}

const startAIResponse = (userMessage: string) => {
  let currentContent = displayBox.getContent()
  if (currentContent === 'Terminal ChatBot' || currentContent.trim() === '') {
    currentContent = '=== 聊天开始 ===\n'
  }
  baseContent = currentContent
  currentAIResponse = ''
  isAIResponding = true

  // 在开始AI回复时，将用户消息添加到聊天历史
  chatHistory.push({
    role: 'user',
    content: userMessage,
  })
  updateStatus()
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
  updateStatus()
}

// 获取上下文消息（限制数量）
const getContextMessages = (newUserMessage: string): Message[] => {
  const contextLength = configManager.get('contextLength')

  // 获取最近的聊天历史（不包括当前用户消息）
  const recentHistory = chatHistory.slice(-Math.max(0, contextLength - 1))

  // 添加当前用户消息
  return [...recentHistory, { role: 'user' as const, content: newUserMessage }]
}

// Handle input submission
inputBox.key('enter', async () => {
  const value = inputBox.getValue()
  if (value.trim() === '/clear') {
    // Clear chat history and display
    chatHistory.length = 0
    displayBox.setContent('=== Chat Cleared ===\n')
    updateStatus()
    inputBox.clearValue()
    inputBox.focus()
    screen.render()
    return
  }

  if (value.trim()) {
    addMessage('You', value)

    inputBox.clearValue()
    inputBox.focus()
    screen.render()

    try {
      // 获取包含上下文的消息数组
      const contextMessages = getContextMessages(value.trim())
      startAIResponse(value.trim())
      llmService.getCompletion(contextMessages)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
      addMessage('Error', errorMessage)
    }
  }
})

// 处理AI回复的数据流
llmService.on('data', (chunk) => {
  if (isAIResponding) {
    updateAIMessage(chunk)
  }
})

// 处理AI回复结束
llmService.on('end', (_fullResponse) => {
  endAIResponse()
})

// 处理错误
llmService.on('error', (error) => {
  endAIResponse()
  addMessage('Error', error)
})

// Handle escape key to clear input
inputBox.key('escape', function () {
  inputBox.clearValue()
  screen.render()
})

inputBox.key('S-enter', function () {
  inputBox.setValue(inputBox.getValue() + '\n')
  screen.render()
})

// 添加滚动功能
screen.key(['up', 'k'], function () {
  displayBox.scroll(-1)
  screen.render()
})

screen.key(['down', 'j'], function () {
  displayBox.scroll(1)
  screen.render()
})

screen.key(['pageup'], function () {
  displayBox.scroll(-5)
  screen.render()
})

screen.key(['pagedown'], function () {
  displayBox.scroll(5)
  screen.render()
})

// 按Tab键在聊天区域和输入框之间切换焦点
screen.key(['tab'], function () {
  if (screen.focused === inputBox) {
    displayBox.focus()
  } else {
    inputBox.focus()
  }
  screen.render()
})

// Quit on Control-C
screen.key(['C-c'], function (_ch, _key) {
  return process.exit(0)
})

// Focus the input box initially
inputBox.focus()

// Render the screen.
updateStatus()
screen.render()
