# Tour Mode Roadmap

## Current Implementation (MVP)
- ✅ Hidden scoring features
- ✅ Basic tour statistics (Tours Taken, Hours in Air)
- ✅ Starting location selection (3 locations)
- ✅ Tour-focused UI language

## Phase 1: Tour History & Destinations (Next Sprint)

### New Data Types
```typescript
interface TourDestination {
  id: string;
  name: string;
  coordinates: { latitude: number; longitude: number };
  visitedAt: string;
  duration: number;
  startLocation: string;
  highlights: string[];  // Notable moments from AI pilot
  maxAltitude: number;
  weatherConditions?: string;
}

interface TourRoute {
  id: string;
  name: string;
  description: string;
  waypoints: Coordinates[];
  estimatedDuration: number;
  difficulty: 'easy' | 'moderate' | 'challenging';
  highlights: string[];
}
```

### Features
- Replace ScoresPage with DestinationsPage
- Tour history with map visualization
- Visited locations tracker
- Tour statistics dashboard
- Export tour logs

## Phase 2: Enhanced Starting Locations

### Additional Locations
- **Europe**: Swiss Alps, Norwegian Fjords, Mediterranean Coast
- **Asia**: Mount Fuji, Hong Kong Harbor, Himalayas
- **Americas**: Yosemite, Niagara Falls, Patagonia
- **Oceania**: Great Barrier Reef, New Zealand Alps
- **Africa**: Table Mountain, Nile River, Serengeti

### Location Features
- Custom coordinates input
- Location-specific aircraft selection
- Recommended tour routes from each location
- Local time and weather integration
- Location information cards

## Phase 3: Guided Tour System

### Tour Types
1. **Scenic Tours**: Focus on natural beauty
2. **City Tours**: Urban landmarks and skylines
3. **Historical Tours**: Historical sites with context
4. **Adventure Tours**: Challenging terrain, weather
5. **Sunset/Sunrise Tours**: Time-specific experiences

### AI Pilot Enhancements
- Location-aware commentary
- Historical facts and stories
- Wildlife spotting callouts
- Weather commentary
- Photography suggestions

### Tour Features
- Pre-planned routes with waypoints
- Dynamic route adjustment
- Estimated tour duration
- Point of Interest notifications
- Auto-follow mode for routes

## Phase 4: Social & Sharing

### Community Features
- Share completed tours
- Download tour recordings
- Community tour ratings
- Featured tours of the week
- Tour creator profiles

### Export Options
- Flight path KML/GPX export
- Tour summary PDF
- Social media integration
- Video highlights compilation

## Phase 5: Advanced Features

### Immersion Enhancements
- **Dynamic Weather**: Real-world weather at destinations
- **Time of Day**: Sunset/sunrise calculations
- **Seasonal Changes**: Different experiences by season
- **Wildlife**: Animal sightings based on location/time
- **Events**: Special events (migrations, festivals)

### Gamification (Non-Competitive)
- **Passport System**: Stamp collection for destinations
- **Photography Mode**: Capture and save scenic moments
- **Tour Achievements**: "First Sunset", "Mountain Explorer"
- **Discovery System**: Hidden landmarks to find
- **Tour Journal**: Personal flight diary

### Technical Enhancements
- **Performance**: Route optimization algorithms
- **Offline Mode**: Download tour data for offline use
- **Multi-Language**: Pilot speaks different languages
- **Accessibility**: Audio descriptions, larger UI options
- **VR Support**: Immersive tour experience

## Phase 6: Professional Features

### Tour Guide Training
- Learn real tour guide techniques
- Practice commentary
- Study location history
- Emergency procedures

### Custom Tour Creation
- Route planning tools
- Waypoint editor
- Commentary scripting
- Tour testing mode

### Analytics
- Popular destinations
- Average tour duration
- User preferences
- Feedback analysis

## Implementation Priorities

### High Priority
1. Tour history tracking
2. More starting locations
3. Basic route system
4. Enhanced AI commentary

### Medium Priority
1. Social sharing
2. Weather integration
3. Photography mode
4. Tour achievements

### Low Priority
1. VR support
2. Professional tools
3. Offline mode
4. Multi-language

## Technical Considerations

### Database Schema (Future)
```sql
-- Tours table
CREATE TABLE tours (
  id UUID PRIMARY KEY,
  user_id UUID,
  start_location VARCHAR,
  destination VARCHAR,
  duration INTEGER,
  max_altitude FLOAT,
  created_at TIMESTAMP
);

-- Destinations table
CREATE TABLE destinations (
  id UUID PRIMARY KEY,
  name VARCHAR,
  coordinates POINT,
  description TEXT,
  category VARCHAR
);

-- Tour waypoints
CREATE TABLE tour_waypoints (
  tour_id UUID,
  sequence INTEGER,
  coordinates POINT,
  notes TEXT
);
```

### API Endpoints (Future)
- `GET /api/tours` - User's tour history
- `GET /api/destinations` - Available destinations
- `GET /api/routes/:location` - Suggested routes
- `POST /api/tours` - Save completed tour
- `GET /api/tours/:id/export` - Export tour data

### Performance Optimizations
- Lazy load destination data
- Cache popular routes
- Compress tour recordings
- CDN for location images

## Success Metrics
- Average tour completion rate
- User retention (tours per month)
- Destination diversity
- AI pilot satisfaction ratings
- Community engagement

This roadmap transforms Vibe Pilot from a scoring-based flight sim into an immersive tour experience platform.