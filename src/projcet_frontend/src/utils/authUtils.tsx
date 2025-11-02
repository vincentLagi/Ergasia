import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getCookie, validateCookie, logout, fetchUserBySession } from "../controller/userController";

export const authUtils = () => {
    const navigate = useNavigate();
    const cookie = getCookie("cookie");
    const session = localStorage.getItem("session");
    const current_user = localStorage.getItem("current_user");

    useEffect(() => {
        const checkAuth = async () => {
            if (!cookie && !session && !current_user) {
                navigate('/');
                await logout();
                return;
            }

            const user = await fetchUserBySession();
            if (!user || !current_user) {
                navigate('/');
                await logout();
                return;
            }

            // Check if user needs to complete profile
            if (user && !user.isProfileCompleted) {
                const currentPath = window.location.pathname;
                if (currentPath !== '/complete-profile') {
                    navigate('/complete-profile');
                    return;
                }
            }

            if (cookie && !session || !current_user) {
                const isValid = await validateCookie();
                if (!isValid) {
                    navigate('/');
                    await logout();
                    return;
                }
            } else if (cookie && cookie !== session || !current_user) {
                navigate('/');
                await logout();
            }
        };

        checkAuth();
    }, [cookie, session, current_user, navigate]);

    return useMemo(() => ({ cookie, session, current_user }), [cookie, session,  current_user]);
};