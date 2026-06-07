export interface FeatureItem {
  id: number;
  title: string;
  description: string;
  status: string;
  metric: string;
}

export interface KpiItem {
  label: string;
  value: string;
  trend: string;
  tone: string;
}

export interface OperationRecord {
  key: string;
  name: string;
  owner: string;
  status: string;
  metric: string;
  priority: string;
}

export interface OverviewResponse {
  appName: string;
  appCode: string;
  description: string;
  features: FeatureItem[];
  kpis: KpiItem[];
  records: OperationRecord[];
}

export interface Store {
  id: number;
  name: string;
  code: string;
  address?: string;
  manager?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  category?: string;
  unit: string;
  price: number;
  isActive: boolean;
  createdAt: string;
}

export interface InventoryCheckItem {
  id: number;
  checkId: number;
  productId: number;
  productName: string;
  productSku: string;
  unit: string;
  price: number;
  systemStock: number;
  actualStock: number;
  difference: number;
  differenceValue: number;
  differenceType?: "normal" | "profit" | "loss";
  remark?: string;
  createdAt: string;
}

export interface InventoryCheck {
  id: number;
  checkNo: string;
  storeId: number;
  store?: Store;
  period: string;
  status: "pending" | "processing" | "completed";
  operator?: string;
  remark?: string;
  totalProfit: number;
  totalLoss: number;
  createdAt: string;
  completedAt?: string;
  items?: InventoryCheckItem[];
}

export interface CreateInventoryCheckRequest {
  storeId: number;
  period: string;
  operator?: string;
  remark?: string;
  items: {
    productId: number;
    productName: string;
    productSku: string;
    unit: string;
    price: number;
    systemStock: number;
    actualStock: number;
    remark?: string;
  }[];
}

export interface UpdateInventoryCheckItemRequest {
  actualStock: number;
  remark?: string;
}

export interface SubmitInventoryCheckRequest {
  operator?: string;
  remark?: string;
}
