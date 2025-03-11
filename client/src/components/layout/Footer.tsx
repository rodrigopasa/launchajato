import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-4 px-6 text-center mt-auto">
      <div className="container mx-auto">
        <p className="text-sm">
          Desenvolvido por: Rodrigo Pasa - Todos os Direitos Reservados - {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}