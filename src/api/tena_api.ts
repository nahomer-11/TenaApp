import axios from 'axios';

const API_BASE_URL = 'https://tena-care-api.onrender.com/tenaCare_api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(async (config) => {
  let token = localStorage.getItem('tena_access_token');
  
  if (token) {
    // Check if token is expired and refresh if needed
    const tokenData = JSON.parse(localStorage.getItem('tena_token_data') || '{}');
    const expirationTime = tokenData.exp;
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (expirationTime && currentTime >= expirationTime) {
      // Token is expired, try to refresh
      const refreshToken = localStorage.getItem('tena_refresh_token');
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken
          });
          
          const newTokens = refreshResponse.data;
          localStorage.setItem('tena_access_token', newTokens.access);
          localStorage.setItem('tena_refresh_token', newTokens.refresh);
          
          // Parse and store token data for expiration checking
          const tokenPayload = JSON.parse(atob(newTokens.access.split('.')[1]));
          localStorage.setItem('tena_token_data', JSON.stringify(tokenPayload));
          
          token = newTokens.access;
        } catch (error) {
          console.error('Token refresh failed:', error);
          // Clear tokens and redirect to login
          localStorage.removeItem('tena_access_token');
          localStorage.removeItem('tena_refresh_token');
          localStorage.removeItem('tena_token_data');
          localStorage.removeItem('tena_user');
          window.location.href = '/login';
          return config;
        }
      }
    }
    
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone_number?: string;
  is_active?: boolean;
  is_staff?: boolean;
  name?: string; // Add for backward compatibility
  phone?: string; // Add for backward compatibility
}

export interface Hospital {
  id: number;
  name: string;
  nameAmharic: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  rating: number;
  specialties: string[];
  distance?: number;
}

export interface HealthCalculatorResult {
  value: string;
  category: string;
  recommendations: string[];
}

export interface HealthTip {
  id: number;
  ImageURL: string;
  Title: string;
  Tip: string;
  Tag: string;
  Date: string;
}

export interface FirstAid {
  id: number;
  ImageURL: string;
  Title: string;
  Warning: string;
  Instructions: string;
}

export interface Remedy {
  id: number;
  ImageURL: string;
  Title: string;
  Tag: string;
  Stars: number;
  Date: string;
  Description: string;
  Ingredients: string;
  Instructions: string;
  HowToUse: string;
  Precautions: string;
}

export interface MedicineReminder {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  times: string[];
  isActive: boolean;
}

export interface ChatSession {
  id: number;
  user: number;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  session: number;
  sender: 'user' | 'ai';
  content: string;
  time_stamp: string;
}

