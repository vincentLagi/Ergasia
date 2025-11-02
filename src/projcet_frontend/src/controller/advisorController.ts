import { storage } from '../utils/storage';

const ADVISOR_API_URL = process.env.REACT_APP_ADVISOR_API_URL || "https://advisor.130.211.124.157.sslip.io/api/chat";

export const askAdvisor = async (prompt: string): Promise<string> => {
    try {
        // Get current user from storage
        const currentUser = storage.getUser();
        const userId = currentUser?.id || null;

        const payload = {
            message: prompt,
            userId: userId  // Include user ID in the request
        };

        // DEBUG: Log environment and URL details
        console.log('🔍 [ADVISOR DEBUG] Environment check:');
        console.log('🔍 [ADVISOR DEBUG] - Current location protocol:', window.location.protocol);
        console.log('🔍 [ADVISOR DEBUG] - Advisor API URL:', ADVISOR_API_URL);
        console.log('🔍 [ADVISOR DEBUG] - Is HTTPS page with HTTP API?', window.location.protocol === 'https:' && ADVISOR_API_URL.startsWith('http://'));
        console.log('🔍 [ADVISOR DEBUG] Sending message to advisor via REST:', JSON.stringify(payload, null, 2));
        
        // Choose URL based on environment
        const isDev = !!(import.meta as any).env?.DEV;
        const isLocalDfx = (import.meta as any).env?.DFX_NETWORK === 'local';
        const isHttpPage = typeof window !== 'undefined' && window.location.protocol === 'http:';
        const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
        let apiUrl = ADVISOR_API_URL;
        if (isDev) {
            apiUrl = "/advisor-api/api/chat"; // Vite proxy for local development
        } else if (isLocalDfx && isHttpPage) {
            // When serving built assets via local dfx over HTTP, allow HTTP to avoid SSL errors locally
            apiUrl = ADVISOR_API_URL.replace('https://', 'http://');
        } // On HTTPS pages (production), keep HTTPS
        console.log('🔍 [ADVISOR DEBUG] - Final API URL used:', apiUrl);
        let response: Response | null = null;

        const doFetch = async (url: string) => fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
            // Add timeout and credentials handling
            signal: AbortSignal.timeout(30000), // 30 second timeout
            mode: 'cors' // Explicitly set CORS mode
        });

        try {
            response = await doFetch(apiUrl);
        } catch (err: any) {
            // If HTTPS fails, and we're on an HTTP page, try HTTP fallback once
            const isTypeError = err && err.name === 'TypeError';
            const canTryHttp = apiUrl.startsWith('https://') && isHttpPage;
            if (isTypeError && canTryHttp) {
                const httpUrl = apiUrl.replace('https://', 'http://');
                console.warn('🔁 [ADVISOR DEBUG] HTTPS failed, retrying via HTTP:', httpUrl);
                response = await doFetch(httpUrl);
                apiUrl = httpUrl;
            } else {
                throw err;
            }
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

    const responseData = await response.json();
        console.log('Received response from advisor:', responseData);
        
        // Handle the REST API response (ChatResponse model)
        if (responseData && responseData.response && responseData.status === "success") {
            return responseData.response;
        }
        
        if (responseData && responseData.status === "error") {
            return `Error from advisor: ${responseData.response}`;
        }

        return "Maaf, format response dari AI Advisor tidak dikenali.";
        
    } catch (error: any) {
        console.error("Error communicating with advisor agent:", error);
        
        // More specific error messages
        if (String(error?.message || '').includes('Failed to fetch')) {
            return "Tidak dapat terhubung ke AI Advisor. Pastikan koneksi internet stabil dan server tersedia di "+ ADVISOR_API_URL;
        } else if (error.message.includes('400')) {
            return "Format permintaan tidak valid. Mohon coba lagi.";
        } else if (error.message.includes('500')) {
            return "Terjadi kesalahan pada server AI Advisor.";
        }
        
        return `Kesalahan: ${error.message}`;
    }
};