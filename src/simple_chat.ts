import blessed from 'blessed'
import { LLMService } from './services/LLMService.js'
import { LLMServiceV2 } from './services/LLMServiceV2.js'
import { ConfigManager } from './managers/ConfigManager.js'

const configManager = new ConfigManager()
// 使用新的基于ai SDK的LLMService
const llmService = new LLMServiceV2(configManager)

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
const inputBox = blessed.textbox({
  top: '85%',
  left: 0,
  width: '100%',
  height: '15%',
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

// Create a label for the input box
const inputLabel = blessed.text({
  top: 0,
  left: 1,
  width: '100%',
  height: 1,
  content: '输入消息后按Enter发送 | Ctrl+C退出 | ↑↓滚动聊天记录',
  style: {
    fg: 'yellow',
  },
  parent: inputBox,
})

// Append components to the screen
screen.append(displayBox)
screen.append(inputBox)
screen.append(inputLabel)

// 用于跟踪当前AI回复的变量
let currentAIResponse = ''
let isAIResponding = false
let baseContent = ''

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

const startAIResponse = () => {
  let currentContent = displayBox.getContent()
  if (currentContent === 'Terminal ChatBot' || currentContent.trim() === '') {
    currentContent = '=== 聊天开始 ===\n'
  }
  baseContent = currentContent
  currentAIResponse = ''
  isAIResponding = true
}

const endAIResponse = () => {
  isAIResponding = false
  // 确保最终消息被保存到baseContent中
  baseContent = displayBox.getContent()
}

// Handle input submission
inputBox.on('submit', async (value) => {
  if (value.trim()) {
    addMessage('You', value)
    inputBox.clearValue()
    inputBox.focus()
    screen.render()

    try {
      startAIResponse()
      llmService.getCompletion([{ role: 'user', content: value }])
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
llmService.on('end', (fullResponse) => {
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
screen.key(['C-c'], function (ch, key) {
  return process.exit(0)
})

// Focus the input box initially
inputBox.focus()

// Render the screen.
screen.render()
