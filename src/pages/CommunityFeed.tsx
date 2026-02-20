 import { useState, useEffect } from 'react';
 import { Link, useNavigate } from 'react-router-dom';
import { Loader2, MessageSquare, Star, Send, User, Clock, Eye } from 'lucide-react';
import { CanvasViewer } from '@/components/community/CanvasViewer';
 import { Header } from '@/components/layout/Header';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Avatar, AvatarFallback } from '@/components/ui/avatar';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { useAuthContext } from '@/contexts/AuthContext';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
 
 interface CaseSolution {
   id: string;
   user_id: string;
   case_id: string;
   case_title: string;
   canvas_state: Record<string, unknown>;
   final_diagnosis: string | null;
   confidence_rating: number | null;
   reflection: string | null;
   created_at: string;
   profile?: {
     display_name: string;
     specialty: string | null;
   };
   reviews_count?: number;
   avg_rating?: number;
 }
 
 interface Review {
   id: string;
   rating: number;
   comment: string;
   created_at: string;
   reviewer?: {
     display_name: string;
   };
 }
 
 export default function CommunityFeed() {
   const navigate = useNavigate();
   const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
   const { toast } = useToast();
 
   const [solutions, setSolutions] = useState<CaseSolution[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [selectedSolution, setSelectedSolution] = useState<CaseSolution | null>(null);
   const [reviews, setReviews] = useState<Review[]>([]);
   const [newComment, setNewComment] = useState('');
   const [newRating, setNewRating] = useState<number>(5);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [filter, setFilter] = useState<'recent' | 'top'>('recent');
 
   useEffect(() => {
     if (!authLoading && !isAuthenticated) {
       navigate('/auth');
       return;
     }
     loadSolutions();
   }, [authLoading, isAuthenticated, filter]);
 
   const loadSolutions = async () => {
     setIsLoading(true);
     
     const { data: solutionsData, error } = await supabase
       .from('case_solutions')
       .select('*')
       .eq('is_public', true)
       .order('created_at', { ascending: false })
       .limit(50);
 
     if (error) {
       console.error('Error loading solutions:', error);
       setIsLoading(false);
       return;
     }
 
     // Load profiles for each solution
     const userIds = [...new Set(solutionsData.map(s => s.user_id))];
     const { data: profiles } = await supabase
       .from('profiles')
       .select('user_id, display_name, specialty')
       .in('user_id', userIds);
 
     // Load review counts
     const solutionIds = solutionsData.map(s => s.id);
     const { data: reviewStats } = await supabase
       .from('solution_reviews')
       .select('solution_id, rating')
       .in('solution_id', solutionIds);
 
     // Map profiles and stats to solutions
     const enrichedSolutions = solutionsData.map(solution => {
       const profile = profiles?.find(p => p.user_id === solution.user_id);
       const solutionReviews = reviewStats?.filter(r => r.solution_id === solution.id) || [];
       const avgRating = solutionReviews.length > 0
         ? solutionReviews.reduce((sum, r) => sum + r.rating, 0) / solutionReviews.length
         : 0;
 
       return {
         ...solution,
         canvas_state: solution.canvas_state as Record<string, unknown>,
         profile: profile ? { display_name: profile.display_name, specialty: profile.specialty } : undefined,
         reviews_count: solutionReviews.length,
         avg_rating: avgRating,
       };
     });
 
     // Sort if needed
     if (filter === 'top') {
       enrichedSolutions.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
     }
 
     setSolutions(enrichedSolutions);
     setIsLoading(false);
   };
 
   const loadReviews = async (solutionId: string) => {
     const { data: reviewsData } = await supabase
       .from('solution_reviews')
       .select('*')
       .eq('solution_id', solutionId)
       .order('created_at', { ascending: false });
 
     if (!reviewsData) {
       setReviews([]);
       return;
     }
 
     // Load reviewer profiles
     const reviewerIds = reviewsData.map(r => r.reviewer_id);
     const { data: profiles } = await supabase
       .from('profiles')
       .select('user_id, display_name')
       .in('user_id', reviewerIds);
 
     const enrichedReviews = reviewsData.map(review => ({
       ...review,
       reviewer: profiles?.find(p => p.user_id === review.reviewer_id),
     }));
 
     setReviews(enrichedReviews);
   };
 
   const handleViewSolution = (solution: CaseSolution) => {
     setSelectedSolution(solution);
     loadReviews(solution.id);
   };
 
   const handleSubmitReview = async () => {
     if (!selectedSolution || !user || !newComment.trim()) return;
 
     setIsSubmitting(true);
     const { error } = await supabase
       .from('solution_reviews')
       .insert({
         solution_id: selectedSolution.id,
         reviewer_id: user.id,
         rating: newRating,
         comment: newComment.trim(),
       });
 
     if (error) {
       toast({ title: 'Error submitting review', description: error.message, variant: 'destructive' });
     } else {
       toast({ title: 'Review submitted' });
       setNewComment('');
       setNewRating(5);
       loadReviews(selectedSolution.id);
       loadSolutions();
     }
     setIsSubmitting(false);
   };
 
   if (authLoading || isLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-background">
       <Header />
 
        <main className="container py-4 md:py-8 px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Community Solutions</h1>
              <p className="text-muted-foreground text-sm md:text-base">Learn from peer reasoning and share feedback</p>
            </div>
            <Select value={filter} onValueChange={(v: 'recent' | 'top') => setFilter(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="top">Top Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
 
         {solutions.length === 0 ? (
           <Card>
             <CardContent className="py-12 text-center">
               <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
               <h3 className="text-lg font-medium mb-2">No public solutions yet</h3>
               <p className="text-muted-foreground mb-4">
                 Complete a case and share your solution to be the first!
               </p>
               <Link to="/cases">
                 <Button>Browse Cases</Button>
               </Link>
             </CardContent>
           </Card>
         ) : (
           <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
             {solutions.map(solution => (
               <Card key={solution.id} className="hover:shadow-md transition-shadow">
                 <CardHeader className="pb-3">
                   <div className="flex items-start justify-between">
                     <div>
                       <CardTitle className="text-base">{solution.case_title}</CardTitle>
                       {solution.final_diagnosis && (
                         <Badge variant="secondary" className="mt-1">
                           {solution.final_diagnosis}
                         </Badge>
                       )}
                     </div>
                     {solution.avg_rating && solution.avg_rating > 0 && (
                      <div className="flex items-center gap-1 text-primary">
                         <Star className="h-4 w-4 fill-current" />
                         <span className="text-sm font-medium">{solution.avg_rating.toFixed(1)}</span>
                       </div>
                     )}
                   </div>
                 </CardHeader>
                 <CardContent>
                   <div className="flex items-center gap-2 mb-3">
                     <Avatar className="h-6 w-6">
                       <AvatarFallback className="text-xs">
                         {solution.profile?.display_name?.[0] || 'U'}
                       </AvatarFallback>
                     </Avatar>
                     <span className="text-sm font-medium">{solution.profile?.display_name || 'Anonymous'}</span>
                     {solution.profile?.specialty && (
                       <Badge variant="outline" className="text-xs">{solution.profile.specialty}</Badge>
                     )}
                   </div>
 
                   {solution.reflection && (
                     <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                       {solution.reflection}
                     </p>
                   )}
 
                   <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                     <span className="flex items-center gap-1">
                       <Clock className="h-3 w-3" />
                       {new Date(solution.created_at).toLocaleDateString()}
                     </span>
                     <span className="flex items-center gap-1">
                       <MessageSquare className="h-3 w-3" />
                       {solution.reviews_count || 0} reviews
                     </span>
                   </div>
 
                   <Dialog>
                     <DialogTrigger asChild>
                       <Button
                         variant="outline"
                         className="w-full"
                         onClick={() => handleViewSolution(solution)}
                       >
                         View & Review
                       </Button>
                     </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{selectedSolution?.case_title}</DialogTitle>
                        </DialogHeader>
                        
                        {selectedSolution && (
                          <div className="space-y-6">
                            {/* Canvas Viewer */}
                            <div>
                              <h4 className="text-sm font-medium mb-2">Reasoning Map</h4>
                              <CanvasViewer
                                canvasState={selectedSolution.canvas_state as { nodes?: any[]; edges?: any[] }}
                                className="h-[300px] md:h-[400px]"
                              />
                            </div>

                            {/* Solution Details */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback>
                                    {selectedSolution.profile?.display_name?.[0] || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{selectedSolution.profile?.display_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedSolution.profile?.specialty}
                                  </p>
                                </div>
                              </div>

                              {selectedSolution.final_diagnosis && (
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Final Diagnosis</h4>
                                  <Badge>{selectedSolution.final_diagnosis}</Badge>
                                  {selectedSolution.confidence_rating && (
                                    <span className="ml-2 text-sm text-muted-foreground">
                                      Confidence: {selectedSolution.confidence_rating}%
                                    </span>
                                  )}
                                </div>
                              )}

                              {selectedSolution.reflection && (
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Reflection</h4>
                                  <p className="text-sm text-muted-foreground">{selectedSolution.reflection}</p>
                                </div>
                              )}
                           </div>
 
                           {/* Reviews Section */}
                           <div className="border-t pt-4">
                             <h4 className="font-medium mb-4">Reviews ({reviews.length})</h4>
                             
                             {/* Add Review */}
                             {user?.id !== selectedSolution.user_id && (
                               <div className="space-y-3 mb-6 p-4 bg-muted/50 rounded-lg">
                                 <div className="flex items-center gap-2">
                                   <span className="text-sm">Your rating:</span>
                                   {[1, 2, 3, 4, 5].map(n => (
                                     <button
                                       key={n}
                                       onClick={() => setNewRating(n)}
                                       className="focus:outline-none"
                                     >
                                       <Star
                                      className={cn(
                                        'h-5 w-5',
                                        n <= newRating ? 'text-primary fill-current' : 'text-muted-foreground'
                                      )}
                                       />
                                     </button>
                                   ))}
                                 </div>
                                 <Textarea
                                   placeholder="Share your feedback on this solution..."
                                   value={newComment}
                                   onChange={e => setNewComment(e.target.value)}
                                 />
                                 <Button onClick={handleSubmitReview} disabled={isSubmitting || !newComment.trim()}>
                                   {isSubmitting ? (
                                     <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                   ) : (
                                     <Send className="h-4 w-4 mr-2" />
                                   )}
                                   Submit Review
                                 </Button>
                               </div>
                             )}
 
                             {/* Existing Reviews */}
                             <div className="space-y-4">
                               {reviews.length === 0 ? (
                                 <p className="text-sm text-muted-foreground text-center py-4">
                                   No reviews yet. Be the first to review!
                                 </p>
                               ) : (
                                 reviews.map(review => (
                                   <div key={review.id} className="border-b pb-4 last:border-0">
                                     <div className="flex items-center justify-between mb-2">
                                       <div className="flex items-center gap-2">
                                         <Avatar className="h-6 w-6">
                                           <AvatarFallback className="text-xs">
                                             {review.reviewer?.display_name?.[0] || 'U'}
                                           </AvatarFallback>
                                         </Avatar>
                                         <span className="text-sm font-medium">
                                           {review.reviewer?.display_name || 'Anonymous'}
                                         </span>
                                       </div>
                                       <div className="flex items-center gap-1">
                                         {Array.from({ length: review.rating }).map((_, i) => (
                                         <Star key={i} className="h-3 w-3 text-primary fill-current" />
                                         ))}
                                       </div>
                                     </div>
                                     <p className="text-sm">{review.comment}</p>
                                     <p className="text-xs text-muted-foreground mt-1">
                                       {new Date(review.created_at).toLocaleDateString()}
                                     </p>
                                   </div>
                                 ))
                               )}
                             </div>
                           </div>
                         </div>
                       )}
                     </DialogContent>
                   </Dialog>
                 </CardContent>
               </Card>
             ))}
           </div>
         )}
       </main>
     </div>
   );
 }