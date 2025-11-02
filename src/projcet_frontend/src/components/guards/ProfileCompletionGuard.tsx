import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { authStatusAtom, userAtom } from '../../store/authAtoms';
import { getUserById } from '../../controller/userController';
import { User } from '../../shared/types/User';

interface ProfileCompletionGuardProps {
    children: React.ReactNode;
}

const ProfileCompletionGuard: React.FC<ProfileCompletionGuardProps> = ({ children }) => {
    const [authStatus] = useAtom(authStatusAtom);
    const [user] = useAtom(userAtom);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        console.log('ProfileCompletionGuard - authStatus:', authStatus);
        console.log('ProfileCompletionGuard - user:', user);
        
        const checkProfileCompletion = async () => {
            if (authStatus === 'loading') {
                console.log('ProfileCompletionGuard - Still loading auth status');
                return; // Still loading, wait
            }

            if (authStatus === 'unauthenticated' || !user) {
                console.log('ProfileCompletionGuard - User not authenticated');
                setIsLoading(false);
                return;
            }

            try {
                console.log('ProfileCompletionGuard - Fetching user data for ID:', user.id);
                // Get fresh user data to check if profile is complete
                const userData = await getUserById(user.id);
                console.log('ProfileCompletionGuard - User data received:', userData);
                if (userData && "ok" in userData) {
                    setCurrentUser(userData.ok);
                    console.log('ProfileCompletionGuard - Profile completed?', userData.ok.isProfileCompleted);
                }
            } catch (error) {
                console.error('ProfileCompletionGuard - Error fetching user data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkProfileCompletion();
    }, [authStatus, user]);

    // Show loading while checking
    if (authStatus === 'loading' || isLoading) {
        console.log('ProfileCompletionGuard - Showing loading screen');
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    // If not authenticated, redirect to login
    if (authStatus === 'unauthenticated') {
        console.log('ProfileCompletionGuard - Redirecting to login');
        return <Navigate to="/login" replace />;
    }

    // If authenticated but profile not complete, redirect to complete profile
    if (currentUser && !currentUser.isProfileCompleted) {
        console.log('ProfileCompletionGuard - Profile not completed, redirecting to complete-profile');
        return <Navigate to="/complete-profile" replace />;
    }

    // If profile is complete, render the protected content
    console.log('ProfileCompletionGuard - Profile completed, rendering children');
    return <>{children}</>;
};

export default ProfileCompletionGuard;
