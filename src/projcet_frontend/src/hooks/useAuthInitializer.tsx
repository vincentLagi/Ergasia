import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { authStatusAtom, userAtom } from '../app/store/auth';
import { fetchUserBySession } from '../controller/userController';
import { storage } from '../utils/storage';

export const useAuthInitializer = () => {
    const [, setAuthStatus] = useAtom(authStatusAtom);
    const [, setUser] = useAtom(userAtom);

    useEffect(() => {
        const initializeAuth = async () => {
            console.log('AuthInitializer - Starting auth initialization');
            
            // 1. Coba muat dari localStorage terlebih dahulu untuk pemuatan UI yang cepat
            // Logika inisialisasi yang disederhanakan: Cukup verifikasi sesi.
            // `storage.getUser` akan dipanggil di dalam `fetchUserBySession` jika diperlukan.
            try {
                const user = await fetchUserBySession();
                if (user) {
                    setUser(user);
                    setAuthStatus('authenticated');
                } else {
                    setUser(null);
                    setAuthStatus('unauthenticated');
                    storage.clear();
                }
            } catch (error) {
                console.error('AuthInitializer - Error initializing auth:', error);
                setUser(null);
                setAuthStatus('unauthenticated');
                storage.clear();
            }
        };

        initializeAuth();
    }, [setAuthStatus, setUser]);
};

// Component version
const AuthInitializer: React.FC = () => {
    useAuthInitializer();
    return null; // This component doesn't render anything
};

export default AuthInitializer;
