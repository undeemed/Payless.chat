import { Suspense } from 'react';
import CpxSurveyContent from './content';

export const metadata = {
  title: 'Survey Complete | Payless.ai',
  description: 'Complete surveys to earn AI credits',
};

export default function CpxSurveyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    </div>}>
      <CpxSurveyContent />
    </Suspense>
  );
}
