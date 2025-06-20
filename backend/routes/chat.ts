import express, { Request, Response } from 'express';
import pilotAgent from '../services/pilotAgent';

const router = express.Router();

interface StartTourRequest {
  passengerName: string;
  tourType: string;
}

interface FlightData {
  altitude: number;
  latitude?: number;
  longitude?: number;
  heading?: number;
  speed?: number;
  aircraft?: string;
  onGround: boolean;
}

interface MessageRequest {
  sessionId: string;
  message: string;
  flightData?: FlightData;
}

interface EndTourRequest {
  sessionId: string;
}

// Start a new tour session
router.post('/start', async (req: Request<{}, {}, StartTourRequest>, res: Response) => {
  try {
    const { passengerName, tourType } = req.body;
    const result = await pilotAgent.startTour(passengerName, tourType);
    
    res.json({
      success: true,
      sessionId: result.sessionId,
      welcomeMessage: result.welcomeMessage
    });
  } catch (error) {
    console.error('Error starting tour:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start tour'
    });
  }
});

// Send a message (for non-WebSocket clients)
router.post('/message', async (req: Request<{}, {}, MessageRequest>, res: Response) => {
  try {
    const { sessionId, message, flightData } = req.body;
    
    if (!sessionId || !message) {
      res.status(400).json({
        success: false,
        error: 'Session ID and message are required'
      });
      return;
    }
    
    const response = await pilotAgent.sendMessage(sessionId, message, flightData || { altitude: 0, onGround: true });
    
    res.json({
      success: true,
      response
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message'
    });
  }
});

// Get conversation history
router.get('/history/:sessionId', (req: Request<{ sessionId: string }>, res: Response) => {
  try {
    const { sessionId } = req.params;
    const history = pilotAgent.getHistory(sessionId);
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation history'
    });
  }
});

// End tour session
router.post('/end', (req: Request<{}, {}, EndTourRequest>, res: Response) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
      return;
    }
    
    pilotAgent.endTour(sessionId);
    
    res.json({
      success: true,
      message: 'Tour ended successfully'
    });
  } catch (error) {
    console.error('Error ending tour:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end tour'
    });
  }
});

export default router;