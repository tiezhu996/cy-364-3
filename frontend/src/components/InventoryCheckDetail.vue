<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  fetchInventoryCheck,
  updateInventoryCheckItem,
  submitInventoryCheck,
} from "../api/client";
import type { InventoryCheck, InventoryCheckItem } from "../types";

const props = defineProps<{
  checkId: number;
  visible: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  updated: [];
}>();

const check = ref<InventoryCheck | null>(null);
const loading = ref(false);
const submitting = ref(false);
const editingItem = ref<{
  id: number;
  actualStock: number;
  remark: string;
} | null>(null);
const showEditDialog = ref(false);
const submitForm = ref({
  operator: "",
  remark: "",
});

const isCompleted = computed(() => check.value?.status === "completed");

const summary = computed(() => {
  if (!check.value) return { profit: 0, loss: 0, net: 0, profitCount: 0, lossCount: 0 };
  const items = check.value.items || [];
  let profit = 0;
  let loss = 0;
  let profitCount = 0;
  let lossCount = 0;
  items.forEach((item) => {
    if (item.differenceType === "profit") {
      profit += item.differenceValue;
      profitCount++;
    } else if (item.differenceType === "loss") {
      loss += Math.abs(item.differenceValue);
      lossCount++;
    }
  });
  return { profit, loss, net: profit - loss, profitCount, lossCount };
});

watch(
  () => props.visible,
  (val) => {
    if (val && props.checkId) {
      loadDetail();
    }
  },
  { immediate: true }
);

async function loadDetail() {
  loading.value = true;
  try {
    check.value = await fetchInventoryCheck(props.checkId);
    submitForm.value = {
      operator: check.value.operator || "",
      remark: check.value.remark || "",
    };
  } catch (e) {
    ElMessage.error("加载盘点详情失败");
  } finally {
    loading.value = false;
  }
}

function getRowClassName({ row }: { row: InventoryCheckItem }) {
  if (row.differenceType === "loss") {
    return "diff-loss-row";
  } else if (row.differenceType === "profit") {
    return "diff-profit-row";
  }
  return "";
}

function formatDifference(diff: number) {
  if (diff > 0) return `+${diff}`;
  return diff.toString();
}

function formatDifferenceValue(value: number) {
  if (value > 0) return `+¥${value.toFixed(2)}`;
  if (value < 0) return `-¥${Math.abs(value).toFixed(2)}`;
  return "¥0.00";
}

function openEditItem(item: InventoryCheckItem) {
  if (isCompleted.value) return;
  editingItem.value = {
    id: item.id,
    actualStock: item.actualStock,
    remark: item.remark || "",
  };
  showEditDialog.value = true;
}

async function saveEditItem() {
  if (!editingItem.value || !check.value) return;

  try {
    check.value = await updateInventoryCheckItem(
      check.value.id,
      editingItem.value.id,
      {
        actualStock: editingItem.value.actualStock,
        remark: editingItem.value.remark,
      }
    );
    ElMessage.success("更新成功");
    showEditDialog.value = false;
    editingItem.value = null;
    emit("updated");
  } catch (e) {
    ElMessage.error("更新失败");
  }
}

async function handleSubmit() {
  if (!check.value) return;

  try {
    await ElMessageBox.confirm(
      "提交后将自动计算盘盈盘亏并生成运营记录，确认提交吗？",
      "提交盘点",
      {
        confirmButtonText: "确认提交",
        cancelButtonText: "取消",
        type: "warning",
      }
    );
  } catch {
    return;
  }

  submitting.value = true;
  try {
    check.value = await submitInventoryCheck(check.value.id, submitForm.value);
    ElMessage.success("盘点提交成功");
    emit("updated");
  } catch (e) {
    ElMessage.error("提交失败");
  } finally {
    submitting.value = false;
  }
}

function close() {
  emit("update:visible", false);
}

