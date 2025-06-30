
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
     * Automatically chunks text if it exceeds byte limits
     */
    async synthesizeSpeech(options: TTSOptions): Promise<string | null> {
        if (!this.apiKey) {
            throw new Error('Google TTS API key not configured');
        }

        const {
            text,
            languageCode = 'en-US',
            voiceName = 'en-US-Studio-O',
            ssmlGender = 'FEMALE',
            audioEncoding = 'MP3',
            speakingRate = 1.0,
            pitch = 0.0
        } = options;

        // Clean text for TTS
        const cleanText = this.cleanTextForTTS(text);

        if (!cleanText.trim()) {
            return null;
        }

        // Check if text needs chunking
        const maxBytes = 4000; // Safe limit with buffer
        const textBytes = new TextEncoder().encode(cleanText).length;
        
        if (textBytes <= maxBytes) {
            // Text is small enough, process normally
            return await this.synthesizeSingleChunk(cleanText, {
                languageCode,
                voiceName,
                ssmlGender,
                audioEncoding,
                speakingRate,
                pitch
            });
        }

        // Text is too long, chunk it and play sequentially
        console.log(`Text too long (${textBytes} bytes), chunking into smaller segments`);
        const chunks = this.chunkTextIntoSegments(cleanText, maxBytes);
        
        if (chunks.length === 0) {
            return null;
        }

        // Play the first chunk immediately and return its audio
        // Subsequent chunks will be handled by playChunkedAudio
        return await this.synthesizeSingleChunk(chunks[0], {
            languageCode,
            voiceName,
            ssmlGender,
            audioEncoding,
            speakingRate,
            pitch
        });
    }

    /**
     * Synthesize a single text chunk
     */
    private async synthesizeSingleChunk(
        text: string, 
        voiceOptions: {
            languageCode: string;
            voiceName: string;
            ssmlGender: 'FEMALE' | 'MALE';
            audioEncoding: string;
            speakingRate: number;
            pitch: number;
        }
    ): Promise<string | null> {
        try {
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: {
                        text: text
                    },
                    voice: {
                        languageCode: voiceOptions.languageCode,
                        name: voiceOptions.voiceName,
                        ssmlGender: voiceOptions.ssmlGender
                    },
                    audioConfig: {
                        audioEncoding: voiceOptions.audioEncoding,
                        speakingRate: voiceOptions.speakingRate,
                        pitch: voiceOptions.pitch,
                        volumeGainDb: 0.0,
                        sampleRateHertz: voiceOptions.audioEncoding === 'MP3' ? 24000 : 22050,
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
                return `data:audio/mp3;base64,${data.audioContent}`;
            }

            return null;
        } catch (error) {
            console.error('TTS synthesis error:', error);
            throw error;
        }
    }

    /**
     * Break text into chunks that fit within byte limits
     */
    private chunkTextIntoSegments(text: string, maxBytes: number): string[] {
        const chunks: string[] = [];
        const encoder = new TextEncoder();
        
        // Try to split by sentences first
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        let currentChunk = '';
        
        for (const sentence of sentences) {
            const sentenceText = sentence.trim();
            if (!sentenceText) continue;
            
            const testChunk = currentChunk 
                ? `${currentChunk}. ${sentenceText}` 
                : sentenceText;
            
            const testBytes = encoder.encode(testChunk).length;
            
            if (testBytes > maxBytes) {
                // Current chunk is full, save it and start new one
                if (currentChunk.trim()) {
                    chunks.push(currentChunk.trim());
                }
                
                // If single sentence is too long, split it by words
                if (encoder.encode(sentenceText).length > maxBytes) {
                    const wordChunks = this.chunkByWords(sentenceText, maxBytes);
                    chunks.push(...wordChunks);
                    currentChunk = '';
                } else {
                    currentChunk = sentenceText;
                }
            } else {
                currentChunk = testChunk;
            }
        }
        
        // Add remaining chunk
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
        
        return chunks;
    }

    /**
     * Split text by words when sentences are too long
     */
    private chunkByWords(text: string, maxBytes: number): string[] {
        const chunks: string[] = [];
        const encoder = new TextEncoder();
        const words = text.split(/\s+/).filter(w => w.trim());
        
        let currentChunk = '';
        
        for (const word of words) {
            const testChunk = currentChunk 
                ? `${currentChunk} ${word}` 
                : word;
            
            if (encoder.encode(testChunk).length > maxBytes) {
                if (currentChunk.trim()) {
                    chunks.push(currentChunk.trim());
                }
                currentChunk = word;
            } else {
                currentChunk = testChunk;
            }
        }
        
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
        
        return chunks;
    }

    /**
     * Play chunked audio sequentially
     */
    async playChunkedAudio(
        text: string,
        options: Omit<TTSOptions, 'text'> = {}
    ): Promise<void> {
        const cleanText = this.cleanTextForTTS(text);
        const maxBytes = 4000;
        const chunks = this.chunkTextIntoSegments(cleanText, maxBytes);
        
        console.log(`Playing ${chunks.length} audio chunks sequentially`);
        
        for (let i = 0; i < chunks.length; i++) {
            console.log(`Playing chunk ${i + 1}/${chunks.length}`);
            
            try {
                const audioUrl = await this.synthesizeSingleChunk(chunks[i], {
                    languageCode: options.languageCode || 'en-US',
                    voiceName: options.voiceName || 'en-US-Studio-O',
                    ssmlGender: options.ssmlGender || 'FEMALE',
                    audioEncoding: options.audioEncoding || 'MP3',
                    speakingRate: options.speakingRate || 1.0,
                    pitch: options.pitch || 0.0
                });
                
                if (audioUrl) {
                    await this.playAudio(audioUrl);
                    // Small delay between chunks
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            } catch (error) {
                console.error(`Error playing chunk ${i + 1}:`, error);
                // Continue with next chunk even if one fails
            }
        }
    }

    /**
     * Truncate text to fit within byte limit while preserving word boundaries
     */
    private truncateTextToBytes(text: string, maxBytes: number): string {
        const encoder = new TextEncoder();
        const truncationSuffix = ' [Content truncated for audio]';
        const suffixBytes = encoder.encode(truncationSuffix).length;
        const targetBytes = maxBytes - suffixBytes - 100; // Extra buffer
        
        // If text is too long, truncate by sentences first
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        let result = '';
        
        for (const sentence of sentences) {
            const testResult = result + (result ? '. ' : '') + sentence.trim();
            if (encoder.encode(testResult).length > targetBytes) {
                break;
            }
            result = testResult;
        }
        
        // If we have a good result, return it
        if (result.trim() && encoder.encode(result + truncationSuffix).length <= maxBytes) {
            return result.trim() + truncationSuffix;
        }
        
        // Fallback: truncate by words
        const words = text.split(/\s+/).filter(w => w.trim());
        result = '';
        
        for (const word of words) {
            const testResult = result + (result ? ' ' : '') + word;
            if (encoder.encode(testResult).length > targetBytes) {
                break;
            }
            result = testResult;
        }
        
        return (result.trim() || 'Content too long for audio') + truncationSuffix;
    }

    /**
     * Emergency truncation method that guarantees text fits within byte limit
     */
    private emergencyTruncate(text: string, maxBytes: number): string {
        const encoder = new TextEncoder();
        const truncationSuffix = ' [Truncated]';
        const suffixBytes = encoder.encode(truncationSuffix).length;
        const targetBytes = maxBytes - suffixBytes - 50; // Safety buffer
        
        // Simple character-by-character truncation
        let result = '';
        const chars = Array.from(text); // Handle Unicode properly
        
        for (const char of chars) {
            const testResult = result + char;
            if (encoder.encode(testResult).length > targetBytes) {
                break;
            }
            result = testResult;
        }
        
        // Ensure we don't cut words in half
        const lastSpaceIndex = result.lastIndexOf(' ');
        if (lastSpaceIndex > result.length * 0.8) { // Only if we're not losing too much
            result = result.substring(0, lastSpaceIndex);
        }
        
        return result.trim() + truncationSuffix;
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
            .replace(/_{1,2}(.*?)_{1,2}/g, '$1')
            // Remove markdown links
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Remove images completely
            // Remove ALL emojis and special characters more aggressively
            .replace(/[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F100}-\u{1F1FF}]|[\u{1F200}-\u{1F2FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/gu, '')
            // Remove bullet points and list markers
            .replace(/^\s*[-*+•]\s*/gm, '')
            .replace(/^\s*\d+\.\s*/gm, '')
            .replace(/^\s*[a-zA-Z]\.\s*/gm, '')
            // Remove table formatting completely
            .replace(/\|/g, ' ')
            .replace(/^\s*[-:=+|]+\s*$/gm, '')
            // Remove blockquotes
            .replace(/^\s*>\s*/gm, '')
            // Remove horizontal rules
            .replace(/^\s*[-*_=]{3,}\s*$/gm, '')
            // Remove code blocks
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`[^`]+`/g, '')
            // Remove HTML tags if any
            .replace(/<[^>]*>/g, '')
            // Remove special markdown formatting
            .replace(/\[!\w+\]/g, '') // Remove callouts like [!NOTE]
            .replace(/:::[\s\S]*?:::/g, '') // Remove admonitions
            // Clean up excessive punctuation
            .replace(/[.]{3,}/g, '...')
            .replace(/[!]{2,}/g, '!')
            .replace(/[?]{2,}/g, '?')
            // Clean up whitespace more aggressively
            .replace(/\n{3,}/g, '. ')
            .replace(/\s{3,}/g, ' ')
            .replace(/\n+/g, '. ')
            .replace(/\.\s*\./g, '.')
            // Remove standalone special characters
            .replace(/[^\w\s.,!?()-]/g, '')
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
        return textBytes > 4000; // 5000 byte limit with larger buffer
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
