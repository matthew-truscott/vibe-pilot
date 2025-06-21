// Service to set flight goals via webhook
class FlightGoalService {
  private webhookUrl = 'http://192.168.58.243:7860/api/v1/webhook/9df5c83e-fa0d-47aa-9891-8b4c3079cc83';

  // Destination presets with descriptive goals
  private destinations: Record<string, string> = {
    'athens': 'Fly a scenic tour over Athens, Greece. Start at Athens International Airport and explore the Acropolis, Parthenon, and the beautiful Greek coastline.',
    'san-francisco': 'Take a breathtaking tour of San Francisco Bay Area. Fly over the Golden Gate Bridge, Alcatraz Island, and enjoy views of downtown San Francisco.',
    'new-york': 'Experience the Big Apple from above. Tour Manhattan, see the Statue of Liberty, Central Park, and the impressive skyline.',
    'grand-canyon': 'Explore one of nature\'s greatest wonders. Fly through the Grand Canyon, following the Colorado River and witnessing the stunning rock formations.',
    'paris': 'Romantic flight over the City of Lights. Circle the Eiffel Tower, fly along the Seine River, and see the Arc de Triomphe from above.',
    'dubai': 'Modern marvel tour of Dubai. See the Burj Khalifa, Palm Jumeirah, and the impressive skyline of this desert metropolis.',
    'tokyo': 'Discover Tokyo from the skies. Fly over Tokyo Tower, Mount Fuji in the distance, and the bustling cityscape.',
    'sydney': 'Australian adventure over Sydney. Tour the Opera House, Harbour Bridge, and the beautiful beaches along the coast.',
    'london': 'Royal tour of London. Fly over Big Ben, Buckingham Palace, Tower Bridge, and follow the Thames River.',
    'rio': 'Tropical paradise tour of Rio de Janeiro. See Christ the Redeemer, Sugarloaf Mountain, and the famous Copacabana Beach.',
    'rome': 'Ancient Rome from above. Circle the Colosseum, Vatican City, and follow the historic Tiber River.',
    'hawaii': 'Island hopping in Hawaii. Explore volcanic landscapes, pristine beaches, and lush tropical valleys.',
    'alps': 'Alpine adventure in the Swiss Alps. Navigate through mountain peaks, glaciers, and picturesque valleys.',
    'norway-fjords': 'Scandinavian beauty tour. Fly through dramatic Norwegian fjords, waterfalls, and coastal landscapes.',
    'antarctica': 'Extreme adventure over Antarctica. Explore icebergs, glaciers, and the vast frozen wilderness.',
  };

  async setFlightGoal(destination: string): Promise<boolean> {
    const goal = this.destinations[destination] || this.destinations['athens'];
    
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: goal
      });

      if (!response.ok) {
        console.error('Failed to set flight goal:', response.status);
        return false;
      }

      console.log(`Flight goal set: ${destination}`);
      return true;
    } catch (error) {
      console.error('Error setting flight goal:', error);
      return false;
    }
  }

  getDestinations(): Array<{ value: string; label: string }> {
    return Object.keys(this.destinations).map(key => ({
      value: key,
      label: key.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    }));
  }

  getDestinationDescription(destination: string): string {
    return this.destinations[destination] || '';
  }
}

export default new FlightGoalService();