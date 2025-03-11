import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Definir tipos
interface ThemeSettings {
  primary: string;
  variant: string;
  appearance: string;
  radius: string;
}

interface OrganizationSettings {
  name: string;
  logo: string | null;
}

interface Settings {
  theme: ThemeSettings;
  organization: OrganizationSettings;
}

interface SettingsContextType {
  settings: Settings | null;
  isLoading: boolean;
  updateOrganizationName: (name: string) => void;
  updateOrganizationLogo: (logo: string | null) => void;
}

// Criar contexto
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Hook para usar o contexto
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings deve ser usado dentro de um SettingsProvider');
  }
  return context;
};

// Provedor do contexto
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  
  // Configurações padrão
  const defaultSettings: Settings = {
    theme: {
      primary: '#0ea5e9',
      variant: 'professional',
      appearance: 'light',
      radius: '0.5',
    },
    organization: {
      name: 'LaunchRocket',
      logo: null,
    }
  };

  // Estado local para cópias das configurações
  const [localSettings, setLocalSettings] = useState<Settings | null>(null);

  // Buscar configurações atuais
  const { data: fetchedSettings, isLoading } = useQuery<Settings>({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/settings');
        return response.json();
      } catch (error) {
        return defaultSettings;
      }
    }
  });

  // Atualizar o estado local quando os dados são carregados
  useEffect(() => {
    if (fetchedSettings) {
      setLocalSettings(fetchedSettings);
    }
  }, [fetchedSettings]);

  // Funções para atualizar o contexto
  const updateOrganizationName = (name: string) => {
    if (!localSettings) return;
    
    // Atualizar o estado local
    setLocalSettings({
      ...localSettings,
      organization: {
        ...localSettings.organization,
        name,
      }
    });
    
    // Atualizar o cache da consulta para refletir a mudança
    queryClient.setQueryData(['/api/settings'], {
      ...localSettings,
      organization: {
        ...localSettings.organization,
        name,
      }
    });
  };

  const updateOrganizationLogo = (logo: string | null) => {
    if (!localSettings) return;
    
    // Atualizar o estado local
    setLocalSettings({
      ...localSettings,
      organization: {
        ...localSettings.organization,
        logo,
      }
    });
    
    // Atualizar o cache da consulta para refletir a mudança
    queryClient.setQueryData(['/api/settings'], {
      ...localSettings,
      organization: {
        ...localSettings.organization,
        logo,
      }
    });
  };

  // Valor do contexto
  const value: SettingsContextType = {
    settings: localSettings,
    isLoading,
    updateOrganizationName,
    updateOrganizationLogo,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};