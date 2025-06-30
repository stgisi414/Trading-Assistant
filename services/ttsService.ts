
export interface TTSOptions {
    text: string;
    languageCode?: string;
    voiceName?: string;
    ssmlGender?: 'FEMALE' | 'MALE'; // Removed NEUTRAL as it's not supported
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
            ssmlGender = 'FEMALE', // Changed from NEUTRAL to FEMALE (supported by API)
            audioEncoding = 'MP3',
            speakingRate = 1.0,
            pitch = 0.0
        } = options;

        // Clean text for TTS (remove markdown and emojis)
        let cleanText = this.cleanTextForTTS(text);

        if (!cleanText.trim()) {
            return null;
        }

        // Check byte length and truncate if necessary (5000 byte limit)
        const maxBytes = 4500; // Leave some buffer for safety
        const textBytes = new TextEncoder().encode(cleanText).length;
        
        if (textBytes > maxBytes) {
            console.warn(`Text too long for TTS (${textBytes} bytes), truncating to ${maxBytes} bytes`);
            cleanText = this.truncateTextToBytes(cleanText, maxBytes);
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
     * Truncate text to fit within byte limit while preserving word boundaries
     */
    private truncateTextToBytes(text: string, maxBytes: number): string {
        const encoder = new TextEncoder();
        let truncated = text;
        
        // If text is too long, truncate by sentences first
        const sentences = text.split(/[.!?]+/);
        let result = '';
        
        for (const sentence of sentences) {
            const testResult = result + sentence + '.';
            if (encoder.encode(testResult).length > maxBytes) {
                break;
            }
            result = testResult;
        }
        
        // If we still have some text, return it
        if (result.trim()) {
            return result.trim() + ' [Content truncated for audio]';
        }
        
        // Fallback: truncate by words
        const words = text.split(' ');
        result = '';
        
        for (const word of words) {
            const testResult = result + ' ' + word;
            if (encoder.encode(testResult).length > maxBytes) {
                break;
            }
            result = testResult;
        }
        
        return result.trim() + ' [Content truncated for audio]';
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
     * Check if text is within TTS length limits
     */
    isTextTooLong(text: string): boolean {
        const cleanText = this.cleanTextForTTS(text);
        const textBytes = new TextEncoder().encode(cleanText).length;
        return textBytes > 4500; // 5000 byte limit with buffer
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
                { name: 'en-US-Studio-O', gender: 'FEMALE', description: 'High quality neural voice' },
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
