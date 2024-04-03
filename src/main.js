const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const fs = require('fs'); // Импортируем модуль fs для работы с файлами

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());

const MESSAGES_FILE = './data/messages.json'; // Имя файла для хранения сообщений

// Функция для чтения сообщений из файла
const readMessagesFromFile = () => {
  try {
    if (fs.existsSync(MESSAGES_FILE)) { // Проверяем существование файла
      const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
      return JSON.parse(data);
    } else {
      // Если файл не существует, возвращаем пустой массив
      return [];
    }
  } catch (error) {
    console.error('Error reading messages from file:', error);
    return [];
  }
};


// Функция для записи сообщений в файл
const writeMessagesToFile = (messages) => {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages), 'utf8');
  } catch (error) {
    console.error('Error writing messages to file:', error);
  }
};

// Проверяем существование файла перед его записью
if (!fs.existsSync(MESSAGES_FILE)) {
  writeMessagesToFile([]);
}

let messages = readMessagesFromFile(); // Читаем сообщения из файла при запуске сервера

wss.on('connection', function connection(ws) {
  ws.send(JSON.stringify(messages));

  ws.on('message', function incoming(message) {
    const newMessage = JSON.parse(message);
    messages.push(newMessage);
    writeMessagesToFile(messages); // После добавления нового сообщения записываем обновленный список в файл
    
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(messages));
      }
    });
  });
});

app.use(express.json());

app.post('/messages', (req, res) => {
  const newMessage = req.body;
  messages.push(newMessage);
  writeMessagesToFile(messages); // После добавления нового сообщения записываем обновленный список в файл
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(messages));
    }
  });

  res.json(messages);
});

app.delete('/messages/:id', (req, res) => {
  const messageId = req.params.id;
  messages = messages.filter((message, index) => index !== parseInt(messageId));
  writeMessagesToFile(messages); // После удаления сообщения записываем обновленный список в файл
  
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(messages));
    }
  });

  res.json(messages);
});

app.get('/messages', (req, res) => {
  res.json(messages);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
