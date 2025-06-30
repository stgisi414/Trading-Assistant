
export interface TTSOptions {
    text: string;
    languageCode?: string;
    voiceName?: string;
    ssmlGender?: 'NEUTRAL' | 'FEMALE' | 'MALE';
    audioEncoding?: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
    speakingRate?: number;
    pitch?: number;
}

export class TTSService {
    private apiKey: string;
    private baseUrl = 'https://texttospeech.googleapis.com/v1/text:synthesize';

    constructor() {
        this.apiKey = process.env.GOOGLE_TTS_API_KEY || '';
        if (!this.apiKey) {
            console.warn('Google TTS API key not found. TTS features will be disabled.');
        }
    }

    /**
     * Convert text to speech using Google Cloud Text-to-Speech API
     */
    async synthesizeSpeech(options: TTSOptions): Promise<string | null> {
        if (!this.apiKey) {
            throw new Error('Google TTS API key not configured');
        }

        const {
            text,
            languageCode = 'en-US',
            voiceName = 'en-US-Studio-O', // High quality neural voice
            ssmlGender = 'NEUTRAL',
            audioEncoding = 'MP3',
            speakingRate = 1.0,
            pitch = 0.0
        } = options;

        // Clean text for TTS (remove markdown and emojis)
        const cleanText = this.cleanTextForTTS(text);

        if (!cleanText.trim()) {
            return null;
        }

        try {
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: {
                        text: cleanText
                    },
                    voice: {
                        languageCode,
                        name: voiceName,
                        ssmlGender
                    },
                    audioConfig: {
                        audioEncoding,
                        speakingRate,
                        pitch,
                        volumeGainDb: 0.0,
                        sampleRateHertz: audioEncoding === 'MP3' ? 24000 : 22050,
                        effectsProfileId: ['telephony-class-application']
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`TTS API error: ${error.error?.message || response.statusText}`);
            }

            const data = await response.json();
            
            if (data.audioContent) {
                // Create data URL for audio playback
                const audioDataUrl = `data:audio/mp3;base64,${data.audioContent}`;
                return audioDataUrl;
            }

            return null;
        } catch (error) {
            console.error('TTS synthesis error:', error);
            throw error;
        }
    }

    /**
     * Clean text for TTS by removing markdown, emojis, and formatting
     */
    private cleanTextForTTS(text: string): string {
        return text
            // Remove markdown headers
            .replace(/#{1,6}\s*/g, '')
            // Remove markdown formatting
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/~~(.*?)~~/g, '$1')
            // Remove markdown links
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // Remove emojis and special characters
            .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
            // Remove bullet points and list markers
            .replace(/^\s*[-*+]\s*/gm, '')
            .replace(/^\s*\d+\.\s*/gm, '')
            // Remove table formatting
            .replace(/\|/g, ' ')
            .replace(/^\s*[-:]+\s*$/gm, '')
            // Remove blockquotes
            .replace(/^\s*>\s*/gm, '')
            // Remove horizontal rules
            .replace(/^\s*[-*_]{3,}\s*$/gm, '')
            // Clean up whitespace
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    /**
     * Play audio from data URL
     */
    async playAudio(audioDataUrl: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const audio = new Audio(audioDataUrl);
            
            audio.onended = () => resolve();
            audio.onerror = () => reject(new Error('Audio playback failed'));
            
            audio.play().catch(reject);
        });
    }

    /**
     * Check if TTS is available
     */
    isAvailable(): boolean {
        return !!this.apiKey;
    }

    /**
     * Get available voice options for language
     */
    getVoiceOptions(languageCode: string = 'en-US') {
        const voiceOptions = {
            'en-US': [
                { name: 'en-US-Studio-O', gender: 'NEUTRAL', description: 'High quality neural voice' },
                { name: 'en-US-Studio-Q', gender: 'FEMALE', description: 'Female neural voice' },
                { name: 'en-US-Studio-M', gender: 'MALE', description: 'Male neural voice' },
                { name: 'en-US-Wavenet-A', gender: 'MALE', description: 'WaveNet male voice' },
                { name: 'en-US-Wavenet-B', gender: 'MALE', description: 'WaveNet male voice' },
                { name: 'en-US-Wavenet-C', gender: 'FEMALE', description: 'WaveNet female voice' },
                { name: 'en-US-Wavenet-D', gender: 'MALE', description: 'WaveNet male voice' },
                { name: 'en-US-Wavenet-E', gender: 'FEMALE', description: 'WaveNet female voice' },
            ]
        };

        return voiceOptions[languageCode as keyof typeof voiceOptions] || voiceOptions['en-US'];
    }
}

// Export singleton instance
export const ttsService = new TTSService();
