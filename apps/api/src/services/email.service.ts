/**
 * E-mails transacionais — port simplificado de `emailService.js`.
 * Em teste/dev sem credenciais, apenas loga (não falha checkout).
 */

export interface PedidoPagoEmailInput {
  lojaNome: string;
  lojaEmail: string;
  pedido: { id: number; total: number; metodo_pagamento?: string };
  itens: Array<{ quantidade: number; nome?: string; nome_produto?: string; subtotal: number }>;
}

export async function enviarNotificacaoPedidoPago(input: PedidoPagoEmailInput): Promise<void> {
  if (!input.lojaEmail) return;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[Email] Pedido pago #${input.pedido.id} — credenciais SMTP ausentes, skip.`);
    return;
  }

  // Envio real via SMTP fica opcional (legacy continua com nodemailer até descomissionamento).
  console.log(
    `[Email] Notificação pedido pago #${input.pedido.id} para ${input.lojaEmail} (${input.itens.length} itens).`,
  );
}
