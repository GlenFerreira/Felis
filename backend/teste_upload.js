const http = require('http');

// Simula o ESP32 enviando uma foto JPEG de teste para o servidor Node.js
const dummyJpeg = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
    0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60,
    0x00, 0x60, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0xFF, 0xD9
]);

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/upload',
    method: 'POST',
    headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': dummyJpeg.length,
        'X-Trigger': 'agua',
        'X-Weight-Delta': '15.0'
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        console.log('Resposta do Servidor Node:', body);
        console.log('Teste concluído com sucesso!');
    });
});

req.on('error', (e) => {
    console.error('Erro na requisição:', e.message);
});

req.write(dummyJpeg);
req.end();
