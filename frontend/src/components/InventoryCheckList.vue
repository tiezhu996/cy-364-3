<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { ElMessage } from "element-plus";
import { fetchInventoryChecks, fetchStores, createInventoryCheck, fetchProducts } from "../api/client";
import type { InventoryCheck, Store, Product, CreateInventoryCheckRequest } from "../types";
import InventoryCheckDetail from "./InventoryCheckDetail.vue";

const checks = ref<InventoryCheck[]>([]);
const stores = ref<Store[]>([]);
const products = ref<Product[]>([]);
const loading = ref(false);
const showCreateDialog = ref(false);
const showDetailDialog = ref(false);
const selectedCheckId = ref<number | null>(null);
const statusFilter = ref("");

const formData = ref({
  storeId: 0,
  period: "",
  operator: "",
  remark: "",
});

const statusMap: Record<string, { label: string; type: string }> = {
  pending: { label: "待盘点", type: "warning" },
  processing: { label: "盘点中", type: "primary" },
  completed: { label: "已完成", type: "success" },
};

const filteredChecks = computed(() => {
  if (!statusFilter.value) return checks.value;
  return checks.value.filter((c) => c.status === statusFilter.value);
});

const generatedItems = computed<CreateInventoryCheckRequest["items"]>(() => {
  return products.value.map((p) => ({
    productId: p.id,
    productName: p.name,
    productSku: p.sku,
    unit: p.unit,
    price: p.price,
    systemStock: Math.floor(Math.random() * 200) + 10,
    actualStock: 0,
  }));
});

async function loadData() {
  loading.value = true;
  try {
    const [checksData, storesData, productsData] = await Promise.all([
      fetchInventoryChecks(),
      fetchStores(),
      fetchProducts(),
    ]);
    checks.value = checksData;
    stores.value = storesData;
    products.value = productsData;
  } catch (e) {
    ElMessage.error("加载数据失败");
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  formData.value = {
    storeId: 0,
    period: `${lastMonth.getFullYear()}年${lastMonth.getMonth() + 1}月`,
    operator: "",
    remark: "",
  };
  showCreateDialog.value = true;
}

async function handleCreate() {
  if (!formData.value.storeId) {
    ElMessage.warning("请选择门店");
    return;
  }

  try {
    await createInventoryCheck({
      storeId: formData.value.storeId,
      period: formData.value.period,
      operator: formData.value.operator,
      remark: formData.value.remark,
      items: generatedItems.value,
    });
    ElMessage.success("盘点单创建成功");
    showCreateDialog.value = false;
    await loadData();
  } catch (e) {
    ElMessage.error("创建盘点单失败");
  }
}

function viewDetail(id: number) {
  selectedCheckId.value = id;
  showDetailDialog.value = true;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("zh-CN");
}

onMounted(loadData);

defineExpose({ loadData });
</script>

<template>
  <div class="inventory-check-list">
    <div class="list-header">
      <h3>门店盘点单</h3>
      <div class="header-actions">
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 140px">
          <el-option label="待盘点" value="pending" />
          <el-option label="盘点中" value="processing" />
          <el-option label="已完成" value="completed" />
        </el-select>
        <el-button type="primary" @click="openCreateDialog">发起盘点</el-button>
      </div>
    </div>

    <el-table :data="filteredChecks" v-loading="loading" style="width: 100%">
      <el-table-column prop="checkNo" label="盘点单号" width="160" />
      <el-table-column label="门店" width="180">
        <template #default="{ row }">
          {{ row.store?.name }}
        </template>
      </el-table-column>
      <el-table-column prop="period" label="盘点周期" width="120" />
      <el-table-column prop="operator" label="盘点人" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusMap[row.status]?.type || 'info'">
            {{ statusMap[row.status]?.label || row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="盘盈" width="100">
        <template #default="{ row }">
          <span class="profit">+¥{{ row.totalProfit.toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="盘亏" width="100">
        <template #default="{ row }">
          <span class="loss">-¥{{ row.totalLoss.toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="140">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="viewDetail(row.id)">
            {{ row.status === "completed" ? "查看" : "录入/查看" }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showCreateDialog" title="发起盘点单" width="500px">
      <el-form label-width="100px">
        <el-form-item label="门店" required>
          <el-select v-model="formData.storeId" placeholder="请选择门店" style="width: 100%">
            <el-option v-for="store in stores" :key="store.id" :label="store.name" :value="store.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="盘点周期">
          <el-input v-model="formData.period" placeholder="如：2026年5月" />
        </el-form-item>
        <el-form-item label="盘点人">
          <el-input v-model="formData.operator" placeholder="请输入盘点人姓名" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" rows="2" placeholder="请输入备注" />
        </el-form-item>
        <el-form-item label="商品数">
          <span>{{ products.length }} 个商品将自动载入，系统库存为预设值</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>

    <InventoryCheckDetail
      v-if="showDetailDialog && selectedCheckId"
      :check-id="selectedCheckId"
      v-model:visible="showDetailDialog"
      @updated="loadData"
    />
  </div>
</template>

<style scoped>
.inventory-check-list {
  background: var(--paper);
  border-radius: 8px;
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.list-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--ink);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.profit {
  color: var(--accent);
  font-weight: 600;
}

.loss {
  color: var(--warm);
  font-weight: 600;
}
</style>
