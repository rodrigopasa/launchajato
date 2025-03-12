import { Rocket } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

export default function Footer() {
  const { settings } = useSettings();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-gray-300 py-4 px-6 text-center mt-auto">
      <div className="container mx-auto">
        <div className="flex items-center justify-center mb-2">
          {settings?.organization?.logo ? (
            <img 
              src={settings.organization.logo} 
              alt={settings?.organization?.name || "LaunchRocket"} 
              className="h-6 mr-2"
            />
          ) : (
            <div className="flex items-center font-semibold text-white">
              <Rocket className="h-5 w-5 text-primary mr-1" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">
                {settings?.organization?.name || "LaunchRocket"}
              </span>
            </div>
          )}
        </div>
        <p className="text-sm">
          Desenvolvido por: <span className="text-primary">Rodrigo Pasa</span> - Todos os Direitos Reservados - {currentYear}
        </p>
      </div>
    </footer>
  );
}