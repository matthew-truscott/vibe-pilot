// Speech-to-Text and Text-to-Speech service
class SpeechService {
  private recognition: any = null;
  private synthesis = window.speechSynthesis;
  private elevenLabsApiKey: string | null = null;
  private elevenLabsVoiceId: string | null = null;
  private isListening = false;
  private autoPlayEnabled = true;

  constructor() {
    // Initialize Web Speech API for STT
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";
    }

    this.elevenLabsApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    this.elevenLabsVoiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB"; // Default to Adam voice
  }

  // Speech-to-Text using Web Speech API
  startListening(
    onResult: (text: string) => void,
    onError?: (error: any) => void,
  ): void {
    if (!this.recognition) {
      onError?.(new Error("Speech recognition not supported"));
      return;
    }

    if (this.isListening) return;

    this.isListening = true;

    this.recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;

      if (event.results[last].isFinal) {
        onResult(transcript);
        this.isListening = false;
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      this.isListening = false;
      onError?.(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.recognition.start();
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  // Text-to-Speech using ElevenLabs API
  async speakWithElevenLabs(text: string, voiceId?: string): Promise<void> {
    if (!this.elevenLabsApiKey) {
      console.warn("ElevenLabs API key not found, falling back to browser TTS");
      this.speakWithBrowserTTS(text);
      return;
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || this.elevenLabsVoiceId}`,
        {
          method: "POST",
          headers: {
            Accept: "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": this.elevenLabsApiKey,
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error("ElevenLabs API request failed");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      return new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = reject;
        audio.play();
      });
    } catch (error) {
      console.error("ElevenLabs TTS error:", error);
      // Fallback to browser TTS
      this.speakWithBrowserTTS(text);
    }
  }

  // Fallback TTS using browser's built-in speech synthesis
  speakWithBrowserTTS(text: string): void {
    if (!this.synthesis) {
      console.error("Speech synthesis not supported");
      return;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to use a female voice if available
    const voices = this.synthesis.getVoices();
    const femaleVoice = voices.find(
      (voice) =>
        voice.name.toLowerCase().includes("female") ||
        voice.name.toLowerCase().includes("samantha") ||
        voice.name.toLowerCase().includes("victoria"),
    );

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    this.synthesis.speak(utterance);
  }

  // Main speak method that respects auto-play setting
  speak(text: string, forcePlay: boolean = false): void {
    if (!this.autoPlayEnabled && !forcePlay) return;

    if (this.elevenLabsApiKey) {
      this.speakWithElevenLabs(text);
    } else {
      this.speakWithBrowserTTS(text);
    }
  }

  // Stop any ongoing speech
  stopSpeaking(): void {
    this.synthesis?.cancel();
  }

  // Toggle auto-play
  setAutoPlay(enabled: boolean): void {
    this.autoPlayEnabled = enabled;
  }

  isAutoPlayEnabled(): boolean {
    return this.autoPlayEnabled;
  }

  getListeningState(): boolean {
    return this.isListening;
  }
}

export default new SpeechService();

