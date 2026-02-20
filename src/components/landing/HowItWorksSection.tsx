import { motion } from 'framer-motion';
import { FileText, GitBranch, Users2, TrendingUp } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Select a Case',
    description: 'Choose from diverse clinical scenarios across specialties and difficulty levels.',
  },
  {
    number: '02',
    icon: GitBranch,
    title: 'Map Your Reasoning',
    description: 'Build your diagnostic thinking visually - connect symptoms to diagnoses, order tests, and track your logic.',
  },
  {
    number: '03',
    icon: Users2,
    title: 'Compare & Reflect',
    description: 'See how experts approached the same case. Identify gaps in your reasoning and cognitive biases.',
  },
  {
    number: '04',
    icon: TrendingUp,
    title: 'Track Progress',
    description: 'Monitor your metacognitive development over time with personalized analytics.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="border-t bg-muted/30 py-20 lg:py-28">
      <div className="container">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-muted-foreground">
            A structured approach to developing clinical reasoning skills through 
            metacognitive practice.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 lg:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-8 hidden h-px w-full bg-border lg:block" />
              )}
              
              <div className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-background">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <span className="mb-2 text-sm font-bold text-primary">
                  STEP {step.number}
                </span>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
