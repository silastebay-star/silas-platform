import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/Button';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-[#4C764C] mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">
            Page Not Found
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button
              size="lg"
              leftIcon={<Home className="w-5 h-5" />}
            >
              Go Home
            </Button>
          </Link>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
            leftIcon={<ArrowLeft className="w-5 h-5" />}
          >
            Go Back
          </Button>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>Lost? Try exploring our community map or return to the homepage.</p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
