
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { tenaAPI, HealthTip, FirstAid } from '@/api/tena_api';
import FirstAidDetail from '@/components/FirstAidDetail';
import { ArrowLeft, Heart, Calendar, BookOpen, Zap, Shield, AlertTriangle, Home } from 'lucide-react';

const HealthTips = () => {
  const [tips, setTips] = useState<HealthTip[]>([]);
  const [firstAidList, setFirstAidList] = useState<FirstAid[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFirstAid, setSelectedFirstAid] = useState<FirstAid | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFirstAid, setIsLoadingFirstAid] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const categories = ['ሁሉም', 'አጠቃላይ ጤና', 'እንቅስቃሴ', 'ምግብ እና እንክብካቤ', 'የአእምሮ ጤና', 'መከላከያ'];

  useEffect(() => {
    loadTips();
    loadFirstAid();
  }, [selectedCategory]);

  const loadTips = async () => {
    setIsLoading(true);
    try {
      const category = selectedCategory === 'All' || !selectedCategory ? undefined : selectedCategory;
      const data = await tenaAPI.getHealthTips(category);
      setTips(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load health tips. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFirstAid = async () => {
    setIsLoadingFirstAid(true);
    try {
      const data = await tenaAPI.getFirstAidList();
      setFirstAidList(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load first aid data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFirstAid(false);
    }
  };

  const handleFirstAidClick = (firstAid: FirstAid) => {
    setSelectedFirstAid(firstAid);
  };

  if (selectedFirstAid) {
    return (
      <FirstAidDetail
        aid={selectedFirstAid}
        onBack={() => setSelectedFirstAid(null)}
      />
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'General Health': return Heart;
      case 'Fitness': return Zap;
      case 'Nutrition': return BookOpen;
      case 'Mental Health': return Shield;
      default: return Heart;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'General Health': return 'from-blue-500 to-cyan-500';
      case 'Fitness': return 'from-green-500 to-teal-500';
      case 'Nutrition': return 'from-orange-500 to-yellow-500';
      case 'Mental Health': return 'from-teal-500 to-green-500';
      case 'Prevention': return 'from-cyan-500 to-blue-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm border-b border-blue-100 dark:border-gray-700">
        <div className="flex items-center p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/home')} className="hover:bg-blue-100 dark:hover:bg-gray-700">
            <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-white" />
          </Button>
          <div className="ml-3 flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Health Tips & First Aid</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">የጤና ምክሮች እና የመጀመሪያ እርዳታ</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate('/home')} className="hover:bg-blue-100 dark:hover:bg-gray-700">
            <Home className="w-5 h-5 text-gray-900 dark:text-white" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Daily Tip Highlight */}
        <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold">Tip of the Day</h2>
                <p className="text-sm text-blue-100">የዕለቱ ምክር</p>
              </div>
            </div>
            {tips.length > 0 && (
              <>
                <p className="text-sm leading-relaxed mb-2">
                  {tips[0].Tip}
                </p>
                <p className="text-xs text-blue-100">
                  Stay healthy and take care of yourself!
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Emergency First Aid Section */}
        <Card className="border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 shadow-sm">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">Emergency First Aid</h3>
                <p className="text-sm text-red-700 dark:text-red-300">የአስቸኳይ ጊዜ የመጀመሪያ እርዳታ</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingFirstAid ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                    <div className="h-4 bg-red-200 dark:bg-red-800 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-red-200 dark:bg-red-800 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {firstAidList.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:shadow-md transition-all duration-200 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700"
                    onClick={() => handleFirstAidClick(item)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <img
                            src={item.ImageURL}
                            alt={item.Title}
                            className="w-12 h-12 object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{item.Title}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {item.Warning}
                            </p>
                          </div>
                        </div>
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                          <span className="text-red-600 dark:text-red-400">→</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Categories */}
        <div className="flex overflow-x-auto space-x-2 py-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                  : 'bg-white/90 dark:bg-gray-800/90 border-blue-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-gray-500 text-gray-900 dark:text-white'
              }`}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Health Tips List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse bg-white/90 dark:bg-gray-800/90 border-blue-100 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex space-x-4">
                    <div className="w-24 h-24 bg-blue-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-blue-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-blue-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-blue-200 dark:bg-gray-700 rounded w-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {tips.map((tip) => {
              const IconComponent = getCategoryIcon(tip.Tag);
              const colorClass = getCategoryColor(tip.Tag);
              
              return (
                <Card key={tip.id} className="shadow-sm hover:shadow-md transition-all duration-200 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-blue-100 dark:border-gray-700">
                  <CardContent className="p-0">
                    <div className="flex">
                      <img
                        src={tip.ImageURL}
                        alt={tip.Title}
                        className="w-24 h-24 object-cover rounded-l-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className={`w-6 h-6 bg-gradient-to-r ${colorClass} rounded-full flex items-center justify-center`}>
                                <IconComponent className="w-3 h-3 text-white" />
                              </div>
                              <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">
                                {tip.Tag}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                              {tip.Title}
                            </h3>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-500 mb-2">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(tip.Date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-900/10 dark:to-cyan-900/10">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {tip.Tip}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!isLoading && tips.length === 0 && (
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-blue-100 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <Heart className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No health tips found</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedCategory('');
                  loadTips();
                }}
                className="bg-white/90 dark:bg-gray-800/90 border-blue-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
              >
                Show All Tips
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HealthTips;
