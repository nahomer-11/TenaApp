
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { tenaAPI, User } from '@/api/tena_api';
import { ArrowLeft, User as UserIcon, Settings, Moon, Sun, Globe, Bell, Info } from 'lucide-react';

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'am'>('en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
    setCurrentTheme(tenaAPI.getCurrentTheme());
    setCurrentLanguage(tenaAPI.getCurrentLanguage());
    
    // Listen for theme changes
    const handleThemeChange = (event: CustomEvent) => {
      setCurrentTheme(event.detail);
    };
    
    const handleLanguageChange = (event: CustomEvent) => {
      setCurrentLanguage(event.detail);
    };
    
    window.addEventListener('themeChanged', handleThemeChange as EventListener);
    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange as EventListener);
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);

  const loadUserData = () => {
    const savedUser = localStorage.getItem('tena_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setEditForm({
        name: userData.full_name || userData.name || '',
        email: userData.email || '',
        phone: userData.phone_number || userData.phone || ''
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updatedUser = await tenaAPI.updateUserProfile(editForm);
      setUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleThemeToggle = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    tenaAPI.switchTheme(newTheme);
    setCurrentTheme(newTheme);
    toast({
      title: "Theme Changed",
      description: `Switched to ${newTheme} theme`,
    });
  };

  const handleLanguageChange = (language: 'en' | 'am') => {
    tenaAPI.switchLanguage(language);
    setCurrentLanguage(language);
    toast({
      title: "Language Changed",
      description: `Language changed to ${language === 'en' ? 'English' : 'አማርኛ'}`,
    });
  };

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          toast({
            title: "Notifications Enabled",
            description: "You will now receive health reminders and alerts.",
          });
        } else {
          toast({
            title: "Permission Denied",
            description: "Please enable notifications in your browser settings.",
            variant: "destructive",
          });
        }
      }
    } else {
      setNotificationsEnabled(false);
      toast({
        title: "Notifications Disabled",
        description: "You will no longer receive notifications.",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No user data found</p>
          <Button onClick={() => navigate('/home')} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border-b border-blue-100 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate('/home')} className="hover:bg-blue-100 dark:hover:bg-gray-700">
              <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-white" />
            </Button>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Profile & Settings</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">ፕሮፋይል እና ቅንብሮች</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Card */}
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Profile Information</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">የግል መረጃ</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white/80 dark:bg-gray-700/80 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-900 dark:text-white">Full Name</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="bg-white/90 dark:bg-gray-700/90 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-900 dark:text-white">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="bg-white/90 dark:bg-gray-700/90 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-900 dark:text-white">Phone Number</Label>
                  <Input
                    id="phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="bg-white/90 dark:bg-gray-700/90 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <Button onClick={handleSaveProfile} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
                  Save Changes
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">{user.full_name || user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                </div>
                {(user.phone_number || user.phone) && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="font-medium text-gray-900 dark:text-white">{user.phone_number || user.phone}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">App Settings</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">የመተግበሪያ ቅንብሮች</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {currentTheme === 'light' ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-blue-500" />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Dark Theme</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Enable dark mode</p>
                </div>
              </div>
              <Switch
                checked={currentTheme === 'dark'}
                onCheckedChange={handleThemeToggle}
              />
            </div>

            {/* Language Selection */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Language</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Choose your language</p>
                </div>
              </div>
              <Select value={currentLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-32 bg-white/90 dark:bg-gray-700/90 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="am">አማርኛ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Health reminders & alerts</p>
                </div>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* About Card */}
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">About TenaCare</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">ስለ ተናኬር</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                TenaCare Mobile Health Hub
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Version 1.0.0
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Your comprehensive health companion
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
