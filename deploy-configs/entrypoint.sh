#!/bin/bash

# Script de inicialização do LaunchRocket em ambiente de produção

echo "LaunchRocket: Iniciando configuração do ambiente..."

# Verificar variáveis de ambiente obrigatórias
if [ -z "$DATABASE_URL" ]; then
    echo "ERRO: Variável DATABASE_URL não está definida!"
    exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
    echo "AVISO: Variável SESSION_SECRET não definida! Gerando valor aleatório..."
    export SESSION_SECRET=$(openssl rand -base64 32)
fi

# Criar pasta uploads se não existir
if [ ! -d "/app/uploads" ]; then
    mkdir -p /app/uploads
    echo "Diretório de uploads criado!"
fi

# Verificar e ajustar permissões da pasta uploads
chmod -R 775 /app/uploads
echo "Permissões do diretório de uploads ajustadas!"

# Aguardar o banco de dados estar disponível
echo "Aguardando conexão com o banco de dados..."
max_retries=60  # Aumentando o número de tentativas
sleep_time=3    # Aumentando o tempo entre as tentativas
counter=0

# Extraindo o host da URL do banco de dados
host=$(echo $DATABASE_URL | sed -E 's/^postgres:\/\/[^:]+:[^@]+@([^:]+):[0-9]+\/.*/\1/')

while ! pg_isready -h "$host" -q; do
    sleep $sleep_time
    counter=$((counter+1))
    if [ $counter -ge $max_retries ]; then
        echo "ERRO: Impossível conectar ao banco de dados após $max_retries tentativas."
        exit 1
    fi
    echo "Tentativa $counter de $max_retries..."
done

echo "Banco de dados disponível!"

# Desativar recursos que possam causar problemas
if [ "$DISABLE_STRIPE" = "true" ]; then
    echo "Modo Stripe desativado para depuração."
fi

if [ "$DISABLE_WHATSAPP" = "true" ]; then
    echo "Integração WhatsApp desativada para depuração."
fi

# Iniciar aplicação
echo "LaunchRocket: Iniciando aplicação..."
exec "$@"
