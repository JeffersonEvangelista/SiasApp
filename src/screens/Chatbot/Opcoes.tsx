import React from 'react';
import { Linking, Text, View, Image } from 'react-native';
import { buscarEntrevistasPorUsuario, buscarEntrevistasPorRecrutador, contarEntrevistasPorUsuario, buscarDataCriacaoUsuario } from '../../services/userService';


export const handleCriadoresDoSistema = (setIsBotTyping: (typing: boolean) => void, setMessages: (messages: any[]) => void) => {
    const creators = [
        { name: 'Davi de Brito Junior', role: 'Líder | Desenvolvedor Full', username: 'DaveBrito' },
        { name: 'Eric Peneres Carneiro', role: 'Desenvolvedor Full', username: 'EricW900' },
        { name: 'Jefferson Moreira Evangelista', role: 'Desenvolvedor Full', username: 'JeffersonEvangelista' },
        { name: 'Pedro Borges de Jesus', role: 'Desenvolvedor Full', username: 'B0rga' },
        { name: 'Wesley Silva dos Santos', role: 'Líder | Desenvolvedor Full', username: 'WesleyS08' },
    ];

    setIsBotTyping(true);

    const sendMessageRecursively = (index) => {
        if (index < creators.length) {
            const member = creators[index];

            // URL para o perfil do GitHub
            const profileUrl = `https://github.com/${member.username}`;

            // URL da imagem do perfil
            const imageUrl = `https://avatars.githubusercontent.com/${member.username}`;

            // Mensagem textual
            const textMessage = `${member.name} (${member.role}) - Visite o perfil: ${profileUrl}`;

            // JSX para a visualização do criador com a imagem e link
            const message = (
                <View style={{ marginBottom: 10, alignItems: 'center' }}>
                    <Image
                        source={{ uri: imageUrl }} // URL da imagem do perfil
                        style={{ width: 50, height: 50, borderRadius: 25 }} // Estilo da imagem
                    />
                    <Text style={{ fontWeight: 'bold' }}>{member.name}</Text>
                    <Text>{member.role}</Text>
                    <Text
                        style={{ color: 'orange' }}
                        onPress={() => Linking.openURL(profileUrl)} // Abre o link do GitHub
                    >
                        {profileUrl}
                    </Text>
                </View>
            );

            // Log da mensagem que está sendo enviada
            console.log('Mensagem enviada: ', {
                text: textMessage,
                sender: 'bot',
                content: message,
            });

            setMessages(prevMessages => [
                ...prevMessages,
                { id: Date.now().toString(), text: textMessage, sender: 'bot', content: message },
            ]);

            setTimeout(() => sendMessageRecursively(index + 1), 500);
        } else {
            setIsBotTyping(false);  
        }
    };

    sendMessageRecursively(0); 
};

export const handleProposito = (setIsBotTyping: (typing: boolean) => void, setMessages: (messages: any[]) => void) => {
    const explanations = [
        { text: `🎉 Estou empolgado em compartilhar o propósito do SIAS App!` },
        { text: `💡 O SIAS foi desenvolvido para otimizar a gestão de entrevistas no setor de Recursos Humanos.` },
        { text: `📋 Objetivo Principal: Facilitar a comunicação e o agendamento de entrevistas.` },
        { text: `👥 Para o RH:` },
        { text: `- Envio de Solicitações: O RH pode enviar solicitações detalhadas para candidatos qualificados.` },
        { text: `- Detalhes das Solicitações: Inclui data, horário e local da entrevista.` },
        { text: `🎓 Para os Candidatos:` },
        { text: `- Gerenciamento de Solicitações: Permite visualizar e gerenciar as solicitações recebidas.` },
        { text: `- Respostas: Os candidatos podem aceitar ou recusar solicitações de forma simples.` },
        { text: `✅ Benefícios:` },
        { text: `- Melhora a comunicação e torna o agendamento de entrevistas mais eficiente.` },
        { text: `Se tiver mais perguntas ou precisar de ajuda, estou aqui para você! 😊` },
    ];

    setIsBotTyping(true);

    const sendMessageRecursively = (index) => {
        if (index < explanations.length) {
            setMessages(prevMessages => [
                ...prevMessages,
                { id: Date.now().toString(), text: explanations[index].text, sender: 'bot' },
            ]);
            setTimeout(() => sendMessageRecursively(index + 1), 500);
        } else {
            setIsBotTyping(false);
        }
    };

    sendMessageRecursively(0);
};

