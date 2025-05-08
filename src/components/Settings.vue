<template>
    <div class="modal" :class="{'fade show': showSettings}" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content bg-dark border border-primary border-3 rounded-3">
                <div class="modal-header">
                    <h5 class="modal-title">Settings</h5>
                    <button type="button" class="close" aria-label="Close" @click="emits('closeSettings')">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div v-if="userSettings !== undefined" class="modal-body">
                    <div class="form-group">
                        <label for="email">E-mail</label>
                        <input type="email" class="form-control" id="email" aria-describedby="emailHelp" placeholder="Enter e-mail" v-model="userSettings.Email">
                        <small id="emailHelp" class="form-text text-muted">DealerOn e-mail address</small>
                    </div>
                    <div class="form-group">
                        <label for="apiKey">Jira Api Key</label>
                        <input type="text" class="form-control" id="apiKey" aria-describedby="apiKeyHelp" placeholder="Enter Jira api key" v-model="userSettings.ApiKey">
                        <small id="apiKeyHelp" class="form-text text-muted">Jira Api Key <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank"><i class="fas"></i></a></small>
                    </div>
                    <div class="form-group">
                        <label for="team">Team</label>
                        <input v-uppercase type="text" class="form-control" id="team" aria-describedby="teamHelp" placeholder="Enter name" v-model="userSettings.TeamName">
                        <small id="teamHelp" class="form-text text-muted">Three character team name: C2C, B2C, TNT, etc</small>
                    </div>
                    <div class="form-group">
                        <label for="boardNumber">Jira Board #</label>
                        <input type="text" class="form-control" id="boardNumber" aria-describedby="boardNumberHelp" placeholder="Enter board number" v-model="userSettings.BoardNumber">
                        <small id="boardNumberHelp" class="form-text text-muted">A jira board setup for to list issues by status</small>
                    </div>
                    <div class="form-group">
                        <label for="slackGroup">Slack integration group</label>
                        <input type="text" class="form-control" id="slackGroup" aria-describedby="slackGroupHelp" placeholder="Slack Group" v-model="userSettings.SlackGroup">
                        <small id="slackGroupHelp" class="form-text text-muted">A slack group for use when generating a slack message: I.e. @c2c-integrators</small>
                    </div>
                    <div class="form-group">
                        <label for="firstPi">First PI start date</label>
                        <input type="date" class="form-control" id="firstPi" aria-describedby="firstPiHelp" placeholder="01/01/1900" v-model="userSettings.FirstPiStartDate">
                        <small id="firstPiHelp" class="form-text text-muted">The start date of the first PI of the year</small>
                    </div>
                    <div class="form-group">
                        <label for="slackGroups">Integration Teams Slack Groups</label><br/>
                        <small id="slackGroupsHelp" class="form-text text-muted">Slack Integration groups for each team, used to send them notifications</small>
                        <ul>
                            <li v-for="(value, key) in userSettings.SlackGroups" :key="key">
                                <label for="slackGroup">{{ key }}</label>
                                <input type="text" class="form-control" id="slackGroup" aria-describedby="slackGroupHelp" placeholder="Slack Group" v-model="userSettings.SlackGroups[key]">
                            </li>
                        </ul>
                        <button type="button" class="btn btn-primary btn-sm" @click="showNewTeam = true">Add New Team</button>
                    </div>
                </div>
                <div class="modal-body">
                    <strong>Auto Builder</strong><br/>
                    To use the autobuilder (<i class="fa-solid"></i>) Download 
                    <a target="_blank" href="https://dev.azure.com/dealeron/ARCH/_git/integration-script">integrate.sh</a> to <u>c:\dealeron\</u>. 
                    Open <strong>powershell</strong> and navigate to the local folder of the repository that you are making a build for. 
                    Click the <i class="fa-solid"></i> icon and paste the copied text into your powershell window.
                </div>
                <button type="button" class="btn btn-primary" @click="handleSaveSettings">Save changes</button>
            </div>
        </div>
    </div>
    <NewSlackTeam :showNewTeam="showNewTeam" @cancelNewTeam="toggleShowNewTeam" @saveNewTeam="addNewTeam"></NewSlackTeam>
</template>
<script setup lang="ts">
    import { UserSettings } from '@/UserSettings';
    import { ref } from 'vue';
    import NewSlackTeam from './NewSlackTeam.vue';

    const showNewTeam = ref(false);

    const props = defineProps({
        showSettings: Boolean,
        userSettings: UserSettings
    });

    const emits = defineEmits(["closeSettings", "saveSettings"]);

    const handleSaveSettings = () => {
        emits("saveSettings");
    };
    const addNewTeam = (newTeam: { TeamName: string, SlackGroup: string }) => {
        console.log("Adding new team", newTeam);
        props.userSettings!.SlackGroups[newTeam.TeamName] = newTeam.SlackGroup;
        showNewTeam.value = false;
    };

    const toggleShowNewTeam = () => {
        showNewTeam.value = !showNewTeam.value;
    }
</script>
<style scoped>
    .show {
        display: block !important;
    }
</style>