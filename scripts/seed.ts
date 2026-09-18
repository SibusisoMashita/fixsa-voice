import { seedReports } from "../src/lib/seed";
import { serviceReportSchema } from "../src/lib/schemas";

for (const report of seedReports) serviceReportSchema.parse(report);
console.log(`Validated ${seedReports.length} wholly synthetic FixSA Voice seed reports.`);
console.log("The browser demo seeds automatically; no external database was modified.");
