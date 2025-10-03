import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "felipedgart@gmail.com",
    pass: "effw yhbr byja xcbf",
  },
});

export const sendRecoveryEmail = async (to, token) => {
  const url = `https://stocksafe.vercel.app/reset-password/${token}`;
  await transporter.sendMail({
    from: `"Suporte" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Recuperação de senha",
    html: `<p>Clique no link abaixo para redefinir sua senha:</p>
           <a href="${url}">${url}</a>
           <p>O link expira em 1 hora.</p>`,
  });
};
