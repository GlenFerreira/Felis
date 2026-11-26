const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const db = require('./db');
const { uploadArquivo } = require('./minioClient');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'felis_secret_key_default';

// Diretório local para backup das fotos do ESP32
const FOTOS_DIR = path.join(__dirname, 'fotos');
if (!fs.existsSync(FOTOS_DIR)) {
  fs.mkdirSync(FOTOS_DIR, { recursive: true });
}

// Configurações do Express
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Middleware para capturar erros de sintaxe no JSON recebido
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      erro: 'JSON malformado no corpo da requisição.',
      detalhes: 'Certifique-se de que os campos e valores estão entre aspas duplas normais (sem barras invertidas em dois-pontos ou vírgulas).',
      exemplo_valido: {
        email: "user",
        senha: "12345"
      }
    });
  }
  next(err);
});

// Configuração do Multer para upload em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // Até 10MB
});

// Middleware de Autenticação JWT
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, usuario) => {
    if (err) {
      return res.status(403).json({ erro: 'Token inválido ou expirado.' });
    }
    req.usuario = usuario;
    next();
  });
}

function formatTimestamp(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const ano = d.getFullYear();
  const mes = pad(d.getMonth() + 1);
  const dia = pad(d.getDate());
  const hora = pad(d.getHours());
  const min = pad(d.getMinutes());
  const seg = pad(d.getSeconds());
  return `${ano}${mes}${dia}_${hora}${min}${seg}`;
}

// ==========================================
// 1. ROTAS DO ESP32-CAM (Compatibilidade 100%)
// ==========================================

// Rota GET / para teste de ping do ESP32 e status da API
app.get('/', async (req, res) => {
  const ipOrigem = req.socket.remoteAddress || 'desconhecido';
  const device = req.headers['x-device'] || 'Dispositivo';
  const espIp = req.headers['x-esp-ip'] || ipOrigem;

  console.log(`\n[${new Date().toLocaleTimeString()}] 🟢 CONEXÃO DETECTADA!`);
  console.log(`   -> Origem: ${device} no IP: ${espIp}`);
  console.log(`   -> Status: Servidor Felis online!\n`);

  try {
    const totalGatos = await db.query('SELECT COUNT(*) FROM gatos');
    const totalEventos = await db.query('SELECT COUNT(*) FROM eventos_alimentador');

    return res.json({
      status: 'online',
      mensagem: 'Servidor Felis API (PostgreSQL + MinIO) pronto!',
      device_conectado: device,
      estatisticas: {
        gatos_cadastrados: parseInt(totalGatos.rows[0].count, 10),
        eventos_alimentador: parseInt(totalEventos.rows[0].count, 10)
      }
    });
  } catch (err) {
    return res.json({ status: 'online', mensagem: 'Servidor Felis online!' });
  }
});

// Rota POST /upload do ESP32-CAM
app.post('/upload', express.raw({ type: '*/*', limit: '10mb' }), async (req, res) => {
  const buffer = req.body;

  if (!buffer || buffer.length === 0) {
    return res.status(400).json({ status: 'erro', mensagem: 'Nenhum dado recebido' });
  }

  const trigger = (req.headers['x-trigger'] || 'desconhecido').toLowerCase();
  const delta = req.headers['x-weight-delta'] || '0';
  const espIp = req.headers['x-esp-ip'] || req.socket.remoteAddress;

  const timestamp = formatTimestamp();
  const nomeArquivo = `${timestamp}_${trigger}.jpg`;
  const caminhoArquivo = path.join(FOTOS_DIR, nomeArquivo);

  // 1. Salva backup local no disco
  fs.writeFile(caminhoArquivo, buffer, () => {});

  let urlMinio = null;
  // 2. Salva no MinIO (bucket felis) na VPS
  try {
    const minioPath = `alimentador/${nomeArquivo}`;
    urlMinio = await uploadArquivo(minioPath, buffer, 'image/jpeg');
    console.log(`   -> MinIO Upload OK: ${urlMinio}`);

    // 3. Registra no PostgreSQL
    await db.query(
      'INSERT INTO eventos_alimentador (gatilho, delta_peso, foto_url) VALUES ($1, $2, $3)',
      [trigger, parseFloat(delta) || 0, urlMinio]
    );
  } catch (e) {
    console.error('[ERRO MINIO/DB ESP32]:', e.message);
  }

  const tamanhoKB = (buffer.length / 1024).toFixed(1);
  console.log(`[${new Date().toLocaleTimeString()}] 📸 FOTO RECEBIDA DO ESP32 (${espIp})!`);
  console.log(`   -> Gatilho: ${trigger.toUpperCase()} (Diminuiu: -${delta}g/ml)`);
  console.log(`   -> Arquivo: ${nomeArquivo} (${tamanhoKB} KB)\n`);

  res.status(200).json({
    status: 'ok',
    arquivo: nomeArquivo,
    trigger: trigger,
    minio_url: urlMinio,
    tamanho_kb: tamanhoKB
  });
});