export const tenaAPI = {
  // Auth endpoints
  async register(userData: { email: string; full_name: string; phone_number: string; password: string }) {
    try {
      const response = await api.post('/auth/register/', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async login(email: string, password: string) {
    try {
      const response = await api.post('/auth/login/', {
        email: email,
        password: password
      });
      
      const data = response.data;
      console.log('Login response:', data);
      
      // Store tokens
      if (data.access) {
        localStorage.setItem('tena_access_token', data.access);
        localStorage.setItem('tena_refresh_token', data.refresh);
        
        // Parse and store token data for expiration checking
        const tokenPayload = JSON.parse(atob(data.access.split('.')[1]));
        localStorage.setItem('tena_token_data', JSON.stringify(tokenPayload));
      }
      
      // Store user data with proper format
      if (data.user) {
        const userData = {
          ...data.user,
          name: data.user.full_name, // Add for backward compatibility
          phone: data.user.phone_number, // Add for backward compatibility
          is_active: data.user.is_active || true,
          is_staff: data.user.is_staff || false
        };
        localStorage.setItem('tena_user', JSON.stringify(userData));
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Token refresh endpoint
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('tena_refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.post('/auth/refresh/', {
        refresh: refreshToken
      });
      
      const data = response.data;
      localStorage.setItem('tena_access_token', data.access);
      localStorage.setItem('tena_refresh_token', data.refresh);
      
      // Parse and store token data for expiration checking
      const tokenPayload = JSON.parse(atob(data.access.split('.')[1]));
      localStorage.setItem('tena_token_data', JSON.stringify(tokenPayload));
      
      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  },

  // Chat endpoints
  async getChatSessions(): Promise<ChatSession[]> {
    try {
      const response = await api.get('/tenaCareAI/sessions/');
      return response.data;
    } catch (error) {
      console.error('Get sessions error:', error);
      return [];
    }
  },

  async createChatSession(): Promise<ChatSession> {
    try {
      const response = await api.post('/tenaCareAI/sessions/create/', {});
      return response.data;
    } catch (error) {
      console.error('Create session error:', error);
      throw error;
    }
  },

  async getChatMessages(sessionId: number): Promise<ChatMessage[]> {
    try {
      const response = await api.get(`/tenaCareAI/sessions/${sessionId}/messages/`);
      return response.data;
    } catch (error) {
      console.error('Get messages error:', error);
      return [];
    }
  },

  async sendChatMessage(sessionId: number, content: string) {
    try {
      const response = await api.post(`/tenaCareAI/sessions/${sessionId}/send/`, {
        content
      });
      return response.data;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  },

  async chatWithAI(message: string) {
    try {
      // Get existing sessions or create a new one if none exist
      let sessions = await this.getChatSessions();
      let sessionId: number;
      
      if (sessions.length === 0) {
        // Create new session if none exist
        const newSession = await this.createChatSession();
        sessionId = newSession.id;
      } else {
        // Use the most recent session
        sessionId = sessions[sessions.length - 1].id;
      }
      
      const response = await this.sendChatMessage(sessionId, message);
      
      // The backend returns { user_message: {...}, ai_message: {...} }
      if (response.ai_message && response.ai_message.content) {
        return {
          message: response.ai_message.content,
          sessionId: sessionId,
          userMessage: response.user_message,
          aiMessage: response.ai_message
        };
      } else if (response.error) {
        throw new Error(response.error);
      } else {
        throw new Error('Invalid response format from AI');
      }
    } catch (error) {
      console.error('Chat with AI error:', error);
      throw error;
    }
  },

  async readTextAloud(text: string) {
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
      } else {
        throw new Error('Speech synthesis not supported');
      }
    } catch (error) {
      console.error('Text to speech error:', error);
      throw error;
    }
  },

  // Remedies endpoints
  async getRemedies(category?: string): Promise<Remedy[]> {
    try {
      const response = await api.get('/core/remedies/');
      let remedies = response.data;
      
      if (category && category !== 'All') {
        remedies = remedies.filter((remedy: Remedy) => remedy.Tag === category);
      }
      
      return remedies;
    } catch (error) {
      console.error('Get remedies error:', error);
      return [];
    }
  },

  async getRemedyDetail(id: string): Promise<Remedy | null> {
    try {
      const response = await api.get(`/core/remedies/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Get remedy detail error:', error);
      return null;
    }
  },

  async searchRemedies(query: string): Promise<Remedy[]> {
    try {
      const remedies = await this.getRemedies();
      return remedies.filter(r => 
        r.Title.toLowerCase().includes(query.toLowerCase()) ||
        r.Tag.toLowerCase().includes(query.toLowerCase()) ||
        r.Description.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Search remedies error:', error);
      return [];
    }
  },

  // Health Tips endpoints
  async getHealthTips(category?: string): Promise<HealthTip[]> {
    try {
      const response = await api.get('/core/health-tips/');
      let tips = response.data;
      
      if (category && category !== 'All') {
        tips = tips.filter((tip: HealthTip) => tip.Tag === category);
      }
      
      return tips;
    } catch (error) {
      console.error('Get health tips error:', error);
      return [];
    }
  },

  // First Aid endpoints
  async getFirstAidList(): Promise<FirstAid[]> {
    try {
      const response = await api.get('/core/first-aid/');
      return response.data;
    } catch (error) {
      console.error('Get first aid error:', error);
      return [];
    }
  },

  async getFirstAidDetail(id: string): Promise<FirstAid | null> {
    try {
      const firstAidList = await this.getFirstAidList();
      return firstAidList.find(aid => aid.id.toString() === id) || null;
    } catch (error) {
      console.error('Get first aid detail error:', error);
      return null;
    }
  },

  // Medicine reminder methods (local storage for now)
  async getMedicineReminders(): Promise<MedicineReminder[]> {
    try {
      const reminders = localStorage.getItem('medicine_reminders');
      return reminders ? JSON.parse(reminders) : [];
    } catch (error) {
      console.error('Get reminders error:', error);
      return [];
    }
  },

  async addMedicineReminder(reminder: Omit<MedicineReminder, 'id'>): Promise<MedicineReminder> {
    try {
      const newReminder: MedicineReminder = {
        ...reminder,
        id: Date.now().toString()
      };
      
      const reminders = await this.getMedicineReminders();
      reminders.push(newReminder);
      localStorage.setItem('medicine_reminders', JSON.stringify(reminders));
      
      // Schedule notification
      await this.scheduleNotification(newReminder);
      
      return newReminder;
    } catch (error) {
      console.error('Add reminder error:', error);
      throw error;
    }
  },

  async updateMedicineReminder(id: string, updates: Partial<MedicineReminder>): Promise<void> {
    try {
      const reminders = await this.getMedicineReminders();
      const index = reminders.findIndex(r => r.id === id);
      
      if (index !== -1) {
        const updatedReminder = { ...reminders[index], ...updates };
        reminders[index] = updatedReminder;
        localStorage.setItem('medicine_reminders', JSON.stringify(reminders));
        
        // Reschedule notification
        await this.cancelNotification(id);
        if (updatedReminder.isActive) {
          await this.scheduleNotification(updatedReminder);
        }
      }
    } catch (error) {
      console.error('Update reminder error:', error);
      throw error;
    }
  },

  async deleteMedicineReminder(id: string): Promise<void> {
    try {
      const reminders = await this.getMedicineReminders();
      const filtered = reminders.filter(r => r.id !== id);
      localStorage.setItem('medicine_reminders', JSON.stringify(filtered));
      
      // Cancel notification
      await this.cancelNotification(id);
    } catch (error) {
      console.error('Delete reminder error:', error);
      throw error;
    }
  },

  // Notification methods
  async scheduleNotification(reminder: MedicineReminder): Promise<void> {
    try {
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.notification) {
        const now = new Date();
        const startDate = new Date(reminder.startDate);
        const endDate = new Date(reminder.endDate);

        reminder.times.forEach((time, index) => {
          const [hours, minutes] = time.split(':').map(Number);
          let scheduleDate = new Date(startDate);
          scheduleDate.setHours(hours, minutes, 0, 0);

          while (scheduleDate <= endDate) {
            if (scheduleDate > now) {
              window.cordova.plugins.notification.local.schedule({
                id: parseInt(`${reminder.id}${index}${scheduleDate.getTime()}`),
                title: 'Medicine Reminder',
                text: `Time to take your ${reminder.name} - ${reminder.dosage}`,
                trigger: { at: scheduleDate },
                led: 'FF0000',
                sound: 'default',
                vibrate: true,
                actions: [
                  { id: 'taken', title: 'Taken' },
                  { id: 'snooze', title: 'Snooze' }
                ]
              });
            }
            scheduleDate.setDate(scheduleDate.getDate() + 1);
          }
        });

        window.cordova.plugins.notification.local.on('trigger', function (notification: any) {
            console.log('Notification triggered:', notification);
        });
      } else {
        console.warn('Cordova Local Notification plugin not available.');
        throw new Error('Cordova Local Notification plugin not available.');
      }
    } catch (error) {
      console.error('Schedule notification error:', error);
    }
  },

  async cancelNotification(reminderId: string): Promise<void> {
    try {
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.notification) {
        window.cordova.plugins.notification.local.getAll(function (notifications: any[]) {
          const idsToCancel = notifications
            .filter(n => n.id.toString().startsWith(reminderId))
            .map(n => n.id);
          window.cordova.plugins.notification.local.cancel(idsToCancel);
        });
      }
    } catch (error) {
      console.error('Cancel notification error:', error);
    }
  },

  // Location and hospital methods
  async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            console.error('Location error:', error);
            resolve({ lat: 9.0192, lng: 38.7525 });
          }
        );
      } else {
        resolve({ lat: 9.0192, lng: 38.7525 });
      }
    });
  },

  async requestLocationPermission(): Promise<boolean> {
    if ('geolocation' in navigator) {
      return true;
    }
    return false;
  },

  async getNearbyHospitals(lat?: number, lng?: number): Promise<Hospital[]> {
    const hospitals: Hospital[] = [
      {
        id: 1,
        name: "Black Lion Hospital",
        nameAmharic: "ብላክ ላይን ሆስፒታል",
        address: "Churchill Avenue, Addis Ababa",
        phone: "+251-11-551-7611",
        latitude: 9.0192,
        longitude: 38.7525,
        rating: 4.2,
        specialties: ["Emergency", "Cardiology", "Surgery", "ICU"],
        distance: 2.5
      },
      {
        id: 2,
        name: "St. Paul's Hospital",
        nameAmharic: "ቅዱስ ጳውሎስ ሆስፒታል",
        address: "Gulele, Addis Ababa",
        phone: "+251-11-551-7612",
        latitude: 9.0353,
        longitude: 38.7469,
        rating: 4.5,
        specialties: ["Emergency", "Pediatrics", "Obstetrics", "Gynecology"],
        distance: 3.2
      },
      {
        id: 3,
        name: "Tikur Anbessa Hospital",
        nameAmharic: "ጥቁር አንበሳ ሆስፒታል",
        address: "Medical Faculty, Addis Ababa University",
        phone: "+251-11-551-7613",
        latitude: 9.0084,
        longitude: 38.7575,
        rating: 4.1,
        specialties: ["Emergency", "Neurology", "Oncology", "Trauma"],
        distance: 1.8
      },
      {
        id: 4,
        name: "Alert Hospital",
        nameAmharic: "አለርት ሆስፒታል",
        address: "Mexico Square, Addis Ababa",
        phone: "+251-11-551-7614",
        latitude: 9.0067,
        longitude: 38.7578,
        rating: 4.3,
        specialties: ["Emergency", "Orthopedics", "Rehabilitation"],
        distance: 2.1
      },
      {
        id: 5,
        name: "Yekatit 12 Hospital",
        nameAmharic: "የካቲት ፲፪ ሆስፒታል",
        address: "Yekatit 12 Square, Addis Ababa",
        phone: "+251-11-551-7615",
        latitude: 9.0301,
        longitude: 38.7414,
        rating: 3.9,
        specialties: ["Emergency", "Internal Medicine", "Surgery"],
        distance: 4.2
      },
      {
        id: 6,
        name: "Zewditu Memorial Hospital",
        nameAmharic: "ዘውዲቱ መታሰቢያ ሆስፒታል",
        address: "Arada, Addis Ababa",
        phone: "+251-11-551-7616",
        latitude: 9.0341,
        longitude: 38.7347,
        rating: 3.8,
        specialties: ["Emergency", "Maternity", "Pediatrics"],
        distance: 5.1
      },
      {
        id: 7,
        name: "Gandhi Memorial Hospital",
        nameAmharic: "ጋንዲ መታሰቢያ ሆስፒታል",
        address: "Addis Ketema, Addis Ababa",
        phone: "+251-11-551-7617",
        latitude: 9.0187,
        longitude: 38.7289,
        rating: 3.7,
        specialties: ["Emergency", "General Medicine", "Surgery"],
        distance: 3.8
      },
      {
        id: 8,
        name: "Ras Desta Damtew Hospital",
        nameAmharic: "ራስ ደስታ ዳምጠው ሆስፒታል",
        address: "Kirkos, Addis Ababa",
        phone: "+251-11-551-7618",
        latitude: 9.0098,
        longitude: 38.7456,
        rating: 3.6,
        specialties: ["Emergency", "Dermatology", "ENT"],
        distance: 2.9
      },
      {
        id: 9,
        name: "Bethzatha General Hospital",
        nameAmharic: "ቤተዛታ ሆስፒታል",
        address: "Bole, Addis Ababa",
        phone: "+251-11-551-7619",
        latitude: 8.9806,
        longitude: 38.7578,
        rating: 4.0,
        specialties: ["Emergency", "Cardiology", "Ophthalmology"],
        distance: 6.2
      },
      {
        id: 10,
        name: "Hayat Medical College Hospital",
        nameAmharic: "ሀያት ሜዲካል ኮሌጅ ሆስፒታል",
        address: "Bole, Addis Ababa",
        phone: "+251-11-551-7620",
        latitude: 8.9889,
        longitude: 38.7889,
        rating: 4.2,
        specialties: ["Emergency", "Surgery", "ICU", "Laboratory"],
        distance: 7.1
      }
    ];
    
    return hospitals;
  },

  async searchHospitals(query: string): Promise<Hospital[]> {
    const hospitals = await this.getNearbyHospitals();
    return hospitals.filter(h => 
      h.name.toLowerCase().includes(query.toLowerCase()) ||
      h.nameAmharic.includes(query) ||
      h.specialties.some(s => s.toLowerCase().includes(query.toLowerCase()))
    );
  },

  async calculateBMI(weight: number, height: number): Promise<HealthCalculatorResult> {
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    const bmiValue = bmi.toFixed(1);
    
    let category = '';
    let recommendations: string[] = [];
    
    if (bmi < 18.5) {
      category = 'Underweight';
      recommendations = [
        'Consider consulting a nutritionist',
        'Focus on healthy weight gain',
        'Include more protein in your diet'
      ];
    } else if (bmi < 25) {
      category = 'Normal weight';
      recommendations = [
        'Maintain your current healthy lifestyle',
        'Continue regular exercise',
        'Keep eating balanced meals'
      ];
    } else if (bmi < 30) {
      category = 'Overweight';
      recommendations = [
        'Consider a balanced diet plan',
        'Increase physical activity',
        'Consult a healthcare provider'
      ];
    } else {
      category = 'Obese';
      recommendations = [
        'Consult a healthcare provider immediately',
        'Consider supervised weight loss program',
        'Focus on lifestyle changes'
      ];
    }
    
    return {
      value: bmiValue,
      category,
      recommendations
    };
  },

  async calculatePregnancyDueDate(lastPeriod: string): Promise<HealthCalculatorResult> {
    const lmp = new Date(lastPeriod);
    const dueDate = new Date(lmp.getTime() + (280 * 24 * 60 * 60 * 1000));
    const today = new Date();
    const weeksPregnant = Math.floor((today.getTime() - lmp.getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    return {
      value: dueDate.toLocaleDateString(),
      category: `${weeksPregnant} weeks`,
      recommendations: [
        'Schedule regular prenatal checkups',
        'Take prenatal vitamins',
        'Maintain a healthy diet',
        'Avoid alcohol and smoking',
        'Get adequate rest'
      ]
    };
  },

  // Theme and language methods
  initializeTheme() {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  },

  getCurrentTheme(): 'light' | 'dark' {
    return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
  },

  switchTheme(theme: 'light' | 'dark') {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: theme }));
  },

  getCurrentLanguage(): 'en' | 'am' {
    return localStorage.getItem('language') as 'en' | 'am' || 'en';
  },

  switchLanguage(language: 'en' | 'am') {
    localStorage.setItem('language', language);
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }));
  },

    async clearChatHistory(): Promise<void> {
    try {
      await api.delete('/tenaCareAI/sessions/clear-history/');
      console.log('✅ Chat history cleared');
    } catch (error) {
      console.error('❌ Error clearing chat history:', error);
      throw error;
    }
  },

  async updateUserProfile(userData: { name: string; email: string; phone: string }): Promise<User> {
    const updatedUser = {
      id: 1,
      email: userData.email,
      full_name: userData.name,
      phone_number: userData.phone,
      is_active: true,
      is_staff: false,
      name: userData.name,
      phone: userData.phone
    };
    localStorage.setItem('tena_user', JSON.stringify(updatedUser));
    return updatedUser;
  }
};

declare global {
  interface Window {
    cordova: any;
  }
}

