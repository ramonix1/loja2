import { io, type Socket } from 'socket.io-client';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');

/** Conecta ao Socket.IO da API Fastify. */
export function createChatSocket(): Socket {
  return io(API_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
  });
}

export { API_URL as CHAT_SOCKET_URL };
