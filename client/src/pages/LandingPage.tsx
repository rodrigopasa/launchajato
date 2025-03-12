import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { LucideRocket, Check, ChevronRight, ArrowRight } from "lucide-react";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LucideRocket className="text-primary h-8 w-8" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            LaunchRocket
          </span>
        </div>
        
        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="hover:text-primary transition-colors">Recursos</a>
          <a href="#pricing" className="hover:text-primary transition-colors">Planos</a>
          <a href="#about" className="hover:text-primary transition-colors">Sobre</a>
          <Link href="/login">
            <Button variant="ghost" className="hover:text-primary">Login</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/80 hover:to-purple-400">
              Criar Conta
            </Button>
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-slate-900 p-4">
          <nav className="flex flex-col gap-4">
            <a href="#features" className="hover:text-primary transition-colors p-2">Recursos</a>
            <a href="#pricing" className="hover:text-primary transition-colors p-2">Planos</a>
            <a href="#about" className="hover:text-primary transition-colors p-2">Sobre</a>
            <Link href="/login">
              <Button variant="ghost" className="hover:text-primary w-full justify-start">Login</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-primary to-purple-500 w-full justify-start">
                Criar Conta
              </Button>
            </Link>
          </nav>
        </div>
      )}

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-10 md:mb-0">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Gerencie seus <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">lançamentos</span> de forma eficiente
          </motion.h1>
          <motion.p 
            className="text-xl text-slate-300 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Simplifique o gerenciamento de projetos, acompanhe tarefas e colabore com sua equipe em uma plataforma intuitiva.
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/80 hover:to-purple-400 w-full sm:w-auto">
                Começar Agora
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 w-full sm:w-auto">
                Fazer Login
              </Button>
            </Link>
          </motion.div>
        </div>
        <motion.div 
          className="md:w-1/2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
        >
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-primary to-purple-500 opacity-75 blur"></div>
            <div className="bg-slate-900 p-8 rounded-lg relative">
              <img 
                src="https://via.placeholder.com/600x400?text=LaunchRocket+Dashboard" 
                alt="LaunchRocket Dashboard" 
                className="rounded-lg shadow-xl w-full"
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-slate-900/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Recursos poderosos para seu sucesso</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Oferecemos todas as ferramentas necessárias para gerenciar seus lançamentos de produtos e serviços digitais.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="bg-slate-800 rounded-lg p-6 transition-all hover:bg-slate-800/70"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Planos para equipes de todos os tamanhos</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Escolha o plano perfeito para sua equipe e comece a gerenciar seus projetos com eficiência.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div 
                key={index}
                className={`rounded-lg p-6 border ${plan.featured ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-primary' : 'bg-slate-800 border-slate-700'}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                {plan.featured && (
                  <div className="bg-primary text-white text-xs font-semibold uppercase tracking-wide py-1 px-3 rounded-full inline-block mb-4">
                    Mais Popular
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== 'Personalizado' && <span className="text-slate-300">/mês</span>}
                </div>
                <p className="text-slate-300 mb-6">{plan.description}</p>
                <ul className="mb-6 space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-2 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button 
                    className={`w-full ${plan.featured ? 'bg-gradient-to-r from-primary to-purple-500 hover:from-primary/80 hover:to-purple-400' : 'bg-slate-700 hover:bg-slate-600'}`}
                  >
                    Escolher Plano
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-slate-900/50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Sobre a LaunchRocket</h2>
            <p className="text-xl text-slate-300 mb-8">
              Somos uma empresa dedicada a simplificar o gerenciamento de projetos para equipes de todos os tamanhos.
              Nossa plataforma foi projetada para ajudar empresas a lançar produtos e serviços digitais com eficiência.
            </p>
            <div className="bg-slate-800 rounded-lg p-8">
              <h3 className="text-2xl font-semibold mb-4">Nossa Missão</h3>
              <p className="text-slate-300 mb-6">
                Capacitar equipes com ferramentas intuitivas que permitam colaboração eficiente, comunicação clara
                e entrega de projetos no prazo. Queremos que cada lançamento seja um sucesso, independentemente do tamanho da sua empresa.
              </p>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/80 hover:to-purple-400">
                  Junte-se a Nós
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center gap-2 mb-6 md:mb-0">
              <LucideRocket className="text-primary h-6 w-6" />
              <span className="text-xl font-bold">LaunchRocket</span>
            </div>
            <div className="flex gap-4">
              <a href="#" className="text-slate-300 hover:text-primary transition-colors">
                <FaTwitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-slate-300 hover:text-primary transition-colors">
                <FaLinkedin className="h-6 w-6" />
              </a>
              <a href="#" className="text-slate-300 hover:text-primary transition-colors">
                <FaGithub className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
            <p>Desenvolvido por: Rodrigo Pasa - Todos os Direitos Reservados - 2025</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Sample data
const features = [
  {
    title: "Gerenciamento de Projetos",
    description: "Crie, organize e acompanhe projetos com facilidade usando nossa interface intuitiva.",
    icon: <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
  },
  {
    title: "Colaboração em Tempo Real",
    description: "Trabalhe com sua equipe em tempo real, compartilhando arquivos e informações instantaneamente.",
    icon: <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
  },
  {
    title: "Gerenciamento de Tarefas",
    description: "Distribua e acompanhe tarefas entre sua equipe, mantendo todos alinhados e produtivos.",
    icon: <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  {
    title: "Integração com WhatsApp",
    description: "Comunique-se com sua equipe e clientes através do WhatsApp diretamente da plataforma.",
    icon: <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
  },
  {
    title: "Relatórios Detalhados",
    description: "Gere relatórios personalizados para acompanhar o progresso e tomar decisões informadas.",
    icon: <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  },
  {
    title: "Compartilhamento de Arquivos",
    description: "Compartilhe e gerencie arquivos do projeto de forma segura e organizada.",
    icon: <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "R$ 99",
    description: "Ideal para pequenas equipes iniciando seus projetos.",
    features: [
      "Até 5 usuários",
      "Até 10 projetos",
      "Armazenamento de 5GB",
      "Suporte por email",
      "Integrações básicas"
    ]
  },
  {
    name: "Professional",
    price: "R$ 249",
    description: "Perfeito para equipes em crescimento com necessidades avançadas.",
    features: [
      "Até 20 usuários",
      "Projetos ilimitados",
      "Armazenamento de 50GB",
      "Suporte prioritário",
      "Todas as integrações",
      "Relatórios avançados"
    ],
    featured: true
  },
  {
    name: "Enterprise",
    price: "Personalizado",
    description: "Solução personalizada para grandes organizações.",
    features: [
      "Usuários ilimitados",
      "Projetos ilimitados",
      "Armazenamento personalizado",
      "Suporte 24/7",
      "Todas as integrações",
      "Relatórios avançados",
      "API dedicada"
    ]
  }
];