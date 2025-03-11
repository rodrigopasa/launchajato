import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload, Save, RefreshCw, Image } from "lucide-react";

// Lista de cores primárias para escolha
const COLOR_OPTIONS = [
  { value: "#0ea5e9", label: "Azul", class: "bg-blue-500" },
  { value: "#10b981", label: "Verde", class: "bg-green-500" },
  { value: "#8b5cf6", label: "Roxo", class: "bg-purple-500" },
  { value: "#ef4444", label: "Vermelho", class: "bg-red-500" },
  { value: "#f59e0b", label: "Laranja", class: "bg-orange-500" },
  { value: "#ec4899", label: "Rosa", class: "bg-pink-500" },
  { value: "#64748b", label: "Cinza", class: "bg-slate-500" },
  { value: "#334155", label: "Cinza Escuro", class: "bg-slate-700" },
];

// Opções de variantes
const VARIANT_OPTIONS = [
  { value: "professional", label: "Profissional" },
  { value: "vibrant", label: "Vibrante" },
  { value: "tint", label: "Suave" },
];

// Opções de aparência
const APPEARANCE_OPTIONS = [
  { value: "light", label: "Modo Claro" },
  { value: "dark", label: "Modo Escuro" },
  { value: "system", label: "Sistema" },
];

// Opções de arredondamento
const RADIUS_OPTIONS = [
  { value: "0", label: "Sem arredondamento" },
  { value: "0.25", label: "Mínimo" },
  { value: "0.5", label: "Médio" },
  { value: "0.75", label: "Amplo" },
  { value: "1", label: "Máximo" },
];

