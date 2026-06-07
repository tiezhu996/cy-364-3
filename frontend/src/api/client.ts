import { API_BASE_URL } from "../constants/app";
import type {
  OverviewResponse,
  Store,
  Product,
  InventoryCheck,
  CreateInventoryCheckRequest,
  UpdateInventoryCheckItemRequest,
  SubmitInventoryCheckRequest,
} from "../types";

export async function fetchOverview(): Promise<OverviewResponse> {
  const response = await fetch(`${API_BASE_URL}/overview`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Overview request failed: ${response.status}`);
  }

  return response.json() as Promise<OverviewResponse>;
}

export async function fetchStores(): Promise<Store[]> {
  const response = await fetch(`${API_BASE_URL}/inventory-checks/stores`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Stores request failed: ${response.status}`);
  }

  return response.json() as Promise<Store[]>;
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE_URL}/inventory-checks/products`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Products request failed: ${response.status}`);
  }

  return response.json() as Promise<Product[]>;
}

export async function fetchInventoryChecks(params?: {
  storeId?: number;
  status?: string;
  period?: string;
}): Promise<InventoryCheck[]> {
  const queryParams = new URLSearchParams();
  if (params?.storeId) queryParams.set("storeId", params.storeId.toString());
  if (params?.status) queryParams.set("status", params.status);
  if (params?.period) queryParams.set("period", params.period);

  const url = `${API_BASE_URL}/inventory-checks${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Inventory checks request failed: ${response.status}`);
  }

  return response.json() as Promise<InventoryCheck[]>;
}

export async function fetchInventoryCheck(id: number): Promise<InventoryCheck> {
  const response = await fetch(`${API_BASE_URL}/inventory-checks/${id}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Inventory check request failed: ${response.status}`);
  }

  return response.json() as Promise<InventoryCheck>;
}

export async function createInventoryCheck(
  data: CreateInventoryCheckRequest
): Promise<InventoryCheck> {
  const response = await fetch(`${API_BASE_URL}/inventory-checks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Create inventory check failed: ${response.status}`);
  }

  return response.json() as Promise<InventoryCheck>;
}

export async function updateInventoryCheckItem(
  checkId: number,
  itemId: number,
  data: UpdateInventoryCheckItemRequest
): Promise<InventoryCheck> {
  const response = await fetch(`${API_BASE_URL}/inventory-checks/${checkId}/items/${itemId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Update inventory check item failed: ${response.status}`);
  }

  return response.json() as Promise<InventoryCheck>;
}

export async function submitInventoryCheck(
  id: number,
  data: SubmitInventoryCheckRequest
): Promise<InventoryCheck> {
  const response = await fetch(`${API_BASE_URL}/inventory-checks/${id}/submit`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Submit inventory check failed: ${response.status}`);
  }

  return response.json() as Promise<InventoryCheck>;
}

export async function fetchPendingCount(): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/inventory-checks/pending-count`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Pending count request failed: ${response.status}`);
  }

  return response.json() as Promise<number>;
}
