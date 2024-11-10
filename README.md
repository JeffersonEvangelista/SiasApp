# Sias App

Este repositório é dedicado ao desenvolvimento do aplicativo SIAS.

Para garantir a eficiência e a clareza ao longo do projeto, adotamos uma abordagem colaborativa envolvendo todos os membros da equipe. Utilizamos a metodologia de arquitetura C4 (Context, Containers, Components, and Code), que nos proporcionou uma estrutura robusta e bem-organizada. Essa abordagem ajudou a estruturar o desenvolvimento de forma coesa e a gerenciar o sistema de maneira eficaz.

**Aviso:** Este projeto é uma extensão da versão web do SIAS, que lida com entrevistas, solicitações de entrevistas e agendamentos. No entanto, no aplicativo, as funcionalidades de criação de vagas e inscrição nelas não estão disponíveis. Portanto, contas novas podem não ter acesso a todas as funcionalidades que estão presentes "em contas mais antigas".

## Descrição das Funcionalidades

O **SIAS** é projetado para otimizar a gestão de entrevistas realizadas pelo setor de Recursos Humanos, proporcionando facilidade e agilidade tanto para o RH quanto para os candidatos.

### Funcionalidades

#### Para o RH
 - **Envio de Solicitações**: O RH pode enviar solicitações detalhadas para candidatos qualificados.
  - **Detalhes das Solicitações**: Cada solicitação inclui informações como data, horário e local da entrevista, garantindo que o candidato tenha todos os dados necessários.

#### Para os Candidatos
 - **Gerenciamento de Solicitações**: Os candidatos podem acessar uma aba de gerenciamento para visualizar e acompanhar todas as solicitações recebidas.
 - **Respostas às Solicitações**: Os candidatos têm a opção de aceitar ou recusar as solicitações recebidas de uma empresa específica.

#### Funcionalidades Comuns
- **Chatbot de Suporte**: Disponível para RH e candidatos, o chatbot responde às dúvidas mais frequentes relacionadas à conta e uso da plataforma, proporcionando suporte rápido e acessível.
- **Modo de Treinamento para Entrevistas**: Uma ferramenta prática que auxilia candidatos a se prepararem para entrevistas, com perguntas simuladas e orientações úteis, aumentando a confiança e o preparo dentro do chatbot.

### Benefícios
- **Facilidade e Agilidade**: Facilita o processo de agendamento de entrevistas e melhora a comunicação entre RH e candidatos, tornando o fluxo mais eficiente para ambas as partes.
- **Suporte Prático**: Com o chatbot integrado e o modo de treino, o SIAS oferece suporte e orientação contínua para candidatos e RH, aprimorando a experiência de uso.

## Instalação

1. Clone o repositório:

```bash
git clone https://github.com/JeffersonEvangelista/SiasApp
```

2. Navegue até o diretório do projeto:
```bash
cd SiasApp
```
3. Instale as dependências e configure o ambiente:
- Instale o Expo (se ainda não o fez):
```bash
npm install expo
```
- Instale o Expo CLI globalmente
 ```bash
npm install -g expo-cli
```
- Instale as dependências do projeto:
```bash
npm install
```
- Inicie o servidor de desenvolvimento:
```bash
npx expo start
```
Ou se preferir, inicie sem login com o modo anônimo
```bash
npx expo start --no-auth
```



## Rodando Localmente

### Usando Expo Go

1. Inicie o servidor de desenvolvimento:

- Com login no Expo
```bash
npx expo start 
```
- Sem login, no modo anônimo:
```bash
npx expo start --no-auth  
```
2. Abra o Expo Go:
- **No dispositivo móvel:** Instale o aplicativo Expo Go pela Play Store (Android) ou App Store (iOS).
- **No Expo Go:** Use o aplicativo para escanear o QR code exibido no terminal ou na página que abrirá no navegador.

3. Teste o aplicativo:

- O aplicativo será carregado e exibido no seu dispositivo móvel.

### Usando Android Studio

