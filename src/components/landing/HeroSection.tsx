import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, GitBranch, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Brain,
    title: 'Visual Reasoning',
    description: 'Map your diagnostic thinking process with interactive canvases',
  },
  {
    icon: GitBranch,
    title: 'Flexible Modes',
    description: 'Choose mind-map or flowchart style based on your preference',
  },
  {
    icon: Users,
    title: 'Learn Together',
    description: 'Collaborate with peers on complex cases in real-time',
  },
  {
    icon: BarChart3,
    title: 'Track Growth',
    description: 'Understand your thinking patterns and improve over time',
  },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10" />
        <div className="absolute right-0 top-0 -z-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Medical Education Reimagined
            </span>
          </motion.div>

          <motion.h1
            className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Master Clinical Reasoning,{' '}
            <span className="text-primary">Not Just Answers</span>
          </motion.h1>

          <motion.p
            className="mt-6 text-lg text-muted-foreground sm:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Externalize your diagnostic thinking through interactive reasoning maps. 
            Compare with experts, learn from peers, and develop metacognitive 
            skills that make you a better clinician.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button asChild size="lg" className="gap-2">
              <Link to="/cases">
                Start a Case
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/dashboard">View Dashboard</Link>
            </Button>
          </motion.div>
        </div>

        {/* Feature cards */}
        <motion.div
          className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group relative rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
