import { transporter } from "./emailService.js";

/**
 * Envia e-mail de boas-vindas para o teste gratuito.
 *
 * @param {string} emailUser - e-mail do usuário destinatário
 * @param {string} fimTeste - data (ou texto) informando quando termina o teste
 * @param {string} [loginUrl] - URL para o usuário acessar o teste (opcional)
 */
export async function EnviarEmail(emailUser, fimTeste, loginUrl = "https://stockseguro.com.br/auth") {
  try {
    const subject = "Bem-vindo ao Stock Seguro — seu teste gratuito";
    const plainText = `Olá,

Bem-vindo ao Stock Seguro!

Seu período de teste gratuito termina em: ${fimTeste}

Acesse o sistema para começar: ${loginUrl}

Se precisar de ajuda, responda este e-mail para suporte@stockseguro.com.br

Atenciosamente,
Equipe Stock Seguro`;

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Bem-vindo ao Stock Seguro</title>
      </head>
      <body style="font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#111827; margin:0; padding:0; background:#f7fafc;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px; margin:32px auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 6px 18px rgba(17,24,39,0.08);">
          <tr>
            <td style="padding:24px 28px; text-align:left; border-bottom:1px solid #eef2f7;">
              <h1 style="margin:0; font-size:20px; font-weight:600; color:#0f172a;">Bem-vindo ao Stock Seguro</h1>
              <p style="margin:6px 0 0; color:#475569; font-size:14px;">Seu período de teste gratuito já está ativo.</p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 28px;">
              <p style="margin:0 0 12px; color:#0f172a; font-size:15px; line-height:1.6;">
                Olá,
              </p>

              <p style="margin:0 0 12px; color:#475569; font-size:15px; line-height:1.6;">
                Obrigado por testar o <strong>Stock Seguro</strong>. Durante o período de avaliação você terá acesso completo às funcionalidades básicas do sistema para gerenciar requisições, controlar estoque e acompanhar o valor em estoque em tempo real.
              </p>

              <ul style="margin:0 0 16px 20px; color:#475569;">
                <li>Cadastro e controle de produtos</li>
                <li>Requisições online com fluxo de aprovação</li>
                <li>Cálculo automático do valor em estoque</li>
                <li>Dashboard em tempo real para administradores</li>
              </ul>

              <p style="margin:0 0 18px; color:#0f172a; font-size:15px;">
                <strong>Seu teste termina em:</strong> ${fimTeste}
              </p>

              <p style="margin:0 0 20px;">
                <a href="${loginUrl}" style="display:inline-block; background:#2563eb; color:#fff; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:600;">Acessar minha conta</a>
              </p>

              <p style="margin:0 0 8px; color:#475569; font-size:13px; line-height:1.5;">
                Se precisar de suporte ou quiser uma demonstração guiada, responda a este e-mail ou contacte <a href="mailto:suporte@stockseguro.com.br" style="color:#2563eb; text-decoration:none;">suporte@stockseguro.com.br</a>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 28px; border-top:1px solid #eef2f7; background:#fafafc; color:#94a3b8; font-size:12px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>Stock Seguro</div>
                <div>Se preferir não receber notificações, responda a este e-mail com "REMOVER".</div>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Stock Seguro" <no-reply@stockseguro.com.br>`,
      to: emailUser,
      replyTo: "suporte@stockseguro.com.br",
      subject,
      text: plainText,
      html,
    };

    // Envia o e-mail e aguarda
    await transporter.sendMail(mailOptions);

    return { success: true, message: "E-mail de boas-vindas enviado." };
  } catch (err) {
    console.error("Erro ao enviar e-mail de boas-vindas:", err);
    return { success: false, message: "Erro ao enviar e-mail.", error: err };
  }
}
