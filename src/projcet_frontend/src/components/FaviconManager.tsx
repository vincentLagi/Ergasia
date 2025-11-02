import React, { useEffect } from 'react';
import { useTheme } from '../app/providers/ThemeProvider';
import ergnLogoLight from '../assets/ergn_logo_light.png';
import ergnLogoDark from '../assets/ergn_logo_dark.png';

const FaviconManager: React.FC = () => {
    const { theme } = useTheme();

    useEffect(() => {
        const link: HTMLLinkElement =
            document.querySelector("link[rel*='icon']") ||
            document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = theme === 'dark' ? ergnLogoDark : ergnLogoLight;
        document.getElementsByTagName('head')[0].appendChild(link);
    }, [theme]);

    return null;
};

export default FaviconManager;