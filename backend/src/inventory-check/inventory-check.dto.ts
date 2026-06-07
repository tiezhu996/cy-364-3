import { IsNotEmpty, IsNumber, IsString, IsOptional, IsArray, ArrayNotEmpty } from "class-validator";

export class CreateInventoryCheckDto {
  @IsNumber()
  @IsNotEmpty()
  storeId!: number;

  @IsString()
  @IsNotEmpty()
  period!: string;

  @IsString()
  @IsOptional()
  operator?: string;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsArray()
  @ArrayNotEmpty()
  items!: CreateInventoryCheckItemDto[];
}

export class CreateInventoryCheckItemDto {
  @IsNumber()
  @IsNotEmpty()
  productId!: number;

  @IsString()
  @IsNotEmpty()
  productName!: string;

  @IsString()
  @IsNotEmpty()
  productSku!: string;

  @IsString()
  @IsNotEmpty()
  unit!: string;

  @IsNumber()
  price!: number;

  @IsNumber()
  systemStock!: number;

  @IsNumber()
  actualStock!: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpdateInventoryCheckItemDto {
  @IsNumber()
  actualStock!: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class SubmitInventoryCheckDto {
  @IsString()
  @IsOptional()
  operator?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}
