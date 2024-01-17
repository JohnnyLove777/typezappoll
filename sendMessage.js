const http = require('http');
const bodyParser = require('body-parser');
const qrcode = require('qrcode-terminal');
const express = require('express');
const { Client, Buttons, List, MessageMedia, LocalAuth } = require('whatsapp-web.js');
require('dotenv').config();

const sessao = "sendMessage";

const app = express();
const server = http.createServer(app);

const port = 3000;

app.use(express.static('.'));
//app.use(bodyParser.json());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Configurações para o primeiro cliente (Windows)
/*const client = new Client({
    authStrategy: new LocalAuth({ clientId: sessao }),
    puppeteer: {
      executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    }
  });*/
  
  //Kit com os comandos otimizados para nuvem Ubuntu Linux (créditos Pedrinho da Nasa Comunidade ZDG)
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: sessao }),
    puppeteer: {
      headless: true,
      //CAMINHO DO CHROME PARA WINDOWS (REMOVER O COMENTÁRIO ABAIXO)
      //executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
      //===================================================================================
      // CAMINHO DO CHROME PARA MAC (REMOVER O COMENTÁRIO ABAIXO)
      //executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      //===================================================================================
      // CAMINHO DO CHROME PARA LINUX (REMOVER O COMENTÁRIO ABAIXO)
       executablePath: '/usr/bin/google-chrome-stable',
      //===================================================================================
      args: [
        '--no-sandbox', //Necessário para sistemas Linux
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // <- Este não funciona no Windows, apague caso suba numa máquina Windows
        '--disable-gpu'
      ]
    }
  });
  
// entao habilitamos o usuario a acessar o serviço de leitura do qr code
client.on('qr', qr => {
  qrcode.generate(qr, {small: true});
});

// apos isso ele diz que foi tudo certin
client.on('ready', () => {
  console.log('API de endpoint sendMessage pronta e conectada.');
});

app.post('/sendMessage', async (req, res) => {
    const { destinatario, mensagem, tipo, msg, media } = req.body;

    if (!client || !client.info) {
        return res.status(402).json({status: 'falha', message: 'Cliente Não Autenticado'});
    }

    if (!destinatario || !tipo) {
        return res.status(400).json({ status: 'falha', mensagem: 'Destinatario e tipo são obrigatórios' });
    }    

    try {
        const chatId = destinatario;

        switch (tipo) {
            case 'text':
                if (!mensagem) {
                    return res.status(400).json({ status: 'falha', mensagem: 'É preciso fornecer uma mensagem' });
                }
                await client.sendMessage(chatId, mensagem);
                break;
            case 'image':
                if (!media) {
                    return res.status(400).json({ status: 'falha', mensagem: 'É preciso fornecer uma midia' });
                }                
                await client.sendMessage(chatId, new MessageMedia(media.mimetype, media.data, media.filename));
                break;
            case 'video':
                if (!media) {
                    return res.status(400).json({ status: 'falha', mensagem: 'É preciso fornecer uma midia' });
                }
                await client.sendMessage(chatId, new MessageMedia(media.mimetype, media.data, media.filename));
                break;
            case 'audio':
                if (!media) {
                    return res.status(400).json({ status: 'falha', mensagem: 'É preciso fornecer uma midia' });
                }
                await client.sendMessage(chatId, new MessageMedia(media.mimetype, media.data, media.filename), {sendAudioAsVoice: true});
                break;
            case 'file':
                if (!media) {
                    return res.status(400).json({ status: 'falha', mensagem: 'É preciso fornecer uma midia' });
                }
                await client.sendMessage(chatId, new MessageMedia(media.mimetype, media.data, media.filename));
                break;
            default:
                return res.status(400).json({ status: 'falha', mensagem: 'Tipo de mensagem inválido' });
        }

        res.status(200).json({ status: 'sucesso', mensagem: 'Mensagem enviada com sucesso'});
    } catch (error) {
        console.error(error);        
        res.status(500).json({ status: 'falha', mensagem: 'Erro ao enviar mensagem' });
    }
});

client.initialize();

server.listen(port, () => {
    console.log(`Servidor sendMessage rodando em http://localhost:${port}`);
});