 import { useState } from 'react';
 import { Loader2, Send } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
 
 const specialties = [
   'Cardiology',
   'Pulmonology',
   'Gastroenterology',
   'Neurology',
   'Endocrinology',
   'Infectious Disease',
   'Nephrology',
   'Hematology',
   'Rheumatology',
   'Emergency Medicine',
   'Internal Medicine',
   'General Practice',
   'Other',
 ];
 
 interface ExpertApplicationFormProps {
   userId: string;
   onSuccess?: () => void;
 }
 
 export function ExpertApplicationForm({ userId, onSuccess }: ExpertApplicationFormProps) {
   const { toast } = useToast();
   const [isSubmitting, setIsSubmitting] = useState(false);
   
   const [qualifications, setQualifications] = useState('');
   const [experienceYears, setExperienceYears] = useState('');
   const [specialty, setSpecialty] = useState('');
   const [reason, setReason] = useState('');
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (!qualifications.trim() || !experienceYears || !specialty || !reason.trim()) {
       toast({ title: 'Please fill in all fields', variant: 'destructive' });
       return;
     }
 
     setIsSubmitting(true);
 
     const { error } = await supabase
       .from('expert_applications')
       .insert({
         user_id: userId,
         qualifications: qualifications.trim(),
         experience_years: parseInt(experienceYears),
         specialty,
         reason: reason.trim(),
       });
 
     if (error) {
       if (error.message.includes('duplicate')) {
         toast({
           title: 'Application already submitted',
           description: 'You have already applied for Expert status.',
           variant: 'destructive',
         });
       } else {
         toast({ title: 'Error submitting application', description: error.message, variant: 'destructive' });
       }
     } else {
       toast({
         title: 'Application submitted!',
         description: 'Your application will be reviewed by an administrator.',
       });
       onSuccess?.();
     }
 
     setIsSubmitting(false);
   };
 
   return (
     <Card>
       <CardHeader>
         <CardTitle>Apply for Expert Status</CardTitle>
         <CardDescription>
           Experts can review case solutions and provide feedback to learners.
         </CardDescription>
       </CardHeader>
       <CardContent>
         <form onSubmit={handleSubmit} className="space-y-4">
           <div className="space-y-2">
             <Label htmlFor="specialty">Specialty</Label>
             <Select value={specialty} onValueChange={setSpecialty}>
               <SelectTrigger>
                 <SelectValue placeholder="Select your specialty" />
               </SelectTrigger>
               <SelectContent>
                 {specialties.map(s => (
                   <SelectItem key={s} value={s}>{s}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="experience">Years of Experience</Label>
             <Input
               id="experience"
               type="number"
               min="0"
               max="50"
               value={experienceYears}
               onChange={e => setExperienceYears(e.target.value)}
               placeholder="e.g., 5"
             />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="qualifications">Qualifications</Label>
             <Textarea
               id="qualifications"
               value={qualifications}
               onChange={e => setQualifications(e.target.value)}
               placeholder="List your medical degrees, certifications, and relevant qualifications..."
               rows={3}
             />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="reason">Why do you want to become an Expert?</Label>
             <Textarea
               id="reason"
               value={reason}
               onChange={e => setReason(e.target.value)}
               placeholder="Explain your motivation for becoming an expert reviewer..."
               rows={3}
             />
           </div>
 
           <Button type="submit" disabled={isSubmitting} className="w-full">
             {isSubmitting ? (
               <Loader2 className="h-4 w-4 animate-spin mr-2" />
             ) : (
               <Send className="h-4 w-4 mr-2" />
             )}
             Submit Application
           </Button>
         </form>
       </CardContent>
     </Card>
   );
 }