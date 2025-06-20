import { useState, useEffect, useCallback } from 'react'
import { getSettings } from '../utils/storage'
import { generateMockFlightData } from './mockSimData'

let connectionInstance = null

class SimConnection {
  constructor() {
    this.connected = false
    this.connecting = false
    this.listeners = new Set()
    this.simData = null
    this.updateInterval = null
  }

  subscribe(listener) {
    this.listeners.add(listener)
    listener({
      connected: this.connected,
      connecting: this.connecting,
      simData: this.simData
    })
    return () => this.listeners.delete(listener)
  }

  notify() {
    this.listeners.forEach(listener => {
      listener({
        connected: this.connected,
        connecting: this.connecting,
        simData: this.simData
      })
    })
  }

  async connect() {
    if (this.connected || this.connecting) return

    this.connecting = true
    this.notify()

    const settings = getSettings()
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      this.connected = true
      this.connecting = false
      
      this.updateInterval = setInterval(() => {
        this.simData = generateMockFlightData()
        this.notify()
      }, 100)
      
      this.notify()
    } catch (error) {
      console.error('Failed to connect to sim:', error)
      this.connecting = false
      this.connected = false
      this.notify()
    }
  }

  disconnect() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    
    this.connected = false
    this.connecting = false
    this.simData = null
    this.notify()
  }

  isConnected() {
    return this.connected
  }

  getSimData() {
    return this.simData
  }
}

export const getSimConnection = () => {
  if (!connectionInstance) {
    connectionInstance = new SimConnection()
  }
  return connectionInstance
}

export const useSimConnection = () => {
  const [state, setState] = useState({
    connected: false,
    connecting: false,
    simData: null
  })

  useEffect(() => {
    const connection = getSimConnection()
    const unsubscribe = connection.subscribe(setState)
    
    const settings = getSettings()
    if (settings.simConnection.autoConnect) {
      connection.connect()
    }
    
    return unsubscribe
  }, [])

  const connect = useCallback(() => {
    getSimConnection().connect()
  }, [])

  const disconnect = useCallback(() => {
    getSimConnection().disconnect()
  }, [])

  return {
    ...state,
    connect,
    disconnect
  }
}