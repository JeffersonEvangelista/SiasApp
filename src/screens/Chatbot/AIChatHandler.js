import { Alert } from 'react-native';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from 'uuid';

// Variáveis de controle para o estado da entrevista
let interviewState = {
    introductionGiven: false,
    step: 0,
    userPosition: "",
    userExperienceLevel: "",
    userEducation: "",
    informationCollected: false,
    questionsAndAnswers: [] // Adiciona esta linha
};

// Função para lidar com a mensagem do usuário
export const handleUserMessage = async (message, setMessages) => {
    const API_KEY = 'AIzaSyAipfv2TKBNwxjDyCbW8iol0PgBFYB9LYY';
    console.log(`Processando mensagem do usuário: ${message}`);

    const genAI = new GoogleGenerativeAI(API_KEY);

    // Verifica se a palavra-chave "Encerrar" foi digitada
    if (message.toLowerCase().includes("encerrar")) {
        try {
            // Cria uma string para armazenar as perguntas e respostas
            const questionsAnswersText = interviewState.questionsAndAnswers.map(q => {
                return `Pergunta: ${q.question}\nResposta: ${q.answer}`;
            }).join("\n\n");

            // Gera um feedback dinâmico utilizando as informações coletadas
            const feedbackPrompt = `
        Você é um entrevistador experiente que acabou de conduzir uma entrevista com base nas seguintes informações:
        - Posição: ${interviewState.userPosition}
        - Nível de experiência: ${interviewState.userExperienceLevel}
        - Formação: ${interviewState.userEducation}
        - Perguntas e Respostas:
        ${questionsAnswersText}

        Avalie o desempenho do candidato considerando os detalhes fornecidos.
        Informe os pontos fortes, as áreas a melhorar, erros cometidos durante a entrevista, e gere uma nota final para o desempenho do candidato (de 0 a 10).
        Estruture o feedback em três partes: 
        1. **Pontos Fortes**
        2. **Pontos a Melhorar**
        3. **Nota Final**
        Use um tom construtivo e por fim informe se você contrataria esse candidato ou não.
      `;

            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const feedbackResult = await model.generateContent(feedbackPrompt);
            const feedbackText = feedbackResult.response.text();

            const botMessage = {
                id: uuidv4(),
                text: feedbackText,
                sender: 'bot'
            };

            setMessages(prevMessages => [...prevMessages, botMessage]);
            resetInterviewState(); // Reseta o estado para uma nova entrevista

        } catch (error) {
            Alert.alert('Erro', `Não foi possível gerar o feedback. Detalhes: ${error.message}`);
            console.error(error);
        }
        return;
    }

    const handleGenerate = async () => {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            let botMessage;

            if (!interviewState.introductionGiven) {
                // Gera a introdução inicial do entrevistador dinamicamente pela IA
                const introPrompt = `
          Crie uma mensagem de boas-vindas para iniciar uma entrevista de emprego.
          O tom deve ser amigável e profissional. 
          A mensagem deve incluir os seguintes elementos:
          1. Uma apresentação do entrevistador, incluindo um nome fictício (ex: "Olá, eu sou o Lucas Pereira").
          2. Um nome fictício para a empresa (ex: "na TechInnovate").
          3. Uma expressão de entusiasmo para conhecer o candidato e discutir a posição.
          Certifique-se de que a mensagem seja acolhedora e incentive o candidato a se sentir à vontade durante a entrevista.
        `;

                const introResult = await model.generateContent(introPrompt);
                const introText = introResult.response.text();

                botMessage = {
                    id: uuidv4(),
                    text: introText,
                    sender: 'bot'
                };
                interviewState.introductionGiven = true;
            } else if (!interviewState.informationCollected) {
                botMessage = getCollectInfoMessage(message);
            }

            if (botMessage) {
                setMessages(prevMessages => [...prevMessages, botMessage]);
                return;
            }

            // Caso todas as informações tenham sido co letadas, gere a pergunta baseada no perfil
            const prompt = generateInterviewQuestionPrompt();
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            botMessage = {
                id: uuidv4(),
                text,
                sender: 'bot'
            };
            setMessages(prevMessages => [...prevMessages, botMessage]);
        } catch (error) {
            Alert.alert('Erro', `Não foi possível gerar a pergunta. Detalhes: ${error.message}`);
            console.error(error);
        }
    };

    await handleGenerate();
};

// Função para coletar informações do usuário
const getCollectInfoMessage = (message) => {
    if (interviewState.step === 0) {
        interviewState.userPosition = message;
        interviewState.step++;
        return {
            id: uuidv4(),
            text: "Qual é o seu nível de experiência?",
            sender: 'bot'
        };
    } else if (interviewState.step === 1) {
        interviewState.userExperienceLevel = message;
        interviewState.step++;
        return {
            id: uuidv4(),
            text: "Qual é a sua formação?",
            sender: 'bot'
        };
    } else if (interviewState.step === 2) {
        interviewState.userEducation = message;
        interviewState.informationCollected = true;
        return {
            id: uuidv4(),
            text: "Agora que tenho suas informações, posso começar a entrevista.",
            sender: 'bot'
        };
    }
};

// Função para gerar a pergunta de entrevista baseada no perfil
const generateInterviewQuestionPrompt = () => {
    const prompt = `
    Você é um entrevistador experiente que está conduzindo uma entrevista para a posição de ${interviewState.userPosition}.
    O candidato tem ${interviewState.userExperienceLevel} anos de experiência e formação em ${interviewState.userEducation}.
    Gere uma pergunta para o candidato que seja relevante para a posição e que permita avaliar suas habilidades e conhecimentos.
  `;
    return prompt;
};

// Função para resetar o estado da entrevista
export const resetInterviewState = (setInterviewState) => {
    interviewState = {
        introductionGiven: false,
        step: 0,
        userPosition: "",
        userExperienceLevel: "",
        userEducation: "",
        informationCollected: false,
        questionsAndAnswers: []
    };
    setInterviewState(interviewState);
};

export { interviewState };