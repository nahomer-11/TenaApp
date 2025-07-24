import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { tenaAPI } from '@/api/tena_api';
import { ArrowLeft, Send, Bot, User, AlertTriangle, Sparkles, Volume2, Home, Phone, Mic, MicOff, Trash2, MessageCircle, AudioLines } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

// Speech recognition types for fallback web API
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
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
  const [recognition, setRecognition] = useState<any>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [microphone, setMicrophone] = useState<MediaStreamAudioSourceNode | null>(null);
  const [speechTimeout, setSpeechTimeout] = useState<NodeJS.Timeout | null>(null);
  const [lastProcessedText, setLastProcessedText] = useState('');
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);
  const [conversationReady, setConversationReady] = useState(true);
  const [useCapacitor, setUseCapacitor] = useState(false);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState('am-ET'); // Default to Amharic
  const [autoListenEnabled, setAutoListenEnabled] = useState(true);
  
  const animationRef = useRef<number>();
  const silenceTimer = useRef<NodeJS.Timeout | null>(null);
  const hasProcessedCurrent = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition - prioritize Capacitor for mobile
  useEffect(() => {
    const initializeSpeechRecognition = async () => {
      // Check if Capacitor speech recognition is available (mobile)
      try {
        const available = await SpeechRecognition.available();
        if (available) {
          console.log('Capacitor Speech Recognition is available');
          setUseCapacitor(true);
          
          // Request permissions
          const permissionResult = await SpeechRecognition.requestPermissions();
          if (permissionResult.speechRecognition !== 'granted') {
            throw new Error('Speech recognition permission denied');
          }
          
          // Get supported languages
          try {
            const languagesResult = await SpeechRecognition.getSupportedLanguages();
            console.log('Supported languages:', languagesResult);
            if (languagesResult && languagesResult.languages) {
              setSupportedLanguages(languagesResult.languages);
              
              // Check if Amharic is supported
              const hasAmharic = languagesResult.languages.some((lang: string) => 
                lang.toLowerCase().includes('am') || 
                lang.toLowerCase().includes('amharic') ||
                lang.toLowerCase().includes('et')
              );
              
              if (!hasAmharic) {
                // Show Amharic setup alert
                alert("⚠️ Amharic Speech Recognition is not supported on your device.\n\nPlease enable Amharic in:\nSettings > System > Languages & Input > Voice Input > Preferred Language\n\nThen try again.");
                // Fallback to English if Amharic not available
                setCurrentLanguage('en-US');
              }
            }
          } catch (error) {
            console.warn('Could not get supported languages:', error);
            setSupportedLanguages(['am-ET', 'en-US']); // Default fallback
          }
          
          // Setup Capacitor event listeners
          SpeechRecognition.addListener('partialResults', (data: any) => {
            console.log('Capacitor partial results:', data.matches);
            if (data.matches && data.matches.length > 0) {
              const currentTranscript = data.matches[0];
              setVoiceText(currentTranscript);
              
              // Clear existing silence timer
              if (silenceTimer.current) {
                clearTimeout(silenceTimer.current);
                silenceTimer.current = null;
              }
              
              // Set silence timer for processing
              if (!isProcessingRequest) {
                silenceTimer.current = setTimeout(() => {
                  if (currentTranscript.trim() && !hasProcessedCurrent.current && !isProcessingRequest) {
                    hasProcessedCurrent.current = true;
                    console.log('Processing after silence (Capacitor):', currentTranscript);
                    stopCapacitorListening();
                    handleVoiceMessage(currentTranscript.trim());
                  }
                }, 2000); // 2 seconds of silence
              }
            }
          });
          
          return;
        }
      } catch (error) {
        console.log('Capacitor Speech Recognition not available, falling back to web API:', error);
      }
      
      // Fallback to web Speech Recognition API
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognitionAPI) {
        console.log('Using web Speech Recognition API');
        const recognitionInstance = new SpeechRecognitionAPI();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = currentLanguage;
        
        recognitionInstance.onstart = () => {
          setIsListening(true);
          hasProcessedCurrent.current = false;
          console.log('Web speech recognition started');
        };
        
        recognitionInstance.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          const currentTranscript = finalTranscript || interimTranscript;
          setVoiceText(currentTranscript);
          
          // Clear existing silence timer
          if (silenceTimer.current) {
            clearTimeout(silenceTimer.current);
            silenceTimer.current = null;
          }
          
          // Only process final results and prevent duplicate processing
          if (finalTranscript && finalTranscript.trim() && !hasProcessedCurrent.current && !isProcessingRequest) {
            hasProcessedCurrent.current = true;
            console.log('Processing final transcript (web):', finalTranscript);
            
            // Stop listening immediately and process
            stopWebListening();
            handleVoiceMessage(finalTranscript.trim());
          } else if (interimTranscript && !isProcessingRequest) {
            // Set silence timer for interim results
            silenceTimer.current = setTimeout(() => {
              if (currentTranscript.trim() && !hasProcessedCurrent.current && !isProcessingRequest) {
                hasProcessedCurrent.current = true;
                console.log('Processing after silence (web):', currentTranscript);
                stopWebListening();
                handleVoiceMessage(currentTranscript.trim());
              }
            }, 2000); // 2 seconds of silence
          }
        };
        
        recognitionInstance.onerror = (event: any) => {
          console.error('Web speech recognition error:', event.error);
          setIsListening(false);
          hasProcessedCurrent.current = false;
          if (event.error !== 'no-speech') {
            toast({
              title: "Voice Recognition Error",
              description: `Error: ${event.error}. Please try again.`,
              variant: "destructive",
            });
          }
        };
        
        recognitionInstance.onend = () => {
          console.log('Web speech recognition ended');
          setIsListening(false);
          if (silenceTimer.current) {
            clearTimeout(silenceTimer.current);
            silenceTimer.current = null;
          }
          setVoiceText('');
          hasProcessedCurrent.current = false;
        };
        
        setRecognition(recognitionInstance);
      } else {
        console.error('Speech recognition not supported');
        toast({
          title: "Not Supported",
          description: "Speech recognition is not supported on this device.",
          variant: "destructive",
        });
      }
    };
    
    initializeSpeechRecognition();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
      }
      // Clean up Capacitor listeners
      SpeechRecognition.removeAllListeners();
    };
  }, [isProcessingRequest, currentLanguage]);

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
      setMicrophone(microphoneInstance);
      
      visualizeAudio(analyserInstance);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone for visualization.",
        variant: "destructive",
      });
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
        
        // Convert API messages to component format
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
    // Simple language detection based on character analysis
    const amharicPattern = /[\u1200-\u137F]/; // Ethiopic script range
    const englishPattern = /^[A-Za-z\s.,!?'"()-]+$/;
    
    if (amharicPattern.test(text)) {
      return 'am-ET';
    } else if (englishPattern.test(text.trim())) {
      return 'en-US';
    }
    
    // Default to current language if can't detect
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
    setCurrentMessage(''); // Clear immediately after sending
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
      
      // Update session ID if returned
      if (response.sessionId) {
        setCurrentSessionId(response.sessionId);
      }

      // Detect response language and update current language for next recognition
      const responseLanguage = detectLanguage(response.message);
      setCurrentLanguage(responseLanguage);
      
      // Auto-read response with TTS API
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

  const startCapacitorListening = async () => {
    try {
      console.log('Starting Capacitor speech recognition with language:', currentLanguage);
      
      await SpeechRecognition.start({
        language: currentLanguage,
        maxResults: 1,
        prompt: currentLanguage.includes('am') ? 'በአማርኛ ይናገሩ' : 'Say something',
        partialResults: true,
        popup: false,
      });
      
      setIsListening(true);
      hasProcessedCurrent.current = false;
      setVoiceText('');
    } catch (error) {
      console.error('Error starting Capacitor recognition:', error);
      
      // Show specific alert for Amharic not supported
      if (currentLanguage.includes('am')) {
        alert("⚠️ Amharic Speech Recognition is not supported on your device.\n\nPlease enable Amharic in:\nSettings > System > Languages & Input > Voice Input > Preferred Language\n\nThen try again.");
      }
      
      toast({
        title: "Error",
        description: "Failed to start voice recognition.",
        variant: "destructive",
      });
    }
  };

  const stopCapacitorListening = async () => {
    try {
      await SpeechRecognition.stop();
      setIsListening(false);
      setVoiceText('');
      hasProcessedCurrent.current = false;
      
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
        silenceTimer.current = null;
      }
    } catch (error) {
      console.error('Error stopping Capacitor recognition:', error);
    }
  };

  const stopWebListening = () => {
    console.log('Stopping web speech recognition...');
    if (recognition) {
      recognition.stop();
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
    setIsListening(false);
    setAudioLevel(0);
  };

  const startListening = async () => {
    if (!conversationReady || isProcessingRequest || isReading) {
      console.log('Cannot start listening - conversation not ready');
      return;
    }

    try {
      await setupAudioVisualization();
      setVoiceText('');
      setLastProcessedText('');
      hasProcessedCurrent.current = false;
      
      if (useCapacitor) {
        await startCapacitorListening();
      } else {
        if (!recognition) {
          toast({
            title: "Not Supported",
            description: "Speech recognition is not supported on this device.",
            variant: "destructive",
          });
          return;
        }
        
        // Update web recognition language
        recognition.lang = currentLanguage;
        console.log('Starting web speech recognition with language:', currentLanguage);
        recognition.start();
      }
    } catch (error) {
      console.error('Error starting recognition:', error);
      toast({
        title: "Error",
        description: "Failed to start voice recognition.",
        variant: "destructive",
      });
    }
  };

  const stopListening = async () => {
    console.log('Stopping speech recognition...');
    
    if (useCapacitor) {
      await stopCapacitorListening();
    } else {
      stopWebListening();
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

  // Enhanced TTS function using the provided API
  const readTextAloudWithAPI = async (text: string, language: string = currentLanguage) => {
    try {
      setIsReading(true);
      setConversationReady(false);
      
      // Stop any ongoing speech synthesis
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      
      // Determine language code for the API
      const langCode = language.includes('am') ? 'am' : 'en';
      
      // Construct the API URL
      const apiUrl = `https://text-to-speech.manzoor76b.workers.dev/?text=${encodeURIComponent(text)}&lang=${langCode}`;
      
      console.log('Making TTS API request:', apiUrl);
      
      // Create audio element
      const audio = new Audio();
      audio.src = apiUrl;
      
      // Handle audio events
      audio.onplay = () => {
        console.log('TTS audio started playing');
        setIsReading(true);
      };
      
      audio.onended = () => {
        console.log('TTS audio ended');
        setIsReading(false);
        setIsProcessingRequest(false);
        setConversationReady(true);
        
        // Auto-start listening again after AI finishes speaking (voice tab only)
        if (activeTab === 'voice' && autoListenEnabled && conversationReady) {
          setTimeout(() => {
            if (!isListening && !isProcessingRequest) {
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
        
        // Fallback to browser TTS
        console.log('Falling back to browser TTS');
        fallbackTTS(text, language);
      };
      
      // Play the audio
      await audio.play();
      
    } catch (error) {
      console.error('TTS API Error:', error);
      setIsReading(false);
      setIsProcessingRequest(false);
      setConversationReady(true);
      
      // Fallback to browser TTS
      console.log('Falling back to browser TTS due to API error');
      fallbackTTS(text, language);
    }
  };

  // Fallback TTS function using browser speechSynthesis
  const fallbackTTS = (text: string, language: string = currentLanguage) => {
    if (!('speechSynthesis' in window)) {
      toast({
        title: "Not Supported",
        description: "Text-to-speech is not supported on this device.",
        variant: "destructive",
      });
      return;
    }

    // Stop any ongoing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    setIsReading(true);
    setConversationReady(false);
    
    const speakText = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      
      console.log('Available voices:', voices.map(v => ({ name: v.name, lang: v.lang })));
      console.log('Detected language for TTS:', language);
      
      let selectedVoice = null;
      let selectedLang = language;
      
      if (language.includes('am')) {
        // For Amharic, try to find compatible voice
        selectedVoice = voices.find(voice => 
          voice.lang.toLowerCase().includes('am') || 
          voice.name.toLowerCase().includes('amharic')
        );
        
        if (!selectedVoice) {
          // Fallback to Arabic for better pronunciation
          selectedVoice = voices.find(voice => 
            voice.lang.toLowerCase().includes('ar')
          );
          selectedLang = 'ar-SA';
        }
      } else {
        // English or other languages
        selectedVoice = voices.find(voice => 
          voice.lang.toLowerCase().includes(language.substring(0, 2))
        );
      }
      
      // Final fallback
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.lang.toLowerCase().includes('en')
        ) || voices[0];
        selectedLang = 'en-US';
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedLang;
      } else {
        utterance.lang = selectedLang;
      }
      
      // Configure speech settings
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = () => {
        console.log('Browser TTS started');
        setIsReading(true);
      };
      
      utterance.onend = () => {
        console.log('Browser TTS ended');
        setIsReading(false);
        setIsProcessingRequest(false);
        setConversationReady(true);
        
        // Auto-start listening again after AI finishes speaking
        if (activeTab === 'voice' && autoListenEnabled && conversationReady) {
          setTimeout(() => {
            if (!isListening && !isProcessingRequest) {
              console.log('Auto-starting listening after browser TTS finished');
              startListening();
            }
          }, 1000);
        }
      };
      
      utterance.onerror = (event) => {
        console.error('Browser TTS Error:', event.error);
        setIsReading(false);
        setIsProcessingRequest(false);
        setConversationReady(true);
        
        toast({
          title: "TTS Error",
          description: "Text-to-speech failed. Please try again.",
          variant: "destructive",
        });
      };
      
      console.log('Speaking text with browser TTS:', text.substring(0, 50) + '...');
      window.speechSynthesis.speak(utterance);
    };
    
    // Ensure voices are loaded before speaking
    if (window.speechSynthesis.getVoices().length === 0) {
      console.log('Waiting for voices to load...');
      const voicesChangedHandler = () => {
        console.log('Voices loaded');
        window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
        speakText();
      };
      window.speechSynthesis.addEventListener('voiceschanged', voicesChangedHandler);
    } else {
      speakText();
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

    // Generate random wave data for speaking animation
    const speakingWaves = Array.from({ length: 12 }, (_, i) => ({
      delay: i * 0.1,
      amplitude: Math.sin(Date.now() / 300 + i) * 10 + 15,
    }));

    return (
      <div className="relative w-full h-full flex items-center justify-center min-h-[50vh] sm:min-h-[60vh]">
        {/* Background gradient overlay */}
        <div className={`absolute inset-0 transition-all duration-1000 ${
          isReading 
            ? 'bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-purple-900/20' 
            : isListening
              ? 'bg-gradient-to-br from-blue-900/20 via-cyan-900/20 to-blue-900/20'
              : 'bg-gradient-to-br from-gray-900/10 via-gray-800/10 to-gray-900/10'
        }`} />
        
        {/* Multiple wave rings with different speeds */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Outer wave rings */}
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
        
        {/* Central visualization area */}
        <div className="relative z-10 flex flex-col items-center space-y-4 sm:space-y-6 px-4">
          {/* Main orb with dynamic scaling */}
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
          
          {/* Enhanced audio level indicator */}
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
          
          {/* Status text with enhanced styling */}
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
                  ? `AI በ${currentLanguage.includes('am') ? 'አማርኛ' : 'English'} እየመለሰ ነው...` 
                  : isListening 
                    ? `በ${currentLanguage.includes('am') ? 'አማርኛ' : 'English'} ይናገሩ...`
                    : 'እዚህ ይንካዩ እና ይናገሩ'
                }
              </div>
              <div className="text-xs sm:text-sm opacity-80 mt-1">
                {isReading 
                  ? `AI is responding in ${currentLanguage.includes('am') ? 'Amharic' : 'English'}` 
                  : isListening 
                    ? `Listening in ${currentLanguage.includes('am') ? 'Amharic' : 'English'}...`
                    : 'Tap to start speaking'
                }
              </div>
            </div>
          </div>
          
          {/* Current speech text display */}
          {voiceText && isListening && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/90 dark:bg-gray-800/90 rounded-xl sm:rounded-2xl max-w-xs sm:max-w-md mx-auto backdrop-blur-sm border shadow-lg">
              <p className="text-sm sm:text-lg text-gray-800 dark:text-gray-200 font-medium text-center leading-relaxed">
                {voiceText}
              </p>
            </div>
          )}
          
          {/* Language indicator */}
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 px-2 sm:px-3 py-1 rounded-full">
            Current: {currentLanguage.includes('am') ? '🇪🇹 አማርኛ' : '🇺🇸 English'}
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
              Chat or speak in {currentLanguage.includes('am') ? 'Amharic & English' : 'English & Amharic'}
            </p>
            {useCapacitor && (
              <p className="text-blue-300 text-xs mt-1">📱 Enhanced mobile speech recognition</p>
            )}
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
                <span>Voice ({currentLanguage.includes('am') ? 'አማርኛ' : 'English'})</span>
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 mt-0 overflow-hidden">
              {/* Chat Messages - Scrollable */}
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
                {/* Full Screen Voice Visualization Area */}
                <div className="flex-1 relative overflow-hidden">
                  <VoiceVisualization />
                </div>
                
                {/* Voice Controls - Fixed at bottom */}
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