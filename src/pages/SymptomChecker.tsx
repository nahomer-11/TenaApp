import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { tenaAPI } from '@/api/tena_api';
import { ArrowLeft, Send, Bot, User, AlertTriangle, Volume2, Home, Phone, Mic, MicOff, Trash2, MessageCircle, AudioLines } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

// Enhanced Speech Recognition for cross-browser Amharic support
class UniversalSpeechRecognition {
  private recognition: any = null;
  private isListening = false;
  private onResultCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private onErrorCallback: ((error: any) => void) | null = null;
  private onStartCallback: (() => void) | null = null;

  constructor() {
    this.initializeRecognition();
  }

  private initializeRecognition() {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition || 
      (window as any).mozSpeechRecognition || 
      (window as any).msSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
      console.log('Speech Recognition initialized for Amharic');
    } else {
      console.error('Speech recognition not supported in this browser');
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = 'am-ET'; // Set to Amharic

    this.recognition.onstart = () => {
      console.log('Amharic speech recognition started');
      this.isListening = true;
      if (this.onStartCallback) this.onStartCallback();
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript && this.onResultCallback) {
        this.onResultCallback(finalTranscript, true);
      } else if (interimTranscript && this.onResultCallback) {
        this.onResultCallback(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        console.error('Microphone permission denied');
      } else if (event.error === 'no-speech') {
        console.log('No speech detected, continuing...');
        return;
      }
      
      if (this.onErrorCallback) this.onErrorCallback(event);
    };

    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      this.isListening = false;
      if (this.onEndCallback) this.onEndCallback();
    };
  }

  start() {
    if (!this.recognition) {
      console.error('Speech recognition not available');
      return false;
    }

    if (this.isListening) {
      this.stop();
    }

    try {
      this.recognition.lang = 'am-ET'; // Ensure Amharic
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  isAvailable() {
    return !!this.recognition;
  }

  onResult(callback: (text: string, isFinal: boolean) => void) {
    this.onResultCallback = callback;
  }

  onStart(callback: () => void) {
    this.onStartCallback = callback;
  }

  onEnd(callback: () => void) {
    this.onEndCallback = callback;
  }

  onError(callback: (error: any) => void) {
    this.onErrorCallback = callback;
  }
}

const SymptomChecker = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('chat');
  
  // Voice-related states
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [speechRecognition, setSpeechRecognition] = useState<UniversalSpeechRecognition | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);
  const [conversationReady, setConversationReady] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('am-ET');
  const [autoListenEnabled, setAutoListenEnabled] = useState(true);
  const [hasSentMessage, setHasSentMessage] = useState(false); // NEW: Prevent duplicate sends
  
  const animationRef = useRef<number>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentAudio = useRef<HTMLAudioElement | null>(null);
  const silenceTimeout = useRef<NodeJS.Timeout | null>(null);
  const finalText = useRef<string>('');
  const lastProcessedText = useRef<string>(''); // NEW: Track last processed text
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    const recognition = new UniversalSpeechRecognition();
    
    if (!recognition.isAvailable()) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.",
        variant: "destructive",
      });
      return;
    }

    recognition.onStart(() => {
      console.log('Amharic recognition started');
      setIsListening(true);
      setVoiceText('');
      finalText.current = '';
      lastProcessedText.current = ''; // FIXED: Reset processed text
      setHasSentMessage(false); // FIXED: Reset sent flag
      if (silenceTimeout.current) {
        clearTimeout(silenceTimeout.current);
        silenceTimeout.current = null;
      }
    });

    recognition.onResult((text: string, isFinal: boolean) => {
      setVoiceText(text);
      
      if (isFinal) {
        finalText.current = text;
        console.log('Final Amharic result:', text);
        
        // FIXED: Only process if we haven't sent a message yet and text is different
        if (text.trim() && !hasSentMessage && text.trim() !== lastProcessedText.current) {
          lastProcessedText.current = text.trim();
          setHasSentMessage(true);
          recognition.stop();
          handleVoiceMessage(text.trim());
        }
      } else {
        // FIXED: Clear existing timeout and set new one for interim results
        if (silenceTimeout.current) {
          clearTimeout(silenceTimeout.current);
          silenceTimeout.current = null;
        }
        
        // FIXED: Wait 3 seconds after user stops speaking
        silenceTimeout.current = setTimeout(() => {
          if (text.trim() && !hasSentMessage && text.trim() !== lastProcessedText.current) {
            console.log('Processing interim Amharic result after 3s silence:', text);
            lastProcessedText.current = text.trim();
            setHasSentMessage(true);
            recognition.stop();
            handleVoiceMessage(text.trim());
          }
        }, 3000); // FIXED: 3 seconds as requested
      }
    });

    recognition.onEnd(() => {
      console.log('Recognition ended');
      setIsListening(false);
      setVoiceText('');
      
      // FIXED: Only process final text if we haven't already sent a message
      if (finalText.current.trim() && !hasSentMessage && finalText.current.trim() !== lastProcessedText.current) {
        lastProcessedText.current = finalText.current.trim();
        setHasSentMessage(true);
        handleVoiceMessage(finalText.current.trim());
      }
      
      finalText.current = '';
      
      if (silenceTimeout.current) {
        clearTimeout(silenceTimeout.current);
        silenceTimeout.current = null;
      }
    });

    recognition.onError((error: any) => {
      console.error('Speech recognition error:', error);
      setIsListening(false);
      setVoiceText('');
      finalText.current = '';
      setHasSentMessage(false); // FIXED: Reset on error
      
      if (error.error !== 'no-speech' && error.error !== 'aborted') {
        let errorMessage = 'Amharic voice recognition error occurred.';
        
        if (error.error === 'not-allowed') {
          errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
        } else if (error.error === 'network') {
          errorMessage = 'Network error. Please check your internet connection.';
        }
        
        toast({
          title: "Voice Recognition Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    });

    setSpeechRecognition(recognition);

    return () => {
      recognition.stop();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (silenceTimeout.current) {
        clearTimeout(silenceTimeout.current);
        silenceTimeout.current = null;
      }
    };
  }, []); // FIXED: Remove isProcessingRequest dependency to prevent recreation

  // Audio visualization setup
  const setupAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      const audioContextInstance = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyserInstance = audioContextInstance.createAnalyser();
      const microphoneInstance = audioContextInstance.createMediaStreamSource(stream);
      
      analyserInstance.fftSize = 256;
      microphoneInstance.connect(analyserInstance);
      
      setAudioContext(audioContextInstance);
      setAnalyser(analyserInstance);
      
      visualizeAudio(analyserInstance);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const visualizeAudio = (analyserInstance: AnalyserNode) => {
    const dataArray = new Uint8Array(analyserInstance.frequencyBinCount);
    
    const animate = () => {
      analyserInstance.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;
      setAudioLevel(average);
      
      if (isListening || isReading) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animate();
  };

  // Load conversation history on component mount
  useEffect(() => {
    loadConversationHistory();
  }, []);

  const loadConversationHistory = async () => {
    try {
      const sessions = await tenaAPI.getChatSessions();
      if (sessions.length > 0) {
        const sessionId = sessions[0].id;
        setCurrentSessionId(sessionId);
        
        const apiMessages = await tenaAPI.getChatMessages(sessionId);
        
        const convertedMessages: ChatMessage[] = apiMessages.map((msg) => ({
          id: msg.id.toString(),
          text: msg.content,
          isBot: msg.sender === 'ai',
          timestamp: new Date(msg.time_stamp),
        }));
        
        setMessages(convertedMessages);
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  const clearHistory = async () => {
    try {
      await tenaAPI.clearChatHistory();
      setMessages([]);
      setCurrentSessionId(null);
      toast({
        title: "History Cleared",
        description: "Chat history has been cleared successfully.",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to clear history. Please try again.",
        variant: "destructive",
      });
    }
  };

  const detectLanguage = (text: string): string => {
    const amharicPattern = /[\u1200-\u137F]/;
    const englishPattern = /^[A-Za-z\s.,!?'"()-]+$/;
    
    if (amharicPattern.test(text)) {
      return 'am-ET';
    } else if (englishPattern.test(text.trim())) {
      return 'en-US';
    }
    
    return currentLanguage;
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || currentMessage;
    if (!textToSend.trim() || isProcessingRequest) return;

    setIsProcessingRequest(true);
    setConversationReady(false);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: textToSend,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setVoiceText('');
    setIsLoading(true);

    try {
      const response = await tenaAPI.chatWithAI(textToSend);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      
      if (response.sessionId) {
        setCurrentSessionId(response.sessionId);
      }

      const responseLanguage = detectLanguage(response.message);
      setCurrentLanguage(responseLanguage);
      
      // FIXED: Auto-read response using TTS API with proper delay
      setTimeout(() => {
        readTextAloudWithAPI(response.message, responseLanguage);
      }, 500);
    } catch (error) {
      console.error('Send message error:', error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
      setIsProcessingRequest(false);
      setConversationReady(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceMessage = (text: string) => {
    if (text.trim() && !isProcessingRequest) {
      console.log('Sending voice message:', text);
      sendMessage(text);
    }
  };

  const startListening = async () => {
    if (!conversationReady || isProcessingRequest || isReading || !speechRecognition) {
      console.log('Cannot start listening - conditions not met');
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      toast({
        title: "Microphone Permission",
        description: "Please allow microphone access to use voice recognition.",
        variant: "destructive",
      });
      return;
    }

    await setupAudioVisualization();
    
    console.log('Starting Amharic speech recognition (am-ET)');
    const started = speechRecognition.start();
    if (!started) {
      toast({
        title: "Speech Recognition Error",
        description: "Failed to start Amharic voice recognition. Please ensure your browser supports it.",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (speechRecognition) {
      speechRecognition.stop();
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setAudioLevel(0);
  };

  const handleReadAloud = async (text: string) => {
    const detectedLanguage = detectLanguage(text);
    readTextAloudWithAPI(text, detectedLanguage);
  };

  // TTS function using your API with URL parameters - Fixed CORS issue
  const readTextAloudWithAPI = async (text: string, language: string = currentLanguage) => {
    try {
      setIsReading(true);
      setConversationReady(false);
      
      // Stop any ongoing audio
      if (currentAudio.current) {
        currentAudio.current.pause();
        currentAudio.current = null;
      }
      
      // Determine language code for the API
      const langCode = language.includes('am') ? 'am' : 'en';
      
      console.log('Playing TTS audio directly:', { text: text.substring(0, 50) + '...', lang: langCode });
      
      // Use your API endpoint with URL parameters - set directly as audio src to bypass CORS
      const encodedText = encodeURIComponent(text);
      const apiUrl = `https://text-to-speech.manzoor76b.workers.dev/?text=${encodedText}&lang=${langCode}`;
      
      console.log('TTS API URL:', apiUrl);
      
      // Create audio element and set src directly to API URL (bypasses CORS)
      const audio = new Audio();
      currentAudio.current = audio;
      
      // Set the API URL directly as audio source
      audio.src = apiUrl;
      
      audio.onplay = () => {
        console.log('TTS audio (.mp3) started playing');
        setIsReading(true);
      };
      
      audio.onended = () => {
        console.log('TTS audio ended');
        setIsReading(false);
        setIsProcessingRequest(false);
        setConversationReady(true);
        setHasSentMessage(false); // FIXED: Reset sent flag after TTS finishes
        currentAudio.current = null;
        
        // FIXED: Auto-start listening again after AI finishes speaking
        if (activeTab === 'voice' && autoListenEnabled) {
          setTimeout(() => {
            if (!isListening && !isProcessingRequest && conversationReady) {
              console.log('Auto-starting listening after TTS finished');
              startListening();
            }
          }, 1000);
        }
      };
      
      audio.onerror = (event) => {
        console.error('TTS Audio Error:', event);
        setIsReading(false);
        setIsProcessingRequest(false);
        setConversationReady(true);
        setHasSentMessage(false); // FIXED: Reset on error
        currentAudio.current = null;
        
        toast({
          title: "Audio Playback Error",
          description: "Failed to play the audio response. Please try again.",
          variant: "destructive",
        });
      };
      
      audio.oncanplaythrough = () => {
        console.log('TTS audio can play through, duration:', audio.duration);
      };
      
      audio.onloadedmetadata = () => {
        console.log('TTS audio metadata loaded, duration:', audio.duration);
      };
      
      // Play the .mp3 audio
      try {
        console.log('Attempting to play TTS audio...');
        await audio.play();
        console.log('TTS audio play() succeeded');
      } catch (playError) {
        console.error('Failed to play TTS audio:', playError);
        
        setIsReading(false);
        setIsProcessingRequest(false);
        setConversationReady(true);
        setHasSentMessage(false); // FIXED: Reset on error
        currentAudio.current = null;
        
        toast({
          title: "Autoplay Blocked",
          description: "Click the speaker button to hear the response. Your browser may have blocked autoplay.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('TTS API Error:', error);
      setIsReading(false);
      setIsProcessingRequest(false);
      setConversationReady(true);
      setHasSentMessage(false); // FIXED: Reset on error
      currentAudio.current = null;
      
      let errorMessage = "Failed to connect to text-to-speech service. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error connecting to TTS service. Please check your internet connection.";
        } else if (error.message.includes('404')) {
          errorMessage = "TTS service not found. Please contact support.";
        } else if (error.message.includes('500')) {
          errorMessage = "TTS service is temporarily unavailable. Please try again later.";
        }
      }
      
      toast({
        title: "Text-to-Speech Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Voice Visualization Component
  const VoiceVisualization = () => {
    const baseScale = 1;
    const scaleMultiplier = audioLevel / 40;
    const totalScale = baseScale + scaleMultiplier;

    const speakingWaves = Array.from({ length: 12 }, (_, i) => ({
      delay: i * 0.1,
      amplitude: Math.sin(Date.now() / 300 + i) * 10 + 15,
    }));

    return (
      <div className="relative w-full h-full flex items-center justify-center min-h-[50vh] sm:min-h-[60vh]">
        <div className={`absolute inset-0 transition-all duration-1000 ${
          isReading 
            ? 'bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-purple-900/20' 
            : isListening
              ? 'bg-gradient-to-br from-blue-900/20 via-cyan-900/20 to-blue-900/20'
              : 'bg-gradient-to-br from-gray-900/10 via-gray-800/10 to-gray-900/10'
        }`} />
        
        <div className="absolute inset-0 flex items-center justify-center">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`absolute rounded-full border-2 transition-all duration-300 ${
                isReading 
                  ? 'border-purple-400/20 animate-ping' 
                  : isListening 
                    ? 'border-blue-400/20 animate-ping'
                    : 'border-gray-400/10'
              }`}
              style={{
                width: `${(i + 1) * 60}px`,
                height: `${(i + 1) * 60}px`,
                animationDuration: `${2 + i * 0.5}s`,
                animationDelay: `${i * 0.2}s`,
                opacity: (isListening || isReading) ? 0.6 - (i * 0.1) : 0.2,
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 flex flex-col items-center space-y-4 sm:space-y-6 px-4">
          <div 
            className={`relative flex items-center justify-center transition-all duration-500 rounded-full shadow-2xl ${
              isReading 
                ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600' 
                : isListening
                  ? 'bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600'
                  : 'bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700'
            }`}
            style={{ 
              width: `${80 + (totalScale - 1) * 40}px`,
              height: `${80 + (totalScale - 1) * 40}px`,
              transform: `scale(${totalScale})`,
              boxShadow: isReading || isListening 
                ? `0 0 40px ${isReading ? 'rgba(168, 85, 247, 0.5)' : 'rgba(59, 130, 246, 0.5)'}`
                : '0 0 20px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
            <Bot className={`w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-lg transition-all duration-300 ${
              isReading ? 'animate-pulse' : ''
            }`} />
          </div>
          
          <div className="flex items-end justify-center space-x-1 sm:space-x-2 h-12 sm:h-16">
            {[...Array(10)].map((_, i) => {
              const height = isReading 
                ? speakingWaves[i % speakingWaves.length].amplitude * 0.6
                : isListening 
                  ? Math.max(6, (audioLevel / 8) * (i + 1) + Math.random() * 8)
                  : 6;
              
              return (
                <div
                  key={i}
                  className={`w-2 sm:w-3 rounded-full transition-all duration-150 ${
                    isReading 
                      ? 'bg-gradient-to-t from-purple-500 to-pink-400' 
                      : isListening
                        ? 'bg-gradient-to-t from-blue-500 to-cyan-400'
                        : 'bg-gradient-to-t from-gray-400 to-gray-500'
                  }`}
                  style={{
                    height: `${height}px`,
                    opacity: (isListening && audioLevel > (i * 8)) || isReading ? 1 : 0.3,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              );
            })}
          </div>
          
          <div className="text-center space-y-2 sm:space-y-3 max-w-xs sm:max-w-md">
            <div className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
              isReading 
                ? 'bg-purple-500/20 border-purple-400/30 text-purple-700 dark:text-purple-300' 
                : isListening 
                  ? 'bg-blue-500/20 border-blue-400/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-500/20 border-gray-400/30 text-gray-600 dark:text-gray-400'
            }`}>
              <div className="text-sm sm:text-lg font-bold">
                {isReading 
                  ? 'AI በአማርኛ እየመለሰ ነው...' 
                  : isListening 
                    ? 'በአማርኛ ይናገሩ...'
                    : 'እዚህ ይንካዩ እና ይናገሩ'
                }
              </div>
              <div className="text-xs sm:text-sm opacity-80 mt-1">
                {isReading 
                  ? 'AI is responding in Amharic' 
                  : isListening 
                    ? 'Listening in Amharic (am-ET)...'
                    : 'Tap to start speaking in Amharic'
                }
              </div>
            </div>
          </div>
          
          {voiceText && isListening && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/90 dark:bg-gray-800/90 rounded-xl sm:rounded-2xl max-w-xs sm:max-w-md mx-auto backdrop-blur-sm border shadow-lg">
              <p className="text-sm sm:text-lg text-gray-800 dark:text-gray-200 font-medium text-center leading-relaxed">
                {voiceText}
              </p>
            </div>
          )}
          
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 px-2 sm:px-3 py-1 rounded-full">
            Current: 🇪🇹 አማርኛ (Amharic)
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col overflow-hidden">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 dark:from-blue-800 dark:via-cyan-800 dark:to-blue-900 flex-shrink-0 shadow-2xl">
        <div className="px-4 pt-8 sm:pt-12 pb-4 sm:pb-6 safe-area-top">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/home')} 
              className="text-white hover:bg-white/20 rounded-xl h-10 w-10 sm:h-12 sm:w-12"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={clearHistory}
                className="text-white hover:bg-white/20 rounded-xl h-10 w-10 sm:h-12 sm:w-12"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/home')} 
                className="text-white hover:bg-white/20 rounded-xl h-10 w-10 sm:h-12 sm:w-12"
              >
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Phone className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">AI Health Assistant</h1>
            <p className="text-blue-100 text-base sm:text-lg font-medium">የጤና ምክር ሰጭ</p>
            <p className="text-blue-200 text-xs sm:text-sm mt-1 sm:mt-2">
              Chat or speak in Amharic & English
            </p>
            <p className="text-blue-300 text-xs mt-1">🎙️ Amharic Speech Recognition Enabled</p>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Disclaimer */}
        <div className="flex-shrink-0 px-4 pt-3 sm:pt-4">
          <Card className="border-0 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 shadow-lg backdrop-blur-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-orange-800 dark:text-orange-200 font-bold">⚠️ Medical Disclaimer</p>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1 leading-relaxed">
                    This AI provides general health information only. Always consult healthcare professionals for proper diagnosis.
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                    ይህ AI አጠቃላይ የጤና መረጃ ብቻ ይሰጣል። ሁልጊዜ ሐኪም ያማክሩ።
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Chat and Voice */}
        <div className="flex-1 flex flex-col min-h-0 px-4 pt-3 sm:pt-4 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 mb-3 sm:mb-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm h-10 sm:h-12 flex-shrink-0">
              <TabsTrigger value="chat" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Chat</span>
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <AudioLines className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Voice (አማርኛ)</span>
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 mt-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto pb-3 sm:pb-4 space-y-3 sm:space-y-4 min-h-0">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] rounded-2xl sm:rounded-3xl ${
                        message.isBot
                          ? 'bg-white/95 dark:bg-gray-800/95 shadow-lg border-0 backdrop-blur-sm'
                          : 'bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 text-white shadow-xl'
                      }`}
                    >
                      <div className="p-3 sm:p-4">
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          {message.isBot && (
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                              <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs sm:text-sm leading-relaxed break-words ${message.isBot ? 'text-gray-800 dark:text-gray-200' : 'text-white'}`}>
                              {message.isBot ? (
                                <div className="prose prose-xs sm:prose-sm max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-li:text-gray-800 dark:prose-li:text-gray-200 prose-strong:text-gray-900 dark:prose-strong:text-white prose-blue:text-blue-600">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {message.text}
                                  </ReactMarkdown>
                                </div>
                              ) : (
                                <p>{message.text}</p>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-2 sm:mt-3">
                              <p className={`text-xs font-medium ${message.isBot ? 'text-gray-500 dark:text-gray-400' : 'text-blue-100'}`}>
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {message.isBot && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReadAloud(message.text)}
                                  disabled={isReading}
                                  className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-blue-100 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl"
                                >
                                  <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {!message.isBot && (
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                              <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/95 dark:bg-gray-800/95 shadow-lg backdrop-blur-sm rounded-2xl sm:rounded-3xl max-w-[85%] sm:max-w-[80%]">
                      <div className="p-3 sm:p-4">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                            <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">AI is analyzing...</span>
                            <div className="flex space-x-1">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Area */}
              <div className="flex-shrink-0 pt-3 sm:pt-4 safe-area-bottom">
                <div className="flex space-x-2 sm:space-x-3">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="ምላክቶትዎን ይግለጹ... / Describe your symptoms..."
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="h-12 sm:h-14 bg-gray-50/90 dark:bg-gray-700/90 border-gray-200 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-400 rounded-xl sm:rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-500 text-sm font-medium shadow-sm"
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    onClick={() => sendMessage()}
                    disabled={!currentMessage.trim() || isLoading}
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 hover:from-blue-700 hover:via-cyan-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Voice Tab */}
            <TabsContent value="voice" className="flex-1 flex flex-col min-h-0 mt-0 overflow-hidden">
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 relative overflow-hidden">
                  <VoiceVisualization />
                </div>
                
                <div className="flex-shrink-0 flex justify-center pb-6 sm:pb-8 pt-4 safe-area-bottom">
                  <Button
                    onClick={isListening ? stopListening : startListening}
                    disabled={isLoading || isReading || isProcessingRequest || !conversationReady}
                    className={`h-20 w-20 sm:h-24 sm:w-24 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 ${
                      isReading
                        ? 'bg-purple-500 hover:bg-purple-600 text-white cursor-not-allowed opacity-80'
                        : isListening 
                          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                          : isProcessingRequest
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white cursor-not-allowed opacity-80'
                            : 'bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white'
                    }`}
                  >
                    {isReading ? (
                      <Volume2 className="w-8 h-8 sm:w-10 sm:h-10" />
                    ) : isListening ? (
                      <MicOff className="w-8 h-8 sm:w-10 sm:h-10" />
                    ) : isProcessingRequest ? (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Mic className="w-8 h-8 sm:w-10 sm:h-10" />
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SymptomChecker;
