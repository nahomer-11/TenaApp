import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Heart, Plus, Calculator,  BookOpen, BotMessageSquare, User, Phone, Sparkles, Menu, Info, Clock, Calendar } from 'lucide-react';
import BottomNav from '@/components/ui/bottom-nav';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface QuickAction {
  title: string;
  titleAmharic: string;
  description: string;
  icon: any;
  color: string;
  path: string;
}

const Home = () => {
  const [userName, setUserName] = useState('User');
  const navigate = useNavigate();
  const { toast } = useToast();

    useEffect(() => {
      // Check if user has a token stored
      const token = localStorage.getItem('tena_access_token');
      
      if (!token) {
        // User is already logged in, go to home
        navigate('/login');
      } 

  }, [navigate]);

  useEffect(() => {
    const storedUser = localStorage.getItem('tena_user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUserName(userData.name || 'User');
    }
  }, []);

  const quickActions: QuickAction[] = [
    {
      title: 'Symptom Checker',
      titleAmharic: 'ምልክት መመርመሪያ',
      description: 'AI-powered symptom analysis',
      icon: BotMessageSquare,
      color: 'from-blue-500 to-cyan-500',
      path: '/symptom-checker',
    },
    {
      title: 'Traditional Remedies',
      titleAmharic: 'ባህላዊ መድሃኒቶች',
      description: 'Ethiopian traditional treatments',
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
      path: '/remedies',
    },
    {
      title: 'Health Tips',
      titleAmharic: 'የጤና ምክሮች',
      description: 'Daily health guidance',
      icon: Plus,
      color: 'from-blue-500 to-cyan-500',
      path: '/health-tips',
    },
    {
      title: 'Health Calculators',
      titleAmharic: 'የጤና ማስያ',
      description: 'BMI, pregnancy calculator & more',
      icon: Calculator,
      color: 'from-blue-500 to-cyan-500',
      path: '/calculators',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 dark:from-blue-800 dark:via-cyan-800 dark:to-blue-900">
        <div className="px-4 pt-12 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-2xl font-bold text-white">TenaCare</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <Info className="w-5 h-5" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="max-h-[80vh]">
                  <DrawerHeader>
                    <DrawerTitle className="flex items-center space-x-2">
                      <Heart className="w-5 h-5 text-blue-600" />
                      <span>About TenaCare</span>
                    </DrawerTitle>
                    <DrawerDescription>
                      Your trusted Ethiopian health companion
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="px-4 pb-8 space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Our Mission</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        TenaCare provides accessible healthcare information , 
                        bridging traditional medicine with modern healthcare technology.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Features</h3>
                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-center space-x-2">
                          <BotMessageSquare className="w-4 h-4 text-blue-600" />
                          <span>AI-powered symptom checker</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          <span>Traditional Ethiopian remedies</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-red-600" />
                          <span>Hospital and emergency locator</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Plus className="w-4 h-4 text-blue-600" />
                          <span>Daily health tips and guidance</span>
                        </li>
                      </ul>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Developer</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Created with ♥ by <span className="font-medium text-blue-600">Nahom Merga</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Version 1.0.0 • Built with modern web technologies
                      </p>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/profile')}
                className="text-white hover:bg-white/20"
              >
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-white/90 text-lg font-medium">
              እንደምን አለህ {userName}! 🙏
            </p>
            <p className="text-blue-100 text-sm mt-1">
              How are you feeling today?
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Quick Health Check */}
        <Card className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 text-white border-0 shadow-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="relative p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <BotMessageSquare className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-1">ምክር ይውሰዱ</h2>
                    <p className="text-blue-100 text-sm">Use AI assistance to evaluate your symptoms.</p>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/symptom-checker')}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm rounded-xl w-full"
                  variant="outline"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  • የምልክት ግምገማ ጀምር
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Grid */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full mr-3"></div>
            Services • አገልግሎቶች
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Card 
                  key={action.path}
                  className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg overflow-hidden group"
                  onClick={() => navigate(action.path)}
                >
                  <CardContent className="p-5 text-center relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 dark:to-gray-800/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className={`w-14 h-14 bg-gradient-to-r ${action.color} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                        {action.title}
                      </h4>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                        {action.titleAmharic}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {action.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Health Tip of the Day */}
        <Card className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-white border-0 shadow-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="relative p-6">
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-12 translate-y-12"></div>
              <div className="relative z-10">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2 flex items-center">
                      💡 Today's Health Tip
                    </h3>
                    <p className="text-sm text-blue-50 leading-relaxed mb-3 font-medium">
                      Stay hydrated! Drink at least 8 glasses of water daily to maintain good health and energy levels.
                    </p>
                    <div className="bg-white/10 rounded-xl p-3">
                      <p className="text-sm text-blue-100 font-amharic">
                        ውሃ ይጠጡ! ጤናን እና ኢነርጂን ለመጠበቅ በቀን ቢያንስ 8 ብርጭቆ ውሃ ይጠጡ።
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Emergency Contact */}
        <Card className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 shadow-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="relative p-4">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">Emergency</h4>
                    <p className="text-red-100 text-sm">24/7 ድንገተኛ አገልግሎት</p>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm rounded-xl px-6"
                  variant="outline"
                  onClick={() => window.open('tel:911', '_self')}
                >
                  Call 911
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom spacing for navigation */}
        <div className="h-4"></div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Home;