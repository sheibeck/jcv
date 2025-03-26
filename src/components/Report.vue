<template>
  <div class="modal" :class="{ 'fade show': showReport }" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg" role="document">
      <div class="modal-content bg-dark border border-primary border-3 rounded-3">
        <div class="modal-header">
          <h5 class="modal-title">Report</h5>
          <button type="button" class="close" aria-label="Close" @click="emits('closeReport')">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="d-flex border-bottom pb-2 mb-2">
            <div class="form-floating">
              <input id="codeBase" v-model="versionCodeBase" type="text" class="form-control bg-dark text-secondary"
                aria-label="CodeBaseKey" placeholder="CodeBaseKey">
              <label for="codeBase">CodeBaseKey:</label>
            </div>
            <button type="button" class="btn btn-secondary" @click="fetchReport" :disabled="isLoading">
              <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              Search
            </button>
          </div>
          <table class="table table-dark table-striped table-hover" id="reportTable">
            <thead>
              <tr>
                <th scope="col">Number</th>
                <th scope="col">Release DateTime</th>
                <th scope="col">PI/Sprint</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in itemsList" :key="item.Number">
                <th scope="row">{{ item.Number }}</th>
                <td>{{ formatDate(item.ReleaseDateTime!) }}</td>
                <td>{{ item.Sprint }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button type="button" class="btn btn-primary" @click="downloadReport"
          :disabled="itemsList.length == 0">Download</button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { fetchQuery } from '@/CosmosDb';
import { ReportItem } from '@/ReportItem';
import { ref, watch } from 'vue';
import * as XLSX from 'xlsx';
import { UserSettings } from '@/UserSettings';

const props = defineProps({
  showReport: Boolean,
  userSettings: {
    type: Object as () => UserSettings,
    required: true
  }
});
const versionCodeBase = ref('');
const itemsList = ref<Array<ReportItem>>([]);
const isLoading = ref(false);

const emits = defineEmits(["closeReport"]);

const fetchReport = async () => {
  isLoading.value = true;
  itemsList.value = [];

  const [year, month, day] = props.userSettings.FirstPiStartDate.split("-").map(Number);
  const firstPiStartDate = new Date(year, month - 1, day);

  const result = await fetchQuery(
    `SELECT TOP 100 c.Number, c.ReleaseDateTime
    FROM c
    WHERE c.CodeBase = '${versionCodeBase.value}' AND c.Released = true AND DateTimePart("yyyy", c.ReleaseDateTime) >= ${firstPiStartDate.getUTCFullYear()}
    ORDER BY c.Major DESC, c.Minor DESC, c.Revision DESC`);

  itemsList.value = result.map(item => new ReportItem(item.Number, new Date(item.ReleaseDateTime), firstPiStartDate));

  isLoading.value = false;
}

const locale = (navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.language;
const intlFormat = Intl.DateTimeFormat(locale, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true, // 24-hour format
  timeZone: "UTC"
});
const formatDate = (dateOffset: Date) => {
  const dateLocal = new Date(dateOffset.getTime() - (dateOffset.getTimezoneOffset() * 60000));
  const result = intlFormat.format(dateLocal).replace(",", "");

  return result;
}

const downloadReport = async () => {
  exportToExcel(itemsList.value);
}

const exportToExcel = (data: Array<any>, filename = "data.xlsx") => {
  if (!data || !data.length) {
    return;
  }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data, { cellDates: true, dateNF: 'mm/dd/yyyy hh:mm:ss AM/PM' });
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filename);
}

watch(() => props.showReport, (value) => {
  if (value) {
    versionCodeBase.value = '';
    itemsList.value = [];
  }
});
</script>
<style scoped>
.show {
  display: block !important;
}
</style>