export default function Settings() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("visual");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Buscar configurações atuais
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
    // Tratamento de erro silencioso para não quebrar se a API ainda não existir
    onError: () => {
      // Configurações padrão se a API não estiver disponível
      return {
        theme: {
          primary: "#0ea5e9",
          variant: "professional",
          appearance: "light",
          radius: "0.5",
        },
        organization: {
          name: "Sistema de Gestão de Projetos",
          logo: null,
        },
      };
    },
  });

  // Estado local para as configurações de tema
  const [themeSettings, setThemeSettings] = useState({
    primary: "#0ea5e9",
    variant: "professional",
    appearance: "light",
    radius: "0.5",
  });

  // Estado local para as configurações da organização
  const [orgSettings, setOrgSettings] = useState({
    name: "Sistema de Gestão de Projetos",
    // outros campos como logo, etc
  });

  // Atualizar estados locais quando os dados são carregados
  useEffect(() => {
    if (settings) {
      if (settings.theme) {
        setThemeSettings(settings.theme);
      }
      if (settings.organization) {
        setOrgSettings(settings.organization);
      }
    }
  }, [settings]);

  // Mutation para salvar configurações
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso",
      });
      
      // Recarregar a página para aplicar as mudanças de tema
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar configurações",
        description: error.message || "Ocorreu um erro ao salvar as configurações",
        variant: "destructive",
      });
    },
  });

  // Mutation para fazer upload do logo
  const uploadLogoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest("/api/settings/logo", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Logo enviado",
        description: "O logo foi enviado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar logo",
        description: error.message || "Ocorreu um erro ao enviar o logo",
        variant: "destructive",
      });
    },
  });

  // Manipular mudança de cor
  const handleColorChange = (color: string) => {
    setThemeSettings({
      ...themeSettings,
      primary: color,
    });
    
    // Aplica a mudança em tempo real
    document.documentElement.style.setProperty('--primary', color);
  };

  // Manipular mudança de variante
  const handleVariantChange = (variant: string) => {
    setThemeSettings({
      ...themeSettings,
      variant,
    });
  };

  // Manipular mudança de aparência
  const handleAppearanceChange = (appearance: string) => {
    setThemeSettings({
      ...themeSettings,
      appearance,
    });
  };

  // Manipular mudança de arredondamento
  const handleRadiusChange = (radius: string) => {
    setThemeSettings({
      ...themeSettings,
      radius,
    });
  };

  // Manipular mudança de nome da organização
  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrgSettings({
      ...orgSettings,
      name: e.target.value,
    });
  };

  // Manipular escolha de arquivo de logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Acionar o input de arquivo
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Enviar logo
  const handleUploadLogo = () => {
    if (!logoFile) return;
    
    const formData = new FormData();
    formData.append("logo", logoFile);
    
    uploadLogoMutation.mutate(formData);
  };

  // Salvar todas as configurações
  const handleSaveSettings = () => {
    saveSettingsMutation.mutate({
      theme: themeSettings,
      organization: orgSettings,
    });
  };

  return (
    <div className="py-6 px-4 md:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Configurações</h2>
        <Button onClick={handleSaveSettings} disabled={saveSettingsMutation.isPending}>
          {saveSettingsMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="visual">Personalização Visual</TabsTrigger>
          <TabsTrigger value="org">Organização</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="visual">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cores e Aparência</CardTitle>
                <CardDescription>
                  Personalize as cores e o estilo visual da aplicação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Cor primária</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                    {COLOR_OPTIONS.map((color) => (
                      <div
                        key={color.value}
                        className="flex flex-col items-center"
                      >
                        <button
                          type="button"
                          className={`w-10 h-10 rounded-full border-2 ${
                            themeSettings.primary === color.value
                              ? "border-black dark:border-white"
                              : "border-transparent"
                          } ${color.class} cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
                          onClick={() => handleColorChange(color.value)}
                          aria-label={`Selecionar cor ${color.label}`}
                        />
                        <span className="text-xs mt-1">{color.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-3">Estilo Visual</h3>
                  <RadioGroup
                    value={themeSettings.variant}
                    onValueChange={handleVariantChange}
                    className="flex flex-col md:flex-row gap-4"
                  >
                    {VARIANT_OPTIONS.map((variant) => (
                      <div key={variant.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={variant.value} id={`variant-${variant.value}`} />
                        <Label htmlFor={`variant-${variant.value}`}>{variant.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-3">Aparência (Modo Claro/Escuro)</h3>
                  <RadioGroup
                    value={themeSettings.appearance}
                    onValueChange={handleAppearanceChange}
                    className="flex flex-col md:flex-row gap-4"
                  >
                    {APPEARANCE_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`appearance-${option.value}`} />
                        <Label htmlFor={`appearance-${option.value}`}>{option.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-3">Arredondamento dos Elementos</h3>
                  <RadioGroup
                    value={themeSettings.radius}
                    onValueChange={handleRadiusChange}
                    className="flex flex-col md:flex-row gap-4"
                  >
                    {RADIUS_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`radius-${option.value}`} />
                        <Label htmlFor={`radius-${option.value}`}>{option.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="org">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Organização</CardTitle>
                <CardDescription>
                  Personalize as informações e a identidade da sua organização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="orgName">Nome da Organização</Label>
                    <Input
                      id="orgName"
                      value={orgSettings.name}
                      onChange={handleOrgNameChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label>Logo da Organização</Label>
                    <div className="mt-2 flex flex-col md:flex-row gap-4 items-start">
                      <div className="border rounded-lg p-4 bg-gray-50 w-40 h-40 flex items-center justify-center overflow-hidden">
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Logo Preview"
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : settings?.organization?.logo ? (
                          <img
                            src={settings.organization.logo}
                            alt="Current Logo"
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <Image className="h-12 w-12 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleLogoChange}
                          className="hidden"
                          accept="image/*"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={triggerFileInput}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Escolher Imagem
                        </Button>
                        
                        {logoFile && (
                          <Button
                            type="button"
                            onClick={handleUploadLogo}
                            disabled={uploadLogoMutation.isPending}
                          >
                            {uploadLogoMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              "Enviar Logo"
                            )}
                          </Button>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-1">
                          Recomendamos uma imagem de pelo menos 512x512px no formato PNG ou SVG
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>
                  Configure como deseja receber notificações do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Notificações por E-mail</Label>
                      <p className="text-sm text-gray-500">
                        Receba atualizações importantes por e-mail
                      </p>
                    </div>
                    <Switch id="email-notifications" defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="task-notifications">Notificações de Tarefas</Label>
                      <p className="text-sm text-gray-500">
                        Seja notificado quando uma tarefa for atribuída a você
                      </p>
                    </div>
                    <Switch id="task-notifications" defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="deadline-notifications">Alertas de Prazo</Label>
                      <p className="text-sm text-gray-500">
                        Receba lembretes de prazos de tarefas e projetos
                      </p>
                    </div>
                    <Switch id="deadline-notifications" defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="mobile-notifications">Notificações Móveis</Label>
                      <p className="text-sm text-gray-500">
                        Ative notificações push em dispositivos móveis
                      </p>
                    </div>
                    <Switch id="mobile-notifications" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}