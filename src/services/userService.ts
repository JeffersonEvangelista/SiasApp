import { createClient } from '@supabase/supabase-js';

// Configure seu Supabase
const supabaseUrl = 'https://enpcrnmsdcjekxmkrlaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucGNybm1zZGNqZWt4bWtybGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0NDY5NzEsImV4cCI6MjA0MTAyMjk3MX0.BInW3v-YBtlK1OrG9W0uR1qtLEOcEEP7G_I8NpYotyA';
const supabase = createClient(supabaseUrl, supabaseKey);

interface User {
    nome: string;
    email: string;
    identificador: string;
    tipo_identificador: 'CPF' | 'CNPJ';
}

// Função para determinar se o identificador é CPF ou CNPJ
const determineIdentifierType = (identificador: string): 'CPF' | 'CNPJ' => {
    // Exemplo simples: CPF tem 11 dígitos e CNPJ tem 14
    const digitsOnly = identificador.replace(/\D/g, '');
    return digitsOnly.length === 11 ? 'CPF' : 'CNPJ';
};

export const saveUserToSupabase = async (user: User) => {
    try {
        const { data, error } = await supabase
            .from('usuarios') 
            .insert([user]);

        if (error) throw error;
        return data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Erro ao salvar usuário no Supabase:', error.message);
        } else {
            console.error('Erro desconhecido ao salvar usuário no Supabase:', error);
        }
        throw error;
    }
};