
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { tenaAPI, Remedy } from '@/api/tena_api';
import { Search, ArrowLeft, Star, Clock, ChevronRight, Home } from 'lucide-react';

const TraditionalRemedies = () => {
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const categories = ['ሁሉም', 'የመከላከያ ሥርዓት', 'የማህደር ስርዓት', 'የመተንፈሻ ስርዓት', 'የህመም ማስታገሻ', 'የቆዳ እንክብካቤ'];

  useEffect(() => {
    loadRemedies();
  }, [selectedCategory]);

  const loadRemedies = async () => {
    setIsLoading(true);
    try {
      const category = selectedCategory === 'All' || !selectedCategory ? undefined : selectedCategory;
      const data = await tenaAPI.getRemedies(category);
      setRemedies(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load remedies. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadRemedies();
      return;
    }

    setIsLoading(true);
    try {
      const results = await tenaAPI.searchRemedies(searchQuery);
      setRemedies(results);
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToDetail = (remedyId: number) => {
    navigate(`/remedy/${remedyId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/home')} className="hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="ml-3 flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Traditional Remedies</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">ባህላዊ መድሃኒቶች</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate('/home')} className="hover:bg-gray-100 dark:hover:bg-gray-700">
            <Home className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search remedies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white backdrop-blur-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
<Button onClick={handleSearch} className="h-12 px-6 bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white">
  Search
</Button>


        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto space-x-2 py-2 scrollbar-hide">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap min-w-fit px-4 flex-shrink-0 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Remedies List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex">
                    <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg mr-4"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {remedies.map((remedy) => (
              <Card 
                key={remedy.id} 
                className="shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 backdrop-blur-sm cursor-pointer"
                onClick={() => navigateToDetail(remedy.id)}
              >
                <CardContent className="p-0">
                  <div className="flex">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
                      <img
                        src={remedy.ImageURL}
                        alt={remedy.Title}
                        className="w-full h-full object-cover rounded-l-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="flex-1 p-4 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1 leading-tight truncate">
                            {remedy.Title}
                          </h3>
                          <Badge variant="secondary" className="text-xs mb-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300">
                            {remedy.Tag}
                          </Badge>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                              {remedy.Stars}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-500 ml-1">
                              {new Date(remedy.Date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {remedy.Description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                          {remedy.Description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && remedies.length === 0 && (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No remedies found</p>
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                loadRemedies();
              }} className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TraditionalRemedies;