// ==========================================
// 2. ROTAS DE AUTENTICAÇÃO DO USUÁRIO
// ==========================================

// Cadastro de novo usuário
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
    }

    // Verifica se e-mail já existe
    const usuarioExistente = await db.query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]);
    if (usuarioExistente.rows.length > 0) {
      return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    // Insere no banco
    const result = await db.query(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email, criado_em',
      [nome.trim(), email.toLowerCase().trim(), senhaHash]
    );

    const novoUsuario = result.rows[0];

    // Gera token JWT
    const token = jwt.sign(
      { id: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso!',
      usuario: novoUsuario,
      token
    });
  } catch (err) {
    console.error('[ERRO REGISTER]:', err);
    res.status(500).json({ erro: 'Erro interno ao cadastrar usuário.' });
  }
});

// Login de usuário (aceita tanto E-mail quanto Nome de Usuário)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Usuário/E-mail e senha são obrigatórios.' });
    }

    const termo = email.toLowerCase().trim();
    const result = await db.query(
      'SELECT * FROM usuarios WHERE LOWER(email) = $1 OR LOWER(nome) = $1',
      [termo]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
    }

    const usuario = result.rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      mensagem: 'Login realizado com sucesso!',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      },
      token
    });
  } catch (err) {
    console.error('[ERRO LOGIN]:', err);
    res.status(500).json({ erro: 'Erro interno ao realizar login.' });
  }
});

// Obter dados do usuário logado
app.get('/api/auth/me', autenticarToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, nome, email, criado_em FROM usuarios WHERE id = $1', [req.usuario.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao obter dados do usuário.' });
  }
});

// ==========================================
// 3. UPLOAD DE FOTO DO GATO PARA O MINIO
// ==========================================

app.post('/api/upload-foto', autenticarToken, upload.single('foto'), async (req, res) => {
  try {
    let buffer;
    let mimeType = 'image/jpeg';

    if (req.file) {
      buffer = req.file.buffer;
      mimeType = req.file.mimetype || 'image/jpeg';
    } else if (req.body && req.body.foto_base64) {
      // Suporte direto para Base64 (elimina problemas com FormData no iOS / New Architecture)
      const base64Limpo = req.body.foto_base64.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Limpo, 'base64');
      mimeType = req.body.mime_type || 'image/jpeg';
    } else {
      return res.status(400).json({ erro: 'Nenhuma foto foi enviada (nem arquivo nem base64).' });
    }

    const extensao = mimeType.includes('png') ? 'png' : 'jpg';
    const nomeArquivo = `gatos/gato_${req.usuario.id}_${Date.now()}_${Math.round(Math.random() * 1000)}.${extensao}`;

    console.log(`[UPLOAD] Enviando foto para o MinIO (${(buffer.length / 1024).toFixed(1)} KB): ${nomeArquivo}...`);
    const fotoUrl = await uploadArquivo(nomeArquivo, buffer, mimeType);
    console.log(`[UPLOAD] ✅ Foto salva com sucesso no MinIO: ${fotoUrl}`);

    res.json({
      mensagem: 'Foto enviada com sucesso para a VPS (MinIO)!',
      foto_url: fotoUrl
    });
  } catch (err) {
    console.error('[ERRO UPLOAD MINIO]:', err);
    res.status(500).json({ erro: 'Falha ao enviar foto para o MinIO: ' + err.message });
  }
});

// ==========================================
// 4. CRUD DE GATOS
// ==========================================

