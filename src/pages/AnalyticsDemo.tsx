import { Header } from '@/components/layout/Header';
import { LocalAnalyticsDemo } from '@/components/demo/LocalAnalyticsDemo';

export default function AnalyticsDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <LocalAnalyticsDemo />
      </main>
    </div>
  );
}
