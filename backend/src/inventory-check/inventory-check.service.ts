import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { CreateInventoryCheckDto, UpdateInventoryCheckItemDto, SubmitInventoryCheckDto } from "./inventory-check.dto";

@Injectable()
export class InventoryCheckService {
  private prisma = new PrismaClient();

  generateCheckNo(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `PD${year}${month}${day}${random}`;
  }

  calculateDifference(systemStock: number, actualStock: number, price: number) {
    const difference = actualStock - systemStock;
    const differenceValue = difference * price;
    let differenceType = "normal";
    if (difference > 0) {
      differenceType = "profit";
    } else if (difference < 0) {
      differenceType = "loss";
    }
    return { difference, differenceValue, differenceType };
  }

  async create(dto: CreateInventoryCheckDto) {
    const store = await this.prisma.store.findUnique({ where: { id: dto.storeId } });
    if (!store) {
      throw new NotFoundException("门店不存在");
    }

    const checkNo = this.generateCheckNo();

    let totalProfit = 0;
    let totalLoss = 0;

    const items = dto.items.map((item) => {
      const { difference, differenceValue, differenceType } = this.calculateDifference(
        item.systemStock,
        item.actualStock,
        item.price
      );
      if (differenceValue > 0) {
        totalProfit += differenceValue;
      } else if (differenceValue < 0) {
        totalLoss += Math.abs(differenceValue);
      }
      return {
        ...item,
        difference,
        differenceValue,
        differenceType,
      };
    });

    const inventoryCheck = await this.prisma.inventoryCheck.create({
      data: {
        checkNo,
        storeId: dto.storeId,
        period: dto.period,
        status: "pending",
        operator: dto.operator,
        remark: dto.remark,
        totalProfit,
        totalLoss,
        items: {
          create: items,
        },
      },
      include: {
        store: true,
        items: true,
      },
    });

    return inventoryCheck;
  }

  async findAll(params?: { storeId?: number; status?: string; period?: string }) {
    const where: any = {};
    if (params?.storeId) where.storeId = params.storeId;
    if (params?.status) where.status = params.status;
    if (params?.period) where.period = params.period;

    return this.prisma.inventoryCheck.findMany({
      where,
      include: {
        store: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOne(id: number) {
    const check = await this.prisma.inventoryCheck.findUnique({
      where: { id },
      include: {
        store: true,
        items: true,
      },
    });
    if (!check) {
      throw new NotFoundException("盘点单不存在");
    }
    return check;
  }

  async updateItem(checkId: number, itemId: number, dto: UpdateInventoryCheckItemDto) {
    const check = await this.prisma.inventoryCheck.findUnique({ where: { id: checkId } });
    if (!check) {
      throw new NotFoundException("盘点单不存在");
    }
    if (check.status === "completed") {
      throw new BadRequestException("盘点单已完成，无法修改");
    }

    const item = await this.prisma.inventoryCheckItem.findUnique({ where: { id: itemId } });
    if (!item || item.checkId !== checkId) {
      throw new NotFoundException("盘点明细不存在");
    }

    const { difference, differenceValue, differenceType } = this.calculateDifference(
      item.systemStock,
      dto.actualStock,
      Number(item.price)
    );

    await this.prisma.inventoryCheckItem.update({
      where: { id: itemId },
      data: {
        actualStock: dto.actualStock,
        difference,
        differenceValue,
        differenceType,
        remark: dto.remark,
      },
    });

    const allItems = await this.prisma.inventoryCheckItem.findMany({ where: { checkId } });
    let totalProfit = 0;
    let totalLoss = 0;
    allItems.forEach((i) => {
      const val = Number(i.differenceValue);
      if (val > 0) {
        totalProfit += val;
      } else if (val < 0) {
        totalLoss += Math.abs(val);
      }
    });

    await this.prisma.inventoryCheck.update({
      where: { id: checkId },
      data: { totalProfit, totalLoss },
    });

    return this.findOne(checkId);
  }

  async submit(id: number, dto: SubmitInventoryCheckDto) {
    const check = await this.prisma.inventoryCheck.findUnique({
      where: { id },
      include: { items: true, store: true },
    });
    if (!check) {
      throw new NotFoundException("盘点单不存在");
    }
    if (check.status === "completed") {
      throw new BadRequestException("盘点单已完成");
    }

    const netProfit = Number(check.totalProfit) - Number(check.totalLoss);
    const metric = netProfit >= 0 ? `盈亏 +¥${netProfit.toFixed(2)}` : `盈亏 -¥${Math.abs(netProfit).toFixed(2)}`;

    const updated = await this.prisma.inventoryCheck.update({
      where: { id },
      data: {
        status: "completed",
        operator: dto.operator || check.operator,
        remark: dto.remark || check.remark,
        completedAt: new Date(),
      },
      include: {
        store: true,
        items: true,
      },
    });

    await this.prisma.operationRecord.create({
      data: {
        moduleName: "门店月度盘点",
        ownerName: dto.operator || "盘点组",
        status: "completed",
        metric,
      },
    });

    return updated;
  }

  async getPendingStoresCount() {
    return this.prisma.inventoryCheck.count({
      where: { status: "pending" },
    });
  }

  async getStores() {
    return this.prisma.store.findMany({ where: { isActive: true } });
  }

  async getProducts() {
    return this.prisma.product.findMany({ where: { isActive: true } });
  }
}
