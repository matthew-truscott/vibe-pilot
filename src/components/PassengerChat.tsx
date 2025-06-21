import { useState, useEffect, useRef } from 'react'
import { useSimConnection, getSimConnection } from '../services/simConnection'
import chatService from '../services/chatService'
import speechService from '../services/speechService'
import { getSettings } from '../utils/storage'
import './PassengerChat.css'

interface Message {
  id: number
  role: 'pilot' | 'passenger'
  content: string
  timestamp: Date
}

interface IncomingMessageData {
  type: string
  message?: string
  timestamp?: string
  sessionId?: string
}

interface PassengerChatProps {
  shouldConnect?: boolean;
}

function PassengerChat({ shouldConnect = true }: PassengerChatProps) {
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState<string>('')
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [sessionId, setSessionId] = useState<string | null>(chatService.getSessionId())
  const [isTyping, setIsTyping] = useState<boolean>(false)
  const [isStartingTour, setIsStartingTour] = useState<boolean>(false)
  const [isListening, setIsListening] = useState<boolean>(false)
  const [autoPlayEnabled, setAutoPlayEnabled] = useState<boolean>(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { simData } = useSimConnection()

  useEffect(() => {
    if (!shouldConnect) {
      console.log('Chat connection disabled via props')
      return
    }
    
    // Initialize chat service
    chatService.connect({
      onConnect: () => {
        setIsConnected(true)
        // Sync sessionId from service
        const currentSessionId = chatService.getSessionId()
        setSessionId(currentSessionId)
        
        // Wait a moment for WebSocket to be fully ready
        setTimeout(() => {
          startTour()
        }, 100)
      },
      onDisconnect: () => {
        setIsConnected(false)
      },
      onMessage: handleIncomingMessage
    })

    // Fallback: Enable chat after 2 seconds even if WebSocket fails
    const fallbackTimer = setTimeout(() => {
      // Check both connection state and if we already have a session
      if (!chatService.isConnected() && !chatService.getSessionId()) {
        setIsConnected(true)
        startTour()
      }
    }, 2000)

    return () => {
      clearTimeout(fallbackTimer)
      // Don't disconnect on unmount - keep connection alive for navigation
      // chatService.disconnect()
    }
  }, [shouldConnect]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const startTour = async (): Promise<void> => {
    console.log('startTour called, current sessionId:', sessionId, 'isStartingTour:', isStartingTour)
    
    // Prevent multiple concurrent tour starts
    if (isStartingTour) {
      console.log('Tour start already in progress, skipping')
      return
    }
    
    const currentSessionId = chatService.getSessionId()
    if (currentSessionId) {
      console.log('Tour already started with sessionId:', currentSessionId)
      setSessionId(currentSessionId)
      return
    }
    
    setIsStartingTour(true)
    
    try {
      console.log('Starting new tour...')
      const settings = getSettings()
      const destination = settings.startingLocation || 'athens'
      const result = await chatService.startTour('Guest', destination)
      console.log('Tour started with result:', result)
      setSessionId(result.sessionId)
      
      // Request flight info updates after tour starts
      setTimeout(() => {
        chatService.requestFlightInfo()
        // Also trigger through SimConnection
        const simConnection = getSimConnection()
        simConnection.requestFlightInfo()
      }, 500)
    } catch (error) {
      console.error('Failed to start tour:', error)
    } finally {
      setIsStartingTour(false)
    }
  }

  const handleIncomingMessage = (data: IncomingMessageData): void => {
    console.log('handleIncomingMessage called with:', data)
    
    if (data.type === 'PILOT_MESSAGE') {
      setIsTyping(false)
      const newMessage = {
        id: Date.now(),
        role: 'pilot' as const,
        content: data.message || '',
        timestamp: new Date(data.timestamp || Date.now())
      }
      console.log('Adding pilot message:', newMessage)
      setMessages(prev => [...prev, newMessage])
      
      // Auto-play pilot message if enabled
      if (autoPlayEnabled && data.message) {
        speechService.speak(data.message)
      }
    } else if (data.type === 'MESSAGE_RECEIVED') {
      setIsTyping(true)
    } else if (data.type === 'TOUR_STARTED') {
      console.log('Tour started message received:', data)
      // Make sure we capture the sessionId from the backend
      if (data.sessionId) {
        setSessionId(data.sessionId)
      }
    }
  }

  const sendMessage = async (): Promise<void> => {
    if (!inputMessage.trim()) return

    const message = inputMessage.trim()
    setInputMessage('')

    // Add passenger message to chat
    const newMessage = {
      id: Date.now(),
      role: 'passenger' as const,
      content: message,
      timestamp: new Date()
    }
    console.log('Adding passenger message:', newMessage)
    setMessages(prev => {
      const updated = [...prev, newMessage]
      console.log('Updated messages:', updated)
      return updated
    })

    // Send message with flight data
    if (!sessionId) {
      console.warn('No session ID available - cannot send message')
      return
    }
    
    try {
      chatService.sendMessage(message, simData || undefined)
    } catch (error) {
      console.error('Failed to send message:', error)
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  const handleVoiceInput = (): void => {
    if (isListening) {
      speechService.stopListening()
      setIsListening(false)
    } else {
      setIsListening(true)
      speechService.startListening(
        (text: string) => {
          setInputMessage(text)
          setIsListening(false)
          // Optionally auto-send the message
          if (text.trim()) {
            setTimeout(() => sendMessage(), 500)
          }
        },
        (error: any) => {
          console.error('Voice input error:', error)
          setIsListening(false)
        }
      )
    }
  }
  
  const toggleAutoPlay = (): void => {
    const newState = !autoPlayEnabled
    setAutoPlayEnabled(newState)
    speechService.setAutoPlay(newState)
  }

  const sendQuickQuestion = (question: string): void => {
    // Set the message and send immediately
    setInputMessage(question)
    
    // Add passenger message to chat
    const newMessage = {
      id: Date.now(),
      role: 'passenger' as const,
      content: question,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])

    // Send message with flight data
    if (!sessionId) {
      console.warn('No session ID available - cannot send message')
      return
    }
    
    try {
      chatService.sendMessage(question, simData || undefined)
      setInputMessage('') // Clear input after sending
      
      // Generate new random questions for next time
      setTimeout(() => {
        setQuickQuestions(generateQuickQuestions(3))
      }, 1000) // Small delay so user can see their choice was sent
    } catch (error) {
      console.error('Failed to send message:', error)
      setIsTyping(false)
    }
  }

  const allQuickQuestions = [
    "What's that below us?",
    "How high are we flying?", 
    "Is this normal turbulence?",
    "Can we fly over there?",
    "How fast are we going?",
    "What's our flight plan?",
    "Is it safe to fly in this weather?",
    "Can you show me the city center?",
    "How long until we land?",
    "What aircraft are we flying?",
    "Can we see the mountains from here?",
    "What's that noise?",
    "Are we on course?",
    "How's the fuel looking?"
  ]

  // State for current quick questions
  const [quickQuestions, setQuickQuestions] = useState<string[]>([])

  // Generate random questions
  const generateQuickQuestions = (count: number = 3) => {
    const shuffled = [...allQuickQuestions].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  // Initialize quick questions on mount
  useEffect(() => {
    setQuickQuestions(generateQuickQuestions(3))
  }, [])

  return (
    <div className="passenger-chat">
      <div className="chat-header">
        <div className="pilot-info">
          <span className="pilot-avatar">👩‍✈️</span>
          <div>
            <h3>Captain Sarah Mitchell</h3>
            <span className={`status ${isConnected ? 'online' : 'offline'}`}>
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={toggleAutoPlay}
            title={autoPlayEnabled ? 'Disable auto-play voice' : 'Enable auto-play voice'}
            style={{
              background: autoPlayEnabled ? 'var(--primary-blue)' : 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 16px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
          >
            {autoPlayEnabled ? '🔊' : '🔇'} Auto-speak
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && <div style={{padding: '20px', color: '#666'}}>No messages yet...</div>}
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'pilot' ? '👩‍✈️' : '🧑'}
            </div>
            <div className="message-content">
              <div className="message-header">
                <span className="message-author">
                  {msg.role === 'pilot' ? 'Captain Sarah' : 'You'}
                </span>
                <span className="message-time">
                  {msg.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className="message-text">
                {msg.content}
                {msg.role === 'pilot' && (
                  <button
                    onClick={() => speechService.speak(msg.content, true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      marginLeft: '10px',
                      fontSize: '16px',
                      opacity: 0.7,
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                    title="Listen to message"
                  >
                    🔊
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message pilot typing">
            <div className="message-avatar">👩‍✈️</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="quick-questions">
        {quickQuestions.map((question, index) => (
          <button
            key={index}
            className="quick-question-btn"
            onClick={() => sendQuickQuestion(question)}
            disabled={!sessionId}
          >
            {question}
          </button>
        ))}
      </div>

      <div className="chat-input">
        <button
          onClick={handleVoiceInput}
          disabled={!isConnected}
          style={{
            background: isListening ? '#ff4444' : 'var(--button-gradient)',
            border: 'none',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: 'white',
            transition: 'all 0.3s ease',
            animation: isListening ? 'pulse 1.5s infinite' : 'none'
          }}
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isListening ? '⏹️' : '🎤'}
        </button>
        <input
          type="text"
          placeholder={isListening ? "Listening..." : "Ask your pilot anything..."}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!isConnected}
          style={{
            backgroundColor: isListening ? '#f0f8ff' : 'white'
          }}
        />
        <button 
          onClick={sendMessage} 
          disabled={!isConnected || !inputMessage.trim()}
          className="send-button"
        >
          <span>Send</span>
        </button>
      </div>
    </div>
  )
}

export default PassengerChat
