 import { useState, useEffect, useCallback } from 'react';
 import { User, Session } from '@supabase/supabase-js';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
 
 export type AppRole = 'learner' | 'expert' | 'admin';
 
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
 
 interface AuthState {
   user: User | null;
   session: Session | null;
   profile: Profile | null;
   role: AppRole | null;
   isLoading: boolean;
 }
 
 export function useAuth() {
   const [state, setState] = useState<AuthState>({
     user: null,
     session: null,
     profile: null,
     role: null,
     isLoading: true,
   });
   const { toast } = useToast();
 
   const fetchUserData = useCallback(async (userId: string) => {
     try {
       // Fetch profile
       const { data: profile } = await supabase
         .from('profiles')
         .select('*')
         .eq('user_id', userId)
         .single();
 
       // Fetch role
       const { data: roles } = await supabase
         .from('user_roles')
         .select('role')
         .eq('user_id', userId);
 
       // Get highest priority role
       let role: AppRole = 'learner';
       if (roles && roles.length > 0) {
         const roleOrder: AppRole[] = ['admin', 'expert', 'learner'];
         for (const r of roleOrder) {
           if (roles.some(ur => ur.role === r)) {
             role = r;
             break;
           }
         }
       }
 
       setState(prev => ({
         ...prev,
         profile: profile as Profile | null,
         role,
         isLoading: false,
       }));
     } catch (error) {
       console.error('Error fetching user data:', error);
       setState(prev => ({ ...prev, isLoading: false }));
     }
   }, []);
 
   useEffect(() => {
     // Set up auth state listener FIRST
     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       (event, session) => {
         setState(prev => ({
           ...prev,
           session,
           user: session?.user ?? null,
         }));
 
         // Defer fetching user data
         if (session?.user) {
           setTimeout(() => {
             fetchUserData(session.user.id);
           }, 0);
         } else {
           setState(prev => ({
             ...prev,
             profile: null,
             role: null,
             isLoading: false,
           }));
         }
       }
     );
 
     // THEN check for existing session
     supabase.auth.getSession().then(({ data: { session } }) => {
       setState(prev => ({
         ...prev,
         session,
         user: session?.user ?? null,
       }));
 
       if (session?.user) {
         fetchUserData(session.user.id);
       } else {
         setState(prev => ({ ...prev, isLoading: false }));
       }
     });
 
     return () => subscription.unsubscribe();
   }, [fetchUserData]);
 
   const signUp = async (email: string, password: string, displayName: string) => {
     const redirectUrl = `${window.location.origin}/`;
     
     const { data, error } = await supabase.auth.signUp({
       email,
       password,
       options: {
         emailRedirectTo: redirectUrl,
         data: { display_name: displayName },
       },
     });
 
     if (error) {
       toast({
         title: 'Sign up failed',
         description: error.message,
         variant: 'destructive',
       });
       return { error };
     }
 
     toast({
       title: 'Check your email',
       description: 'We sent you a confirmation link to verify your account.',
     });
     
     return { data, error: null };
   };
 
   const signIn = async (email: string, password: string) => {
     const { data, error } = await supabase.auth.signInWithPassword({
       email,
       password,
     });
 
     if (error) {
       toast({
         title: 'Sign in failed',
         description: error.message,
         variant: 'destructive',
       });
       return { error };
     }
 
     return { data, error: null };
   };
 
   const signOut = async () => {
     const { error } = await supabase.auth.signOut();
     if (error) {
       toast({
         title: 'Sign out failed',
         description: error.message,
         variant: 'destructive',
       });
     }
   };
 
   const updateProfile = async (updates: Partial<Profile>) => {
     if (!state.user) return { error: new Error('Not authenticated') };
 
     const { data, error } = await supabase
       .from('profiles')
       .update(updates)
       .eq('user_id', state.user.id)
       .select()
       .single();
 
     if (error) {
       toast({
         title: 'Update failed',
         description: error.message,
         variant: 'destructive',
       });
       return { error };
     }
 
     setState(prev => ({ ...prev, profile: data as Profile }));
     toast({ title: 'Profile updated' });
     return { data, error: null };
   };
 
   const hasRole = (role: AppRole): boolean => {
     if (!state.role) return false;
     const roleHierarchy: AppRole[] = ['admin', 'expert', 'learner'];
     const userRoleIndex = roleHierarchy.indexOf(state.role);
     const requiredRoleIndex = roleHierarchy.indexOf(role);
     return userRoleIndex <= requiredRoleIndex;
   };
 
   const isAdmin = state.role === 'admin';
   const isExpert = state.role === 'expert' || state.role === 'admin';
 
   return {
     ...state,
     signUp,
     signIn,
     signOut,
     updateProfile,
     hasRole,
     isAdmin,
     isExpert,
     isAuthenticated: !!state.user,
   };
 }