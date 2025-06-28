#!/usr/bin/env node
import blessed from "blessed";
import { LLMService } from "./services/LLMService";
import { ChatManager } from "./managers/ChatManager";
import { ConfigManager } from "./managers/ConfigManager";

async function startTUI(): Promise<void> {
  const screen = blessed.screen({
    smartCSR: true,
    title: "Chatbot TUI",
    fullUnicode: true,
  });

  // --- Manager & Service Instantiation ---
  const configManager = new ConfigManager();
  const chatManager = new ChatManager();
  chatManager.initialize(); // Set up default session
  // const llmService = new LLMService(configManager);

  // --- UI 更新函数 ---
  function updateHistoryList() {
    const sessions = chatManager.getSessions();
    historyList.setItems(sessions.map((s) => s.title));
    screen.render();
  }

  function loadSession(sessionId: string) {
    chatManager.setActiveSession(sessionId);
    const session = chatManager.getActiveSession();
    if (session) {
      header.setContent(`当前会话: ${session.title}`);
      chatLog.setContent("");
      session.messages.forEach((msg) => {
        const color = msg.role === "user" ? "blue-fg" : "green-fg";
        const prefix = msg.role === "user" ? "You" : "AI";
        chatLog.log(`{${color}}${prefix}:{/} ${msg.content}`);
      });
    }
    screen.render();
  }

  // --- 左侧边栏 ---
  const sidebar = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: "30%",
    height: "100%",
    style: { border: { fg: "cyan" } },
    border: "line",
    label: "导航",
  });

  const navMenu = blessed.list({
    parent: sidebar,
    top: 0,
    left: 0,
    width: "100%-2",
    height: 6,
    items: ["💬 Chat", "🤖 Agent", "📚 知识库", "⚙️ 设置"],
    keys: true,
    mouse: true,
    border: "line",
    style: { border: { fg: "white" }, selected: { bg: "blue" } },
    label: "主菜单",
  });

  const historyList = blessed.list({
    parent: sidebar,
    top: 6,
    left: 0,
    width: "100%-2",
    height: "100%-8",
    items: [], // 将由ChatManager动态填充
    keys: true,
    mouse: true,
    border: "line",
    style: { border: { fg: "white" }, selected: { bg: "blue" } },
    label: "历史记录 (Ctrl+N 新建)",
  });

  // --- 右侧主内容区 ---
  const mainContentContainer = blessed.box({
    parent: screen,
    top: 0,
    left: "30%",
    width: "70%",
    height: "100%",
  });

  const header = blessed.text({
    parent: mainContentContainer,
    top: 0,
    left: 1,
    height: 1,
    content: "",
    style: { bold: true },
  });

  const chatLog = blessed.log({
    parent: mainContentContainer,
    top: 1,
    left: 0,
    width: "100%-2",
    height: "100%-5",
    border: "line",
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: " ", style: { bg: "red" } },
    keys: true,
    mouse: true,
    tags: true,
  });

  const inputBox = blessed.textbox({
    parent: mainContentContainer,
    bottom: 0,
    left: 0,
    width: "100%-2",
    height: 3,
    border: "line",
    style: { border: { fg: "green" } },
    inputOnFocus: true,
  });

  // --- 服务实例化 ---
  const llmService = new LLMService(configManager);

  // --- 交互逻辑 ---
  inputBox.on("submit", (text) => {
    if (text.trim()) {
      const activeSession = chatManager.getActiveSession();
      if (activeSession) {
        chatManager.addMessage(activeSession.id, {
          role: "user",
          content: text,
        });
        chatLog.log(`{blue-fg}You:{/} ${text}`);
        inputBox.clearValue();
        screen.render();
        // Pass the full message history to the LLM service
        llmService.getCompletion(activeSession.messages);
      }
    }
  });

  llmService.on("start", () => {
    chatLog.log(`{green-fg}AI:{/} `);
  });

  llmService.on("data", (chunk) => {
    chatLog.add(chunk);
    screen.render();
  });

  llmService.on("end", (fullResponse) => {
    const activeSession = chatManager.getActiveSession();
    if (activeSession && fullResponse) {
      chatManager.addMessage(activeSession.id, {
        role: "assistant",
        content: fullResponse,
      });
    }
    inputBox.focus();
    screen.render();
  });

  llmService.on("error", (errorMessage) => {
    chatLog.log(`{red-fg}Error: ${errorMessage}{/}`);
    inputBox.focus();
    screen.render();
  });

  historyList.on("select", (item, index) => {
    const sessions = chatManager.getSessions();
    const selectedSession = sessions[index];
    if (selectedSession) {
      loadSession(selectedSession.id);
    }
  });

  // --- 全局快捷键 ---
  screen.key(["C-n"], () => {
    const newSession = chatManager.createNewSession();
    updateHistoryList();
    loadSession(newSession.id);
    historyList.select(0);
    inputBox.focus();
  });

  screen.key(["tab"], (ch, key) => {
    key.shift ? screen.focusPrevious() : screen.focusNext();
  });

  screen.key(["q", "C-c"], (ch, key) => {
    return process.exit(0);
  });

  // --- 初始化 ---
  updateHistoryList();
  const firstSession = chatManager.getSessions()[0];
  if (firstSession) {
    loadSession(firstSession.id);
    historyList.select(0);
  }
  historyList.focus();
  screen.render();
}

startTUI().catch(console.error);
