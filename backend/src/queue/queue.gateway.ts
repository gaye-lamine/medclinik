import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client WebSocket connecté: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client WebSocket déconnecté: ${client.id}`);
  }

  broadcastQueueUpdate() {
    if (this.server) {
      this.server.emit('queue_updated');
    }
  }
}
