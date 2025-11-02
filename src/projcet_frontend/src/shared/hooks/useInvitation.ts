import { useState, useEffect, useCallback } from 'react';
import {  UserInvitationPayload } from '../types/Invitation';
import { getInvitationByUserId } from '../../controller/invitationController';

export const useInvitation = (userId: string) => {
    const [invitations, setInvitations] = useState<UserInvitationPayload[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);


    const fetchInvitations = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            const res = await getInvitationByUserId(userId);
            setInvitations(res);
        } catch (err) {
            setError('Failed to fetch invitations');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchInvitations();
    }, [fetchInvitations]);

    return { invitations, loading, error, refetch: fetchInvitations, processingInvitation, setProcessingInvitation };
};