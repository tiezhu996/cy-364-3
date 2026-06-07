import { Module } from "@nestjs/common";
import { OverviewController } from "./overview/overview.controller";
import { OverviewService } from "./overview/overview.service";
import { InventoryCheckController } from "./inventory-check/inventory-check.controller";
import { InventoryCheckService } from "./inventory-check/inventory-check.service";
import { AppLogger } from "./common/app.logger";

@Module({
  controllers: [OverviewController, InventoryCheckController],
  providers: [OverviewService, InventoryCheckService, AppLogger],
})
export class AppModule {}
