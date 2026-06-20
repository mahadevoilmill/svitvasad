import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';

let client;
let qrCodeData = null;
let clientStatus = 'disconnected'; // disconnected, qr, ready, authenticated

export const initWhatsApp = () => {
  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions'
      ],
      headless: true
    }
  });

  console.log('Initializing WhatsApp client...');

  client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr.substring(0, 20) + '...');
    qrcode.toDataURL(qr, (err, url) => {
      qrCodeData = url;
      clientStatus = 'qr';
    });
  });

  client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
    clientStatus = 'loading';
  });

  client.on('authenticated', () => {
    console.log('AUTHENTICATED');
    clientStatus = 'authenticated';
    qrCodeData = null;
  });

  client.on('ready', () => {
    console.log('READY');
    clientStatus = 'ready';
  });

  client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
    clientStatus = 'disconnected';
  });

  client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
    clientStatus = 'disconnected';
    client.initialize();
  });

  client.initialize().catch(err => console.error('Initialization error:', err));
};

export const getStatus = () => ({
  status: clientStatus,
  qr: qrCodeData
});

export const sendMessage = async (number, message) => {
  if (clientStatus !== 'ready') {
    throw new Error('WhatsApp client is not ready. Please scan the QR code first.');
  }

  // Format number: remove +, spaces, and add @c.us
  const cleanNumber = number.replace(/\D/g, '');
  const finalNumber = cleanNumber.includes('@c.us') ? cleanNumber : `${cleanNumber}@c.us`;

  return await client.sendMessage(finalNumber, message);
};
