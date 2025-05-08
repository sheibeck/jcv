<template>
    <div class="modal" :class="{ 'fade show': showNewTeam }" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content bg-dark border border-success border-3 rounded-3">
                <div class="modal-header">
                    <h5 class="modal-title">Add New Integration Slack Team</h5>
                    <button type="button" class="close" aria-label="Close" @click="handleCancelNewTeam">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="team">Team</label>
                        <input type="text" class="form-control" id="team" aria-describedby="teamlHelp" placeholder="DO"
                            v-model="teamName">
                        <small id="teamlHelp" class="form-text text-muted">DealerOn Engineering Team</small>
                    </div>
                    <div class="form-group">
                        <label for="slackGroup">Salck Integration Group</label>
                        <input type="text" class="form-control" id="slackGroup" aria-describedby="slackGroupHelp"
                            placeholder="@do-integration" v-model="slackGroup">
                        <small id="slackGroupHelp" class="form-text text-muted">Slack Integration group for this
                            Team</small>
                    </div>
                </div>
                <div class="d-grid gap-2 col-6 mx-auto">
                    <button type="button" class="btn btn-primary" @click="handleSaveNewTeam">Save changes</button>
                    <button type="button" class="btn btn-danger" @click="handleCancelNewTeam">Cancel</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
const teamName = ref("");
const slackGroup = ref("");

const emits = defineEmits(["cancelNewTeam", "saveNewTeam"]);

const props = defineProps({
    showNewTeam: Boolean
});

const handleSaveNewTeam = () => {
    emits("saveNewTeam", { TeamName: teamName.value, SlackGroup: slackGroup.value });
    clearValues();
};
const handleCancelNewTeam = () => {
    emits("cancelNewTeam");
    clearValues();
};

const clearValues = () => {
    teamName.value = "";
    slackGroup.value = "";
};

</script>

<style scoped>
.btn-danger {
    margin-bottom: 1em;

}
</style>