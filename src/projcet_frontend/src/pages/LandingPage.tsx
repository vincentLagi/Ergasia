import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from 'antd';
import { ArrowRight, Briefcase, Users, Award, DollarSign, Sparkles, Zap, Globe } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../ui/components/Navbar';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // If user is authenticated and came from a protected route, redirect them back
    if (isAuthenticated && !isLoading) {
      const from = (location.state as any)?.from;
      if (from && from !== '/') {
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, location.state, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      {/* Hero Section with Decorative Elements */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating Geometric Shapes */}
          <motion.div
            className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"
            animate={{
              y: [0, -20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-40 right-20 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl"
            animate={{
              y: [0, 30, 0],
              scale: [1, 0.9, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-20 left-1/4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl"
            animate={{
              y: [0, -15, 0],
              x: [0, 10, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.1)_1px,transparent_1px)] bg-[size:25px_25px]" />
          
          {/* Gradient Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 via-indigo-500/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Floating Icons */}
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                className="absolute top-10 left-10 text-primary/30"
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Sparkles size={24} />
              </motion.div>
              <motion.div
                className="absolute top-20 right-16 text-indigo-500/30"
                animate={{
                  y: [0, 15, 0],
                  rotate: [0, -5, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Zap size={28} />
              </motion.div>
              <motion.div
                className="absolute bottom-10 left-1/3 text-blue-500/30"
                animate={{
                  y: [0, -12, 0],
                  rotate: [0, 10, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Globe size={32} />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                <Sparkles size={16} />
                Powered by Blockchain Technology
              </div>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              The Future of Freelance is{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Decentralized
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Ergasia connects top talent with innovative projects, powered by secure, 
              transparent, and instant crypto payments on the blockchain.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<ArrowRight />}
                  onClick={() => navigate('/find')}
                  className="h-12 px-8 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Find Your Next Gig
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="large" 
                  onClick={() => navigate('/post')}
                  className="h-12 px-8 text-lg border-2 hover:border-primary hover:text-primary transition-all duration-300"
                >
                  Hire Top Talent
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold mb-4">
                How It Works
              </h2>
              <p className="text-xl text-muted-foreground">
                A simple, secure, and transparent process from start to finish.
              </p>
            </motion.div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <DollarSign className="h-8 w-8" />,
                title: 'Post a Job & Deposit Funds',
                description: 'Clients post job details and securely deposit crypto into a smart contract-based escrow.',
                color: 'text-green-600'
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: 'Hire the Perfect Freelancer',
                description: 'Browse profiles, invite talent, or accept applications. Agree on terms to initiate the work.',
                color: 'text-blue-600'
              },
              {
                icon: <Briefcase className="h-8 w-8" />,
                title: 'Complete & Submit Work',
                description: 'Freelancers complete the job and submit their work for review directly on the platform.',
                color: 'text-purple-600'
              },
              {
                icon: <Award className="h-8 w-8" />,
                title: 'Approve & Release Payment',
                description: 'Once the client approves the work, the smart contract automatically releases the funds instantly.',
                color: 'text-indigo-600'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ 
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                className="bg-card p-6 rounded-xl shadow-sm border border-border hover:shadow-lg transition-all duration-300 group"
              >
                <div className={`${feature.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* Background Decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl blur-xl opacity-20" />
            
            <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-12 text-white overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl" />
              
              <div className="relative z-10">
                <h2 className="text-4xl font-bold mb-4">
                  Ready to Join the Revolution?
                </h2>
                <p className="text-xl mb-8 opacity-90">
                  Whether you're looking for your next big project or the perfect talent 
                  to build your vision, Ergasia is your gateway to the future of work.
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    size="large" 
                    className="h-12 px-8 text-lg bg-white text-indigo-600 border-none hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300"
                    icon={<ArrowRight />}
                    onClick={() => navigate('/find')}
                  >
                    Get Started Today
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;