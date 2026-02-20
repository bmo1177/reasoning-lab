import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Sparkles, Brain, Users, Target, Zap, Star, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    }
  };

  const backgroundX = useTransform(mouseX, [0, 1], ["-5%", "5%"]);
  const backgroundY = useTransform(mouseY, [0, 1], ["-5%", "5%"]);

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Animated Background */}
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ x: backgroundX, y: backgroundY }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20 dark:from-primary/10 dark:via-background dark:to-secondary/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-[128px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[150px]" />
      </motion.div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Content */}
      <motion.div 
        style={{ y, opacity, scale }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Next-Gen Clinical Learning</span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-primary to-foreground dark:from-white dark:via-primary dark:to-white">
            Master Clinical
          </span>
          <br />
          <span className="relative">
            Reasoning
            <motion.svg
              className="absolute -bottom-2 left-0 w-full"
              viewBox="0 0 300 12"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              <motion.path
                d="M2 10C50 2 100 2 150 6C200 10 250 10 298 2"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
              />
            </motion.svg>
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10"
        >
          Visualize your diagnostic thinking, get AI-powered insights, and compare 
          with expert reasoning in real-time.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/cases">
            <Button 
              size="lg" 
              className="group relative overflow-hidden px-8 py-6 text-lg"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Learning
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            size="lg"
            className="group px-8 py-6 text-lg border-2"
          >
            <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            Watch Demo
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
          aria-label="Platform statistics"
        >
          {[
            { value: "100+", label: "Clinical Cases", description: "Curated medical scenarios" },
            { value: "9", label: "Node Types", description: "For comprehensive reasoning" },
            { value: "24/7", label: "AI Support", description: "Always-available feedback" },
            { value: "Free", label: "To Start", description: "Begin learning today" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              className="text-center"
            >
              <div 
                className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
                aria-label={`${stat.value} ${stat.label}`}
              >
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-muted-foreground"
        >
          <span className="text-sm">Scroll to explore</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}

export function FeatureShowcase() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Get real-time feedback on your diagnostic reasoning with advanced AI that understands clinical logic.",
      color: "from-blue-500 to-cyan-500",
      delay: 0,
    },
    {
      icon: Target,
      title: "Visual Reasoning Maps",
      description: "Build interactive diagrams that connect symptoms, findings, and diagnoses to visualize your thinking process.",
      color: "from-purple-500 to-pink-500",
      delay: 0.1,
    },
    {
      icon: Users,
      title: "Expert Comparison",
      description: "Compare your reasoning with expert solutions and learn from detailed side-by-side analysis.",
      color: "from-orange-500 to-red-500",
      delay: 0.2,
    },
    {
      icon: Zap,
      title: "Interactive Learning",
      description: "Engage with dynamic cases, order virtual tests, and receive immediate feedback on your decisions.",
      color: "from-green-500 to-emerald-500",
      delay: 0.3,
    },
  ];

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Everything You Need to
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"> Excel</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful tools designed to enhance your clinical reasoning skills and accelerate your learning journey.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: feature.delay }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl" 
                style={{ background: `linear-gradient(to right, var(--tw-gradient-stops))` }} 
              />
              
              <div className="relative p-8 rounded-2xl border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors duration-300">
                {/* Icon */}
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {feature.description}
                </p>

                {/* Decorative Line */}
                <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Choose a Case",
      description: "Select from hundreds of real-world clinical scenarios across various specialties.",
    },
    {
      number: "02",
      title: "Build Your Map",
      description: "Create visual reasoning diagrams connecting symptoms, tests, and diagnoses.",
    },
    {
      number: "03",
      title: "Get AI Insights",
      description: "Receive intelligent feedback on your diagnostic approach and reasoning.",
    },
    {
      number: "04",
      title: "Compare & Learn",
      description: "See how your reasoning compares with expert solutions and improve.",
    },
  ];

  return (
    <section className="py-32 relative overflow-hidden bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Start Learning in
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"> 4 Simple Steps</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-border to-transparent" />
              )}

              <div className="relative group">
                {/* Step Number */}
                <div className="text-7xl font-bold text-muted/20 group-hover:text-primary/20 transition-colors duration-300 mb-4">
                  {step.number}
                </div>
                
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  const testimonials = [
    {
      quote: "This platform transformed how I approach clinical reasoning. The visual maps make complex cases so much clearer.",
      author: "Medical Resident",
      role: "University Hospital",
      rating: 5,
    },
    {
      quote: "The AI feedback is incredibly helpful. It's like having a senior physician guiding your thinking process.",
      author: "Medical Student",
      role: "Year 3 Clinical Rotations",
      rating: 5,
    },
    {
      quote: "Finally, a tool that helps me visualize my diagnostic reasoning. My clinical skills have improved dramatically.",
      author: "Attending Physician",
      role: "Internal Medicine",
      rating: 5,
    },
  ];

  return (
    <section className="py-32 relative overflow-hidden" aria-labelledby="testimonials-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Testimonials
          </span>
          <h2 id="testimonials-heading" className="text-4xl sm:text-5xl font-bold mb-6">
            Loved by Medical
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"> Professionals</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative p-8 rounded-2xl border bg-card/50 backdrop-blur-sm"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4" aria-label={`Rated ${testimonial.rating} out of 5 stars`}>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                ))}
              </div>

              <blockquote className="text-lg mb-6 italic">
                "{testimonial.quote}"
              </blockquote>

              <footer>
                <div className="font-semibold">{testimonial.author}</div>
                <div className="text-sm text-muted-foreground">{testimonial.role}</div>
              </footer>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTASection() {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      
      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-[100px]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Ready to Transform Your
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary block mt-2">
              Clinical Reasoning?
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of medical professionals who are already improving their diagnostic skills with our platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/cases">
              <Button size="lg" className="px-8 py-6 text-lg">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            
            <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
              View Pricing
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required. Start learning immediately.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
