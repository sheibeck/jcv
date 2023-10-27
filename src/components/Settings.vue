<template>
    <div class="modal" :class="{'fade show': showSettings}" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Settings</h5>
                    <button type="button" class="close" aria-label="Close" @click="emits('closeSettings')">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="team">Team</label>
                        <input v-if="userSettings !== undefined" type="text" class="form-control" id="team" aria-describedby="teamHelp" placeholder="Enter name" v-model="userSettings.TeamName">
                        <small id="teamHelp" class="form-text text-muted">Three character team name: C2C, B2C, TNT, etc</small>
                    </div>
                    <div class="form-group">
                        <label for="boardNumber">Jira Board #</label>
                        <input v-if="userSettings !== undefined" type="text" class="form-control" id="boardNumber" aria-describedby="boardNumberHelp" placeholder="Enter board number" v-model="userSettings.BoardNumber">
                        <small id="boardNumberHelp" class="form-text text-muted">A jira board that has tickets with status Integrating</small>
                    </div>
                    <div class="form-group">
                        <label for="slackGroup">Slack integration group</label>
                        <input v-if="userSettings !== undefined" type="text" class="form-control" id="slackGroup" aria-describedby="slackGroupHelp" placeholder="Slack Group" v-model="userSettings.SlackGroup">
                        <small id="slackGroupHelp" class="form-text text-muted">A slack group for use when generating a slack message: I.e. @c2c-integrators</small>
                    </div>
                </div>
                <button type="button" class="btn btn-primary" @click="handleSaveSettings">Save changes</button>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
    import { UserSettings } from '@/UserSettings';

    const props = defineProps({
        showSettings: Boolean,
        userSettings: UserSettings
    });

    const emits = defineEmits(["closeSettings", "saveSettings"]);

    const handleSaveSettings = () => {
        emits("saveSettings");
    };

</script>
<style scoped>
    .show {
        display: block !important;
    }
</style>