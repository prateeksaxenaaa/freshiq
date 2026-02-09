import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { useAuth } from './AuthProvider';

type Household = Database['public']['Tables']['households']['Row'];

type HouseholdContextType = {
    household: Household | null;
    loading: boolean;
};

const HouseholdContext = createContext<HouseholdContextType>({
    household: null,
    loading: true,
});

export const useHousehold = () => useContext(HouseholdContext);

export const HouseholdProvider = ({ children }: { children: React.ReactNode }) => {
    const { session } = useAuth();
    const [household, setHousehold] = useState<Household | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session?.user) return;

        const fetchHousehold = async () => {
            console.log('Fetching household for user:', session.user.id);
            // 1. Check if user is a member of any household
            const { data: members, error } = await supabase
                .from('household_members')
                .select('household_id, households(*)')
                .eq('user_id', session.user.id)
                .limit(1);

            if (error) {
                console.error('Error fetching household:', error);
                setLoading(false);
                return;
            }

            console.log('Household members found:', members);

            if (members && members.length > 0) {
                const memberData = members[0];
                // Supabase join can return an array or object depending on relationship (1:1 vs 1:N)
                // In our schema, a member belongs to one household in this row, so it should be an object.
                // But let's be safe.
                const householdData = Array.isArray(memberData.households)
                    ? memberData.households[0]
                    : memberData.households;

                console.log('Setting household:', householdData);
                setHousehold(householdData);
            } else {
                console.log('No household found for user.');
                setHousehold(null);
            }
            setLoading(false);
        };

        fetchHousehold();
    }, [session]);

    return (
        <HouseholdContext.Provider value={{ household, loading }}>
            {children}
        </HouseholdContext.Provider>
    );
};
