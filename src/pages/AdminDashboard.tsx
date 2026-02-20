 import { useState, useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { Loader2, Users, Shield, Clock, CheckCircle, XCircle, GraduationCap } from 'lucide-react';
 import { Header } from '@/components/layout/Header';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Avatar, AvatarFallback } from '@/components/ui/avatar';
 import { useAuthContext } from '@/contexts/AuthContext';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
 
 interface ExpertApplication {
   id: string;
   user_id: string;
   qualifications: string;
   experience_years: number;
   specialty: string;
   reason: string;
   status: 'pending' | 'approved' | 'rejected';
   created_at: string;
   profile?: {
     display_name: string;
     email: string;
   };
 }
 
 interface UserWithRole {
   id: string;
   user_id: string;
   display_name: string;
   email: string;
   role: 'learner' | 'expert' | 'admin';
   created_at: string;
 }
 
 export default function AdminDashboard() {
   const navigate = useNavigate();
   const { isAdmin, isLoading: authLoading, user } = useAuthContext();
   const { toast } = useToast();
 
   const [applications, setApplications] = useState<ExpertApplication[]>([]);
   const [users, setUsers] = useState<UserWithRole[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [processingId, setProcessingId] = useState<string | null>(null);
 
   useEffect(() => {
     if (!authLoading) {
       if (!isAdmin) {
         navigate('/');
         return;
       }
       loadData();
     }
   }, [authLoading, isAdmin]);
 
   const loadData = async () => {
     setIsLoading(true);
 
     // Load pending applications
     const { data: appsData } = await supabase
       .from('expert_applications')
       .select('*')
       .order('created_at', { ascending: false });
 
     if (appsData) {
       // Enrich with profiles
       const userIds = appsData.map(a => a.user_id);
       const { data: profiles } = await supabase
         .from('profiles')
         .select('user_id, display_name, email')
         .in('user_id', userIds);
 
       const enrichedApps = appsData.map(app => ({
         ...app,
         status: app.status as 'pending' | 'approved' | 'rejected',
         profile: profiles?.find(p => p.user_id === app.user_id),
       }));
       setApplications(enrichedApps);
     }
 
     // Load users with roles
     const { data: rolesData } = await supabase
       .from('user_roles')
       .select('*')
       .order('created_at', { ascending: false });
 
     if (rolesData) {
       const userIds = rolesData.map(r => r.user_id);
       const { data: profiles } = await supabase
         .from('profiles')
         .select('user_id, display_name, email')
         .in('user_id', userIds);
 
       const usersWithRoles = rolesData.map(role => {
         const profile = profiles?.find(p => p.user_id === role.user_id);
         return {
           id: role.id,
           user_id: role.user_id,
           display_name: profile?.display_name || 'Unknown',
           email: profile?.email || '',
           role: role.role as 'learner' | 'expert' | 'admin',
           created_at: role.created_at,
         };
       });
       setUsers(usersWithRoles);
     }
 
     setIsLoading(false);
   };
 
   const handleApplicationAction = async (appId: string, userId: string, action: 'approved' | 'rejected') => {
     setProcessingId(appId);
 
     // Update application status
     const { error: updateError } = await supabase
       .from('expert_applications')
       .update({
         status: action,
         reviewed_by: user?.id,
         reviewed_at: new Date().toISOString(),
       })
       .eq('id', appId);
 
     if (updateError) {
       toast({ title: 'Error', description: updateError.message, variant: 'destructive' });
       setProcessingId(null);
       return;
     }
 
     // If approved, add expert role
     if (action === 'approved') {
       const { error: roleError } = await supabase
         .from('user_roles')
         .insert({ user_id: userId, role: 'expert' });
 
       if (roleError && !roleError.message.includes('duplicate')) {
         toast({ title: 'Error adding role', description: roleError.message, variant: 'destructive' });
       }
     }
 
     toast({ title: action === 'approved' ? 'Application approved' : 'Application rejected' });
     loadData();
     setProcessingId(null);
   };
 
   if (authLoading || isLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   const pendingApps = applications.filter(a => a.status === 'pending');
   const processedApps = applications.filter(a => a.status !== 'pending');
 
   return (
     <div className="min-h-screen bg-background">
       <Header />
 
       <main className="container py-8">
         <div className="flex items-center gap-3 mb-8">
           <Shield className="h-8 w-8 text-primary" />
           <div>
             <h1 className="text-3xl font-bold">Admin Dashboard</h1>
             <p className="text-muted-foreground">Manage users and expert applications</p>
           </div>
         </div>
 
         {/* Stats */}
         <div className="grid sm:grid-cols-3 gap-4 mb-8">
           <Card>
             <CardContent className="pt-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-muted-foreground">Total Users</p>
                   <p className="text-2xl font-bold">{users.length}</p>
                 </div>
                 <Users className="h-8 w-8 text-muted-foreground" />
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="pt-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-muted-foreground">Experts</p>
                   <p className="text-2xl font-bold">{users.filter(u => u.role === 'expert').length}</p>
                 </div>
                 <GraduationCap className="h-8 w-8 text-muted-foreground" />
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="pt-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-muted-foreground">Pending Applications</p>
                   <p className="text-2xl font-bold">{pendingApps.length}</p>
                 </div>
                 <Clock className="h-8 w-8 text-muted-foreground" />
               </div>
             </CardContent>
           </Card>
         </div>
 
         <Tabs defaultValue="applications" className="space-y-6">
           <TabsList>
             <TabsTrigger value="applications">
               Expert Applications
               {pendingApps.length > 0 && (
                 <Badge variant="destructive" className="ml-2">{pendingApps.length}</Badge>
               )}
             </TabsTrigger>
             <TabsTrigger value="users">All Users</TabsTrigger>
           </TabsList>
 
           <TabsContent value="applications" className="space-y-6">
             {/* Pending Applications */}
             {pendingApps.length > 0 && (
               <div>
                 <h3 className="text-lg font-semibold mb-4">Pending Review</h3>
                 <div className="space-y-4">
                   {pendingApps.map(app => (
                     <Card key={app.id}>
                       <CardContent className="pt-6">
                         <div className="flex items-start justify-between">
                           <div className="flex gap-4">
                             <Avatar>
                               <AvatarFallback>
                                 {app.profile?.display_name?.[0] || 'U'}
                               </AvatarFallback>
                             </Avatar>
                             <div className="space-y-2">
                               <div>
                                 <p className="font-medium">{app.profile?.display_name}</p>
                                 <p className="text-sm text-muted-foreground">{app.profile?.email}</p>
                               </div>
                               <div className="flex gap-2">
                                 <Badge variant="outline">{app.specialty}</Badge>
                                 <Badge variant="secondary">{app.experience_years} years exp.</Badge>
                               </div>
                               <div className="text-sm">
                                 <p className="font-medium">Qualifications:</p>
                                 <p className="text-muted-foreground">{app.qualifications}</p>
                               </div>
                               <div className="text-sm">
                                 <p className="font-medium">Reason for applying:</p>
                                 <p className="text-muted-foreground">{app.reason}</p>
                               </div>
                               <p className="text-xs text-muted-foreground">
                                 Applied {new Date(app.created_at).toLocaleDateString()}
                               </p>
                             </div>
                           </div>
                           <div className="flex gap-2">
                             <Button
                               size="sm"
                               onClick={() => handleApplicationAction(app.id, app.user_id, 'approved')}
                               disabled={processingId === app.id}
                             >
                               {processingId === app.id ? (
                                 <Loader2 className="h-4 w-4 animate-spin" />
                               ) : (
                                 <>
                                   <CheckCircle className="h-4 w-4 mr-1" />
                                   Approve
                                 </>
                               )}
                             </Button>
                             <Button
                               size="sm"
                               variant="destructive"
                               onClick={() => handleApplicationAction(app.id, app.user_id, 'rejected')}
                               disabled={processingId === app.id}
                             >
                               <XCircle className="h-4 w-4 mr-1" />
                               Reject
                             </Button>
                           </div>
                         </div>
                       </CardContent>
                     </Card>
                   ))}
                 </div>
               </div>
             )}
 
             {/* Processed Applications */}
             {processedApps.length > 0 && (
               <div>
                 <h3 className="text-lg font-semibold mb-4">Processed</h3>
                 <div className="space-y-2">
                   {processedApps.map(app => (
                     <Card key={app.id} className="bg-muted/30">
                       <CardContent className="py-4">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                             <Avatar className="h-8 w-8">
                               <AvatarFallback className="text-xs">
                                 {app.profile?.display_name?.[0] || 'U'}
                               </AvatarFallback>
                             </Avatar>
                             <div>
                               <p className="font-medium text-sm">{app.profile?.display_name}</p>
                               <p className="text-xs text-muted-foreground">{app.specialty}</p>
                             </div>
                           </div>
                           <Badge variant={app.status === 'approved' ? 'default' : 'destructive'}>
                             {app.status === 'approved' ? (
                               <CheckCircle className="h-3 w-3 mr-1" />
                             ) : (
                               <XCircle className="h-3 w-3 mr-1" />
                             )}
                             {app.status}
                           </Badge>
                         </div>
                       </CardContent>
                     </Card>
                   ))}
                 </div>
               </div>
             )}
 
             {applications.length === 0 && (
               <Card>
                 <CardContent className="py-12 text-center text-muted-foreground">
                   No expert applications yet
                 </CardContent>
               </Card>
             )}
           </TabsContent>
 
           <TabsContent value="users">
             <Card>
               <CardHeader>
                 <CardTitle>All Users</CardTitle>
                 <CardDescription>View and manage user roles</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="space-y-2">
                   {users.map(u => (
                     <div
                       key={u.id}
                       className="flex items-center justify-between p-3 rounded-lg border"
                     >
                       <div className="flex items-center gap-3">
                         <Avatar className="h-8 w-8">
                           <AvatarFallback className="text-xs">
                             {u.display_name[0]}
                           </AvatarFallback>
                         </Avatar>
                         <div>
                           <p className="font-medium text-sm">{u.display_name}</p>
                           <p className="text-xs text-muted-foreground">{u.email}</p>
                         </div>
                       </div>
                       <Badge
                         variant={
                           u.role === 'admin' ? 'default' :
                           u.role === 'expert' ? 'secondary' : 'outline'
                         }
                       >
                         {u.role}
                       </Badge>
                     </div>
                   ))}
                 </div>
               </CardContent>
             </Card>
           </TabsContent>
         </Tabs>
       </main>
     </div>
   );
 }