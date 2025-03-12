import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { transitions } from '@/lib/animations';
import { Rocket, Star, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function RocketAnimation() {
  const [showAnimation, setShowAnimation] = useState(true);

  // Esconder a animação após algum tempo se o usuário não interagir
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 15000); // 15 segundos

    return () => clearTimeout(timer);
  }, []);

  if (!showAnimation) {
    return null;
  }

  return (
    <Card className="mb-8 overflow-hidden relative bg-gradient-to-r from-slate-900 to-indigo-950 border-none shadow-xl">
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {/* Estrelas no fundo */}
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ opacity: 0.3, scale: 0.5 }}
            animate={{ 
              opacity: [0.3, 0.8, 0.3], 
              scale: [0.5, 0.8, 0.5],
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2 + Math.random() * 3,
              delay: Math.random() * 2,
            }}
            style={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`,
              zIndex: 1
            }}
          >
            <Star className="text-white h-2 w-2" />
          </motion.div>
        ))}
      </div>

      <div className="px-8 py-12 flex flex-col md:flex-row items-center relative z-10">
        <div className="md:w-3/5 mb-6 md:mb-0 md:pr-8">
          <motion.h2 
            className="text-2xl md:text-3xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.bounce}
          >
            Impulsione seus <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-primary">Lançamentos de Produtos</span>
          </motion.h2>
          <motion.p 
            className="text-slate-300 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, ...transitions.default }}
          >
            Gerencie projetos, acompanhe tarefas e colabore com sua equipe em uma única plataforma integrada. Use notificações por WhatsApp para manter todos atualizados.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, ...transitions.default }}
          >
            <Button 
              size="lg" 
              variant="default"
              className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30"
              onClick={() => setShowAnimation(false)}
            >
              Começar Agora
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        <div className="md:w-2/5 flex justify-center">
          <div className="relative h-40 w-40">
            {/* Efeito de fogo do foguete */}
            <motion.div
              className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-20 bg-gradient-to-t from-orange-500 via-yellow-400 to-transparent rounded-full"
              initial={{ opacity: 0, scaleY: 0.5 }}
              animate={{ 
                opacity: [0.5, 0.8, 0.5], 
                scaleY: [0.7, 1, 0.7],
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.2,
              }}
              style={{ filter: 'blur(8px)', transformOrigin: 'bottom' }}
            />
            
            {/* Foguete */}
            <motion.div
              initial={{ y: 60 }}
              animate={{ y: [0, -15, 0] }}
              transition={{ 
                repeat: Infinity, 
                duration: 3,
                ease: "easeInOut",
              }}
              className="absolute left-1/2 -translate-x-1/2"
            >
              <motion.div
                whileHover={{ rotate: 5, scale: 1.05 }}
                transition={transitions.spring}
              >
                <Rocket 
                  size={70} 
                  className="text-white transform -rotate-45"
                  strokeWidth={1.5}
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Botão para fechar a animação */}
      <button 
        onClick={() => setShowAnimation(false)}
        className="absolute top-3 right-3 text-slate-300 hover:text-white"
        aria-label="Fechar animação"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </Card>
  );
}