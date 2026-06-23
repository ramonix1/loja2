import { io, type Socket } from 'socket.io-client';

import { chatSocketUrl } from './browser-api.js';

/** Conecta ao Socket.IO da API Fastify. */
export function createChatSocket(): Socket {
  return io(chatSocketUrl(), {
    withCredentials: true,
    transports: ['websocket', 'polling'],
  });
}

export { chatSocketUrl as CHAT_SOCKET_URL };
