import { Client, ActivityType } from "discord.js";
import { strikeStore } from "./strikeStore.js";
import { moderationQueue } from "./queue.js";

/**
 * 10-Minute Telemetric Status Logger & Memory Watchdog
 * 
 * Essential for Termux Android runtime to monitor RAM consumption (RSS)
 * and prevent Android's aggressive Low Memory Killer (LMK) from terminating the bot.
 */
export function startStatusLogger(client: Client): NodeJS.Timeout {
  const TEN_MINUTES_MS = 10 * 60 * 1000;

  const logStatus = () => {
    try {
      const memory = process.memoryUsage();
      const formatMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2);
      
      const rssMB = parseFloat(formatMB(memory.rss));
      const heapUsedMB = parseFloat(formatMB(memory.heapUsed));
      const heapTotalMB = parseFloat(formatMB(memory.heapTotal));
      
      const uptimeSec = Math.floor(process.uptime());
      const hours = Math.floor(uptimeSec / 3600);
      const minutes = Math.floor((uptimeSec % 3600) / 60);
      const seconds = uptimeSec % 60;
      const uptimeString = `${hours}h ${minutes}m ${seconds}s`;

      const guildsCount = client.guilds.cache.size;
      const cachedUsers = client.users.cache.size;
      const activeStrikes = strikeStore.getActiveCount();
      const queueStats = moderationQueue.getStats();

      console.log("\n================ [ 10-MINUTE SYSTEM STATUS ] ================");
      console.log(`⏱️ Uptime:            ${uptimeString}`);
      console.log(`📊 Servers / Users:    ${guildsCount} guilds | ${cachedUsers} cached users`);
      console.log(`🧠 Memory (Termux):   RSS: ${rssMB} MB | Heap: ${heapUsedMB}/${heapTotalMB} MB`);
      console.log(`⚡ Strike Records:     ${activeStrikes} active in-memory`);
      console.log(`🤖 AI Queue Stats:     Processed: ${queueStats.totalProcessed} | In-Flight: ${queueStats.inFlight} | Dropped: ${queueStats.totalDropped}`);
      
      // Proactive Termux Android OOM Warning
      if (rssMB > 160) {
        console.warn(`⚠️ [MEM WARNING] RSS usage is high (${rssMB} MB). If running with '--expose-gc', triggering manual garbage collection.`);
        if (typeof global.gc === "function") {
          global.gc();
          console.log(`🧹 Manual GC executed. New Heap: ${formatMB(process.memoryUsage().heapUsed)} MB`);
        }
      }
      console.log("============================================================\n");

      // Update bot presence status
      if (client.user) {
        client.user.setPresence({
          activities: [
            {
              name: `🛡️ Guarding ${guildsCount} Guilds | AI Active`,
              type: ActivityType.Custom,
            },
          ],
          status: "online",
        });
      }
    } catch (error: any) {
      console.error("[Status Logger] Non-fatal error collecting metrics:", error?.message || error);
    }
  };

  // Run once shortly after startup, then every 10 minutes
  setTimeout(logStatus, 5000);
  const interval = setInterval(logStatus, TEN_MINUTES_MS);
  return interval;
}
