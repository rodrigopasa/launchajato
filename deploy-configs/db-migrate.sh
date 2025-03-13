#!/bin/bash

# Script para executar as migrações do banco de dados no ambiente Coolify

echo "Iniciando processo de migração do banco de dados..."

# Verificar se variáveis de ambiente necessárias estão presentes
if [ -z "$DATABASE_URL" ]; then
    echo "ERRO: Variável DATABASE_URL não está definida!"
    exit 1
fi

# Instalar dependências
echo "Instalando dependências..."
npm ci

# Executar migração do banco de dados
echo "Executando migração do banco de dados..."
npm run db:push

# Verificar se a migração foi bem-sucedida
if [ $? -eq 0 ]; then
    echo "Migração do banco de dados concluída com sucesso!"
else
    echo "ERRO: Falha ao executar migração do banco de dados!"
    exit 1
fi

echo "Processo de migração concluído!"
exit 0