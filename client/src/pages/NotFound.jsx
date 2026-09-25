import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ruler, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-brand-950/80 border border-brand-500/30 text-brand-400 flex items-center justify-center mb-4">
        <Ruler className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-white mb-2">404</h1>
      <h2 className="text-lg font-bold text-slate-300 mb-2">Page Not Found</h2>
      <p className="text-xs text-slate-500 max-w-sm mb-6">
        The page you are trying to access does not exist or has been moved.
      </p>
      <Button variant="primary" icon={ArrowLeft} onClick={() => navigate('/dashboard')}>
        Return to Dashboard
      </Button>
    </div>
  );
};
