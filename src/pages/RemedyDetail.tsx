
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { tenaAPI, Remedy } from '@/api/tena_api';
import { ArrowLeft, Star, Clock, AlertTriangle, ChefHat, Utensils } from 'lucide-react';

const RemedyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [remedy, setRemedy] = useState<Remedy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'am'>('en');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadRemedyDetail(id);
    }
    setCurrentLanguage(tenaAPI.getCurrentLanguage());
  }, [id]);

  const loadRemedyDetail = async (remedyId: string) => {
    setIsLoading(true);
    try {
      const data = await tenaAPI.getRemedyDetail(remedyId);
      if (data) {
        setRemedy(data);
      } else {
        toast({
          title: "Remedy not found",
          description: "The requested remedy could not be found.",
          variant: "destructive",
        });
        navigate('/remedies');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load remedy details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = currentLanguage === 'en' ? 'am' : 'en';
    setCurrentLanguage(newLang);
    tenaAPI.switchLanguage(newLang);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border-b border-green-100 dark:border-gray-700">
          <div className="flex items-center p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/remedies')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="ml-3">
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="p-4">
          <Card className="animate-pulse bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-600 rounded-lg mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!remedy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Remedy not found</p>
          <Button onClick={() => navigate('/remedies')}>Back to Remedies</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border-b border-green-100 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate('/remedies')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Remedy Details</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">የመድሃኒት ዝርዝሮች</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Main Info Card */}
        <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="relative">
              <img
                src={remedy.ImageURL}
                alt={remedy.Title}
                className="w-full h-48 object-cover rounded-t-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              <div className="absolute top-4 right-4">
                <Badge className="bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white">
                  {remedy.Tag}
                </Badge>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {remedy.Title}
                </h2>
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                  <span className="text-sm font-medium dark:text-white">{remedy.Stars}/5</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-gray-400 mr-1" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{new Date(remedy.Date).toLocaleDateString()}</span>
                </div>
              </div>

              {remedy.Description && (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                  {remedy.Description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ingredients */}
        <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <ChefHat className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Ingredients
              </h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {remedy.Ingredients.split(',').map((ingredient, index) => (
                <Badge key={index} variant="outline" className="mr-2 mb-2 p-2 dark:border-gray-600 dark:text-gray-300">
                  {ingredient.trim()}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Preparation Instructions
            </h3>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {remedy.Instructions}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Usage */}
        {remedy.HowToUse && (
          <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Utensils className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  How to Use
                </h3>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {remedy.HowToUse}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Precautions */}
        {remedy.Precautions && (
          <Card className="border-0 shadow-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-300">
                  Precautions
                </h3>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-red-800 dark:text-red-200 leading-relaxed">
                {remedy.Precautions}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button 
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            onClick={() => {
              toast({
                title: "Added to Favorites",
                description: "This remedy has been saved to your favorites.",
              });
            }}
          >
            Add to Favorites
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: remedy.Title,
                  text: remedy.Description || 'Traditional remedy from TenaCare',
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
                toast({
                  title: "Link Copied",
                  description: "Remedy link copied to clipboard.",
                });
              }
            }}
          >
            Share
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RemedyDetail;
