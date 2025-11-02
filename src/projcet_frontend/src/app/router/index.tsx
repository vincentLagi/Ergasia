import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Spin } from 'antd';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '../../shared/components/ErrorFallback';
import AuthGuard from '../../shared/components/AuthGuard';
import BalanceTransactionPage from '../../pages/BalanceTransactionPage';

const LandingPage = lazy(() => import('../../pages/LandingPage'));
const FindJobPage = lazy(() => import('../../pages/FindJobPage'));
const PostJobPage = lazy(() => import('../../pages/PostJobPage'));
const JobDetailPage = lazy(() => import('../../pages/JobDetailPage'));
const ProfilePage = lazy(() => import('../../pages/ProfilePage'));
const PublicProfilePage = lazy(() => import('../../pages/PublicProfilePage'));
const ManageJobPage = lazy(() => import('../../pages/ManageJobPage'));
const BrowseFreelancerPage = lazy(() => import('../../pages/BrowseFreelancerPage'));
const CompleteProfilePage = lazy(() => import('../../pages/CompleteProfilePage'));
const AccountPage = lazy(() => import('../../pages/AccountPage'));
const AdminPage = lazy(() => import('../../pages/AdminPage'));
const ChatPage = lazy(() => import('../../pages/ChatPage'));
const ChatWithAIPage = lazy(() => import('../../pages/ChatWithAIPage'));

const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Spin size="large" tip="Loading..." />
  </div>
);

const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthGuard>
    <RouteWrapper>
      {children}
    </RouteWrapper>
  </AuthGuard>
);

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={
          <RouteWrapper>
            <LandingPage />
          </RouteWrapper>
        } 
      />
      
      {/* Profile Completion Route - No guard needed */}
      <Route 
        path="/complete-profile" 
        element={
          <RouteWrapper>
            <CompleteProfilePage />
          </RouteWrapper>
        } 
      />

      {/* Protected Routes - Require authentication and profile completion */}
      <Route 
        path="/find" 
        element={
          <ProtectedRoute>
            <FindJobPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/post" 
        element={
          <ProtectedRoute>
            <PostJobPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/jobs/:jobId" 
        element={
          <ProtectedRoute>
            <JobDetailPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile/:id" 
        element={
          <ProtectedRoute>
            <PublicProfilePage />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/balance-transaction"
        element={
          <ProtectedRoute>
            <BalanceTransactionPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/manage" 
        element={
          <ProtectedRoute>
            <ManageJobPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/browse" 
        element={
          <ProtectedRoute>
            <BrowseFreelancerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        }
      />
       <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat-ai"
        element={
          <ProtectedRoute>
            <ChatWithAIPage />
          </ProtectedRoute>
        }
      />
      
      {/* Admin Route */}
      <Route
        path="/admin"
        element={
          <RouteWrapper>
            <AdminPage />
          </RouteWrapper>
        }
      />
      
    

      {/* 404 Route */}
      <Route
        path="*"
        element={
          <RouteWrapper>
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">404</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">Page not found</p>
                <a 
                  href="/" 
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Go back home
                </a>
              </div>
            </div>
          </RouteWrapper>
        } 
      />
    </Routes>
  );
};