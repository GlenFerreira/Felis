const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const FOTOS_DIR = path.join(__dirname, 'fotos');

if (!fs.existsSync(FOTOS_DIR)) {
    fs.mkdirSync(FOTOS_DIR, { recursive: true });
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

function limparIp(ip) {
    if (!ip) return 'desconhecido';
    return ip.replace('::ffff:', '');
}

const server = http.createServer((req, res) => {
    const ipOrigem = limparIp(req.socket.remoteAddress);
    const horaAtual = new Date().toLocaleTimeString();

    // Rota GET / (Ping e teste de conectividade do ESP32 ou Navegador)
    if (req.method === 'GET' && req.url === '/') {
        const device = req.headers['x-device'] || 'Dispositivo';
        const espIp = req.headers['x-esp-ip'] || ipOrigem;

        console.log(`\n[${horaAtual}] 🟢 CONEXÃO DETECTADA!`);
        console.log(`   -> Origem: ${device} no IP: ${espIp}`);
        console.log(`   -> Status: Comunicação com o Backend confirmada com sucesso!\n`);

        const fotos = fs.readdirSync(FOTOS_DIR).sort().reverse();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
            status: 'online',
            mensagem: 'Servidor Felis online e pronto para receber fotos!',
            device_conectado: device,
            total_fotos: fotos.length,
            ultimas_fotos: fotos.slice(0, 10)
        }, null, 2));
    }

    // Rota POST /upload para receber a foto do ESP32-CAM
    if (req.method === 'POST' && req.url.startsWith('/upload')) {
        const chunks = [];

        req.on('data', (chunk) => {
            chunks.push(chunk);
        });

        req.on('end', () => {
            const buffer = Buffer.concat(chunks);

            if (buffer.length === 0) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ status: 'erro', mensagem: 'Nenhum dado recebido' }));
            }

            const trigger = (req.headers['x-trigger'] || 'desconhecido').toLowerCase();
            const delta = req.headers['x-weight-delta'] || '0';
            const espIp = req.headers['x-esp-ip'] || ipOrigem;

            const timestamp = formatTimestamp();
            const nomeArquivo = `${timestamp}_${trigger}.jpg`;
            const caminhoArquivo = path.join(FOTOS_DIR, nomeArquivo);

            fs.writeFile(caminhoArquivo, buffer, (err) => {
                if (err) {
                    console.error('[ERRO] Falha ao salvar foto:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ status: 'erro', mensagem: 'Falha ao salvar arquivo' }));
                }

                const tamanhoKB = (buffer.length / 1024).toFixed(1);
                console.log(`[${horaAtual}] 📸 FOTO RECEBIDA DO ESP32 (${espIp})!`);
                console.log(`   -> Gatilho: ${trigger.toUpperCase()} (Diminuiu: -${delta}g/ml)`);
                console.log(`   -> Arquivo: fotos/${nomeArquivo} (${tamanhoKB} KB)\n`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'ok',
                    arquivo: nomeArquivo,
                    trigger: trigger,
                    tamanho_kb: tamanhoKB
                }));
            });
        });

        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'erro', mensagem: 'Rota nao encontrada' }));
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log(' 🐱 SERVIDOR LOCAL ALIMENTADOR FELIS (Node.js)');
    console.log(` Ouvindo na porta ${PORT} em 0.0.0.0 (rede local)`);
    console.log(` As fotos serao salvas na pasta: ${FOTOS_DIR}`);
    console.log(' Aguardando conexao do ESP32-CAM...');
    console.log('='.repeat(60));
});
