
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ArrowLeft, Clock, AlertTriangle, CheckCircle, Phone } from 'lucide-react';
import { FirstAid } from '@/api/tena_api';

interface FirstAidDetailProps {
  aid: FirstAid;
  onBack: () => void;
}

const FirstAidDetail = ({ aid, onBack }: FirstAidDetailProps) => {
  const [showAmharic, setShowAmharic] = useState(false);

  // Parse instructions into steps (split by numbered lines)
  const parseInstructions = (instructions: string) => {
    const steps = instructions.split('\r\n\r\n').filter(step => step.trim());
    return steps.map((step, index) => ({
      id: (index + 1).toString(),
      title: `Step ${index + 1}`,
      description: step.replace(/^\d+\s*/, '').trim(), // Remove leading number
    }));
  };

  const steps = parseInstructions(aid.Instructions);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border-b border-blue-100 dark:border-gray-700">
        <div className="flex items-center p-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-blue-100 dark:hover:bg-gray-700">
            <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-white" />
          </Button>
          <div className="ml-3 flex-1">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">First Aid Guide</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">የመጀመሪያ እርዳታ መመሪያ</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Title Card */}
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border-0">
          <CardContent className="p-0">
            <img
              src={aid.ImageURL}
              alt={aid.Title}
              className="w-full h-48 object-cover rounded-t-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r from-red-500 to-orange-500">
                  URGENT
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4 mr-1" />
                  5-10 minutes
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {aid.Title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Emergency First Aid</p>
            </div>
          </CardContent>
        </Card>

        {/* Warnings */}
        {aid.Warning && (
          <Card className="border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h3 className="font-semibold text-red-900 dark:text-red-200">Important Warning</h3>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-red-800 dark:text-red-200">{aid.Warning}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Steps */}
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Step-by-Step Instructions
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {step.title}
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 shadow-lg">
          <CardContent className="p-4">
            <div className="text-center">
              <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">When to Call Emergency Services</h4>
              <p className="text-sm text-red-800 dark:text-red-300 mb-3">
                If the situation is life-threatening or beyond your ability to help, call emergency services immediately.
              </p>
              <Button 
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                onClick={() => window.open('tel:911', '_self')}
              >
                <Phone className="w-4 h-4 mr-2" />
                Call 911
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FirstAidDetail;
