
# Sias App 

Este repositório é dedicado ao desenvolvimento do aplicativo SIAS.

Para garantir a eficiência e a clareza ao longo do projeto, adotamos uma abordagem colaborativa envolvendo todos os membros da equipe. Utilizamos a metodologia de arquitetura C4 (Context, Containers, Components, and Code), que nos proporcionou uma estrutura robusta e bem-organizada. Essa abordagem ajudou a estruturar o desenvolvimento de forma coesa e a gerenciar o sistema de maneira eficaz.


## Pré-requisitos

Antes de rodar o projeto, certifique-se de que você tem as seguintes ferramentas instaladas na sua máquina:

- [Node.js](https://nodejs.org/) (versão recomendada: LTS)
- [npm](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/) (gerenciador de pacotes)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (se você estiver usando Expo)
- [Git](https://git-scm.com/) (para versionamento e controle de código)
- [Expo GO](https://expo.dev/go) (para versionamento e controle de código)
- Ou 
- [Android Studio](https://developer.android.com/studio?hl=pt-br) (para versionamento e controle de código)


## Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/JeffersonEvangelista/SiasApp 
   ```

2. Navegue até o diretório do projeto:
 ```bash
   cd seu-repositorio 
   ```

3. Abra o seu terminal:
 ```bash
   1. npm install expo
   2. npm install -g expo-cli  (Opcional) Instale o Expo CLI globalmente, se ainda não o fez: 
   3. npm install
   4. npx expo start
   ```
   

## Rodando localmente

### Usando Expo Go

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run start
   ```
ou, se você tiver o Expo CLI instalado globalmente:
 ```bash
    expo start
   ```

2. Abra o Expo Go
- No seu dispositivo móvel: Instale o aplicativo [Expo Go](https://expo.dev/go) da Play Store (Android) ou App Store (iOS).
- No Expo Go: Use o aplicativo para escanear o QR code exibido no terminal ou na página que se abrirá no seu navegador após iniciar o servidor.

3. Teste o aplicativo:
- O aplicativo será carregado e exibido no seu dispositivo móvel.


###  Usando Android Studio

1. Inicie o servidor de desenvolvimento:

```bash
    npm run start
   ``` 
   ou, se você tiver o Expo CLI instalado globalmente:
```bash
    expo start

``` 

2. Configure o emulador Android:

- Abra o Android Studio e inicie um emulador Android. Se você ainda não tiver um emulador configurado, você pode criar um novo dispositivo virtual através do Android Studio.
3. Inicie o aplicativo no emulador:

- No terminal onde o servidor de desenvolvimento está rodando, pressione a para abrir o aplicativo no emulador Android.
4. Teste o aplicativo:

- O aplicativo será carregado e exibido no emulador Android.

### Atenção

Ao iniciar o projeto, ele pode aparecer como **"Using development build"**. Para que funcione corretamente no Expo Go, é necessário estar no modo **"Using Expo Go"**.

Para fazer essa mudança:

- Clique na letra **"S"** no canto inferior direito da tela do Expo.
## Visão Geral

O **SIAS** é projetado para otimizar a gestão de entrevistas realizadas pelo setor de Recursos Humanos. Nosso objetivo é proporcionar facilidade e agilidade tanto para o RH quanto para os candidatos.

### Funcionalidades

#### Para o RH
- **Envio de Solicitações**: O RH pode enviar solicitações detalhadas para candidatos qualificados.
- **Detalhes das Solicitações**: As solicitações incluem informações como data, horário e local da entrevista.

#### Para os Candidatos
- **Gerenciamento de Solicitações**: Os candidatos podem acessar a aba de gerenciamento para visualizar e gerenciar as solicitações recebidas.
- **Respostas**: Os candidatos podem aceitar ou recusar as solicitações recebidas de uma determinada empresa.

### Benefícios

- **Facilidade e Agilidade**: Facilita o processo de agendamento de entrevistas e a comunicação entre RH e candidatos.

## Ferramentas Utilizadas

O desenvolvimento do **SIAS Mobile** envolve várias ferramentas essenciais que garantem o funcionamento eficiente do aplicativo. As ferramentas incluem tecnologias para a interface do usuário, linguagens de programação e bancos de dados para gerenciar a lógica do servidor e o armazenamento de dados, além de ferramentas adicionais para desenvolvimento e testes.

| Ferramenta     | Descrição                                                         | Uso no Projeto                                                 |
|----------------|-------------------------------------------------------------------|----------------------------------------------------------------|
| **Firebase**   | Plataforma de desenvolvimento do Google com diversas ferramentas e serviços. | Utilizado para autenticação e gerenciamento de dados em tempo real. |
| **Supabase**   | Plataforma de banco de dados de código aberto.                    | Utilizado para gerenciamento de banco de dados e autenticação. |
| **Expo Go**    | Aplicativo que permite visualizar e testar aplicativos Expo no dispositivo móvel. | Utilizado para testar e visualizar o aplicativo durante o desenvolvimento. |
| **Postman**    | Ferramenta para testar APIs e endpoints.                           | Utilizado para testar e depurar chamadas de API durante o desenvolvimento. |
| **Visual Studio Code (VSCode)** | Editor de código fonte leve e poderoso da Microsoft. | Utilizado como IDE principal para desenvolvimento do código-fonte do aplicativo. |
| **Figma**      | Ferramenta de design colaborativo para criação de interfaces de usuário. | Utilizada para design e prototipagem das interfaces do SIAS.    |
| **Android Studio** | Ambiente de desenvolvimento integrado (IDE) para Android.        | Utilizado para desenvolvimento e testes do aplicativo Android. |
| **Trello**     | Ferramenta de gestão de projetos e tarefas.                       | Utilizada para organização e acompanhamento do progresso do projeto. |

## Tecnologias Fundamentais

O **SIAS Mobile** utiliza uma combinação de tecnologias modernas para proporcionar uma experiência rica e interativa no aplicativo. A principal tecnologia utilizada é o **React Native** com o **Expo**, que facilita o desenvolvimento e o teste do aplicativo em dispositivos móveis.

| Tecnologia              | Descrição                                                        | Uso no Projeto                                                 |
|-------------------------|------------------------------------------------------------------|----------------------------------------------------------------|
| **React Native**        | Framework de desenvolvimento de aplicativos móveis usando JavaScript e React. | Utilizado para construir a interface do usuário e a lógica do aplicativo de forma nativa para Android e iOS. |
| **Expo**                | Conjunto de ferramentas e serviços para desenvolvimento com React Native. | Facilita o desenvolvimento, testes e construção do aplicativo, fornecendo APIs e ferramentas adicionais para melhorar a produtividade. |
| **React Navigation**    | Biblioteca para gerenciamento de navegação em aplicativos React Native. | Utilizada para criar e gerenciar a navegação entre telas e rotas no aplicativo. |
| **React Native Paper**  | Biblioteca de componentes UI para React Native, seguindo as diretrizes do Material Design. | Utilizada para construir interfaces de usuário com componentes estilizados e consistentes. |
| **React Native Elements** | Biblioteca de componentes UI para React Native com um design unificado. | Utilizada para fornecer componentes prontos para uso e customizáveis, melhorando a consistência e eficiência do desenvolvimento. |
| **Google Calendar API** | API para integração com o Google Calendar.                       | Utilizada para gerenciamento e sincronização de eventos no calendário. |
| **ChatBot**             | API para integração com chatbots e serviços de mensagem.          | Utilizada para suporte e interação com os usuários através de chatbots. |
 e Etc 

 ## Equipe de Desenvolvimento

O projeto **SIAS Mobile** é desenvolvido por um time talentoso de estudantes da FATEC Zona Sul. Cada membro traz habilidades únicas e desempenha um papel essencial para o sucesso do projeto. Conheça nossa equipe:

- **[Davi de Brito Junior](https://github.com/DaveBrito)** - *Líder, Desenvolvedor Full-Stack*
  

- **[Eric Peneres Carneiro](https://github.com/EricW900)** - *Desenvolvedor Full-Stack*
 

- **[Pedro Borges de Jesus](https://github.com/B0rga)** - *Desenvolvedor Full-Stack*
 
- **[Jefferson Moreira Evangelista](https://github.com/JeffersonEvangelista)** - *Desenvolvedor Full-Stack*
 
- **[Wesley Silva dos Santos](https://github.com/WesleyS08)** - *Líder, Desenvolvedor Full-Stack*


Cada membro da equipe traz uma combinação de habilidades técnicas e criatividade para garantir que o **SIAS Mobile** ofereça a melhor experiência possível para os usuários. Estamos comprometidos em criar um aplicativo eficiente e inovador, aproveitando ao máximo as habilidades e o conhecimento de cada um.
