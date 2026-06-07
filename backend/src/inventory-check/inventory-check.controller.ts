import { Controller, Get, Post, Put, Param, Body, Query } from "@nestjs/common";
import { InventoryCheckService } from "./inventory-check.service";
import { CreateInventoryCheckDto, UpdateInventoryCheckItemDto, SubmitInventoryCheckDto } from "./inventory-check.dto";

@Controller("api/inventory-checks")
export class InventoryCheckController {
  constructor(private readonly inventoryCheckService: InventoryCheckService) {}

  @Post()
  create(@Body() dto: CreateInventoryCheckDto) {
    return this.inventoryCheckService.create(dto);
  }

  @Get()
  findAll(
    @Query("storeId") storeId?: string,
    @Query("status") status?: string,
    @Query("period") period?: string
  ) {
    const params: any = {};
    if (storeId) params.storeId = Number(storeId);
    if (status) params.status = status;
    if (period) params.period = period;
    return this.inventoryCheckService.findAll(params);
  }

  @Get("pending-count")
  getPendingCount() {
    return this.inventoryCheckService.getPendingStoresCount();
  }

  @Get("stores")
  getStores() {
    return this.inventoryCheckService.getStores();
  }

  @Get("products")
  getProducts() {
    return this.inventoryCheckService.getProducts();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.inventoryCheckService.findOne(Number(id));
  }

  @Put(":id/items/:itemId")
  updateItem(
    @Param("id") checkId: string,
    @Param("itemId") itemId: string,
    @Body() dto: UpdateInventoryCheckItemDto
  ) {
    return this.inventoryCheckService.updateItem(Number(checkId), Number(itemId), dto);
  }

  @Put(":id/submit")
  submit(@Param("id") id: string, @Body() dto: SubmitInventoryCheckDto) {
    return this.inventoryCheckService.submit(Number(id), dto);
  }
}
