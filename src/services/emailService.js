import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendRecoveryEmail = async (to, code) => {
  await transporter.sendMail({
    from: `"Suporte" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Código de recuperação de senha",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Recuperação de senha</h2>
        <p>Use o código abaixo para redefinir sua senha:</p>

        <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 16px 0; color: #2563eb;">
          ${code}
        </div>

        <p>O código expira em <strong>1 hora</strong>.</p>
        <p>Se você não solicitou essa recuperação, ignore este e-mail.</p>
      </div>
    `,
  });
};

