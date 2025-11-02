import { atom } from 'jotai';
import { User, ProfilePictureCache, UserProfile } from '../../shared/types/User';


// Users data atoms
export const usersAtom = atom<User[]>([]);
export const freelancersAtom = atom<User[]>([]);
export const selectedUserAtom = atom<User | null>(null);

// User search and filters
export const userSearchQueryAtom = atom('');
export const userFiltersAtom = atom({
  skills: [] as string[],
  experienceLevel: [] as string[],
  availability: [] as string[],
  rating: 0,
  priceRange: [] as string[],
  location: [] as string[],
});

// Derived atoms for filtered users
export const filteredFreelancersAtom = atom((get) => {
  const freelancers = get(freelancersAtom);
  const searchQuery = get(userSearchQueryAtom);
  const filters = get(userFiltersAtom);

  let filtered = freelancers;

  // Apply search filter
  // if (searchQuery) {
  //   filtered = filtered.filter(user =>
  //     user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     (user.description && user.description.toLowerCase().includes(searchQuery.toLowerCase()))
  //   );
  // }

  // Apply skills filter
  // if (filters.skills.length > 0) {
  //   filtered = filtered.filter((user: UserProfile) =>
  //     user.preference.some((pref: any) =>
  //       filters.skills.includes(pref.jobCategoryName)
  //     )
  //   );
  // }

  // Apply rating filter
  // if (filters.rating > 0) {
  //   filtered = filtered.filter(user =>
  //     (user.rating || 0) >= filters.rating
  //   );
  // }

  return filtered;
});

// User statistics atoms
// export const userStatsAtom = atom((get) => {
//   const users = get(usersAtom);
//   const freelancers = get(freelancersAtom);
  
//   return {
//     totalUsers: users.length,
//     totalFreelancers: freelancers.length,
//     activeFreelancers: freelancers.filter(f => f.rating && f.rating > 0).length,
//     topRatedFreelancers: freelancers.filter(f => (f.rating || 0) >= 4.5).length,
//   };
// });

// User actions atom
export const userActionsAtom = atom(
  null,
  (get, set, action: 
    | { type: 'SET_USERS'; users: User[] }
    | { type: 'SET_FREELANCERS'; freelancers: User[] }
    | { type: 'ADD_USER'; user: User }
    | { type: 'UPDATE_USER'; userId: string; updates: Partial<User> }
    | { type: 'DELETE_USER'; userId: string }
    | { type: 'SET_SELECTED_USER'; user: User | null }
    | { type: 'UPDATE_FILTERS'; filters: Partial<typeof userFiltersAtom> }
  ) => {
    switch (action.type) {
      case 'SET_USERS':
        set(usersAtom, action.users);
        break;
      case 'SET_FREELANCERS':
        set(freelancersAtom, action.freelancers);
        break;
      case 'ADD_USER':
        set(usersAtom, (prev) => [...prev, action.user]);
        break;
      case 'UPDATE_USER':
        set(usersAtom, (prev) =>
          prev.map(user =>
            user.id === action.userId ? { ...user, ...action.updates } : user
          )
        );
        break;
      case 'DELETE_USER':
        set(usersAtom, (prev) => prev.filter(user => user.id !== action.userId));
        break;
      case 'SET_SELECTED_USER':
        set(selectedUserAtom, action.user);
        break;
      case 'UPDATE_FILTERS':
        set(userFiltersAtom, (prev) => ({ ...prev, ...action.filters }));
        break;
    }
  }
);

// User interactions atoms
export const userInteractionsAtom = atom({
  invitations: [] as any[],
  messages: [] as any[],
  reviews: [] as any[],
});

// Favorite freelancers atom
export const favoriteFreelancersAtom = atom<string[]>([]);
export const isFavoriteFreelancerAtom = atom(
  (get) => (userId: string) => get(favoriteFreelancersAtom).includes(userId),
  (get, set, { userId, favorite }: { userId: string; favorite: boolean }) => {
    const favorites = get(favoriteFreelancersAtom);
    if (favorite && !favorites.includes(userId)) {
      set(favoriteFreelancersAtom, [...favorites, userId]);
    } else if (!favorite && favorites.includes(userId)) {
      set(favoriteFreelancersAtom, favorites.filter(id => id !== userId));
    }
  }
);

// User activity tracking
export const userActivityAtom = atom({
  lastLogin: null as Date | null,
  sessionsToday: 0,
  totalSessions: 0,
  averageSessionDuration: 0,
});

// User preferences atom (renamed to avoid conflict with auth store)
export const userDisplayPreferencesAtom = atom({
  notifications: {
    email: true,
    push: true,
    jobAlerts: true,
    messageAlerts: true,
  },
  privacy: {
    profileVisibility: 'public' as 'public' | 'private' | 'contacts',
    showEmail: false,
    showPhone: false,
  },
  display: {
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
  },
});