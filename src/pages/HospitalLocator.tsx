
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { tenaAPI, Hospital } from '@/api/tena_api';
import { ArrowLeft, Search, MapPin, Star, Bell, Navigation, Home } from 'lucide-react';

const HospitalLocator = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    getCurrentLocationAndLoadHospitals();
  }, []);

  const getCurrentLocationAndLoadHospitals = async () => {
    setIsLoading(true);
    try {
      // Request location permission
      const hasPermission = await tenaAPI.requestLocationPermission();
      if (hasPermission) {
        const location = await tenaAPI.getCurrentLocation();
        setUserLocation({ lat: location.lat, lng: location.lng });
        
        // Load nearby hospitals
        const nearbyHospitals = await tenaAPI.getNearbyHospitals(location.lat, location.lng);
        setHospitals(nearbyHospitals);
      } else {
        toast({
          title: "Location access denied",
          description: "Showing all hospitals. Enable location for better results.",
          variant: "destructive",
        });
        // Load all hospitals if location is not available
        const allHospitals = await tenaAPI.getNearbyHospitals();
        setHospitals(allHospitals);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load hospitals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      getCurrentLocationAndLoadHospitals();
      return;
    }

    setIsSearching(true);
    try {
      const results = await tenaAPI.searchHospitals(searchQuery);
      setHospitals(results);
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const callHospital = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const getDirections = (hospital: Hospital) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;
    window.open(url, '_blank');
  };

  const getEmergencyColor = (specialty: string) => {
    if (specialty.toLowerCase().includes('emergency')) return 'bg-red-500';
    if (specialty.toLowerCase().includes('cardiology')) return 'bg-purple-500';
    if (specialty.toLowerCase().includes('pediatrics')) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/home')} className="hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-white" />
          </Button>
          <div className="ml-3 flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Hospital Locator</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">የሆስፒታል አድራሻ</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate('/home')} className="hover:bg-gray-100 dark:hover:bg-gray-700">
            <Home className="w-5 h-5 text-gray-900 dark:text-white" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Emergency Alert */}
        <Card className="border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-200">Emergency</h3>
                <p className="text-sm text-red-800 dark:text-red-300">Call 911 or go to nearest emergency room</p>
                <p className="text-xs text-red-700 dark:text-red-400">አስቸኳይ ጊዜ 911 ወይም ቅርብ ወዳለ ሆስፒታል ይሂዱ</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search hospitals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching} className="h-12 bg-blue-600 hover:bg-blue-700 text-white">
            {isSearching ? "..." : "Search"}
          </Button>
        </div>

        {/* Location Status */}
        {userLocation && (
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-800 dark:text-green-200">
                  Showing hospitals near your location
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hospitals List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {hospitals.map((hospital) => (
              <Card key={hospital.id} className="shadow-sm hover:shadow-md transition-shadow bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{hospital.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{hospital.nameAmharic}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-500 mb-2">
                        <div className="flex items-center">
                          <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
                          <span>{hospital.rating}</span>
                        </div>
                        {hospital.distance && (
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span>{hospital.distance.toFixed(1)} km away</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{hospital.address}</p>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {hospital.specialties.map((specialty, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className={`text-xs text-white ${getEmergencyColor(specialty)}`}
                        >
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => callHospital(hospital.phone)}
                      className="flex-1 bg-white/80 dark:bg-gray-700/80 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <Bell className="w-3 h-3 mr-1" />
                      Call
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => getDirections(hospital)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      Directions
                    </Button>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-500">{hospital.phone}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && hospitals.length === 0 && (
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No hospitals found</p>
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                getCurrentLocationAndLoadHospitals();
              }} className="bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
                Show All Hospitals
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Emergency Contacts */}
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">Emergency Contacts</h3>
            <p className="text-sm text-red-700 dark:text-red-300">የአስቸኳይ ጊዜ ስልክ ቁጥሮች</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Emergency Services</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Police, Fire, Medical</p>
                </div>
                <Button size="sm" onClick={() => callHospital('911')} className="bg-red-600 hover:bg-red-700 text-white">
                  911
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Ambulance</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">የአምቡላንስ አገልግሎት</p>
                </div>
                <Button size="sm" onClick={() => callHospital('907')} className="bg-red-600 hover:bg-red-700 text-white">
                  907
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HospitalLocator;
