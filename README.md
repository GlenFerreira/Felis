# 🐱 Felis - Ecossistema Completo: ESP32-CAM, Backend API & Aplicativo Expo

Sistema completo e automatizado de monitoramento e cuidados felinos. 

O projeto é composto por três frentes totalmente integradas:
1. **Hardware (ESP32-CAM + HX711):** Monitora em tempo real o peso das tigelas de ração e água, detecta consumo com filtro anti-ruído e envia fotos das refeições.
2. **Backend API (Node.js + PostgreSQL + MinIO na VPS):** Centraliza a lógica de negócios, autenticação JWT, CRUD de gatos e uploads de fotos para a nuvem.
3. **Aplicativo Mobile (Expo / React Native):** Interface moderna para o tutor criar conta, cadastrar seus gatos com fotos reais, acompanhar idade calculada automaticamente, peso, status de castração e histórico.

---

## 📑 Sumário
1. [Visão Geral da Arquitetura](#-1-visão-geral-da-arquitetura)
2. [Banco de Dados (PostgreSQL) & Armazenamento (MinIO na VPS)](#-2-banco-de-dados-postgresql--armazenamento-minio-na-vps)
3. [Aplicativo Mobile em Expo](#-3-aplicativo-mobile-em-expo)
   - [Funcionalidades do App](#funcionalidades-do-app)
   - [Como Rodar o Aplicativo](#como-rodar-o-aplicativo)
4. [Backend API (Node.js)](#-4-backend-api-nodejs)
   - [Endpoints da API](#endpoints-da-api)
   - [Como Iniciar o Servidor](#como-iniciar-o-servidor)
5. [Hardware (ESP32-CAM & HX711)](#-5-hardware-esp32-cam--hx711)
   - [Pinagem e Ligações](#pinagem-e-ligações)
6. [Estrutura de Pastas do Projeto](#-6-estrutura-de-pastas-do-projeto)

---

## 🏛️ 1. Visão Geral da Arquitetura

```text
 ┌──────────────────────┐             ┌─────────────────────────────┐
 │  ESP32-CAM (OV2640)  │             │   App Mobile (Expo / RN)    │
 │  2x Balanças HX711   │             │  - Cadastro e Login         │
 │  Ração & Água        │             │  - Ficha dos Gatos          │
 └──────────┬───────────┘             │  - Upload de Fotos (Câmera) │
            │                         └──────────────┬──────────────┘
    (HTTP POST /upload)                              │ (REST API / JWT)
            │                                        │
            ▼                                        ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │                     Backend API (Node.js / Express)              │
 │                     Porta 5000 (0.0.0.0 / Rede Local)            │
 └───────────────────┬──────────────────────────┬───────────────────┘
                     │                          │
           (Conexão PostgreSQL)           (API S3 / Upload)
                     │                          │
                     ▼                          ▼
       ┌───────────────────────────┐  ┌───────────────────────────┐
       │   PostgreSQL (VPS Nuvem)  │  │   MinIO Bucket (VPS Nuvem)│
       │   Tabelas: usuarios,      │  │   Bucket: "felis"         │
       │   gatos, eventos          │  │   Fotos dos gatos e pets  │
       │   IP: 62.171.175.197:5432 │  │   IP: 62.171.175.197:9090 │
       └───────────────────────────┘  └───────────────────────────┘
```

---

## ☁️ 2. Banco de Dados (PostgreSQL) & Armazenamento (MinIO na VPS)

As informações dos usuários e gatinhos ficam seguras e persistidas diretamente na sua VPS:

### PostgreSQL
* **Host:** `62.171.175.197:5432`
* **Banco:** `postgres`
* **Tabelas Criadas:**
  - `usuarios`: ID, nome, e-mail (único), senha criptografada (`bcrypt`) e data de cadastro.
  - `gatos`: ID, vínculo com usuário (`usuario_id`), nome, sexo, data de nascimento, peso atual, raça, cor, status de castração, URL da foto no MinIO e observações.
  - `eventos_alimentador`: histórico das fotos capturadas pelo ESP32 com peso consumido e gatilho.

### MinIO (Armazenamento de Fotos na Nuvem)
* **Endpoint:** `http://62.171.175.197:9090`
* **Bucket:** `felis` (com política de leitura pública ativada).
* Todas as fotos tiradas com a câmera do celular no aplicativo ou selecionadas da galeria são enviadas diretamente para `http://62.171.175.197:9090/felis/gatos/...`.

---

## 📱 3. Aplicativo Mobile em Expo

O aplicativo foi desenvolvido com **Expo (React Native)** e possui uma interface moderna com tema pet profissional.

### Funcionalidades do App
* 🔐 **Autenticação Completa:**
  - Criar conta (Nome, E-mail e Senha).
  - Login seguro com token JWT persistido de forma criptografada no `expo-secure-store` (compatível com Keychain do iOS e Keystore do Android).
* 🐱 **Cadastro e Perfil dos Gatos:**
  - **Foto de Perfil:** Tira foto com a câmera do celular na hora ou escolhe da galeria (`expo-image-picker`), com conversão em Base64 e upload direto para o MinIO na VPS.
  - **Nome** do pet.
  - **Sexo:** Seleção visual rápida (Macho / Fêmea).
  - **Data de Nascimento:** Cálculo automático da idade em tempo real (ex: *"1 ano e 4 meses"*, *"8 meses"*).
  - **Peso Atual:** Em kg.
  - **Raça e Cor:** Sugestões e campo livre.
  - **Castrado:** Interruptor Switch (Sim / Não).
  - **Observações:** Espaço para anotações de vacinas, temperamento e cuidados especiais.
* 🚨 **Monitoramento de Saúde e Detecção de Anomalias:**
  - **Alerta Inteligente de Desvio de Rotina:** Identifica automaticamente comportamentos anormais (ex: gato acostumado a beber água 2 a 3x ao dia que fica 48h sem ingestão hídrica).
  - **Card de Risco Clínico:** Explicações claras sobre os perigos da desidratação felina e recomendações veterinárias imediatas.
  - **Badge de Alerta no App:** Marcador vermelho com exclamação na aba e no card do gatinho.
* 📊 **Gráficos Comparativos de Ingestão (Últimos 7 dias):**
  - Gráficos interativos para **Água (ml)** e **Ração (g)** com **Linha de Meta Diária (Baseline)**.
  - Colunas com cores inteligentes: verde esmeralda para dias dentro da rotina, laranja para consumo baixo e vermelho para anomalias críticas.
  - Toque em qualquer coluna do gráfico para abrir a ficha daquele dia.
  - **Simulador de Cenários:** Alternador entre o cenário de anomalia (alerta ativo) e o cenário de rotina 100% normal.
* ⏱️ **Timeline Cronológica de Alimentação:**
  - Linha do tempo visual vertical conectada por nós e horários.
  - Métricas de cada visita: quantidade consumida (-18g, -45ml) e duração da permanência no comedouro.
  - Miniatura e modal de foto ampliada capturada pelo ESP32-CAM.
  - Filtros rápidos: `Todos`, `Água 💧`, `Ração 🍲`, `Anomalias ⚠️`.
* 📱 **Navegação por Abas Inferiores (Bottom Tabs):**
  - Navegação rápida entre **Meus Pets**, **Relatórios** e **Timeline**.

### Como Rodar o Aplicativo

#### Passo 1: Inicie o Backend
Dê dois cliques em:
```
iniciar_backend.bat
```

#### Passo 2: Inicie o Aplicativo Expo
Dê dois cliques em:
```
iniciar_app.bat
```
*(Ou pelo terminal: `cd mobile` e depois `npx expo start`).*

#### Passo 3: Abrir no Celular ou Emulador
* **No Celular (Recomendado):** Instale o aplicativo **Expo Go** (disponível na Google Play Store e Apple App Store) e aponte a câmera para o **QR Code** exibido no terminal.
* **Na Web:** Pressione `w` no terminal para abrir no navegador.

---

## 📡 4. Backend API (Node.js)

O backend em `backend/server.js` atua como a ponte central conectando o ESP32-CAM, o aplicativo Expo, o banco PostgreSQL e o bucket MinIO.

### Endpoints da API

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/` | Status da API e estatísticas de gatos cadastrados |
| `POST` | `/upload` | Recebe fotos JPEG do **ESP32-CAM** e registra evento de consumo |
| `POST` | `/api/auth/register` | Cadastra novo usuário com senha criptografada (`bcrypt`) |
| `POST` | `/api/auth/login` | Autentica o usuário e retorna o token JWT |
| `GET` | `/api/auth/me` | Retorna o perfil do usuário logado |
| `GET` | `/api/cats` | Lista todos os gatos do usuário logado |
| `POST` | `/api/cats` | Cadastra um novo gato |
| `PUT` | `/api/cats/:id` | Atualiza as informações de um gato existente |
| `DELETE` | `/api/cats/:id` | Remove um gato do sistema |
| `POST` | `/api/upload-foto` | Recebe foto do app móvel e sobe para o MinIO na VPS |
| `GET` | `/api/feed-events` | Histórico dos últimos consumos registrados pelo ESP32 |

---

## 🔌 5. Hardware (ESP32-CAM & HX711)

### Pinagem e Ligações
* **GPIO 14:** Pino **SCK (Clock)** compartilhado para ambos os módulos HX711.
* **GPIO 13:** Pino **DT / DOUT** do HX711 da Ração.
* **GPIO 15:** Pino **DT / DOUT** do HX711 da Água.
* **5V:** Alimentação principal (ligada no 5V do ESP32-CAM).
* **GND:** Terra comum obrigatório.

### Célula de Carga no HX711
* **Vermelho:** E+ (Excitação +)
* **Preto:** E- (Excitação -)
* **Branco:** A- (Sinal -)
* **Verde:** A+ (Sinal +)

---

## 📁 6. Estrutura de Pastas do Projeto

```text
Felis/
├── backend/
│   ├── .env                   # Credenciais da VPS (PostgreSQL e MinIO)
│   ├── db.js                  # Pool de conexão PostgreSQL
│   ├── minioClient.js         # Cliente MinIO S3 (Upload e políticas)
│   ├── server.js              # Servidor API Express (Porta 5000)
│   ├── fotos/                 # Backup local das fotos do ESP32
│   └── package.json           # Dependências da API
│
├── mobile/
│   ├── App.js                 # Ponto de entrada do aplicativo Expo
│   ├── app.json               # Configurações do Expo
│   ├── package.json           # Dependências React Native
│   └── src/
│       ├── context/
│       │   └── AuthContext.js # Contexto de autenticação e sessão JWT
│       ├── services/
│       │   └── api.js         # Conexão HTTP REST e upload multipart
│       ├── screens/
│       │   ├── AuthScreen.js  # Tela de Login e Criação de Conta
│       │   └── HomeScreen.js  # Dashboard principal com lista de gatos
│       ├── components/
│       │   ├── CatFormModal.js    # Modal com câmera/galeria e formulário
│       │   └── CatDetailsModal.js # Ficha técnica completa do gato
│       └── utils/
│           └── helpers.js     # Cálculo de idade e máscaras de data
│
├── esp/
│   ├── esp.ino                # Firmware universal do ESP32-CAM
│   ├── board_config.h         # Configuração AI-Thinker
│   └── camera_pins.h          # Mapeamento de registradores da câmera
│
├── iniciar_backend.bat        # Atalho de 1 clique para iniciar o Backend API
├── iniciar_app.bat            # Atalho de 1 clique para iniciar o App Expo
└── README.md                  # Documentação completa do projeto
```
