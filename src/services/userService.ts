import { createClient } from '@supabase/supabase-js';

// Configure seu Supabase
const supabaseUrl = 'https://enpcrnmsdcjekxmkrlaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucGNybm1zZGNqZWt4bWtybGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0NDY5NzEsImV4cCI6MjA0MTAyMjk3MX0.BInW3v-YBtlK1OrG9W0uR1qtLEOcEEP7G_I8NpYotyA';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Candidato {
    nome: string;
    email: string;
    cpf: string; 
    foto_perfil?: string; 
}

interface Recrutador {
    nome: string;
    email: string;
    cnpj: string; 
    empresa: string; 
    foto_perfil?: string; 
}

interface Vaga {
    id_recrutador: string; // UUID do recrutador
    titulo: string;
    descricao: string;
    localizacao: string;
    requisitos: string;
    salario?: number; // Salário opcional
}

interface SolicitacaoEntrevista {
    id_recrutador: string; // UUID do recrutador
    id_candidato: string; // UUID do candidato
    id_vaga: string; // UUID da vaga
    data_entrevista: string; // Data da entrevista (ISO 8601 string)
    horario: string; // Horário da entrevista (ISO 8601 string)
    local: string;
    status: 'pendente' | 'aceita' | 'recusada'; // Status da solicitação
}

interface RespostaCandidato {
    id_solicitacao: string; // UUID da solicitação de entrevista
    id_candidato: string; // UUID do candidato
    resposta: 'aceita' | 'recusada'; // Resposta do candidato
}

interface ChatbotInteracao {
    id_candidato: string; // UUID do candidato
    id_recrutador: string; // UUID do recrutador
    mensagem: string;
    resposta_chatbot: string;
}

interface ConfiguracoesApp {
    id_candidato?: string; // UUID do candidato (opcional)
    id_recrutador?: string; // UUID do recrutador (opcional)
    notificacoes?: boolean;
    idioma?: 'pt-BR' | 'en-US'; // Idioma preferido
    tema?: 'claro' | 'escuro'; // Tema preferido
}

export const saveCandidatoToSupabase = async (candidato: Candidato) => {
    try {
        const { data, error } = await supabase
            .from('candidatos')
            .insert([candidato]);

        if (error) throw error;
        return data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Erro ao salvar candidato no Supabase:', error.message);
        } else {
            console.error('Erro desconhecido ao salvar candidato no Supabase:', error);
        }
        throw error;
    }
};

export const saveRecrutadorToSupabase = async (recrutador: Recrutador) => {
    try {
        const { data, error } = await supabase
            .from('recrutadores')
            .insert([recrutador]);

        if (error) throw error;
        return data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Erro ao salvar recrutador no Supabase:', error.message);
        } else {
            console.error('Erro desconhecido ao salvar recrutador no Supabase:', error);
        }
        throw error;
    }
};

export const saveVagaToSupabase = async (vaga: Vaga) => {
    try {
        const { data, error } = await supabase
            .from('vagas')
            .insert([vaga]);

        if (error) throw error;
        return data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Erro ao salvar vaga no Supabase:', error.message);
        } else {
            console.error('Erro desconhecido ao salvar vaga no Supabase:', error);
        }
        throw error;
    }
};

export const saveSolicitacaoEntrevistaToSupabase = async (solicitacao: SolicitacaoEntrevista) => {
    try {
        const { data, error } = await supabase
            .from('solicitacoes_entrevista')
            .insert([solicitacao]);

        if (error) throw error;
        return data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Erro ao salvar solicitação de entrevista no Supabase:', error.message);
        } else {
            console.error('Erro desconhecido ao salvar solicitação de entrevista no Supabase:', error);
        }
        throw error;
    }
};

export const saveRespostaCandidatoToSupabase = async (resposta: RespostaCandidato) => {
    try {
        const { data, error } = await supabase
            .from('respostas_candidatos')
            .insert([resposta]);

        if (error) throw error;
        return data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Erro ao salvar resposta do candidato no Supabase:', error.message);
        } else {
            console.error('Erro desconhecido ao salvar resposta do candidato no Supabase:', error);
        }
        throw error;
    }
};

export const saveChatbotInteracaoToSupabase = async (interacao: ChatbotInteracao) => {
    try {
        const { data, error } = await supabase
            .from('chatbot_interacoes')
            .insert([interacao]);

        if (error) throw error;
        return data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Erro ao salvar interação do chatbot no Supabase:', error.message);
        } else {
            console.error('Erro desconhecido ao salvar interação do chatbot no Supabase:', error);
        }
        throw error;
    }
};

export const saveConfiguracoesAppToSupabase = async (configuracoes: ConfiguracoesApp) => {
    try {
        const { data, error } = await supabase
            .from('configuracoes_app')
            .insert([configuracoes]);

        if (error) throw error;
        return data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Erro ao salvar configurações do app no Supabase:', error.message);
        } else {
            console.error('Erro desconhecido ao salvar configurações do app no Supabase:', error);
        }
        throw error;
    }
};
