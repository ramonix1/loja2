import { io, type Socket } from 'socket.io-client';

const LEGACY_URL = (import.meta.env.VITE_LEGACY_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/** Conecta ao Socket.IO do legacy (temporário até Fase 4). */
export function createChatSocket(): Socket {
  return io(LEGACY_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
  });
}

export { LEGACY_URL as CHAT_SOCKET_URL };
