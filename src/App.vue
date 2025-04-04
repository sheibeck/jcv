<template>
  <div id="main-content" v-if="isLoaded">
    <div class="d-flex navbar bg-dark px-2 mb-1 border-bottom">
      <div class="flex-grow-1">
        <div class="h5">Jira Version Manager</div>
        <div class="d-flex p-1">
          <div class="h4 pt-1">
            {{ getBoardDisplayName }}
          </div>
          <button class="btn btn-sm btn-secondary m-1" title="settings" @click="toggleShowSettings">
            <i class="fas"></i>
          </button>
          <button class="btn btn-sm btn-secondary m-1" title="report" @click="toggleShowReport">
            <i class="fas"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="row" v-if="component?.CodeBases">
      <div class="col border-end">
        <div class="p-2 me-0 border-bottom">
          <div class="h3 mb-0" aria-describedby="subtaskHelp">
            Jira Sub-tasks
            <button type="button" class="btn btn-sm btn-secondary m-1" title="refresh board sub-tasks"
              :disabled="isLoadingJira" @click="refreshButtonHandler()">
              <span v-if="isLoadingJira" class="spinner-border spinner-border-sm" role="status"
                aria-hidden="true"></span>
              <i v-if="!isLoadingJira" class="fas"></i>
            </button>
          </div>
          <small id="subtaskHelp">Sub-tasks by repository with status</small>:
          <select v-model="subTaskStatus" :onchange="getIssues">
            <option value="Integrating">Integrating</option>
            <option value="Reviewing">Reviewing</option>
            <option value="Regression Testing">Regression Testing</option>
          </select>
        </div>
        <div v-if="component.CodeBases.length == 0">
          <span class="h5">No Sub-tasks found with status <span class="badge bg-primary"> {{
            subTaskStatus }}</span></span>
        </div>
        <div v-else v-for="codebase in component.CodeBases" v-bind:key="codebase.Name" class="card p-1 bg-dark">
          <span class="h4 border-bottom">
            {{ codebase.Name }}
            <a :href="getCodeBaseRepoUrl(codebase.Name)" target="_blank" :title="`${codebase.Name} Repository`"><i
                class="fas"></i></a>
          </span>
          <DraggableIssueList :handler="issueListChanged" :issues="codebase.Issues" :repo-name="codebase.Name"
            :team="settings.TeamName"></DraggableIssueList>
        </div>
      </div>

      <div class="col border-start">
        <div class="row">
          <div class="d-flex">
            <div>
              <span class="h3" aria-describedby="versionHelp" aria-label="">Versions</span>
              <sup>
                <i title="Showing last 15 versions." class="fa-solid fa-circle-question" id="versionHelp"></i>
              </sup>
            </div>

            <div class="ms-auto">
              <sup>
                <i id="searchHelp" title="Search by '{codebase} {#.#.#}'" class="fa-solid fa-circle-question"></i>
              </sup>
            </div>
            <div class="form-group input-group-sm p-1 input-with-clear">
              <input v-uppercaseDirective v-model="searchInputText" type="text"
                class="form-control bg-dark text-secondary" id="team" @change="fetchAllVersions"
                placeholder="Search ..." aria-describedby="searchHelp" />
              <span role="button" class="clear-button" @click="clearInput">×</span>
            </div>

            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" role="switch" id="showReleased"
                :checked="showReleasedVersions" aria-describedby="releasedHelp" v-model="showReleasedVersions"
                @click="toggleReleasedVersions()">
              <label class="form-check-label mt-1" for="showReleased">Released?
                <sup>
                  <i id="releasedHelp" title="Show released versions" class="fa-solid fa-circle-question"></i>
                </sup>
              </label>
            </div>
          </div>
        </div>
        <div class="d-flex border-bottom pb-2 mb-2">
          <div class="form-floating mx-1">
            <input id="version" ref="newVersionNumber" type="text" class="form-control bg-dark text-secondary"
              aria-label="Version Number" placeholder="#.##.#">
            <label for="version">Version #:</label>
          </div>
          <div class="form-floating mx-1">
            <input id="codeBase" ref="versionCodeBase" type="text" class="form-control bg-dark text-secondary"
              aria-label="CodeBaseKey" value="" placeholder="CodeBaseKey">
            <label for="codeBase">CodeBaseKey:</label>
          </div>
          <button type="button" class="btn btn-secondary" @click="addVersion()">Add</button>
        </div>
        <div v-if="versions.length == 0">
          <span class="h5">No Versions Found. Create one or try fetching again.
            <button type="button" class="btn btn-sm btn-secondary m-1" title="refresh board sub-tasks"
              @click="fetchAllVersions()" :disabled="isLoadingVersions">
              <i v-if="!isLoadingVersions" class="fas"></i>
              <span v-if="isLoadingVersions" class="spinner-border spinner-border-sm" role="status"
                aria-hidden="true"></span>
            </button>
          </span>
        </div>
        <div v-else v-for="version in versions" v-bind:key="version.Number" class="card bg-dark p-1 mb-1">
          <div class="card-body p-0">
            <h5 class="card-title d-flex">
              <div>
                {{ version.CodeBase }} {{ version.Number }}
              </div>
              <div class="ms-auto">
                <ActionButtons :versions="versions" :version="version" :callback="fetchAllVersions"
                  :settings="settings">
                </ActionButtons>
              </div>
            </h5>
            <h6 class="card-subtitle text-muted col d-flex">
              <div class="form-check me-4">
                <input type="checkbox" class="form-check-input" v-model="version.IsPlanned"
                  @change="updateVersion(version)" aria-describedby="plannedHelp">
                <label class="form-check-label">Planned<sup>
                    <i id="plannedHelp" title="This build has been sent to integration as a build plan."
                      class="fa-solid fa-circle-question"></i>
                  </sup>
                </label>
              </div>
              <div class="form-check me-4">
                <input type="checkbox" class="form-check-input" v-model="version.IsBuilt"
                  @change="updateVersion(version)">
                <label class="form-check-label">Built</label>
              </div>
              <div class="form-check">
                <input type="checkbox" class="form-check-input" v-model="version.Released"
                  @change="updateVersion(version)">
                <label class="form-check-label">Released</label>
                <input type="datetime-local" v-model="version.ReleaseDateTime" @change="updateVersion(version)"
                  :disabled="!version.Released" />
              </div>
            </h6>
            <DraggableIssueList :handler="versionListChanged" :issues="version.Issues" :repo-name="version.CodeBase"
              :team="settings.TeamName"></DraggableIssueList>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Settings v-if="isLoaded" :showSettings="showSettings" @closeSettings="toggleShowSettings"
    @saveSettings="saveUserSettings" :userSettings="settings"></Settings>
  <Report v-if="isLoaded" :showReport="showReport" @closeReport="toggleShowReport" :userSettings="settings">
  </Report>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { Component } from "@/Component";
