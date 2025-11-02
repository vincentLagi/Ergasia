import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../../hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, needsProfileCompletion, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect if still loading
    if (isLoading) return;

    // If not authenticated, redirect to home page (where login modal can be triggered)
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to home');
      navigate('/', { 
        replace: true,
        state: { from: location.pathname } // Save where they wanted to go
      });
      return;
    }

    // If authenticated but needs profile completion, redirect to complete profile
    if (isAuthenticated && needsProfileCompletion && user && !user.isProfileCompleted) {
      // Don't redirect if already on profile completion page
      if (location.pathname !== '/complete-profile') {
        console.log('User needs profile completion, redirecting');
        navigate('/complete-profile', { replace: true });
      }
      return;
    }

  }, [isAuthenticated, isLoading, needsProfileCompletion, user, navigate, location.pathname]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Authenticating..." />
      </div>
    );
  }

  // If not authenticated, show loading (redirect will happen in useEffect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Redirecting..." />
      </div>
    );
  }

  // If authenticated but needs profile completion, show loading (redirect will happen in useEffect)
  if (needsProfileCompletion && user && !user.isProfileCompleted && location.pathname !== '/complete-profile') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Setting up your profile..." />
      </div>
    );
  }

  // All checks passed, render the protected content
  return <>{children}</>;
};

export default AuthGuard;

