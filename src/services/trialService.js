import prisma from "./prismaClient.js";

export async function verificarTrialsExpirados() {
  const agora = new Date();

  // Busca todas as assinaturas trial que já expiraram
  const expiradas = await prisma.subscription.findMany({
    where: {
      isTrial: true,
      currentPeriodEnd: { lt: agora },
      status: "trialing",
    },
  });

  // Atualiza o status para 'expired'
  for (const sub of expiradas) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "expired" },
    });
  }

  console.log(`Trials expirados processados: ${expiradas.length}`);
}
