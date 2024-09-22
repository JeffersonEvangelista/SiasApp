import { createClient } from '@supabase/supabase-js';
import { getCurrentUserEmail } from '../services/Firebase';

// Configure seu Supabase
export const supabaseUrl = 'https://enpcrnmsdcjekxmkrlaf.supabase.co';
export const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucGNybm1zZGNqZWt4bWtybGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0NDY5NzEsImV4cCI6MjA0MTAyMjk3MX0.BInW3v-YBtlK1OrG9W0uR1qtLEOcEEP7G_I8NpYotyA';
export const supabase = createClient(supabaseUrl, supabaseKey);

// ========================================================  Definições de Interfaces ==================================================
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
    id_recrutador: string;
    titulo: string;
    descricao: string;
    localizacao: string;
    requisitos: string;
    salario?: number;
}
interface SolicitacaoEntrevista {
    id_recrutador: string;
    id_candidato: string;
    id_vaga: string;
    data_entrevista: string;
    horario: string;
    local: string;
    status: 'pendente' | 'aceita' | 'recusada';
}
interface RespostaCandidato {
    id_solicitacao: string;
    id_candidato: string;
    resposta: 'aceita' | 'recusada';
}
interface ChatbotInteracao {
    id_candidato: string;
    id_recrutador: string;
    mensagem: string;
    resposta_chatbot: string;
}
interface ConfiguracoesApp {
    id_candidato?: string;
    id_recrutador?: string;
    notificacoes?: boolean;
    idioma?: 'pt-BR' | 'en-US';
    tema?: 'claro' | 'escuro';
}

//==========================================================  Funções de Inserção ==========================================================
// =============================== Candidatos
export const saveCandidatoToSupabase = async (candidato: Candidato) => {
    try {
        const { data, error } = await supabase
            .from('candidatos')
            .insert([candidato]);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao salvar candidato no Supabase:', error instanceof Error ? error.message : error);
        throw error;
    }
};

// =============================== Recrutadores
export const saveRecrutadorToSupabase = async (recrutador: Recrutador) => {
    try {
        const { data, error } = await supabase
            .from('recrutadores')
            .insert([recrutador]);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao salvar recrutador no Supabase:', error instanceof Error ? error.message : error);
        throw error;
    }
};

// =============================== Vagas
export const saveVagaToSupabase = async (vaga: Vaga) => {
    try {
        const { data, error } = await supabase
            .from('vagas')
            .insert([vaga]);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao salvar vaga no Supabase:', error instanceof Error ? error.message : error);
        throw error;
    }
};

// =============================== Solicitacoes
export const saveSolicitacaoEntrevistaToSupabase = async (solicitacao: SolicitacaoEntrevista) => {
    try {
        const { data, error } = await supabase
            .from('solicitacoes_entrevista')
            .insert([solicitacao]);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao salvar solicitação de entrevista no Supabase:', error instanceof Error ? error.message : error);
        throw error;
    }
};

// =============================== Respostas dos candidatos
export const saveRespostaCandidatoToSupabase = async (resposta: RespostaCandidato) => {
    try {
        const { data, error } = await supabase
            .from('respostas_candidatos')
            .insert([resposta]);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao salvar resposta do candidato no Supabase:', error instanceof Error ? error.message : error);
        throw error;
    }
};

// =============================== Chatbot
export const saveChatbotInteracaoToSupabase = async (interacao: ChatbotInteracao) => {
    try {
        const { data, error } = await supabase
            .from('chatbot_interacoes')
            .insert([interacao]);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao salvar interação do chatbot no Supabase:', error instanceof Error ? error.message : error);
        throw error;
    }
};

// =============================== Configuracoes
export const saveConfiguracoesAppToSupabase = async (configuracoes: ConfiguracoesApp) => {
    try {
        const { data, error } = await supabase
            .from('configuracoes_app')
            .insert([configuracoes]);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao salvar configurações do app no Supabase:', error instanceof Error ? error.message : error);
        throw error;
    }
};
//======================================================================================================================================


//==========================================================  Funções de Busca ==========================================================

// =============================== Chatbot
export const fetchChatbotInteracao = async (id_candidato: string, id_recrutador: string) => {
    try {
        const { data, error } = await supabase
            .from('chatbot_interacoes')
            .select('*')
            .eq('id_candidato', id_candidato)
            .eq('id_recrutador', id_recrutador);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar interação do chatbot no Supabase:', error instanceof Error ? error.message : error);
        throw error;
    }
};

