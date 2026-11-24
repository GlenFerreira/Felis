#include <Arduino.h>
#include "esp_camera.h"
#include "img_converters.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include "HX711.h"

// ==========================================
// 1. Configuração da Câmera (AI-Thinker)
// ==========================================
#include "board_config.h"

// ==========================================
// 2. Credenciais de Wi-Fi e Servidor Backend
// ==========================================
const char *ssid = "2G_ARON";
const char *password = "64182719";

const char *server_base   = "http://192.168.0.16:5000";
const char *server_upload = "http://192.168.0.16:5000/upload";

// ==========================================
// 3. Pinagem dos Sensores de Peso (HX711)
// ==========================================
#define PIN_SCK_COMUM     14
#define PIN_DOUT_RACAO    13
#define PIN_DOUT_AGUA     15

HX711 balancaRacao;
HX711 balancaAgua;

bool racaoConectada = false;
bool aguaConectada  = false;
esp_err_t erroInitCamera = ESP_OK;
int modeloSensorPID = 0;

// ==========================================
// 4. Parâmetros de Peso e Calibração
// ==========================================
float FATOR_CALIBRACAO_RACAO = -1000.0; 
float FATOR_CALIBRACAO_AGUA  = -1000.0;

const float LIMIAR_QUEDA_RACAO = 3.0; 
const float LIMIAR_QUEDA_AGUA  = 3.0; 

const unsigned long COOLDOWN_FOTO_MS = 10000; 
unsigned long ultimoDisparoFoto = 0;

float pesoRefRacao = 0.0;
float pesoRefAgua  = 0.0;

int confirmacoesQuedaRacao = 0;
int confirmacoesQuedaAgua  = 0;

unsigned long ultimoTempoLeitura = 0;
const unsigned long INTERVALO_LEITURA = 1200;

// Protótipos
bool inicializarCameraUniversal();
bool enviarFoto(const char* gatilho, float deltaPeso);
float lerPesoFiltrado(HX711 &balanca);
bool esperarHX711(HX711 &balanca, int pinoDout, const char* nome);
bool testarComunicacaoBackend();

void setup() {
  Serial.begin(115200);
  delay(1000);

  // 1. Inicializa a Câmera de forma universal (com fallback automático caso o sensor não tenha JPEG em hardware)
  inicializarCameraUniversal();

  // 2. Conecta ao Wi-Fi
  WiFi.begin(ssid, password);
  WiFi.setSleep(false);
  Serial.printf("\nConectando ao WiFi: %s ", ssid);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println("\n[OK] WiFi Conectado com sucesso!");
  Serial.print("[INFO] IP do ESP32-CAM: ");
  Serial.println(WiFi.localIP());

  // 3. Relatório da Câmera
  Serial.println("\n========================================");
  Serial.println("   🔍 DIAGNÓSTICO DA CÂMERA E MEMÓRIA   ");
  Serial.println("========================================");
  Serial.printf("💾 PSRAM Detectada no ESP32: %s\n", psramFound() ? "SIM (Ativada)" : "NAO (Desativada)");
  
  if (erroInitCamera == ESP_OK) {
    Serial.println("✅ Status da Câmera: INICIALIZADA COM SUCESSO!");
    Serial.printf("📸 Modelo do Sensor Identificado: PID 0x%02X\n", modeloSensorPID);
  } else {
    Serial.printf("❌ Status da Câmera: ERRO 0x%x (%s)\n", erroInitCamera, esp_err_to_name(erroInitCamera));
  }
  Serial.println("========================================\n");

  // 4. Testa comunicação com o Backend Node.js
  Serial.println("[INFO] Testando comunicacao com o servidor Backend...");
  if (testarComunicacaoBackend()) {
    Serial.println("✅ [OK] Comunicacao com o Backend confirmada com sucesso!");
  } else {
    Serial.println("❌ [ALERTA] Backend nao respondeu em 192.168.0.16:5000!");
  }

  // 5. Teste de envio de foto de boot
  if (erroInitCamera == ESP_OK) {
    Serial.println("\n📸 [TESTE DE CÂMERA] Capturando e enviando foto de inicialização...");
    delay(500);
    if (enviarFoto("boot_teste", 0.0)) {
      Serial.println("🎉 [SUCESSO TOTAL] Foto de boot capturada e salva no computador!");
    } else {
      Serial.println("⚠️ [AVISO] Falha ao enviar foto de boot.");
    }
  }

  // 6. Inicializa sensores HX711
  Serial.println("\n[INFO] Inicializando Celulas de Carga HX711...");
  balancaRacao.begin(PIN_DOUT_RACAO, PIN_SCK_COMUM);
  balancaAgua.begin(PIN_DOUT_AGUA, PIN_SCK_COMUM);

  racaoConectada = esperarHX711(balancaRacao, PIN_DOUT_RACAO, "Modulo RACAO");
  if (racaoConectada) {
    balancaRacao.set_scale(FATOR_CALIBRACAO_RACAO);
    delay(200);
    balancaRacao.tare(5);
    pesoRefRacao = lerPesoFiltrado(balancaRacao);
    Serial.printf("[OK] Racao pronta! Referencia inicial: %.1f\n", pesoRefRacao);
  }

  aguaConectada = esperarHX711(balancaAgua, PIN_DOUT_AGUA, "Modulo AGUA");
  if (aguaConectada) {
    balancaAgua.set_scale(FATOR_CALIBRACAO_AGUA);
    delay(200);
    balancaAgua.tare(5);
    pesoRefAgua = lerPesoFiltrado(balancaAgua);
    Serial.printf("[OK] Agua pronta! Referencia inicial: %.1f\n", pesoRefAgua);
  }

  Serial.println("========================================");
  Serial.println("✅ Sistema pronto e monitorando!");
  Serial.println("➡️ PASSO 1: Coloque o peso na balanca.");
  Serial.println("➡️ PASSO 2: Aguarde aparecer '[PESO ADICIONADO] Racao subiu'.");
  Serial.println("➡️ PASSO 3: Retire o peso para disparar a foto!");
  Serial.println("========================================\n");
}

