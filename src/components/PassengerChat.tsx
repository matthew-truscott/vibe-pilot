import { useState, useEffect, useRef } from 'react'
import { useSimConnection } from '../services/simConnection'
import chatService from '../services/chatService'
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
}

function PassengerChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState<string>('')
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState<boolean>(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { simData } = useSimConnection()

  useEffect(() => {
    // Initialize chat service
    chatService.connect({
      onConnect: () => {
        console.log('Connected to chat service')
        setIsConnected(true)
        startTour()
      },
      onDisconnect: () => {
        console.log('Disconnected from chat service')
        setIsConnected(false)
      },
      onMessage: handleIncomingMessage
    })

    return () => {
      chatService.disconnect()
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const startTour = async (): Promise<void> => {
    try {
      const result = await chatService.startTour('Guest', 'scenic')
      setSessionId(result.sessionId)
      
      // Add welcome message
      setMessages([{
        id: Date.now(),
        role: 'pilot',
        content: result.message,
        timestamp: new Date()
      }])
    } catch (error) {
      console.error('Failed to start tour:', error)
    }
  }

  const handleIncomingMessage = (data: IncomingMessageData): void => {
    if (data.type === 'PILOT_MESSAGE') {
      setIsTyping(false)
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'pilot',
        content: data.message || '',
        timestamp: new Date(data.timestamp || Date.now())
      }])
    } else if (data.type === 'MESSAGE_RECEIVED') {
      setIsTyping(true)
    }
  }

  const sendMessage = async (): Promise<void> => {
    if (!inputMessage.trim() || !sessionId) return

    const message = inputMessage.trim()
    setInputMessage('')

    // Add passenger message to chat
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'passenger',
      content: message,
      timestamp: new Date()
    }])

    // Send message with flight data
    try {
      await chatService.sendMessage(message, simData || undefined)
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

  const quickQuestions = [
    "What's that below us?",
    "How high are we flying?",
    "Is this normal turbulence?",
    "Can we fly over there?",
  ]

  return (
    <div className="passenger-chat">
      <div className="chat-header">
        <div className="pilot-info">
          <span className="pilot-avatar">👨‍✈️</span>
          <div>
            <h3>Captain Mike</h3>
            <span className={`status ${isConnected ? 'online' : 'offline'}`}>
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'pilot' ? '👨‍✈️' : '🧑'}
            </div>
            <div className="message-content">
              <div className="message-header">
                <span className="message-author">
                  {msg.role === 'pilot' ? 'Captain Mike' : 'You'}
                </span>
                <span className="message-time">
                  {msg.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className="message-text">{msg.content}</div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message pilot typing">
            <div className="message-avatar">👨‍✈️</div>
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
            onClick={() => setInputMessage(question)}
          >
            {question}
          </button>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Ask your pilot anything..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!isConnected}
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