const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let blocos = {};

wss.on('connection', (ws) => {
  console.log('Cliente conectado');

  ws.send(JSON.stringify({ tipo: 'estado', blocos }));

  ws.on('message', (mensagem) => {
    const dados = JSON.parse(mensagem);

    if (dados.tipo === 'mover') {
      blocos[dados.id] = { x: dados.x, y: dados.y };

      wss.clients.forEach((cliente) => {
        if (cliente.readyState === WebSocket.OPEN) {
          cliente.send(JSON.stringify(dados));
        }
      });
    }
  });
});
