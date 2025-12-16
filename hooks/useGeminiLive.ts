import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array, downsampleBuffer } from '../utils/audioUtils';

interface UseGeminiLiveProps {
  systemInstruction: string;
}

export const useGeminiLive = ({ systemInstruction }: UseGeminiLiveProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0); // For visualization
  const [aiTranscription, setAiTranscription] = useState(""); // Real-time text output

  // Audio Contexts
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  
  // Streaming refs
  const sessionRef = useRef<any>(null); // Holds the Live session
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  // Playback queue
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const connect = useCallback(async () => {
    try {
      if (!process.env.API_KEY) {
        throw new Error("API Key not found. Please check process.env.API_KEY");
      }

      setError(null);
      setAiTranscription(""); // Clear previous text on new connection
      
      // Initialize Contexts
      // Note: Browsers might ignore the sampleRate request, so we must handle resampling.
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      inputContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      outputContextRef.current = new AudioContextClass({ sampleRate: 24000 });

      // Get Mic Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // Establish Live Connection
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: systemInstruction,
          outputAudioTranscription: {}, 
        },
        callbacks: {
          onopen: async () => {
            console.log("Gemini Live Connected");
            setIsConnected(true);
            
            // Resume contexts if suspended (browser autoplay policy)
            try {
              if (inputContextRef.current?.state === 'suspended') {
                  await inputContextRef.current.resume();
              }
              if (outputContextRef.current?.state === 'suspended') {
                  await outputContextRef.current.resume();
              }
            } catch (e) {
              console.error("AudioContext resume failed", e);
            }
            
            // Start Mic Streaming
            if (!inputContextRef.current) return;
            
            const source = inputContextRef.current.createMediaStreamSource(stream);
            const scriptProcessor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate volume for visualizer
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              setVolume(Math.sqrt(sum / inputData.length));

              // Resample if necessary to 16kHz
              let pcmData = inputData;
              if (inputContextRef.current && inputContextRef.current.sampleRate !== 16000) {
                 pcmData = downsampleBuffer(inputData, inputContextRef.current.sampleRate, 16000);
              }

              const pcmBlob = createPcmBlob(pcmData);
              sessionPromise.then((session) => {
                // Ensure session is valid before sending
                if (session) {
                    try {
                        session.sendRealtimeInput({ media: pcmBlob });
                    } catch (err) {
                        console.error("Error sending audio input:", err);
                    }
                }
              });
            };

            source.connect(scriptProcessor);
            // Mute the script processor output to prevent feedback loop
            const gainNode = inputContextRef.current.createGain();
            gainNode.gain.value = 0;
            gainNodeRef.current = gainNode;
            scriptProcessor.connect(gainNode);
            gainNode.connect(inputContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (!outputContextRef.current) return;

            // Handle Text Transcription
            const transcriptionText = message.serverContent?.outputTranscription?.text;
            if (transcriptionText) {
                setAiTranscription(prev => prev + transcriptionText);
            }

            // Handle Audio Output
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
                try {
                    setIsSpeaking(true);
                    const bytes = base64ToUint8Array(audioData);
                    const audioBuffer = await decodeAudioData(bytes, outputContextRef.current);
                    
                    const source = outputContextRef.current.createBufferSource();
                    source.buffer = audioBuffer;
                    
                    // Simple gain for output volume
                    const gainNode = outputContextRef.current.createGain();
                    gainNode.gain.value = 1.0; 
                    source.connect(gainNode);
                    gainNode.connect(outputContextRef.current.destination);

                    // Schedule playback
                    const currentTime = outputContextRef.current.currentTime;
                    // Ensure we don't schedule in the past
                    if (nextStartTimeRef.current < currentTime) {
                        nextStartTimeRef.current = currentTime;
                    }
                    
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    
                    sourcesRef.current.add(source);
                    source.onended = () => {
                        sourcesRef.current.delete(source);
                        if (sourcesRef.current.size === 0) {
                            setIsSpeaking(false);
                        }
                    };
                } catch (decodeErr) {
                    console.error("Audio decode error:", decodeErr);
                }
            }
            
            if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setIsSpeaking(false);
                setAiTranscription(""); // Clear text on interruption
            }
          },
          onclose: () => {
            console.log("Gemini Live Closed");
            setIsConnected(false);
            setIsSpeaking(false);
          },
          onerror: (err) => {
            console.error("Gemini Live Error", err);
            setError("Connection Error: " + (err.message || "Unknown error"));
            setIsConnected(false);
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect to mic or API");
    }
  }, [systemInstruction]);

  const disconnect = useCallback(() => {
    // Stop Mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    if (inputContextRef.current) {
        inputContextRef.current.close();
        inputContextRef.current = null;
    }

    // Stop Speakers
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    if (outputContextRef.current) {
        outputContextRef.current.close();
        outputContextRef.current = null;
    }

    setIsConnected(false);
    setIsSpeaking(false);
    setVolume(0);
    setAiTranscription("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return { connect, disconnect, isConnected, isSpeaking, error, volume, aiTranscription };
};