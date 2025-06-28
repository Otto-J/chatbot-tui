#!/usr/bin/env node
import blessed from 'blessed';
import { LLMService } from './services/LLMService';

async function startTUI(): Promise<void> {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'Chatbot TUI',
    fullUnicode: true,
  });

  // --- 左侧边栏 ---
  const sidebar = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '30%',
    height: '100%',
    style: { border: { fg: 'cyan' } },
    border: 'line',
    label: '导航',
  });

  const navMenu = blessed.list({
    parent: sidebar,
    top: 0,
    left: 0,
    width: '100%-2',
    height: 6,
    items: ['💬 Chat', '🤖 Agent', '📚 知识库', '⚙️ 设置'],
    keys: true,
    mouse: true,
    border: 'line',
    style: {
      border: { fg: 'white' },
      selected: { bg: 'blue' },
    },
    label: '主菜单',
  });

  const historyList = blessed.list({
    parent: sidebar,
    top: 6,
    left: 0,
    width: '100%-2',
    height: '100%-8',
    items: ['(新聊天)', '会话1: 关于TUI布局的讨论', '会话2: stricli项目初始化', '会话3: bun的使用'],
    keys: true,
    mouse: true,
    border: 'line',
    style: {
      border: { fg: 'white' },
      selected: { bg: 'blue' },
    },
    label: '历史记录',
  });

  // --- 右侧主内容区 ---
  const mainContentContainer = blessed.box({
    parent: screen,
    top: 0,
    left: '30%',
    width: '70%',
    height: '100%',
  });

  const header = blessed.text({
    parent: mainContentContainer,
    top: 0,
    left: 1,
    height: 1,
    content: '当前会话: (新聊天)',
    style: { bold: true },
  });

  const chatLog = blessed.log({
    parent: mainContentContainer,
    top: 1,
    left: 0,
    width: '100%-2',
    height: '100%-5',
    border: 'line',
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: ' ', style: { bg: 'red' } },
    keys: true,
    mouse: true,
    tags: true,
  });

  const inputBox = blessed.textbox({
    parent: mainContentContainer,
    bottom: 0,
    left: 0,
    width: '100%-2',
    height: 3,
    border: 'line',
    style: { border: { fg: 'green' } },
    inputOnFocus: true,
  });

  // --- 服务实例化 ---
  const llmService = new LLMService();

  // --- 交互逻辑 ---
  inputBox.on('submit', (text) => {
    if (text.trim()) {
      chatLog.log(`{blue-fg}You:{/} ${text}`);
      inputBox.clearValue();
      inputBox.focus();
      screen.render();

      // 调用LLM服务
      llmService.getCompletion(text);
    }
  });

  llmService.on('start', () => {
    chatLog.log(`{green-fg}AI:{/} `); // 准备好接收AI的回答
  });

  llmService.on('data', (chunk) => {
    chatLog.add(chunk); // 将流式数据块追加到最后一行
    screen.render();
  });

  llmService.on('end', () => {
    inputBox.focus(); // AI回答结束后，焦点回到输入框
    screen.render();
  });

  historyList.on('select', (item, index) => {
    const selectedText = item.getText().replace(/<\/?\w+>/g, '');
    header.setContent(`当前会话: ${selectedText}`);
    chatLog.setContent('');
    chatLog.log(`加载会话: "${selectedText}"...`);
    inputBox.focus();
    screen.render();
  });

  // --- 全局快捷键 ---
  screen.key(['tab'], (ch, key) => {
    key.shift ? screen.focusPrevious() : screen.focusNext();
  });

  screen.key(['q', 'C-c'], (ch, key) => {
    return process.exit(0);
  });
  
  historyList.focus();
  historyList.select(0);

  screen.render();
}

startTUI().catch(console.error);