1. Inicie o servidor de desenvolvimento:

- Com login no Expo
```bash
npx expo start 
```
- Sem login, no modo anônimo:
```bash
npx expo start --no-auth  
```
2. Configure o emulador Android:
- **Abra o Android Studio** e inicie um emulador Android. Se ainda não tiver um emulador configurado, você pode criar um novo dispositivo virtual através do Android Studio

3. Inicie o aplicativo no emulador:

- No terminal onde o servidor de desenvolvimento está rodando, pressione "a" para abrir o aplicativo no emulador Android.

### Atenção
Ao iniciar o projeto, ele pode aparecer como "Using development build". Para que funcione corretamente no Expo Go, é necessário estar no modo "Using Expo Go".

Para fazer essa mudança:
  - Clique na letra **"S"** no canto inferior direito da tela do Expo.

## Imagens do APP

| Tela de Cadastro | Tela de Login |
|------------------|---------------|
| ![Tela de Cadastro](/img/cadastro.jpg) | ![Tela de Login](/img/login.jpg) |
| Tela de Home     | Tela de Agenda |
| ![Tela de Home](/img/home.jpg) | ![Tela de Agenda](/img/Agenda.jpg) |
| Tela de Chat     | Tela de Chatbot |
| ![Tela de Chat](/img/Chat.jpg) | ![Tela de Chatbot](/img/chatbot.jpg) |
| Tela de Configuração |       |
| ![Tela de Configuração](/img/Configuração.jpg) |       |


## Download

Aqui você pode encontrar as instruções para baixar o aplicativo.

