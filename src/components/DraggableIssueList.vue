<template>
    <draggable
        @change="handler"
        :list="issues"
        class="border version-drop bg-white p-1"
        group="version"
        item-key="Number">
        <template #item="{element}">
        <div class="border m-1 p-1">
            <div class="bg-gray">
            {{ element.Number }} <a :href="getIssueUrl(element.Number)" target="_blank" :title="`Jira Issue ${element.Number}`"><i class="fas"></i></a>
                <i v-if="element.IsPbi" title="pbi" class="badge bg-secondary small ms-1">pbi</i>
                <i v-if="element.IsSev" :title="element.Priority" class="badge bg-secondary small ms-1">sev</i>
                <i v-if="isRegression(element)" title="Regression sub-task" class="badge bg-warning small ms-1">regression</i>
            </div>
            <small>{{element.Summary}}</small>
        </div>
        </template>
    </draggable>
</template>
<script setup lang="ts">
import draggable from 'vuedraggable';
import type { JiraTicket } from '@/JiraTicket';
import { isRegression } from '@/Utils';

const props = defineProps<{
    handler: any;
    issues: Array<JiraTicket>
}>();

const getIssueUrl = (issueNumber: string) => {
  return `https://dealeron.atlassian.net/browse/${issueNumber}`;
}

</script>