import { CodeBase } from "@/CodeBase";
import { Version } from "@/Version";
import { IssueService } from "@/IssueService";
import { UserSettings, fetchSettings, isSettingsValid, saveSettings } from "@/UserSettings";
import Settings from "@/components/Settings.vue";
import { fetchAllItems, saveItem, saveAllItems, checkDuplicateVersion } from "@/CosmosDb";
import DraggableIssueList from "@/components/DraggableIssueList.vue";
import ActionButtons from "./components/Actionbuttons.vue";
import { sendMessage } from "@/UserMessageService";
import { hasValue } from "@/Utils";
import Report from "@/components/Report.vue";

const settings = ref<UserSettings>(new UserSettings());
const component = ref();
const newVersionNumber = ref();
const versionCodeBase = ref();
const versions = ref(new Array<Version>());
const showReleasedVersions = ref(false);
const issueService = new IssueService();
const showSettings = ref(false);
const showReport = ref(false);
const isLoaded = ref(false);
const searchInputText = ref("");
const subTaskStatus = ref("Integrating");

// loaders
const isLoadingJira = ref(false);
const isLoadingVersions = ref(false);

const toggleShowSettings = () => {
  showSettings.value = !showSettings.value;
  toggleModalBackground();
}
const toggleShowReport = () => {
  showReport.value = !showReport.value;
  toggleModalBackground();
}
const toggleModalBackground = () => {
  const showBackground = showSettings.value || showReport.value;
  document.getElementById("main-content")?.classList.toggle("modal-open-blur", showBackground);
};

const clearInput = () => {
  searchInputText.value = "";
  fetchAllVersions();
};

const getBoardNumber = computed(() => {
  return settings.value?.BoardNumber ?? "0";
});

const getBoardDisplayName = computed(() => {
  return settings.value ? `${settings.value.TeamName} - Integration` : "No Board Selected";
});

const getCodeBaseRepoUrl = (repoName: string) => `https://dev.azure.com/dealeron/C2C/_git/${repoName}/branches`;

const getIssues = async function () {
  isLoadingJira.value = true;

  component.value.CodeBases = new Array<CodeBase>();

  const issueList: any = await issueService.GetIssues(getBoardNumber.value, subTaskStatus.value);

  //put issues into code bases
  issueList.forEach((issue: any) => {
    if (!component.value.CodeBases.find((cb: CodeBase) => cb.Name == issue.CodeBase)) {
      component.value.AddCodeBase(new CodeBase(issue.CodeBase));
    }
    const codeBase = component.value.CodeBases.find((cb: CodeBase) => cb.Name == issue.CodeBase);
    codeBase?.AddIssue(issue);
  });

  handleVersionedIssues();

  isLoadingJira.value = false;
}

const refreshButtonHandler = async () => {
  await getIssues();
  sendMessage("Refreshed sub-tasks from Jira.");
}

