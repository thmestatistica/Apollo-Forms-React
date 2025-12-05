# 📘 Guia do Código – Apollo Forms React

Bem-vindo ao guia de desenvolvimento do **Apollo Forms React**. Este documento serve como um mapa para navegar pela arquitetura do projeto. O objetivo é ajudar novos programadores a localizar rapidamente páginas, componentes, contextos e a lógica de negócio sem se perderem na estrutura de pastas.

---

## 🚀 Visão Geral (Entry Points)

Estes são os ficheiros fundamentais que iniciam a aplicação.

- **`src/main.jsx`**: O ponto de entrada principal. É aqui que o React é injetado no DOM e onde a árvore principal (incluindo os *Providers* globais e a `App`) é renderizada.
- **`src/App.jsx`**: O "esqueleto" (shell) da aplicação. Define o layout base e orquestra o sistema de rotas principal.
- **`src/index.css`**: Folha de estilos globais e definições de variáveis CSS.

---

## 🗂️ Rotas e Páginas (`src/routes/`)

Aqui vivem os "ecrãs" (screens) da aplicação. Cada ficheiro representa uma rota acessível pelo URL.

### 🏠 Geral
- **`routes/HomeForms.jsx`**: Página central com a lista e atalhos para os formulários disponíveis.
- **`routes/error/Error.jsx`**: Página de "falha segura" (fallback). Exibida quando ocorre um erro de rota ou estado inesperado (404/500).

### 📝 Motor de Formulários
- **`routes/forms/FormGen.jsx`**: O coração do sistema dinâmico. Esta página gera formulários automaticamente baseando-se em configurações JSON, utilizando o contexto de formulário e componentes de input.

### 👤 Área do Paciente
- **`routes/paciente/LoginPaciente.jsx`**: Ecrã de autenticação exclusivo para pacientes.
- **`routes/paciente/TelaInicialPaciente.jsx`**: *Dashboard* inicial do paciente após o login (visão geral e ações rápidas).
- **`routes/paciente/PacienteForms.jsx`**: Área onde o paciente visualiza e preenche os seus formulários pendentes.

### 👨‍⚕️ Área do Terapeuta
- **`routes/terapeuta/LoginTerapeuta.jsx`**: Ecrã de autenticação exclusivo para terapeutas.
- **`routes/terapeuta/TelaInicialTerapeuta.jsx`**: *Dashboard* de gestão do terapeuta após o login.
- **`routes/terapeuta/FormsTerapeuta.jsx`**: Painel para criação, gestão e consulta de formulários dos pacientes.

---

## 🧠 Contextos e Estado Global (`src/context/`)

Utilizamos a Context API do React para gerir estados que precisam de estar acessíveis em toda a aplicação.

### 🔐 Autenticação (`src/context/auth/`)
- **`AuthContext.jsx`**: Define a estrutura dos dados de autenticação.
- **`AuthProvider.jsx`**: Gere a sessão do utilizador (tokens, persistência, verificação de login) e expõe funções como `login()` e `logout()`.

### 📋 Formulários (`src/context/form/`)
- **`FormContext.jsx`**: Define o estado partilhado de um formulário ativo.
- **`FormProvider.jsx`**: Controla o ciclo de vida completo de um formulário: carregamento de dados, validação em tempo real, gestão de erros e submissão.

---

## 🎣 Custom Hooks (`src/hooks/`)

Invólucros (wrappers) personalizados para facilitar o consumo dos contextos.

- **`useAuth.jsx`**: Hook para aceder rapidamente ao utilizador atual e verificar permissões (ex: `const { user } = useAuth();`).
- **`useFormContext.jsx`**: Hook essencial para componentes de input. Permite ler e escrever valores no formulário sem passar *props* manualmente.

---

## 🧩 Componentes Reutilizáveis (`src/components/`)

Blocos de construção da interface do utilizador (UI).

### 📅 Agenda
- **`AgenCard.jsx`**: Cartão visual de um agendamento/slot individual.
- **`AgenPag.jsx`**: O contentor da agenda. Gere a lista de cartões, filtros e paginação.

### 🛡️ Segurança
- **`ProtectRoutes.jsx`**: *Wrapper* de segurança. Envolve rotas privadas, impedindo o acesso de não-autenticados e redirecionando para o login apropriado.

### 🏗️ Construção de Formulário
- **`CampoDinamico.jsx`**: Componente inteligente que decide qual *input* renderizar (texto, select, data) com base num objeto de configuração JSON.

