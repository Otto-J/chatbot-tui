import { describe, it, expect, beforeEach } from 'vitest'
import { ChatManager, type Message } from './ChatManager'

describe('ChatManager', () => {
  let chatManager: ChatManager

  beforeEach(() => {
    // Now creates a clean instance every time
    chatManager = new ChatManager()
  })

  it('should start with zero sessions', () => {
    expect(chatManager.getSessions()).toHaveLength(0)
  })

  it('should create a new session and set it as active', () => {
    expect(chatManager.getSessions()).toHaveLength(0) // Starts empty
    const newSession = chatManager.createNewSession('Test Session')
    const sessions = chatManager.getSessions()
    expect(sessions).toHaveLength(1) // Now has one

    const activeSession = chatManager.getActiveSession()
    expect(activeSession).toBeDefined()
    expect(activeSession?.id).toBe(newSession.id)
    expect(sessions[0]!.title).toBe('Test Session')
  })

  it('should add a message to the active session', () => {
    const session = chatManager.createNewSession()
    const newMessage: Message = { role: 'user', content: 'Hello, world!' }
    chatManager.addMessage(session.id, newMessage)

    const updatedSession = chatManager.getActiveSession()
    expect(updatedSession?.messages).toHaveLength(1)
    expect(updatedSession?.messages[0]).toEqual(newMessage)
  })

  it('should switch the active session', () => {
    const session1 = chatManager.createNewSession('Session 1')
    const session2 = chatManager.createNewSession('Session 2')

    chatManager.setActiveSession(session1.id)
    let active = chatManager.getActiveSession()
    expect(active?.id).toBe(session1.id)

    chatManager.setActiveSession(session2.id)
    active = chatManager.getActiveSession()
    expect(active?.id).toBe(session2.id)
  })

  it('should return sessions sorted by creation date (newest first)', async () => {
    chatManager.createNewSession('First')
    // A small delay to ensure different creation timestamps
    await new Promise((resolve) => setTimeout(resolve, 10))
    chatManager.createNewSession('Second')

    const sessions = chatManager.getSessions()
    expect(sessions[0]!.title).toBe('Second')
    expect(sessions[1]!.title).toBe('First')
  })
})
