const nodemailer = require('nodemailer');

function createTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
  });
}

async function enviarRecuperacaoSenha({ email, nome, resetUrl }) {
  const transport = createTransport();
  if (!transport) throw new Error('SMTP não configurado.');
  const safeName = String(nome || 'estudante').replace(/[<>&"']/g, '');
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Redefinição de senha — PlanejAI',
    text: `Olá, ${safeName}. Redefina sua senha em ${resetUrl}. O link expira em 30 minutos.`,
    html: `<p>Olá, ${safeName}.</p><p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${resetUrl}">Redefinir minha senha</a></p><p>O link expira em 30 minutos. Se não foi você, ignore esta mensagem.</p>`
  });
}

module.exports = { enviarRecuperacaoSenha };
