<template>
    <draggable
        @change="handler"
        :list="issues"
        class="border version-drop bg-dark p-1 border-secondary rounded"
        group="version"
        item-key="Number">
        <template #item="{element}">
        <div class="border m-1 p-1 rounded">
            <div>
                <strong>{{ element.Number }}</strong>
                <a class="ms-2" :href="getIssueUrl(element.Number)" target="_blank" :title="`Jira Issue ${element.Number}`"><i class="fas"></i></a>
                <a class="ms-2" :href="getIssueBranchUrl(element.Number)" target="_blank" :title="`${element.Number} Branch`"><i class="fas"></i></a>
                <i v-if="element.IsPbi" title="pbi" class="badge bg-secondary small ms-1">pbi</i>
                <i v-if="element.IsSev" :title="element.Priority" class="badge bg-danger small ms-1">sev</i>
                <i v-if="isRegression(element)" title="Regression sub-task" class="badge bg-warning text-dark small ms-1">regression</i>
            </div>
            <span v-if="hasValue(element.Team)" class="badge bg-info text-dark">{{ element.Team }}</span>
            <small>{{ element.Summary }}</small>
            <div>
                <template v-for="label in element.Labels" :key="label" >
                    <span class="badge rounded-pill bg-secondary">{{ label }}</span>
                </template>
            </div>
        </div>
        </template>
    </draggable>
</template>
<script setup lang="ts">
import draggable from 'vuedraggable';
import type { JiraTicket } from '@/JiraTicket';
import { isRegression, hasValue } from '@/Utils';
import { getIssueUrl } from '@/Utils';

const props = defineProps<{
    handler: any;
    issues: Array<JiraTicket>
    repoName: string;
    team: string;
}>();

const getIssueBranchUrl = (issueNumber: string) => `https://dev.azure.com/dealeron/${props.team}/_git/${props.repoName}?version=GB${issueNumber}`;

</script>

<style scoped>
    .badge {
        margin: 0 5px 0 0;
    }
</style>