void loop() {
  unsigned long agora = millis();
  if (agora - ultimoTempoLeitura >= INTERVALO_LEITURA) {
    ultimoTempoLeitura = agora;

    bool emCooldown = (agora - ultimoDisparoFoto < COOLDOWN_FOTO_MS);

    // ----------------------------------------------------
    // 1. MONITORAMENTO DE RAÇÃO
    // ----------------------------------------------------
    if (racaoConectada && balancaRacao.is_ready()) {
      float pesoAtual = lerPesoFiltrado(balancaRacao);
      float delta = pesoRefRacao - pesoAtual;

      Serial.printf("[STATUS] Racao: %5.1f | Ref: %5.1f | Delta: %+5.1f %s\n", 
                    pesoAtual, pesoRefRacao, -delta, emCooldown ? "(COOLDOWN)" : "");

      if (pesoAtual > (pesoRefRacao + LIMIAR_QUEDA_RACAO)) {
        Serial.printf("\n⬆️ [PESO ADICIONADO] Racao subiu de %.1f para %.1f. Nova referencia definida!\n\n", 
                      pesoRefRacao, pesoAtual);
        pesoRefRacao = pesoAtual;
        confirmacoesQuedaRacao = 0;
      }
      else if (!emCooldown && delta >= LIMIAR_QUEDA_RACAO) {
        confirmacoesQuedaRacao++;
        Serial.printf("🔍 Confirmando queda de racao (%d/2)...\n", confirmacoesQuedaRacao);

        if (confirmacoesQuedaRacao >= 2) {
          Serial.printf("\n🚨 [GATILHO CONFIRMADO] Racao diminuiu: -%.1f!\n", delta);
          
          enviarFoto("racao", delta);

          ultimoDisparoFoto = millis();
          confirmacoesQuedaRacao = 0;
          pesoRefRacao = lerPesoFiltrado(balancaRacao);
          Serial.printf("🔄 Nova referencia de Racao: %.1f\n\n", pesoRefRacao);
        }
      } else {
        confirmacoesQuedaRacao = 0;
      }
    }

    // ----------------------------------------------------
    // 2. MONITORAMENTO DE ÁGUA
    // ----------------------------------------------------
    if (aguaConectada && balancaAgua.is_ready()) {
      float pesoAtual = lerPesoFiltrado(balancaAgua);
      float delta = pesoRefAgua - pesoAtual;

      Serial.printf("[STATUS] Agua:  %5.1f | Ref: %5.1f | Delta: %+5.1f %s\n", 
                    pesoAtual, pesoRefAgua, -delta, emCooldown ? "(COOLDOWN)" : "");

      if (pesoAtual > (pesoRefAgua + LIMIAR_QUEDA_AGUA)) {
        Serial.printf("\n⬆️ [PESO ADICIONADO] Agua subiu de %.1f para %.1f. Nova referencia definida!\n\n", 
                      pesoRefAgua, pesoAtual);
        pesoRefAgua = pesoAtual;
        confirmacoesQuedaAgua = 0;
      }
      else if (!emCooldown && delta >= LIMIAR_QUEDA_AGUA) {
        confirmacoesQuedaAgua++;
        Serial.printf("🔍 Confirmando queda de agua (%d/2)...\n", confirmacoesQuedaAgua);

        if (confirmacoesQuedaAgua >= 2) {
          Serial.printf("\n🚨 [GATILHO CONFIRMADO] Agua diminuiu: -%.1f!\n", delta);
          
          enviarFoto("agua", delta);

          ultimoDisparoFoto = millis();
          confirmacoesQuedaAgua = 0;
          pesoRefAgua = lerPesoFiltrado(balancaAgua);
          Serial.printf("🔄 Nova referencia de Agua: %.1f\n\n", pesoRefAgua);
        }
      } else {
        confirmacoesQuedaAgua = 0;
      }
    }
  }
}