// Listar gatos do usuário logado
app.get('/api/cats', autenticarToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, nome, sexo, 
              TO_CHAR(data_nascimento, 'YYYY-MM-DD') as data_nascimento, 
              peso_atual, raca, cor, castrado, foto_url, observacoes, criado_em 
       FROM gatos 
       WHERE usuario_id = $1 
       ORDER BY criado_em DESC`,
      [req.usuario.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[ERRO LISTAR GATOS]:', err);
    res.status(500).json({ erro: 'Erro ao buscar gatos cadastrados.' });
  }
});

// Cadastrar novo gato
app.post('/api/cats', autenticarToken, async (req, res) => {
  try {
    const { nome, sexo, data_nascimento, peso_atual, raca, cor, castrado, foto_url, observacoes } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: 'O nome do gato é obrigatório.' });
    }

    const result = await db.query(
      `INSERT INTO gatos (usuario_id, nome, sexo, data_nascimento, peso_atual, raca, cor, castrado, foto_url, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, nome, sexo, TO_CHAR(data_nascimento, 'YYYY-MM-DD') as data_nascimento, peso_atual, raca, cor, castrado, foto_url, observacoes, criado_em`,
      [
        req.usuario.id,
        nome.trim(),
        sexo || 'Indefinido',
        data_nascimento || null,
        peso_atual ? parseFloat(peso_atual) : null,
        raca || 'SRD (Sem Raça Definida)',
        cor || '',
        castrado === true || castrado === 'true',
        foto_url || null,
        observacoes || ''
      ]
    );

    console.log(`[CAT] 🐱 Gato "${nome}" cadastrado com sucesso pelo usuário ID ${req.usuario.id}!`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[ERRO CADASTRAR GATO]:', err);
    res.status(500).json({ erro: 'Erro ao salvar gato: ' + err.message });
  }
});

// Atualizar informações do gato
app.put('/api/cats/:id', autenticarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, sexo, data_nascimento, peso_atual, raca, cor, castrado, foto_url, observacoes } = req.body;

    const result = await db.query(
      `UPDATE gatos 
       SET nome = COALESCE($1, nome),
           sexo = COALESCE($2, sexo),
           data_nascimento = COALESCE($3, data_nascimento),
           peso_atual = COALESCE($4, peso_atual),
           raca = COALESCE($5, raca),
           cor = COALESCE($6, cor),
           castrado = COALESCE($7, castrado),
           foto_url = COALESCE($8, foto_url),
           observacoes = COALESCE($9, observacoes)
       WHERE id = $10 AND usuario_id = $11
       RETURNING id, nome, sexo, TO_CHAR(data_nascimento, 'YYYY-MM-DD') as data_nascimento, peso_atual, raca, cor, castrado, foto_url, observacoes`,
      [
        nome, sexo, data_nascimento, peso_atual, raca, cor, castrado, foto_url, observacoes,
        id, req.usuario.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Gato não encontrado ou você não tem permissão para editá-lo.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[ERRO EDITAR GATO]:', err);
    res.status(500).json({ erro: 'Erro ao atualizar dados do gato.' });
  }
});

// Excluir gato
app.delete('/api/cats/:id', autenticarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM gatos WHERE id = $1 AND usuario_id = $2 RETURNING id', [id, req.usuario.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Gato não encontrado ou não pertence a você.' });
    }

    res.json({ mensagem: 'Gato removido com sucesso!', id });
  } catch (err) {
    console.error('[ERRO DELETAR GATO]:', err);
    res.status(500).json({ erro: 'Erro ao remover gato.' });
  }
});

// Eventos de consumo do alimentador (para histórico no app)
app.get('/api/feed-events', autenticarToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, gatilho, delta_peso, foto_url, criado_em FROM eventos_alimentador ORDER BY criado_em DESC LIMIT 20'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar histórico de alimentação.' });
  }
});

// Criação automática da tabela de eventos caso não exista
async function inicializarTabelas() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS eventos_alimentador (
        id SERIAL PRIMARY KEY,
        gatilho VARCHAR(50) NOT NULL,
        delta_peso NUMERIC(6, 2),
        foto_url TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {
    console.error('[INIT DB EVENTOS]:', e.message);
  }
}
inicializarTabelas();

app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(65));
  console.log(' 🐱 SERVIDOR FELIS API (Node.js + PostgreSQL + MinIO)');
  console.log(` 📡 Ouvindo na porta ${PORT} em 0.0.0.0 (rede local)`);
  console.log(` 🐘 PostgreSQL: Conectado em 62.171.175.197:5432`);
  console.log(` 🪣 MinIO Bucket: http://62.171.175.197:9090/felis`);
  console.log('='.repeat(65));
});
