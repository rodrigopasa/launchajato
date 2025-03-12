// Transições padrão para vários elementos
export const transitions = {
  // Transição suave padrão
  default: {
    type: "tween",
    ease: "easeInOut",
    duration: 0.3
  },
  
  // Transição mais rápida para elementos pequenos
  quick: {
    type: "tween",
    ease: "easeOut",
    duration: 0.2
  },
  
  // Transição com rebote para ações positivas
  bounce: {
    type: "spring",
    stiffness: 300,
    damping: 20
  },
  
  // Transição mais longa para elementos importantes
  emphasis: {
    type: "tween",
    ease: "easeInOut",
    duration: 0.5
  }
};

// Variantes de animação para diferentes situações
export const variants = {
  // Para elementos que aparecem/desaparecem
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: transitions.default }
  },
  
  // Para entrada de elementos de cima para baixo
  slideDown: {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: transitions.default }
  },
  
  // Para exibir modais e dialogs
  scaleUp: {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: transitions.bounce }
  },
  
  // Para listas de itens com delay sequencial
  staggerList: {
    hidden: { opacity: 0 },
    visible: (i = 0) => ({
      opacity: 1,
      transition: {
        delay: i * 0.05,
        ...transitions.quick
      }
    })
  }
};