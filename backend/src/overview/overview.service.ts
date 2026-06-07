import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { overviewData as staticOverviewData } from "./overview.data";

@Injectable()
export class OverviewService {
  private prisma = new PrismaClient();

  async getOverview() {
    const pendingCount = await this.prisma.inventoryCheck.count({
      where: { status: "pending" },
    });

    const operationRecords = await this.prisma.operationRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const statusMap: Record<string, string> = {
      ready: "已上线",
      processing: "处理中",
      pending: "待处理",
      completed: "已完成",
    };

    const priorityMap: Record<string, string> = {
      ready: "高",
      processing: "中",
      pending: "高",
      completed: "低",
    };

    const records = operationRecords.map((record, index) => ({
      key: `record-${record.id}`,
      name: record.moduleName,
      owner: record.ownerName,
      status: statusMap[record.status] || record.status,
      metric: record.metric,
      priority: priorityMap[record.status] || "中",
    }));

    const originalPending = parseInt(staticOverviewData.kpis.find((k) => k.label === "待处理")?.value || "0");
    const totalPending = originalPending + pendingCount;

    const kpis = staticOverviewData.kpis.map((kpi) => {
      if (kpi.label === "待处理") {
        return {
          ...kpi,
          value: totalPending.toString(),
          trend: pendingCount > 0 ? `${pendingCount} 门店待盘点` : "无待盘点",
        };
      }
      return kpi;
    });

    const overviewRecords = [
      ...staticOverviewData.records,
      ...records,
    ].slice(0, 10);

    return {
      ...staticOverviewData,
      kpis,
      records: overviewRecords,
    };
  }

  getHealth() {
    return { status: "ok" };
  }
}