onMounted(() => {
  if (props.visible && props.checkId) {
    loadDetail();
  }
});
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="close"
    title="盘点详情"
    width="900px"
    class="inventory-detail-dialog"
    :close-on-click-modal="false"
  >
    <div v-loading="loading" class="detail-content">
      <div v-if="check" class="detail-header">
        <div class="header-info">
          <div class="info-row">
            <span class="label">盘点单号：</span>
            <span class="value">{{ check.checkNo }}</span>
          </div>
          <div class="info-row">
            <span class="label">门店：</span>
            <span class="value">{{ check.store?.name }}</span>
          </div>
          <div class="info-row">
            <span class="label">周期：</span>
            <span class="value">{{ check.period }}</span>
          </div>
        </div>
        <div class="header-summary">
          <div class="summary-card profit">
            <span class="summary-label">盘盈</span>
            <span class="summary-value">+¥{{ summary.profit.toFixed(2) }}</span>
            <span class="summary-count">{{ summary.profitCount }} 项</span>
          </div>
          <div class="summary-card loss">
            <span class="summary-label">盘亏</span>
            <span class="summary-value">-¥{{ summary.loss.toFixed(2) }}</span>
            <span class="summary-count">{{ summary.lossCount }} 项</span>
          </div>
          <div class="summary-card net" :class="{ positive: summary.net >= 0 }">
            <span class="summary-label">净盈亏</span>
            <span class="summary-value">
              {{ summary.net >= 0 ? "+" : "" }}¥{{ summary.net.toFixed(2) }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="check" class="detail-table">
        <div class="table-legend">
          <span class="legend-item"><span class="dot loss"></span>盘亏</span>
          <span class="legend-item"><span class="dot profit"></span>盘盈</span>
          <span class="legend-item"><span class="dot normal"></span>正常</span>
        </div>
        <el-table
          :data="check.items"
          :row-class-name="getRowClassName"
          size="small"
          style="width: 100%"
          max-height="400px"
        >
          <el-table-column prop="productName" label="商品名称" width="180" />
          <el-table-column prop="productSku" label="SKU" width="120" />
          <el-table-column prop="unit" label="单位" width="80" align="center" />
          <el-table-column prop="price" label="单价" width="90" align="right">
            <template #default="{ row }">
              ¥{{ row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="systemStock" label="系统库存" width="100" align="right" />
          <el-table-column label="实际库存" width="110" align="center">
            <template #default="{ row }">
              <span v-if="!isCompleted" class="editable-stock" @click="openEditItem(row)">
                {{ row.actualStock }}
                <el-icon><Edit /></el-icon>
              </span>
              <span v-else>{{ row.actualStock }}</span>
            </template>
          </el-table-column>
          <el-table-column label="差异数量" width="100" align="right">
            <template #default="{ row }">
              <span :class="{
                'diff-profit': row.differenceType === 'profit',
                'diff-loss': row.differenceType === 'loss'
              }">
                {{ formatDifference(row.difference) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="差异金额" width="110" align="right">
            <template #default="{ row }">
              <span :class="{
                'diff-profit': row.differenceType === 'profit',
                'diff-loss': row.differenceType === 'loss'
              }">
                {{ formatDifferenceValue(row.differenceValue) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.differenceType === 'loss'" type="danger" size="small">盘亏</el-tag>
              <el-tag v-else-if="row.differenceType === 'profit'" type="success" size="small">盘盈</el-tag>
              <el-tag v-else type="info" size="small">正常</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="check && !isCompleted" class="detail-footer">
        <el-form :inline="true" label-width="80px">
          <el-form-item label="盘点人">
            <el-input v-model="submitForm.operator" placeholder="请输入盘点人" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="submitForm.remark" placeholder="请输入备注" style="width: 280px" />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <template #footer>
      <el-button @click="close">关闭</el-button>
      <el-button
        v-if="check && !isCompleted"
        type="primary"
        :loading="submitting"
        @click="handleSubmit"
      >
        提交盘点
      </el-button>
    </template>

    <el-dialog v-model="showEditDialog" title="录入实际库存" width="400px">
      <el-form v-if="editingItem" label-width="100px">
        <el-form-item label="实际库存">
          <el-input-number
            v-model="editingItem.actualStock"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="editingItem.remark"
            type="textarea"
            rows="2"
            placeholder="差异原因等"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEditItem">保存</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<style scoped>
.detail-content {
  min-height: 500px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 16px;
  background: var(--surface);
  border-radius: 8px;
}

.header-info {
  flex: 1;
}

.info-row {
  margin-bottom: 8px;
}

.info-row .label {
  color: #666;
  margin-right: 8px;
}

.info-row .value {
  font-weight: 500;
  color: var(--ink);
}

.header-summary {
  display: flex;
  gap: 12px;
}

.summary-card {
  padding: 12px 20px;
  border-radius: 8px;
  text-align: center;
  min-width: 120px;
  background: white;
}

.summary-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.summary-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
}

.summary-count {
  display: block;
  font-size: 12px;
  color: #999;
}

.summary-card.profit .summary-value {
  color: var(--accent);
}

.summary-card.loss .summary-value {
  color: var(--warm);
}

.summary-card.net .summary-value {
  color: var(--ink);
}

.summary-card.net.positive .summary-value {
  color: var(--accent);
}

.table-legend {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  padding: 8px 0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.dot.loss {
  background: #fef0f0;
  border: 1px solid var(--warm);
}

.dot.profit {
  background: #f0f9eb;
  border: 1px solid var(--accent);
}

.dot.normal {
  background: #f4f4f5;
  border: 1px solid #dcdfe6;
}

.editable-stock {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: var(--accent);
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.2s;
}

.editable-stock:hover {
  background: rgba(125, 143, 45, 0.1);
}

:deep(.diff-loss-row) {
  background-color: #fef0f0 !important;
}

:deep(.diff-loss-row:hover > td) {
  background-color: #fde2e2 !important;
}

:deep(.diff-profit-row) {
  background-color: #f0f9eb !important;
}

:deep(.diff-profit-row:hover > td) {
  background-color: #e1f3d8 !important;
}

.diff-profit {
  color: var(--accent);
  font-weight: 600;
}

.diff-loss {
  color: var(--warm);
  font-weight: 600;
}

.detail-footer {
  margin-top: 20px;
  padding: 16px;
  background: var(--surface);
  border-radius: 8px;
}
</style>
