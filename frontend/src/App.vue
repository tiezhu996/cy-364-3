<script setup lang="ts">
import { onMounted, ref } from "vue";
import { fetchOverview } from "./api/client";
import { APP_CODE, APP_NAME } from "./constants/app";
import { REQUEST_MESSAGES } from "./constants/messages";
import { createFallbackOverview } from "./state/dashboard";
import type { OverviewResponse } from "./types";
import FeatureStrip from "./components/FeatureStrip.vue";
import MetricGrid from "./components/MetricGrid.vue";
import OperationsTable from "./components/OperationsTable.vue";
import InventoryCheckList from "./components/InventoryCheckList.vue";

const overview = ref<OverviewResponse>(createFallbackOverview());
const notice = ref(REQUEST_MESSAGES.overviewFallback);
const activeTab = ref("operations");
const inventoryListRef = ref<InstanceType<typeof InventoryCheckList> | null>(null);

function goHealth() {
  window.location.href = REQUEST_MESSAGES.healthPath;
}

async function refreshOverview() {
  try {
    overview.value = await fetchOverview();
    notice.value = "后端服务已联通，当前展示实时接口数据。";
  } catch {
    notice.value = REQUEST_MESSAGES.overviewFallback;
  }
}

function handleTabChange(tab: string) {
  activeTab.value = tab;
  if (tab === "inventory") {
    inventoryListRef.value?.loadData();
  } else {
    refreshOverview();
  }
}

onMounted(refreshOverview);
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <span class="brand-code">{{ APP_CODE }}</span>
        <h1 class="brand-title">{{ APP_NAME }}</h1>
      </div>
      <el-button type="primary" @click="goHealth">API Health</el-button>
    </header>
    <section class="workspace">
      <div class="lead-grid">
        <article class="hero-panel">
          <span class="pill">{{ notice }}</span>
          <h2>{{ overview.appName }}</h2>
          <p>{{ overview.description }}</p>
        </article>
        <MetricGrid :items="overview.kpis" />
      </div>
      <FeatureStrip :items="overview.features" />

      <el-tabs v-model="activeTab" class="main-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="运营任务流" name="operations">
          <section class="work-panel">
            <OperationsTable :records="overview.records" />
          </section>
        </el-tab-pane>
        <el-tab-pane label="门店盘点" name="inventory">
          <InventoryCheckList ref="inventoryListRef" />
        </el-tab-pane>
      </el-tabs>
    </section>
  </main>
</template>