// =============================== Candidatos
export const fetchCandidato = async (id: string) => {
    try {
        const { data, error } = await supabase
            .from('candidatos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar candidato no Supabase:', error instanceof Error ? error.message : error);
        throw error;
    }
};

// =============================== Recrutadores
export const fetchRecrutador = async (id: string) => {
    try {
        const { data, error } = await supabase
            .from('recrutadores')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar recrutador no Supabase:', error instanceof Error ? error.message : error);
        throw error;
    }
};

// =============================== Vagas
export const fetchVaga = async (id: string) => {
    try {
        const { data, error } = await supabase
            .from('vagas')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar vaga no Supabase:', error instanceof Error ? error.message : error);
        throw error;
    }
};

// =============================== Solicitadoes
export const fetchSolicitacaoEntrevista = async (id: string) => {
    try {
        const { data, error } = await supabase
            .from('solicitacoes_entrevista')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar solicitação de entrevista no Supabase:', error instanceof Error ? error.message : error);
        throw error;
    }
};

// =============================== Respostas
export const fetchRespostaCandidato = async (id: string) => {
    try {
        const { data, error } = await supabase
            .from('respostas_candidatos')
            .select('*')
            .eq('id_solicitacao', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar resposta do candidato no Supabase:', error instanceof Error ? error.message : error);
        throw error;
    }
};
// Função para obter o nome do usuário logado
export const getUserName = async (): Promise<string> => {
    try {
        const email = await getCurrentUserEmail();
        if (!email) {
            throw new Error('Email do usuário não encontrado');
        }

        console.log(`Email do usuário: ${email}`);

        // Tente buscar o usuário como candidato
        const candidato = await fetchCandidatoByEmail(email);
        if (candidato) {
            console.log(`Candidato encontrado: ${candidato.nome}`);
            const chatbotCount = await countChatbotInteractionsForUser(candidato.id, true);
            console.log(`Quantidade de interações de chatbot do candidato ${candidato.nome}: ${chatbotCount}`);
            return candidato.nome;
        }

        // Se não for candidato, tente buscar como recrutador
        const recrutador = await fetchRecrutadorByEmail(email);
        if (recrutador) {
            console.log(`Recrutador encontrado: ${recrutador.nome}`);
            const chatbotCount = await countChatbotInteractionsForUser(recrutador.id, false);
            console.log(`Quantidade de interações de chatbot do recrutador ${recrutador.nome}: ${chatbotCount}`);
            return recrutador.nome;
        }

        throw new Error('Usuário não encontrado em nenhuma das tabelas');

    } catch (error) {
        console.error('Erro ao obter nome do usuário:', error instanceof Error ? error.message : error);
        throw error; // Re-lança o erro para tratamento adicional se necessário
    }
};

// Função para buscar candidato pelo email
export const fetchCandidatoByEmail = async (email: string): Promise<any | null> => {
    try {
        const { data, error } = await supabase
            .from('candidatos')
            .select('*')
            .ilike('email', email);

        console.log('Dados retornados da tabela candidatos:', { data, error });

        if (error) throw error;

        if (data.length === 0) {
            console.log(`Nenhum candidato encontrado para o email: ${email}`);
            return null;
        } else {
            console.log(`Resultados da busca por candidato: ${data.length} encontrado(s).`);
            return data[0];
        }
    } catch (error) {
        console.error('Erro ao buscar candidato no Supabase:', error instanceof Error ? error.message : error);
        throw error;
    }
};
// Função para obter o nome e o ID do usuário logado
export const getUserNameAndId = async (): Promise<{ nome: string; id: string }> => {
    try {
        const email = await getCurrentUserEmail();
        if (!email) {
            throw new Error('Email do usuário não encontrado');
        }

        console.log(`Email do usuário: ${email}`);

        // Tente buscar o usuário como candidato
        const candidato = await fetchCandidatoByEmail(email);
        if (candidato) {
            console.log(`Candidato encontrado: ${candidato.nome}`);
            const chatbotCount = await countChatbotInteractionsForUser(candidato.id, true);
            console.log(`Quantidade de interações de chatbot do candidato ${candidato.nome}: ${chatbotCount}`);
            return { nome: candidato.nome, id: candidato.id }; // Retorna o nome e o ID
        }

        // Se não for candidato, tente buscar como recrutador
        const recrutador = await fetchRecrutadorByEmail(email);
        if (recrutador) {
            console.log(`Recrutador encontrado: ${recrutador.nome}`);
            const chatbotCount = await countChatbotInteractionsForUser(recrutador.id, false);
            console.log(`Quantidade de interações de chatbot do recrutador ${recrutador.nome}: ${chatbotCount}`);
            return { nome: recrutador.nome, id: recrutador.id }; // Retorna o nome e o ID
        }

        throw new Error('Usuário não encontrado em nenhuma das tabelas');

    } catch (error) {
        console.error('Erro ao obter nome do usuário:', error instanceof Error ? error.message : error);
        throw error; // Re-lança o erro para tratamento adicional se necessário
    }
};

// Função para buscar recrutador pelo email
export const fetchRecrutadorByEmail = async (email: string): Promise<any | null> => {
    try {
        const { data, error } = await supabase
            .from('recrutadores')
            .select('*')
            .ilike('email', email);

        console.log('Dados retornados da tabela recrutadores:', { data, error });

        if (error) throw error;

        if (data.length === 0) {
            console.log(`Nenhum recrutador encontrado para o email: ${email}`);
            return null;
        } else {
            console.log(`Resultados da busca por recrutador: ${data.length} encontrado(s).`);
            return data[0];
        }
    } catch (error) {
        console.error('Erro ao buscar recrutador no Supabase:', error instanceof Error ? error.message : error);
        throw error;
    }
};
// Função para contar interações de chatbot do usuário
export const countChatbotInteractionsForUser = async (userId: string, isCandidato: boolean): Promise<number> => {
    try {
        const { count, error } = await supabase
            .from('chatbot_interacoes')
            .select('id', { count: 'exact' })
            .eq(isCandidato ? 'id_candidato' : 'id_recrutador', userId);

        if (error) {
            console.error('Erro ao contar interações de chatbot no Supabase:', error);
            throw error;
        }

        console.log('Dados retornados da tabela chatbot_interacoes:', { count });
        return count || 0; // Retorna a contagem ou 0 se não houver dados
    } catch (error) {
        console.error('Erro ao contar interações de chatbot:', error instanceof Error ? error.message : error);
        throw error;
    }
};
export const buscarEntrevistasPorUsuario = async (userId) => {
    // Substitua a consulta pelo código necessário para buscar as entrevistas do usuário no banco de dados
    const { data: aceitas, error: errorAceitas } = await supabase
        .from('solicitacoes_entrevista')
        .select('*')
        .eq('id_candidato', userId)
        .eq('status', 'aceita');

    const { data: pendentes, error: errorPendentes } = await supabase
        .from('solicitacoes_entrevista')
        .select('*')
        .eq('id_candidato', userId)
        .eq('status', 'pendente');

    if (errorAceitas || errorPendentes) {
        throw new Error('Erro ao buscar entrevistas');
    }

    return { aceitas, pendentes };
};

export const buscarEntrevistasPorRecrutador = async (userId) => {
    const { data: aceitas, error: errorAceitas } = await supabase
        .from('solicitacoes_entrevista')
        .select('*')
        .eq('id_recrutador', userId)
        .eq('status', 'aceita');

    const { data: pendentes, error: errorPendentes } = await supabase
        .from('solicitacoes_entrevista')
        .select('*')
        .eq('id_recrutador', userId)
        .eq('status', 'pendente');

    if (errorAceitas || errorPendentes) {
        throw new Error('Erro ao buscar entrevistas');
    }

    return { aceitas, pendentes };
};
export const contarEntrevistasPorUsuario = async (userId) => {
    // Primeiro, tenta contar pelo id_recrutador
    let { data, error } = await supabase
        .from('solicitacoes_entrevista')
        .select('id', { count: 'exact' })
        .eq('id_recrutador', userId);

    // Se não encontrou, tenta contar pelo id_candidato
    if (error || (data && data.length === 0)) {
        console.log(`Nenhuma entrevista encontrada com id_recrutador: ${userId}. Tentando com id_candidato...`);

        ({ data, error } = await supabase
            .from('solicitacoes_entrevista')
            .select('id', { count: 'exact' })
            .eq('id_candidato', userId));
    }

    if (error) {
        console.error('Erro ao contar entrevistas:', error);
        throw new Error('Erro ao contar entrevistas');
    }

    return data.length; // Retorna o total de registros
};
