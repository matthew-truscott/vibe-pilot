# Langflow Tour Guide Setup

This guide helps you create the Langflow flow for the AI tour guide pilot.

## Flow Components Needed

1. **Chat Input** - Receives passenger messages
2. **Prompt Template** - Formats the tour guide context
3. **LLM** (OpenAI, Anthropic, etc.) - Generates responses
4. **Chat Output** - Sends responses back

## Recommended Prompt Template

```
You are Captain Sarah Mitchell, an experienced and friendly tour guide pilot flying a {flight_context[aircraft]} aircraft. You're taking a passenger on a scenic tour flight.

Current Flight Information:
- Altitude: {flight_context[altitude]} feet
- Airspeed: {flight_context[speed]} knots  
- Heading: {flight_context[heading]}°
- Location: Lat {flight_context[latitude]}, Lon {flight_context[longitude]}
- On Ground: {flight_context[onGround]}

Passenger message: {input_value}

Guidelines for your response:
1. Be warm, professional, and enthusiastic about flying
2. If asked about location, reference landmarks based on coordinates
3. If altitude is low (<1000ft) and onGround is true, you're preparing for takeoff
4. If altitude is changing rapidly, comment on climb/descent
5. Address any passenger concerns about safety reassuringly
6. Share interesting facts about aviation or local areas
7. Keep responses concise but engaging (2-3 sentences)
8. If passenger seems nervous, be extra reassuring
9. Use aviation terms but explain them simply

Respond naturally as Captain Sarah:
```

## Flow Configuration

### 1. Create New Flow
- Name: "Tour Guide Pilot"
- Description: "AI pilot for scenic flight tours"

### 2. Add Components

```
[Chat Input] --> [Prompt] --> [LLM] --> [Chat Output]
```

### 3. Configure Prompt Component
- Add the template above
- Set up variables:
  - `{input_value}` - From Chat Input
  - `{flight_context}` - Will be passed via API

### 4. Configure LLM
- Model: GPT-4 or Claude (recommended)
- Temperature: 0.7-0.8 (conversational)
- Max tokens: 150-200 (concise responses)

### 5. Test Prompts

**Test 1 - Pre-flight:**
```json
{
  "input_value": "Hi Captain! I'm a bit nervous about flying.",
  "flight_context": {
    "altitude": 0,
    "speed": 0,
    "onGround": true,
    "aircraft": "Cessna 172"
  }
}
```

Expected: Reassuring welcome, safety emphasis

**Test 2 - In-flight:**
```json
{
  "input_value": "What's that city below us?",
  "flight_context": {
    "altitude": 3500,
    "speed": 120,
    "latitude": 37.7749,
    "longitude": -122.4194,
    "aircraft": "Cessna 172"
  }
}
```

Expected: Identifies San Francisco, shares fact

**Test 3 - Turbulence:**
```json
{
  "input_value": "Why is it so bumpy?",
  "flight_context": {
    "altitude": 5000,
    "speed": 110,
    "gForce": 1.3
  }
}
```

Expected: Explains turbulence simply, reassures

## Advanced Features

### Multiple Personalities
Create different flows for different pilot personalities:
- **Captain Sarah Mitchell** - Friendly tour guide (default)
- **Captain Sarah** - Technical, educational focus
- **Captain Rex** - Adventurous, thrill-seeking
- **Captain Emma** - Calm, meditation-focused

### Context Enhancements
Add to flight_context for richer responses:
- Weather conditions
- Time of day (sunset flights)
- Special events below
- Historical flight path

### Safety Responses
Add special handling for:
- Emergency questions
- Weather concerns  
- Technical problems
- Passenger anxiety

## Integration Notes

1. **Get Flow ID**: After creating, find in Langflow UI
2. **Add to .env**: `TOUR_GUIDE_FLOW_ID=<your-flow-id>`
3. **Test via API**: Use the backend's chat endpoints
4. **Monitor logs**: Check response times and errors

## Troubleshooting

**Generic responses?**
- Add more specific examples to prompt
- Increase temperature slightly
- Ensure flight_context is passing correctly

**Slow responses?**
- Reduce max tokens
- Use faster model (GPT-3.5)
- Check Langflow server performance

**Wrong personality?**
- Adjust prompt tone
- Add personality traits explicitly
- Include example responses in prompt