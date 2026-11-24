# 🐱 Felis - Alimentador Inteligente com ESP32-CAM & Backend Local

Sistema automatizado de monitoramento e alimentação para gatos. Utiliza o microcontrolador **ESP32-CAM** acoplado a **duas células de carga (HX711)** para monitorar em tempo real o peso das tigelas de **Ração** e **Água**. Quando é detectada uma diminuição estável de peso (indicando que o gato comeu ou bebeu), o ESP32 captura uma foto e a envia via HTTP POST para um servidor local em **Node.js**, onde as imagens são salvas para posterior análise com Inteligência Artificial.

---

## 📑 Sumário
1. [Visão Geral da Arquitetura](#-1-visão-geral-da-arquitetura)
2. [Pinagem e Ligações Elétricas](#-2-pinagem-e-ligações-elétricas)
   - [Tabela de Pinos do ESP32-CAM](#tabela-de-pinos-do-esp32-cam)
   - [Ligação das Células de Carga no Módulo HX711](#ligação-das-células-de-carga-no-módulo-hx711)
   - [Avisos Críticos de Hardware (Pinos Proibidos)](#avisos-críticos-de-hardware-pinos-proibidos)
3. [Lógica e Funcionamento do Firmware (ESP32)](#-3-lógica-e-funcionamento-do-firmware-esp32)
   - [Inicialização Universal da Câmera](#inicialização-universal-da-câmera)
   - [Algoritmo de Detecção de Peso e Anti-Ruído](#algoritmo-de-detecção-de-peso-e-anti-ruído)
4. [Backend Local (Node.js)](#-4-backend-local-nodejs)
   - [Como Iniciar o Servidor](#como-iniciar-o-servidor)
   - [Endpoints da API](#endpoints-da-api)
   - [Formato das Fotos Salvas](#formato-das-fotos-salvas)
5. [Estrutura de Pastas do Projeto](#-5-estrutura-de-pastas-do-projeto)
6. [Próximos Passos (Roadmap)](#-6-próximos-passos-roadmap)

---

## 🏛️ 1. Visão Geral da Arquitetura

```text
  [ Célula de Carga - Ração ] ──> [ Módulo HX711 ] ──┐ (DT: GPIO 13)
                                                    ├─> [ ESP32-CAM AI-Thinker ]
  [ Célula de Carga - Água  ] ──> [ Módulo HX711 ] ──┘ (DT: GPIO 15, SCK: GPIO 14)
                                                               │
                                                       (Wi-Fi / HTTP POST)
                                                               │
                                                               ▼
                                                  [ Backend Local Node.js ]
                                                  (Porta 5000: /upload)
                                                               │
                                                               ▼
                                                   [ Pasta /backend/fotos ]
                                                (20261124_021100_racao.jpg)
```

---

## 🔌 2. Pinagem e Ligações Elétricas

### Tabela de Pinos do ESP32-CAM
Como as fotos são enviadas via Wi-Fi, o leitor de cartão MicroSD da placa não é utilizado, liberando os pinos do barramento SD com segurança.

> **💡 Otimização de Pinos:** O sinal de clock (**SCK**) é **compartilhado** entre os dois módulos HX711, economizando pinos I/O do ESP32.

| Pino no ESP32-CAM | Conexão de Hardware | Função / Descrição |
| :--- | :--- | :--- |
| **GPIO 14** | **SCK / CLK** (de ambos os módulos HX711) | Linha de Clock compartilhada |
| **GPIO 13** | **DT / DOUT** (Módulo HX711 Ração) | Leitura digital da balança de ração |
| **GPIO 15** | **DT / DOUT** (Módulo HX711 Água) | Leitura digital da balança de água |
| **5V** | **VCC** (Entrada de alimentação e HX711) | Alimentação principal (mínimo 1A a 2A) |
| **GND** | **GND** (Terra comum de todo o circuito) | Referência de 0V obrigatória entre ESP e sensores |

---

### Ligação das Células de Carga no Módulo HX711
A maioria das células de carga possui 4 fios (ponte de Wheatstone). Conecte-os nos bornes do **Canal A** de cada HX711:

| Cor do Fio da Célula | Borne no HX711 | Função |
| :--- | :--- | :--- |
| **Vermelho** | **E+** (ou EXC+) | Excitação positiva (alimentação da ponte) |
| **Preto** | **E-** (ou EXC-) | Excitação negativa (terra da ponte) |
| **Branco** | **A-** | Sinal diferencial negativo |
| **Verde** | **A+** | Sinal diferencial positivo |

> **Nota sobre calibração de sinal:** O código já implementa o fator com sinal invertido (`-1000.0`), garantindo que colocar peso gere números positivos e retirar peso gere diminuição.

---

### ⚠️ Avisos Críticos de Hardware (Pinos Proibidos)

* 🚫 **GPIO 16 (NUNCA UTILIZAR):** É conectado internamente ao pino de seleção de chip (CS) da memória PSRAM. Conectar qualquer sensor nele corrompe a memória e gera *boot loop* instantâneo.
* 🚫 **GPIO 12:** Strapping pin MTDI. Se estiver em nível ALTO durante o boot, comuta a tensão da memória Flash para 1.8V e a placa não inicializa.
* 🚫 **GPIO 4:** Conectado ao Flash LED frontal de alta potência.
* 🚫 **GPIO 0:** Usado para o clock principal da câmera (XCLK de 20 MHz) e modo de gravação via FTDI.
* 🚫 **GPIO 1 e 3:** Portas seriais UART0 (TX/RX) mantidas livres para monitoramento serial a 115200 baud.

---

## 🧠 3. Lógica e Funcionamento do Firmware (ESP32)

### Inicialização Universal da Câmera
Muitos lotes de ESP32-CAM vêm de fábrica com sensores que não possuem codificador JPEG embutido por hardware (gerando o erro `0x106 - ESP_ERR_NOT_SUPPORTED`). O firmware implementa uma **estratégia universal**:
1. Tenta inicializar em modo JPEG nativo de hardware.
2. Se o sensor rejeitar (`0x106`), ativa automaticamente o modo `PIXFORMAT_RGB565`.
3. Na hora da transmissão, utiliza a biblioteca oficial `img_converters.h` (`frame2jpg`) para comprimir o quadro via software em menos de 40ms, aproveitando a memória PSRAM.

### Algoritmo de Detecção de Peso e Anti-Ruído
Para evitar disparos falsos causados por ruídos elétricos do ADC ou trepidações mecânicas:
* **Média de 5 Amostras:** Cada leitura faz uma média de 5 medições antes de registrar o valor.
* **Auto-Reabastecimento:** Se o peso aumentar além do limiar (ex: quando você abastece o pote com ração ou água), a nova referência é atualizada automaticamente **sem disparar foto**.
* **Confirmação Dupla:** A queda de peso precisa se manter estável por **2 ciclos consecutivos** para ser considerada legítima.
* **Cooldown de 10 Segundos:** Após bater uma foto, o sensor entra em pausa de 10 segundos, evitando fotos em excesso enquanto o gato ainda está no local.

---

## 💻 4. Backend Local (Node.js)

O backend foi desenvolvido utilizando estritamente os **módulos nativos do Node.js** (`http`, `fs`, `path`). Isso significa que ele **não necessita de `npm install`** e não possui dependências pesadas de terceiros.

### Como Iniciar o Servidor

#### Opção A (Via Atalho):
Dê dois cliques no arquivo:
```
iniciar_backend.bat
```

#### Opção B (Via Terminal):
```bash
cd backend
node server.js
```

O servidor escuta na porta **5000** em todas as interfaces da rede local (`0.0.0.0:5000`).

---

### Endpoints da API

#### `GET /`
* Endpoint de teste e ping de conectividade.
* Quando o ESP32 liga, ele acessa essa rota e o console exibe em verde:
  ```text
  [02:10:35] 🟢 CONEXÃO DETECTADA!
     -> Origem: ESP32-CAM no IP: 192.168.0.178
     -> Status: Comunicação com o Backend confirmada com sucesso!
  ```

#### `POST /upload`
* Recebe os bytes brutos da imagem JPEG enviada pelo ESP32-CAM.
* Lê os cabeçalhos HTTP customizados:
  - `X-Trigger`: Tipo do gatilho (`racao`, `agua` ou `boot_teste`).
  - `X-Weight-Delta`: Quantidade em gramas/ml consumida.
  - `X-ESP-IP`: IP local do ESP32 na rede.
* Salva a imagem diretamente na pasta `backend/fotos/`.

---

### Formato das Fotos Salvas
As imagens são gravadas com timestamp completo e identificação de origem:
```
backend/fotos/AAAAMMDD_HHMMSS_<origem>.jpg
```
*Exemplos gerados em operação real:*
- `20261124_021038_boot_teste.jpg` (24 KB - Foto de teste de boot)
- `20261124_021100_racao.jpg` (38 KB - Foto disparada por consumo de comida)
- `20261124_021140_racao.jpg` (19 KB - Foto de novo consumo)

---

## 📁 5. Estrutura de Pastas do Projeto

```text
Felis/
├── backend/
│   ├── fotos/                 # Pasta onde as fotos recebidas são gravadas
│   ├── server.js              # Servidor HTTP nativo em Node.js (Porta 5000)
│   ├── package.json           # Manifesto do projeto Node.js
│   └── teste_upload.js        # Script utilitário para simular envio de imagem
│
├── esp/
│   ├── esp.ino                # Código-fonte principal do ESP32-CAM
│   ├── board_config.h         # Seleção do modelo AI-Thinker
│   ├── camera_pins.h          # Mapeamento oficial dos pinos da câmera
│   ├── app_httpd.cpp          # Funções complementares do driver de vídeo
│   ├── camera_index.h         # Página HTML padrão do driver (legado)
│   └── partitions.csv         # Tabela de partições de memória Flash
│
├── iniciar_backend.bat        # Atalho de 1 clique para iniciar o servidor Node
└── README.md                  # Documentação completa do projeto
```

---

## 🔮 6. Próximos Passos (Roadmap)

- [ ] **Integração de Modelo de IA (Visão Computacional):**
  - Implementar pipeline em Python (YOLO / OpenCV / MobileNet) no backend para ler as fotos salvas e confirmar a presença e identificação do gato.
- [ ] **Banco de Dados (SQLite / PostgreSQL):**
  - Registrar histórico de consumo (hora exata, quantidade consumida em gramas/ml, link da foto).
- [ ] **Deploy na Nuvem (VPS):**
  - Configurar proxy reverso (Nginx + Certbot HTTPS) na VPS para envio remoto das fotos.
- [ ] **Dashboard Web / Notificações no Telegram/WhatsApp:**
  - Enviar alerta com a foto do pet toda vez que ele se alimentar.
