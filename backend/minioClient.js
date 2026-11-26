const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || '62.171.175.197',
  port: parseInt(process.env.MINIO_PORT, 10) || 9090,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'Raedr93D928'
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'felis';

// Garante que o bucket existe e possui política de leitura pública
async function inicializarBucket() {
  try {
    const existe = await minioClient.bucketExists(BUCKET_NAME);
    if (!existe) {
      console.log(`[MINIO] Criando bucket "${BUCKET_NAME}"...`);
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`[MINIO] ✅ Bucket "${BUCKET_NAME}" criado com sucesso!`);
    }

    const readOnlyPolicy = JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
        }
      ]
    });

    try {
      await minioClient.setBucketPolicy(BUCKET_NAME, readOnlyPolicy);
    } catch (e) {
      // Ignora erro de re-aplicar policy se já existir
    }
  } catch (err) {
    console.error('[MINIO] Erro ao inicializar bucket:', err.message);
  }
}

// Faz upload de buffer e retorna a URL pública acessível
async function uploadArquivo(nomeArquivo, buffer, mimeType = 'image/jpeg') {
  await minioClient.putObject(BUCKET_NAME, nomeArquivo, buffer, buffer.length, {
    'Content-Type': mimeType
  });

  const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
  const endpoint = process.env.MINIO_ENDPOINT;
  const port = process.env.MINIO_PORT;
  
  // URL pública direta para o arquivo no MinIO
  const urlPublica = `${protocol}://${endpoint}:${port}/${BUCKET_NAME}/${nomeArquivo}`;
  return urlPublica;
}

inicializarBucket();

module.exports = {
  minioClient,
  BUCKET_NAME,
  uploadArquivo
};
