import { useParams, useNavigate } from 'react-router-dom';
import { LearningAnalyticsDashboard } from '@/components/simulation/LearningAnalyticsDashboard';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function SessionAnalytics() {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    if (!sessionId) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="container py-8 text-center">
                    <h2 className="text-xl font-semibold">Session ID missing</h2>
                    <Button onClick={() => navigate('/simulations')} className="mt-4">
                        Back to Simulations
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main className="container py-8 max-w-5xl">
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="gap-2 pl-0 hover:pl-2 transition-all"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>

                <LearningAnalyticsDashboard
                    sessionId={sessionId}
                    onBackToLibrary={() => navigate('/simulations')}
                    onRetry={() => {
                        // Logic to retry could be added here if we can determine the caseId from session data
                        navigate('/simulations');
                    }}
                />
            </main>
        </div>
    );
}
