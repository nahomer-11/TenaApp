import { Button } from '@/components/ui/button';
import { Heart, BookOpen, Zap, Phone, User, Calculator } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Heart, path: '/home', label: 'ቤት', labelEng: 'Home' },
    { icon: Zap, path: '/symptom-checker', label: 'ምርመራ', labelEng: 'Check' },
    { icon: BookOpen, path: '/remedies', label: 'መድሃኒት', labelEng: 'Remedies' },
    { icon: Phone, path: '/hospitals', label: 'ሆስፒታል', labelEng: 'Hospital' },
    { icon: User, path: '/profile', label: 'መገለጫ', labelEng: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 px-2 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2 px-3 rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-gradient-to-t from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400" 
                  : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "animate-pulse")} />
              <span className="text-xs font-medium leading-none">
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;