export const handleFuncionalidades = (setIsBotTyping: (typing: boolean) => void, setMessages: (messages: any[]) => void) => {
    const explanations = [
        { text: `🚀 Aqui estão as principais funcionalidades do SIAS App!` },
        { text: `📋 Funcionalidades para o RH:` },
        { text: `- Envio de Solicitações: Permite ao RH enviar solicitações detalhadas para candidatos qualificados.` },
        { text: `- Detalhes das Solicitações: Inclui informações importantes como data, horário e local da entrevista.` },
        { text: `🎓 Funcionalidades para os Candidatos:` },
        { text: `- Gerenciamento de Solicitações: Acesso à aba de gerenciamento para visualizar e gerenciar as solicitações recebidas.` },
        { text: `- Respostas: Possibilidade de aceitar ou recusar as solicitações de uma determinada empresa de forma simples.` },
        { text: `✅ Benefícios:` },
        { text: `- Facilita o processo de agendamento de entrevistas e melhora a comunicação entre o RH e os candidatos.` },
        { text: `Se precisar de mais informações ou tiver dúvidas, estou aqui para ajudar! 😊` },
    ];

    setIsBotTyping(true);

    const sendMessageRecursively = (index) => {
        if (index < explanations.length) {
            setMessages(prevMessages => [
                ...prevMessages,
                { id: Date.now().toString(), text: explanations[index].text, sender: 'bot' },
            ]);
            setTimeout(() => sendMessageRecursively(index + 1), 500);
        } else {
            setIsBotTyping(false);
        }
    };

    sendMessageRecursively(0);
};

export const handleMaisDetalhesSobreOpcoes = (setIsBotTyping: (typing: boolean) => void, setMessages: (messages: any[]) => void) => {
    const explanations = [
        { text: `🤔 Você quer saber mais sobre as opções do SIAS App?` },
        { text: `💡 Aqui estão algumas informações adicionais:` },
        { text: `- Dúvidas do Sistema` },
        { text: `- Relatar algum Bug` },
        { text: `- Dúvidas sobre sua conta` },
        { text: `Se tiver mais perguntas ou precisar de ajuda, posso falar mais sobre cada opção! 😊` },
    ];

    setIsBotTyping(true);

    const sendMessageRecursively = (index) => {
        if (index < explanations.length) {
            setMessages(prevMessages => [
                ...prevMessages,
                { id: Date.now().toString(), text: explanations[index].text, sender: 'bot' },
            ]);
            setTimeout(() => sendMessageRecursively(index + 1), 500);
        } else {
            setIsBotTyping(false);
        }
    };

    sendMessageRecursively(0);
};

export const handleDuvidasDoSistema = (setIsBotTyping: (typing: boolean) => void, setMessages: (messages: any[]) => void) => {
    const explanations = [
        { text: `🤔 Você tem dúvidas sobre o SIAS App?` },
        { text: `💡 Aqui estão algumas infomacoes que vou poder te dar frequentes:` },
        { text: `- Quem me desenvolveu?` },
        { text: `- O Porque fui criado?` },
        { text: `- Minhas funcionalidades` },
        { text: `Se tiver mais perguntas ou precisar de ajuda, estou aqui para você! 😊` },
    ];

    setIsBotTyping(true);

    const sendMessageRecursively = (index) => {
        if (index < explanations.length) {
            setMessages(prevMessages => [
                ...prevMessages,
                { id: Date.now().toString(), text: explanations[index].text, sender: 'bot' },
            ]);
            setTimeout(() => sendMessageRecursively(index + 1), 500);
        } else {
            setIsBotTyping(false);
        }
    };

    sendMessageRecursively(0);
};

export const handleRelatarBug = (setIsBotTyping: (typing: boolean) => void, setMessages: (messages: any[]) => void) => {
    const explanations = [
        { text: `🚨 Você encontrou um bug no SIAS App?` },
        { text: `💡 Nessa opçao voce podera relatar o que  aconteceu` },
        { text: `- E tentaremos resolver o mais rapido o possivel.` },
        { text: `Obrigado por ajudar-nos a melhorar o aplicativo! 😊` },
    ];

    setIsBotTyping(true);

    const sendMessageRecursively = (index) => {
        if (index < explanations.length) {
            setMessages(prevMessages => [
                ...prevMessages,
                { id: Date.now().toString(), text: explanations[index].text, sender: 'bot ' },
            ]);
            setTimeout(() => sendMessageRecursively(index + 1), 500);
        } else {
            setIsBotTyping(false);
        }
    };

    sendMessageRecursively(0);
};