// ==========================================
// Funções Auxiliares
// ==========================================

bool testarComunicacaoBackend() {
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  http.begin(server_base);
  http.setTimeout(2500);
  http.addHeader("X-Device", "ESP32-CAM");
  http.addHeader("X-ESP-IP", WiFi.localIP().toString());
  int httpCode = http.GET();
  http.end();

  return (httpCode == 200);
}

float lerPesoFiltrado(HX711 &balanca) {
  if (balanca.is_ready()) {
    return balanca.get_units(5);
  }
  return 0.0;
}

bool esperarHX711(HX711 &balanca, int pinoDout, const char* nome) {
  Serial.printf("[TESTE] Comunicando com %s (Pino DT no GPIO %d, SCK no GPIO %d)...\n", 
                nome, pinoDout, PIN_SCK_COMUM);
  
  unsigned long inicio = millis();
  while (!balanca.is_ready()) {
    if (millis() - inicio > 2000) {
      int nivelPino = digitalRead(pinoDout);
      Serial.printf("❌ [FALHA] %s nao respondeu a tempo! (Nivel logico do pino %d = %d)\n", 
                    nome, pinoDout, nivelPino);
      return false;
    }
    delay(20);
  }
  Serial.printf("✅ [OK] %s respondeu com sucesso!\n", nome);
  return true;
}

