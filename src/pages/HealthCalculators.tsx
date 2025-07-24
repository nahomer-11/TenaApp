
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { tenaAPI, HealthCalculatorResult } from '@/api/tena_api';
import { ArrowLeft, Heart, HeartPulse,  Weight, Calendar, Home } from 'lucide-react';

const HealthCalculators = () => {
  const [activeCalculator, setActiveCalculator] = useState<string>('');
  const [bmiData, setBmiData] = useState({ weight: '', height: '' });
  const [pregnancyData, setPregnancyData] = useState({ lastPeriod: '' });
  const [bmiResult, setBmiResult] = useState<HealthCalculatorResult | null>(null);
  const [pregnancyResult, setPregnancyResult] = useState<HealthCalculatorResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const calculators = [
    {
      id: 'bmi',
      title: 'BMI Calculator',
      titleAmharic: 'የቁመት ክብደት መመዘኛ',
      description: 'Calculate your Body Mass Index',
      icon: Weight,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'pregnancy',
      title: 'Pregnancy Due Date',
      titleAmharic: 'የወሊድ ቀን ሰላሳ',
      description: 'Calculate expected delivery date',
      icon: HeartPulse,
      color: 'from-pink-500 to-rose-500',
    },
    {
      id: 'bloodPressure',
      title: 'Blood Pressure Monitor',
      titleAmharic: 'የደም ግፊት መቆጣጠሪያ',
      description: 'Track your blood pressure readings',
      icon: Heart,
      color: 'from-red-500 to-orange-500',
    },
  ];

  const calculateBMI = async () => {
    if (!bmiData.weight || !bmiData.height) {
      toast({
        title: "Missing data",
        description: "Please enter both weight and height.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await tenaAPI.calculateBMI(
        parseFloat(bmiData.weight),
        parseFloat(bmiData.height)
      );
      setBmiResult(result);
    } catch (error) {
      toast({
        title: "Calculation failed",
        description: "Please check your inputs and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePregnancy = async () => {
    if (!pregnancyData.lastPeriod) {
      toast({
        title: "Missing data",
        description: "Please enter the last menstrual period date.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await tenaAPI.calculatePregnancyDueDate(pregnancyData.lastPeriod);
      setPregnancyResult(result);
    } catch (error) {
      toast({
        title: "Calculation failed",
        description: "Please check the date and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getBMIColor = (category: string) => {
    switch (category) {
      case 'Underweight': return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20';
      case 'Normal weight': return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
      case 'Overweight': return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20';
      case 'Obese': return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/home')} className="hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-white" />
          </Button>
          <div className="ml-3 flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Health Calculators</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">የጤና ማስሊያዎች</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate('/home')} className="hover:bg-gray-100 dark:hover:bg-gray-700">
            <Home className="w-5 h-5 text-gray-900 dark:text-white" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Calculator Selection */}
{!activeCalculator && (
  <div className="space-y-4">
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Choose a Calculator</h2>
      <div className="space-y-3">
        {calculators.map((calc) => {
          const IconComponent = calc.icon;
          return (
            <Card 
              key={calc.id}
              className="cursor-pointer hover:shadow-md transition-shadow bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-700"
              onClick={() => setActiveCalculator(calc.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{calc.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{calc.titleAmharic}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{calc.description}</p>
                  </div>
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 dark:text-gray-400">→</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  </div>
)}


        {/* BMI Calculator */}
        {activeCalculator === 'bmi' && (
          <div className="space-y-4">
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="icon" onClick={() => setActiveCalculator('')} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                    <ArrowLeft className="w-4 h-4 text-gray-900 dark:text-white" />
                  </Button>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">BMI Calculator</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">የቁመት ክብደት መመዘኛ</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="weight" className="text-gray-900 dark:text-white">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="Enter your weight in kg"
                    value={bmiData.weight}
                    onChange={(e) => setBmiData({ ...bmiData, weight: e.target.value })}
                    className="bg-white/90 dark:bg-gray-700/90 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="height" className="text-gray-900 dark:text-white">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="Enter your height in cm"
                    value={bmiData.height}
                    onChange={(e) => setBmiData({ ...bmiData, height: e.target.value })}
                    className="bg-white/90 dark:bg-gray-700/90 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <Button 
                  onClick={calculateBMI} 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                >
                  {isLoading ? "Calculating..." : "Calculate BMI"}
                </Button>
              </CardContent>
            </Card>

            {/* BMI Result */}
            {bmiResult && (
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your BMI Result</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {bmiResult.value}
                    </div>
                    <Badge className={`text-sm px-3 py-1 ${getBMIColor(bmiResult.category)}`}>
                      {bmiResult.category}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Recommendations</h4>
                    <div className="space-y-2">
                      {bmiResult.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      Note: BMI is a general indicator and may not account for muscle mass, bone density, and other factors. Consult a healthcare provider for personalized advice.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Pregnancy Calculator */}
        {activeCalculator === 'pregnancy' && (
          <div className="space-y-4">
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="icon" onClick={() => setActiveCalculator('')} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                    <ArrowLeft className="w-4 h-4 text-gray-900 dark:text-white" />
                  </Button>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pregnancy Due Date Calculator</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">የወሊድ ቀን ሰላሳ</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="lastPeriod" className="text-gray-900 dark:text-white">Last Menstrual Period</Label>
                  <Input
                    id="lastPeriod"
                    type="date"
                    value={pregnancyData.lastPeriod}
                    onChange={(e) => setPregnancyData({ lastPeriod: e.target.value })}
                    className="bg-white/90 dark:bg-gray-700/90 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <Button 
                  onClick={calculatePregnancy} 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
                >
                  {isLoading ? "Calculating..." : "Calculate Due Date"}
                </Button>
              </CardContent>
            </Card>

            {/* Pregnancy Result */}
            {pregnancyResult && (
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pregnancy Information</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                      <Calendar className="w-8 h-8 text-pink-600 dark:text-pink-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Due Date</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {pregnancyResult.value}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <Heart className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Weeks Pregnant</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {pregnancyResult.category}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Important Notes</h4>
                    <div className="space-y-1">
                      {pregnancyResult.recommendations.map((note, index) => (
                        <p key={index} className="text-sm text-blue-800 dark:text-blue-300">• {note}</p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Blood Pressure Monitor Placeholder */}
        {activeCalculator === 'bloodPressure' && (
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="icon" onClick={() => setActiveCalculator('')} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                  <ArrowLeft className="w-4 h-4 text-gray-900 dark:text-white" />
                </Button>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Blood Pressure Monitor</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">የደም ግፊት መቆጣጠሪያ</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Coming Soon</h3>
              <p className="text-gray-600 dark:text-gray-400">Blood pressure tracking feature will be available in the next update.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HealthCalculators;