export const handleDuvidasSobreConta = (setIsBotTyping: (typing: boolean) => void, setMessages: (messages: any[]) => void) => {
    const explanations = [
        { text: `🤔 Você tem dúvidas sobre sua conta do SIAS App?` },
        { text: `💡 Aqui estão algumas informações úteis que posso te dar:` },
        { text: `- Quantidade de entrevistas já marcadas` },
        { text: `- Entrevistas confirmadas e  as que esperam uma respota` },
        { text: `- O tempo que voce esta conosco` },
        { text: `Se tiver mais perguntas ou precisar de ajuda, estou aqui para você! 😊` },
    ];

    setIsBotTyping(true);

    const sendMessageRecursively = (index) => {
        if (index < explanations.length) {
            setMessages(prevMessages => [
                ...prevMessages,
                { id: Date.now().toString(), text: explanations[index].text, sender: 'bot' },
            ]);
            setTimeout(() => sendMessageRecursively(index + 1), 500);
        } else {
            setIsBotTyping(false);
        }
    };

    sendMessageRecursively(0);
};
export const handleEntrevistasMarcadas = async (setIsBotTyping: (typing: boolean) => void, setMessages: (messages: any[]) => void, userId: string, userName: string, isCandidato: boolean,) => {
    const initialMessages = [
        { text: `🔍 Claro, vamos dar uma olhada nas suas entrevistas!` },
        { text: `⏳ Um momento, por favor... Estou verificando tudo para você!` },
        { text: `👀 Estou conferindo suas entrevistas agora... Só um instante!` },
    ];

    setIsBotTyping(true);

    // Enviar mensagens iniciais sequencialmente
    for (const message of initialMessages) {
        setMessages((prevMessages) => [
            ...prevMessages,
            { id: Date.now().toString(), text: message.text, sender: 'bot' },
        ]);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Intervalo de 2 segundos entre as mensagens
    }

    try {
        console.log(`Buscando entrevistas para o usuário: ${userName}`);
        setMessages((prevMessages: any[]) => [
            ...prevMessages,
            { id: Date.now().toString(), text: `Buscando entrevistas para o usuário: ${userName}`, sender: 'bot' },
        ]);

        // Buscar entrevistas com base no tipo de usuário
        const entrevistas = isCandidato
            ? await buscarEntrevistasPorUsuario(userId)
            : await buscarEntrevistasPorRecrutador(userId);

        console.log('Entrevistas encontradas:', entrevistas);

        const resultMessages = [
            { text: `Você tem ${entrevistas.aceitas.length} entrevistas aceitas ✅.` },
            { text: `Você tem ${entrevistas.pendentes.length} entrevistas pendentes ⏳.` },
        ];

        // Enviar mensagens sobre a quantidade de entrevistas
        for (const resultMessage of resultMessages) {
            setMessages((prevMessages) => [
                ...prevMessages,
                { id: Date.now().toString(), text: resultMessage.text, sender: 'bot' },
            ]);
            await new Promise((resolve) => setTimeout(resolve, 1500)); // Intervalo de 1,5 segundo
        }

        // Exibir detalhes das entrevistas aceitas, se houver
        if (entrevistas.aceitas.length > 0) {
            setMessages((prevMessages) => [
                ...prevMessages,
                { id: Date.now().toString(), text: `Aqui estão os detalhes das suas entrevistas aceitas:`, sender: 'bot' },
            ]);

            for (const entrevista of entrevistas.aceitas) {
                const detalhes = `✅ Entrevista na data ${entrevista.data} às ${entrevista.hora}, local: ${entrevista.local}.`;
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { id: Date.now().toString(), text: detalhes, sender: 'bot' },
                ]);
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }

        // Exibir detalhes das entrevistas pendentes, se houver
        if (entrevistas.pendentes.length > 0) {
            setMessages((prevMessages) => [
                ...prevMessages,
                { id: Date.now().toString(), text: `Aqui estão os detalhes das suas entrevistas pendentes:`, sender: 'bot' },
            ]);

            for (const entrevista of entrevistas.pendentes) {
                const detalhes = `⏳ Entrevista pendente na data ${entrevista.data} às ${entrevista.hora}, local: ${entrevista.local}.`;
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { id: Date.now().toString(), text: detalhes, sender: 'bot' },
                ]);
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Intervalo de 1 segundo entre detalhes
            }
        }
    } catch (error) {
        console.error('Erro ao buscar entrevistas:', error);
        setMessages((prevMessages) => [
            ...prevMessages,
            { id: Date.now().toString(), text: `Desculpe, ocorreu um erro ao buscar as entrevistas.`, sender: 'bot' },
        ]);
    } finally {
        setIsBotTyping(false);
        console.log('Processo de busca de entrevistas finalizado.');
    }
};
// Função para lidar com a quantidade de solicitações
export const handleQuantidadeSolicitacoes = async (setIsBotTyping: (typing: boolean) => void, setMessages: (messages: any[]) => void, userId: string, userName: string, isCandidato: boolean) => {
    const initialMessages = [
        { text: `🔍 Claro, vamos dar uma olhada nas suas entrevistas!` },
        { text: `⏳ Um momento, por favor... Estou verificando tudo para você!` },
    ];

    setIsBotTyping(true);

    // Enviar mensagens iniciais sequencialmente com intervalo
    for (const message of initialMessages) {
        setMessages((prevMessages) => [
            ...prevMessages,
            { id: Date.now().toString(), text: message.text, sender: 'bot' },
        ]);
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    try {
        console.log(`Contando entrevistas para o usuário: ${userName}`);

        // Função de contagem de entrevistas (depende do `userId`)
        const totalEntrevistas = await contarEntrevistasPorUsuario(userId);

        console.log(`Total de entrevistas encontradas: ${totalEntrevistas}`);

        // Mensagem de confirmação após contagem
        setMessages((prevMessages) => [
            ...prevMessages,
            { id: Date.now().toString(), text: `Contando o número de entrevistas para o usuário: ${userName}`, sender: 'bot' },
        ]);

        // Enviar mensagem com a quantidade total de solicitações
        setMessages((prevMessages) => [
            ...prevMessages,
            {
                id: Date.now().toString(),
                text: `📋 Você possui um total de ${totalEntrevistas} solicitações de entrevista.`,
                sender: 'bot',
            },
        ]);
    } catch (error) {
        console.error('Erro ao contar entrevistas:', error);

        // Mensagem de erro
        setMessages((prevMessages) => [
            ...prevMessages,
            {
                id: Date.now().toString(),
                text: `⚠️ Desculpe, ocorreu um erro ao contar as entrevistas. Tente novamente mais tarde.`,
                sender: 'bot',
            },
        ]);
    } finally {
        setIsBotTyping(false); // Bot parou de "digitar"
    }
};
export const handleTempoConosco = async (setIsBotTyping: (typing: boolean) => void, setMessages: (messages: any[]) => void, userId: string, userName: string) => {
    if (!userId || !userName) {
        console.error('Erro ao calcular o tempo no sistema: userId ou userName não definidos');
        setMessages(prevMessages => [
            ...prevMessages,
            { id: Date.now().toString(), text: `⚠️ Desculpe, ocorreu um erro ao calcular o tempo no sistema.`, sender: 'bot' },
        ]);
        return;
    }

    setIsBotTyping(true);

    try {
        console.log(`Calculando tempo no sistema para o usuário: ${userName}`);

        // Chama a função que busca a data de criação
        const dataCriacao = await buscarDataCriacaoUsuario(userId, userName);

        if (!dataCriacao) {
            throw new Error('Data de criação não encontrada');
        }

        const dataAtual = new Date();
        const dataInicio = new Date(dataCriacao);

        // Cálculo de anos, meses e dias
        const anos = dataAtual.getFullYear() - dataInicio.getFullYear();
        const meses = dataAtual.getMonth() - dataInicio.getMonth();
        const dias = dataAtual.getDate() - dataInicio.getDate();

        const mesesAjustados = meses < 0 ? meses + 12 : meses;
        const diasAjustados = dias < 0 ? dias + new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 0).getDate() : dias;

        // Mensagem formatada
        let mensagemTempo = `Uau 🤯 Você está conosco há `;
        if (anos > 0) mensagemTempo += `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
        if (mesesAjustados > 0) mensagemTempo += `, ${mesesAjustados} ${mesesAjustados === 1 ? 'mês' : 'meses'}`;
        if (diasAjustados > 0) mensagemTempo += `  ${diasAjustados} ${diasAjustados === 1 ? 'dia' : 'dias'}`;
        mensagemTempo += '.';

        // Enviar mensagem ao usuário
        setMessages(prevMessages => [
            ...prevMessages,
            { id: Date.now().toString(), text: mensagemTempo, sender: 'bot' },
        ]);

        console.log('Tempo no sistema calculado com sucesso!');
    } catch (error) {
        console.error('Erro ao calcular o tempo no sistema:', error);
        setMessages(prevMessages => [
            ...prevMessages,
            { id: Date.now().toString(), text: `⚠️ Desculpe, ocorreu um erro ao calcular o tempo no sistema.`, sender: 'bot' },
        ]);
    } finally {
        setIsBotTyping(false);
    }
};