[Ir para a seção de download](https://www.terabox.com/portuguese/sharing/link?surl=CCUoYOM3GXzF_FMQuaNGkw)

ou escaneá o QR Code abaixo:
![QR Code](/img/qrcode.png)

## Ferramentas Utilizadas

O desenvolvimento do **SIAS Mobile** envolve várias ferramentas essenciais que garantem o funcionamento eficiente do aplicativo. As ferramentas incluem tecnologias para a interface do usuário, linguagens de programação e bancos de dados para gerenciar a lógica do servidor e o armazenamento de dados, além de ferramentas adicionais para desenvolvimento e testes.

| **Ferramenta**               | **Descrição**                                                         | **Uso no Projeto**                                           |
|------------------------------|-----------------------------------------------------------------------|------------------------------------------------------------|
| **Firebase**                 | Plataforma do Google que oferece diversas ferramentas e serviços.     | Utilizada para autenticação e gerenciamento de dados em tempo real. |
| **Supabase**                 | Plataforma de banco de dados de código aberto, alternativa ao Firebase.| Utilizada para gerenciamento de banco de dados. |
| **Expo Go**                  | Aplicativo que permite visualizar e testar aplicativos Expo em dispositivos móveis. | Utilizado para testar e visualizar o aplicativo durante o desenvolvimento. |
| **Postman**                  | Ferramenta para testar APIs e seus endpoints.                         | Utilizada para testar e depurar chamadas de API durante o desenvolvimento. |
| **Visual Studio Code (VSCode)** | Editor de código-fonte leve e poderoso da Microsoft.               | Utilizado como IDE principal para desenvolvimento do código-fonte do aplicativo. |
| **Figma**                    | Ferramenta de design colaborativo para criação de interfaces de usuário. | Utilizada para design e prototipagem das interfaces do SIAS. |
| **Android Studio**           | Ambiente de desenvolvimento integrado (IDE) para aplicativos Android.  | Utilizado para desenvolvimento e testes do aplicativo Android. |
| **Trello**                   | Ferramenta de gestão de projetos e tarefas.                           | Utilizada para organizar e acompanhar o progresso do projeto. |

## Tecnologias Fundamentais

O **SIAS Mobile** utiliza uma combinação de tecnologias modernas para proporcionar uma experiência rica e interativa no aplicativo. A principal tecnologia utilizada é o **React Native** com o **Expo**, que facilita o desenvolvimento e o teste do aplicativo em dispositivos móveis.

| **Tecnologia**                      | **Descrição**                                                        | **Uso no Projeto**                                                 |
|-------------------------------------|--------------------------------------------------------------------|-------------------------------------------------------------------|
| **React Native**                    | Framework de desenvolvimento de aplicativos móveis usando JavaScript e React. | Utilizado para construir a interface do usuário e a lógica do aplicativo de forma nativa para Android e iOS. |
| **Expo**                            | Conjunto de ferramentas e serviços para desenvolvimento com React Native. | Facilita o desenvolvimento, testes e construção do aplicativo, fornecendo APIs e ferramentas adicionais para melhorar a produtividade. |
| **Nominatim**                       | Serviço de geolocalização baseado em dados do OpenStreetMap.       | Utilizado para obter informações de localização e nomes de ruas a partir de coordenadas geográficas. |
| **Push Notifications API (https://exp.host/--/api/v2/push/send)** | API para envio de notificações push em aplicativos Expo.           | Utilizada para enviar notificações aos usuários sobre eventos importantes, como lembretes de entrevistas. |
| **Gemini**                          | API para simulação de entrevistas e modo de treino.                | Utilizada para preparar candidatos através de simulações de entrevistas, ajudando-os a praticar suas respostas. |
| **@react-navigation/native**        | Biblioteca para gerenciamento de navegação em aplicativos React Native. | Usada para implementar a navegação entre diferentes telas do aplicativo, permitindo uma experiência de usuário fluida. |
| **@react-native-firebase/auth**     | Biblioteca para autenticação usando Firebase.                        | Utilizada para gerenciar o registro e autenticação de usuários, oferecendo login com e-mail e redes sociais. |
| **expo-location**                   | API para acessar informações de localização e geolocalização.      | Utilizada para obter a localização atual do usuário e permitir funcionalidades baseadas em localização, como agendamento de entrevistas. |
| **expo-notifications**              | API para gerenciar e enviar notificações push.                     | Utilizada para configurar e disparar notificações para os usuários em diferentes eventos do aplicativo. |
| **react-native-maps**               | Biblioteca para integração de mapas no aplicativo.                  | Usada para exibir mapas e permitir que os usuários selecionem locais de entrevistas. |
| **react-native-elements**           | Biblioteca de componentes de UI para React Native.                  | Utilizada para criar uma interface visualmente atraente e consistente, utilizando componentes prontos. |
| **lottie-react-native**             | Biblioteca para animações Lottie em aplicativos React Native.        | Utilizada para adicionar animações dinâmicas e interativas, melhorando a experiência do usuário. |
| **@supabase/supabase-js**          | Biblioteca para interação com o Supabase, gerenciando dados e autenticação. | Utilizada para operações CRUD no banco de dados e gerenciamento de autenticação de usuários. |


Outras dependências incluem suporte a armazenamento assíncrono, controle de estado e manipulação de animações, que contribuem para uma experiência de usuário fluida e agradável.


 ## Equipe de Desenvolvimento

O projeto **SIAS Mobile** é desenvolvido por um time talentoso de estudantes da FATEC Zona Sul. Cada membro traz habilidades únicas e desempenha um papel essencial para o sucesso do projeto. Conheça nossa equipe:

- **[Davi de Brito Junior](https://github.com/DaveBrito)** 
  

- **[Eric Peneres Carneiro](https://github.com/EricW900)** 
 

- **[Pedro Borges de Jesus](https://github.com/B0rga)** 
 
- **[Jefferson Moreira Evangelista](https://github.com/JeffersonEvangelista)** 
 
- **[Wesley Silva dos Santos](https://github.com/WesleyS08)** 


Cada membro da equipe traz uma combinação de habilidades técnicas e criatividade para garantir que o **SIAS Mobile** ofereça a melhor experiência possível para os usuários. Estamos comprometidos em criar um aplicativo eficiente e inovador, aproveitando ao máximo as habilidades e o conhecimento de cada um.