// Captura e envio da foto (com conversão JPEG automática se o sensor for RGB/YUV)
bool enviarFoto(const char* gatilho, float deltaPeso) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ERRO] WiFi desconectado, impossivel enviar foto.");
    return false;
  }

  Serial.println("📸 Capturando imagem da camera...");
  camera_fb_t *fb = esp_camera_fb_get();

  if (!fb) {
    Serial.println("❌ [ERRO] Falha ao capturar foto da camera! fb_get retornou NULL.");
    return false;
  }

  uint8_t *jpg_buf = NULL;
  size_t jpg_len = 0;
  bool converteuJpg = false;

  // Se o sensor capturou em RGB565 ou YUV (sensores sem JPEG de hardware), converte para JPEG
  if (fb->format != PIXFORMAT_JPEG) {
    Serial.println("🔄 Convertendo frame para JPEG via software...");
    bool ok = frame2jpg(fb, 80, &jpg_buf, &jpg_len);
    if (!ok) {
      Serial.println("❌ [ERRO] Falha na compressao JPEG do frame!");
      esp_camera_fb_return(fb);
      return false;
    }
    converteuJpg = true;
  } else {
    jpg_buf = fb->buf;
    jpg_len = fb->len;
  }

  Serial.printf("📤 Foto pronta (%u bytes). Enviando para: %s\n", jpg_len, server_upload);

  HTTPClient http;
  http.begin(server_upload);
  http.setTimeout(8000);
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("X-Trigger", gatilho);
  http.addHeader("X-Weight-Delta", String(deltaPeso, 1));
  http.addHeader("X-ESP-IP", WiFi.localIP().toString());

  int httpCode = http.POST(jpg_buf, jpg_len);
  bool sucesso = false;

  if (httpCode == 200) {
    Serial.printf("✅ [SUCESSO] Foto enviada e salva pelo servidor! (HTTP %d)\n", httpCode);
    sucesso = true;
  } else if (httpCode > 0) {
    Serial.printf("⚠️ [AVISO] Servidor respondeu com codigo: HTTP %d\n", httpCode);
  } else {
    Serial.printf("❌ [ERRO] Falha no POST HTTP: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();

  if (converteuJpg && jpg_buf) {
    free(jpg_buf);
  }
  esp_camera_fb_return(fb);
  return sucesso;
}

// Inicialização da câmera Universal (com fallback inteligente)
bool inicializarCameraUniversal() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0       = Y2_GPIO_NUM;
  config.pin_d1       = Y3_GPIO_NUM;
  config.pin_d2       = Y4_GPIO_NUM;
  config.pin_d3       = Y5_GPIO_NUM;
  config.pin_d4       = Y6_GPIO_NUM;
  config.pin_d5       = Y7_GPIO_NUM;
  config.pin_d6       = Y8_GPIO_NUM;
  config.pin_d7       = Y9_GPIO_NUM;
  config.pin_xclk     = XCLK_GPIO_NUM;
  config.pin_pclk     = PCLK_GPIO_NUM;
  config.pin_vsync    = VSYNC_GPIO_NUM;
  config.pin_href     = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn     = PWDN_GPIO_NUM;
  config.pin_reset    = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG; // Tentativa 1: JPEG nativo
  config.frame_size   = FRAMESIZE_UXGA;
  config.grab_mode    = CAMERA_GRAB_WHEN_EMPTY;
  config.fb_location  = CAMERA_FB_IN_PSRAM;
  config.jpeg_quality = 12;
  config.fb_count     = 1;

  if (psramFound()) {
    config.jpeg_quality = 10;
    config.fb_count     = 2;
    config.grab_mode    = CAMERA_GRAB_LATEST;
  } else {
    config.frame_size   = FRAMESIZE_SVGA;
    config.fb_location  = CAMERA_FB_IN_DRAM;
  }

  // Tentativa 1: Inicializa com JPEG
  erroInitCamera = esp_camera_init(&config);

  // Se o erro foi 0x106 (JPEG não suportado no hardware deste sensor):
  if (erroInitCamera == ESP_ERR_NOT_SUPPORTED) {
    Serial.println("⚠️ Sensor sem JPEG por hardware detectado! Ativando modo RGB565 com compressao por software...");
    esp_camera_deinit();
    delay(100);

    // Configura formato compativel com sensores OV7670 / GC0308 / OV7725
    config.pixel_format = PIXFORMAT_RGB565;
    config.frame_size   = FRAMESIZE_VGA;
    config.fb_location  = CAMERA_FB_IN_PSRAM;
    config.fb_count     = 1;
    config.grab_mode    = CAMERA_GRAB_WHEN_EMPTY;

    erroInitCamera = esp_camera_init(&config);
  }

  if (erroInitCamera != ESP_OK) {
    return false;
  }

  sensor_t *s = esp_camera_sensor_get();
  if (s) {
    modeloSensorPID = s->id.PID;
    if (s->id.PID == OV3660_PID) {
      s->set_vflip(s, 1);
      s->set_brightness(s, 1);
      s->set_saturation(s, -2);
    }
    s->set_framesize(s, FRAMESIZE_VGA);
  }
  return true;
}