### 🏠 Home & Navegação
- **`HomeListItem.jsx`**: Componente de lista para os atalhos da Home.
- **`LinkLogin.jsx`**: Botões/Links de chamada para a ação (CTA) para os ecrãs de login.

### ℹ️ Feedback ao Utilizador (Informativos)
- **`LoadingGen.jsx`**: *Spinner* ou indicador de carregamento padrão.
- **`ErroGen.jsx`** / **`SucessGen.jsx`**: Mensagens padronizadas de erro e sucesso.
- **`InfoGen.jsx`**: Avisos informativos neutros.

### ⌨️ Inputs (Entrada de Dados)
- **`MultiSelect.jsx`**: Caixa de seleção múltipla (integração direta com o FormContext).
- **`SingleSelect.jsx`**: Caixa de seleção única.
- **`selectStyles.js`**: Estilização personalizada (provavelmente para bibliotecas como React-Select).

### 🪟 Modais & Tabelas
- **`Modal.jsx`**: Janela sobreposta genérica (pop-up) que recebe qualquer conteúdo filho.
- **`AGridTable.jsx`**: Tabela de dados (Data Grid) com suporte a paginação e seleção de linhas.
- **`PaginationButtons.jsx`**: Controlos de navegação de páginas (`< 1 2 3 >`).

### ⏳ Pendências (Workflow)
- **`EvoCard.jsx`**: Cartão que resume uma evolução ou pendência.
- **`EvoPag.jsx`**: Página que lista pendências.
- **`PenModal.jsx`**: Modal específico para resolver ou detalhar uma pendência.

---

## 📡 Camada de API e Serviços (`src/api/`)

Toda a comunicação com o *backend* está centralizada aqui.

- **`api/axiosInstance.js`**: Cliente HTTP base (Axios) com configurações globais (baseURL, interceptors de token).
- **`forms/axiosInstanceForms.js`**: Instância específica para o microsserviço ou endpoints de formulários.

**Módulos de Serviço:**
Cada pasta contém funções `_utils.js` que encapsulam as chamadas à API:
* 📅 **Agenda:** `agenda_utils.js` (Buscar/Filtrar slots).
* 🔐 **Auth:** `auth_utils.js` (Login/Logout/Sessão).
* 📝 **Forms:** `forms_utils.js` (CRUD de formulários e envio de respostas).
* ⏳ **Pendências:** `pendencias_utils.js` (Listagem e atualização).
* 👩‍⚕️ **Profissionais:** `profissionais_utils.js` (Consulta de terapeutas).

---

## ⚙️ Configurações e Dados Estáticos

- **`config/tipoSlot.js`**: Dicionário que mapeia tipos de agendamento (cores, rótulos, regras de negócio).
- **`data/formulario.jsx`**: Ficheiro crucial que define a **estrutura JSON** dos formulários gerados pelo `FormGen`.

---

## 🛠️ Utilitários e Helpers (`src/utils/`)

Funções puras para lógica auxiliar.

- **🔎 Classificação:** `classificarPendencias.js` (Algoritmos de ordenação).
- **🎨 Formatação:** `formatar_utils.js` (Formatar datas, moeda, capitalização de texto).
- **🎭 Máscaras:** `cpfMask.js` (Formatação visual de inputs, ex: CPF).
- **✅ Validação:** `verify_utils.js` (Verificações booleanas, validação de campos).

---

## 🔄 Fluxo de Dados Típico

Para entender como tudo se liga, siga este rasto:

1.  O **Utilizador** acede a uma rota (ex: `TelaInicialPaciente.jsx`).
2.  O **`ProtectRoutes.jsx`** verifica se existe um token válido no **`AuthProvider`**.
3.  A página carrega e dispara um `useEffect` que chama uma função da **API** (ex: `forms_utils.js`).
4.  Os dados retornados são passados para componentes de UI (ex: **`AGridTable`**) ou armazenados num contexto.
5.  Ao preencher um formulário, o **`CampoDinamico`** consome e atualiza o **`FormProvider`** via hook **`useFormContext`**.

---

## 💡 Dicas para Começar

1.  **Navegação:** Comece por abrir o ficheiro em `src/routes/` que corresponde ao ecrã que deseja alterar.
2.  **Árvore de Componentes:** Verifique os *imports* dessa página para ver quais os componentes de `src/components/` que estão a ser usados.
3.  **Dados:** Se precisar de alterar *como* os dados são procurados, vá a `src/api/`. Se precisar de alterar a *estrutura* do formulário, vá a `data/formulario.jsx`.