const handleVersionedIssues = function () {
  component.value.CodeBases.forEach((codebase: CodeBase) => {
    const versionedIssues = new Array<string>();
    codebase.Issues.forEach((issue) => {
      const issueIsVersioned = versions.value.findIndex(v => {
        const index = v.Issues.findIndex(i => i.Number === issue.Number);
        return index > -1;
      }) > -1;

      if (issueIsVersioned) {
        versionedIssues.push(issue.Number);
      }
    });
    codebase.Issues = codebase.Issues.filter(i => !versionedIssues.includes(i.Number));
  });
}

const toggleReleasedVersions = () => {
  showReleasedVersions.value = !showReleasedVersions.value;
  fetchAllVersions();
}

const addVersion = async function () {
  const version = new Version(settings.value.TeamName, newVersionNumber.value.value, versionCodeBase.value.value);

  if (settings.value.TeamName === "") {
    sendMessage("You must include a team name");
    toggleShowSettings();
    return;
  }

  if (!isValidVersionNumber(version.Number)) {
    sendMessage("You must include a valid version number in the format of #.#.#");
    return;
  }

  if (version.CodeBase === "") {
    sendMessage("You must include a code base number");
    return;
  }

  // 🔥 Optimized Duplicate Check
  const isDuplicate = await checkDuplicateVersion(
    settings.value.TeamName,
    version.CodeBase,
    version.Number
  );

  if (isDuplicate) {
    sendMessage(`Version ${version.Number} already exists for this Codebase`);
    return;
  }

  const id = await saveVersion(version);
  version.id = id;

  //add new versions to the top of the list
  versions.value.unshift(version);

  sendMessage(`Version ${version.Number} added ${version.CodeBase}`);
}

function isValidVersionNumber(version: string): boolean {
  // Define a regular expression pattern to match the version format
  const versionPattern = /^\d+\.\d+\.\d+$/;

  // Use the test method to check if the string matches the pattern
  return versionPattern.test(version);
}

function issueListChanged() {
  //alert("issue list changed");
}

const updateVersion = async (version: any) => {
  // If checkbox is checked, only set the ReleaseDateTime if it's empty
  const now = new Date();
  if (version.Released) {
    if (!version.ReleaseDateTime) {
      const nowOffset = new Date();
      const nowLocal = new Date(nowOffset.getTime() - (nowOffset.getTimezoneOffset() * 60000)).toISOString();
      version.ReleaseDateTime = nowLocal.slice(0, 16); // Format for <input type="datetime-local">
    }
  } else {
    // Clear the date when 'Released' is unchecked
    version.ReleaseDateTime = null;
  }

  await saveVersion(version);
}

const saveVersion = async (version: any) => {
  const versionPayload = JSON.parse(JSON.stringify(version)); // Deep copy to avoid Vue reactivity
  if (!!versionPayload.ReleaseDateTime) {
    versionPayload.ReleaseDateTime = new Date(versionPayload.ReleaseDateTime).toISOString(); // Convert to ISO string to include timezone
  }

  return await saveItem(versionPayload);
}

const versionListChanged = async () => {
  await saveAllItems(versions.value);
}

const fetchAllVersions = async () => {
  isLoadingVersions.value = true;

  const versionList = await fetchAllItems(settings.value.TeamName, showReleasedVersions.value, (searchInputText.value.length > 2 ? searchInputText.value : ""));
  versions.value = versionList;

  handleVersionedIssues();

  isLoadingVersions.value = false;
}

async function fetchVersionsAndIssues() {
  await Promise.all([fetchAllVersions(), getIssues()]);
  sendMessage("Fetched versions.");
}

function saveUserSettings() {
  if (!settings.value) {
    console.error("Settings not initialized.");
    return;
  }

  if (!hasValue(settings.value.Email)) {
    sendMessage("You must enter your DealerOn email.");
    return;
  }

  if (!hasValue(settings.value.ApiKey)) {
    sendMessage("You must enter your Jira api key.");
    return;
  }

  if (!hasValue(settings.value.TeamName)) {
    sendMessage("You must enter a team name.");
    return;
  }
  else {
    component.value = new Component(settings.value.TeamName);
  }

  if (!hasValue(settings.value.BoardNumber)) {
    sendMessage("You must enter a board number.");
    return;
  }

  if (!isSettingsValid(settings.value)) {
    sendMessage("You must enter valid settings.");
    return;
  }

  saveSettings(settings.value);
  toggleShowSettings();
  fetchVersionsAndIssues();

  sendMessage("Saved settings.");
}

onMounted(async () => {
  settings.value = fetchSettings();

  if (!isSettingsValid(settings.value)) {
    toggleShowSettings();
  }
  else {
    component.value = new Component(settings.value.TeamName);
    fetchVersionsAndIssues();
  }

  isLoaded.value = true;
});
</script>

<style>
.version-drop {
  min-height: 100px;
}

.contentsview {
  padding: 5px;
  border-radius: 10px;
}

.profile-img {
  width: 40px;
  border-radius: 20px;
}

.input-with-clear {
  position: relative;
}

.input-with-clear input {
  padding-right: 25px;
  /* Leave space for the "x" button */
}

.clear-button {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 20px;
  color: #ccc;
}

.clear-button:hover {
  color: #000;
}
</style>