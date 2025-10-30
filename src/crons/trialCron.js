import cron from "node-cron"
import { verificarTrialsExpirados } from "../services/trialService.js";

// Roda todo dia às 00:00
export function startTrialCron() {
  cron.schedule("0 0 * * *", async () => {
    console.log("Verificando trials expirados...");
    try {
      await verificarTrialsExpirados();
    } catch (error) {
      console.error("Erro ao processar trials expirados:", error);
    }
  });
}
