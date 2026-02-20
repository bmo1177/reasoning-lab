 import React, { createContext, useContext, ReactNode } from 'react';
 import { useAuth, AppRole } from '@/hooks/useAuth';
 import { User, Session } from '@supabase/supabase-js';
 
 interface Profile {
   id: string;
   user_id: string;
   display_name: string;
   email: string;
   avatar_url: string | null;
   bio: string | null;
   specialty: string | null;
   created_at: string;
   updated_at: string;
 }
 
 interface AuthContextType {
   user: User | null;
   session: Session | null;
   profile: Profile | null;
   role: AppRole | null;
   isLoading: boolean;
   isAuthenticated: boolean;
   isAdmin: boolean;
   isExpert: boolean;
   signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null; data?: unknown }>;
   signIn: (email: string, password: string) => Promise<{ error: Error | null; data?: unknown }>;
   signOut: () => Promise<void>;
   updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null; data?: unknown }>;
   hasRole: (role: AppRole) => boolean;
 }
 
 const AuthContext = createContext<AuthContextType | undefined>(undefined);
 
 export function AuthProvider({ children }: { children: ReactNode }) {
   const auth = useAuth();
   
   return (
     <AuthContext.Provider value={auth}>
       {children}
     </AuthContext.Provider>
   );
 }
 
 export function useAuthContext() {
   const context = useContext(AuthContext);
   if (context === undefined) {
     throw new Error('useAuthContext must be used within an AuthProvider');
   }
   return context;
 }