<template>
  <div class="d-flex navbar bg-light px-2 mb-1">
    <div class="flex-grow-1">
      <div class="h5">Jira Version Manager</div>
      <div class="d-flex p-1">
        <div class="h4 pt-1">
          {{getBoardDisplayName}}
        </div>
        <button type="button" class="btn btn-sm btn-secondary m-1" title="refresh board sub-tasks" @click="refreshButtonHandler()">
          <i class="fas"></i>
        </button>
        <button class="btn btn-sm btn-secondary m-1" title="settings" @click="toggleShowSettings">
          <i class="fas"></i>
        </button>
      </div>
    </div>
  </div>
  
  <div class="row" v-if="component?.CodeBases">
    <div class="col">        
      <div v-for="codebase in component.CodeBases" v-bind:key="codebase.Name" class="card p-1 bg-light">
        <div class="h4 border-bottom">
          {{codebase.Name}}
        </div>        
        <draggable 
          @change="issueListChanged"
          v-model="codebase.Issues" 
          class="border version-drop bg-white p-1"
          group="version"
          item-key="Number">
          <template #item="{element}">
            <div class="border m-1 p-1">
              <div class="bg-gray">
                {{ element.Number }} <a :href="getIssueUrl(element.Number)" target="_blank" :title="`Jira Issue ${element.Number}`"><i class="fas"></i></a>
                <i v-if="element.IsPbi" title="pbi" class="fa-solid fa-triangle-exclamation p-1"></i>
                <i v-if="element.IsSev" :title="element.Priority" class="fa-solid fa-circle-exclamation p-1"></i>
              </div>
              <small>{{element.Summary}}</small>
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <div class="col">
      <div class="row">
        <div class="d-flex">
          <div>
            <span class="h3">Versions</span>
            <sup>
              <i title="Showing last 15 versions." class="fa-solid fa-circle-question"></i>
            </sup>
          </div>
        
          <div class="form-check form-switch ms-auto">
            <input class="form-check-input" type="checkbox" role="switch" id="showReleased" 
              :checked="showReleasedVersions"
              @click="toggleReleasedVersions()">
            <label class="form-check-label mt-1" for="showReleased">Released?
              <sup>
                <i title="Show released versions" class="fa-solid fa-circle-question"></i>
              </sup>
            </label>
          </div>                  
          
        </div>
      </div>
      <div class="d-flex border-bottom pb-2 mb-2">            
        <div class="form-floating mx-1">
          <input id="version" ref="newVersionNumber" type="text" class="form-control" aria-label="Version Number" placeholder="#.##.#">
          <label for="version">Version #:</label>
        </div>            
        <div class="form-floating mx-1">                  
          <input id="codeBase" ref="versionCodeBase" type="text" class="form-control" aria-label="CodeBaseKey" value="" placeholder="CodeBaseKey">
          <label for="codeBase">CodeBaseKey:</label>
        </div>  
        <button type="button" class="btn btn-secondary" @click="addVersion()">Add</button>            
      </div>
      <div v-for="version in versions" v-bind:key="version.Number" class="card bg-light p-1 mb-1">
        <div class="card-body p-0">
          <h5 class="card-title d-flex">
            <div>
              {{version.CodeBase}} {{version.Number}}
            </div>
            <div class="ms-auto">
              <i class="fas pe-1" @click="removeVersion(version.Number, version.CodeBase)"></i>
              <i class="fa-brands fa-slack pe-1" @click="copyVersionForSlack(version.Number, version.CodeBase)"></i>
              <i class="fa-regular fa-file-excel pe-1" @click="copyVersionForExcel(version.Number, version.CodeBase)"></i>
            </div>
          </h5>
          <h6 class="card-subtitle text-muted col d-flex">
            <div class="form-check me-4">
              <input type="checkbox" class="form-check-input" v-model="version.IsPlanned" @change="updateVersion(version)">
              <label class="form-check-label">Planned<sup>
                  <i title="This build has been sent to integration as a build plan." class="fa-solid fa-circle-question"></i>
                </sup>
              </label>
            </div>
            <div class="form-check me-4">
              <input type="checkbox" class="form-check-input" v-model="version.IsBuilt" @change="updateVersion(version)">
              <label class="form-check-label">Built</label>
            </div>
            <div class="form-check">
              <input type="checkbox" class="form-check-input" v-model="version.Released" @change="updateVersion(version)">
              <label class="form-check-label">Released</label>
            </div>
          </h6>
          <draggable 
            @change="versionListChanged"              
            v-model="version.Issues" 
            class="card-text border version-drop bg-white p-1"
            group="version"               
            item-key="Number">
            <template #item="{element}">
              <div class="border m-1 p-1">
                <div class="bg-gray">
                  {{ element.Number }} <a :href="getIssueUrl(element.Number)" target="_blank" :title="`Jira Issue ${element.Number}`"><i class="fas"></i></a>
                  <i v-if="element.IsPbi" title="pbi" class="fa-solid fa-triangle-exclamation p-1"></i>
                  <i v-if="element.IsSev" :title="element.Priority" class="fa-solid fa-circle-exclamation p-1"></i>
                </div>
                <small>{{element.Summary}}</small>
              </div>
            </template>
          </draggable>
        </div>
      </div>
    </div>
  </div>

  <Settings v-if="isLoaded" :showSettings="showSettings" @closeSettings="showSettings=false" @saveSettings="saveSettings" :userSettings="settings"></Settings>
</template>

<script setup lang="ts">
import { onMounted, ref, computed} from "vue";
import { Component } from "./Component";
import { CodeBase } from "./CodeBase";
import { Version } from "./Version";
import { IssueService } from "./IssueService";
import draggable from 'vuedraggable';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import { UserSettings } from "./UserSettings";
import Settings from "./components/Settings.vue";
import VersionCompare from "./VersionSort";
import { fetchAllItems, deleteItem, saveItem, saveAllItems } from "./CosmosDb";

const settings = ref(new UserSettings());
const component = ref();
const newVersionNumber = ref();
const versionCodeBase = ref();
const versions = ref(new Array<Version>());
const showReleasedVersions = ref(false);
const issueService = new IssueService();
const showSettings = ref(false);
const isLoaded = ref(false);

const toggleShowSettings = () => showSettings.value = !showSettings.value;

const getBoardNumber = computed(() => {
  return settings.value?.BoardNumber ?? "0";
});

const getBoardDisplayName = computed(() => {
  return settings.value ? `${settings.value.TeamName} - Integration` : "No Board Selected";
});

const getIssues = async function() {    
  const issueList: any = await issueService.GetIssues(getBoardNumber.value);
  
  //sort the issues list and then create the component/codebases  
  issueList.forEach( (issue: any) => {
    if ( !component.value.CodeBases.find( (cb: CodeBase) => cb.Name == issue.CodeBase ) ) {
      component.value.AddCodeBase(new CodeBase(issue.CodeBase));
    }
    const codeBase = component.value.CodeBases.find( (cb: CodeBase) => cb.Name == issue.CodeBase );
    codeBase?.AddIssue(issue);
  });

  handleVersionedIssues();
}

const refreshButtonHandler = function() {
  getIssues();
  sendMessage("Refreshed issues from Jira.");
}

const handleVersionedIssues = function() { 
  component.value.CodeBases.forEach( (codebase: CodeBase) => {
    const versionedIssues = new Array<string>();
    codebase.Issues.forEach( (issue) => {      
      const issueIsVersioned = versions.value.findIndex( v => {
        const index = v.Issues.findIndex( i => i.Number === issue.Number);
        return index > -1;
      }) > -1;

      if (issueIsVersioned) {
        versionedIssues.push(issue.Number);
      }
    });    
    codebase.Issues = codebase.Issues.filter( i => !versionedIssues.includes(i.Number) );
  });
}

const toggleReleasedVersions = () => {
  showReleasedVersions.value = !showReleasedVersions.value;
  fetchAllVersions(showReleasedVersions.value);
}

const getVersionListByFilter = function() { 
  if (showReleasedVersions.value) {
    return versions.value;
  }
  else {
    const vs = versions.value.filter( v => v.Released === false || v.Released == null || v.Released == undefined );  
    return vs;
  }
}

const addVersion = async function() {  
  const version = new Version(settings.value.TeamName, newVersionNumber.value.value, versionCodeBase.value.value);

  if (settings.value.TeamName === "")  {
    sendMessage("You must include a team name");
    showSettings.value = true;
    return;
  }

  if (version.Number === "")  {
    sendMessage("You must include a version number");
    return;
  }

  if (version.CodeBase === "")  {
    sendMessage("You must include a code base number");
    return;
  }

  if (versions.value.findIndex( v => v.Number == version.Number && v.CodeBase == version.CodeBase) > -1) {
    sendMessage("Version already exists for this Codebase");
    return;
  }

  const id = await saveItem(version);
  version.id = id;

  //add new versions to the top of the list
  versions.value.unshift(version);

  sendMessage(`Version ${version.Number} added ${version.CodeBase}`);
}

const removeVersion = async(versionNumber: string, codeBase: string) =>{
  const verifyDelete = window.confirm("Are you sure you want to delete this version?");
  if (verifyDelete) {
    const v = versions.value.find( v => v.Number === versionNumber && v.CodeBase === codeBase);
    if (v) {
      var index = versions.value.indexOf(v);
      if (index > -1) {
        versions.value.splice(index, 1);
      }
  
      await deleteItem(v);
    }
    getIssues();

    sendMessage(`Version ${versionNumber} deleted from ${codeBase}`);
  }  
}

const copyVersionForSlack = function(versionNumber: string, codeBase: string) {
  const v = versions.value.find( v => v.Number === versionNumber && v.CodeBase == codeBase);
  if (v) {
    let output = `${settings.value?.SlackGroup}\r\n`;
    output += `${v.CodeBase} ${v.Number}\r\n`;
    v.Issues.forEach( (issue) => {
      output += `${issue.Number}${issue.IsSev ? ` [${issue.Priority}]` : ""}\r\n`;
    });
    output += `\r\n`;

    // Copy the text inside the text field
    navigator.clipboard.writeText(output);

    sendMessage("copied for Slack");
  }
}

const copyVersionForExcel = function(versionNumber: string, codeBase: string) {
  const v = versions.value.find( v => v.Number === versionNumber && v.CodeBase == codeBase);
  if (v) {
    const hasSev = v.Issues.findIndex(i => i.IsSev) > -1;
    let output = `v${v.Number}\t`;                  //A
    output += `${v.Number}+?\t`;                    //B
    output += `${"PI?"}\t`;                         //C
    output += `\t`;                                 //D
    output += `${getFormattedDate().toString()}\t`  //E
    output += `Regular\t`                           // F
    output += `${ hasSev ? "SEV" : ""}\t"`;         // G

    //H
    v.Issues.forEach( (issue) => {
      output += `${issue.Number}${issue.IsSev ? ` [${issue.Priority}]` : ""}\n`;
    });

    output += `"\t${hasSev ? "Yes" : "No"}`;        //I

    // Copy the text inside the text field
    navigator.clipboard.writeText(output);

    sendMessage("copied for Excel");
  }
}

function getFormattedDate() {
  const date = new Date();
  var year = date.getFullYear();

  var month = (1 + date.getMonth()).toString();
  month = month.length > 1 ? month : '0' + month;

  var day = date.getDate().toString();
  day = day.length > 1 ? day : '0' + day;
  
  return month + '/' + day + '/' + year;
}

const sendMessage = function (message: string) {
  toast( message, {
      autoClose: 2000,
      style: {
        zIndex: 999999,
      },
    })
}

function issueListChanged(){
  //alert("issue list changed");
}

const updateVersion = async (version: any) => {
  await saveItem(version);
}

const versionListChanged = async () => {
    await saveAllItems(versions.value);   
}

const fetchAllVersions = async(includeReleased: boolean) => {
  const versionList = await fetchAllItems(settings.value.TeamName, includeReleased);
  versions.value = versionList;
  getIssues();
}

const getIssueUrl = (issueNumber: string) => {
  return `https://dealeron.atlassian.net/browse/${issueNumber}`;
}

async function fetchVersions() {
  await fetchAllVersions(showReleasedVersions.value);
  getIssues();
}

function saveSettings() {
  if (!settings.value || !settings.value.isValid()) {
    console.error("Settings not initialized.");
    return;
  }

  if (!settings.value.TeamName) {
    alert("You must enter a team name.");
    return;
  }
  else {
    component.value = new Component(settings.value.TeamName);
  }

  if (!settings.value.BoardNumber) {
    alert("You must enter a board number.");
    return;
  }
  
  settings.value.saveSettings();
  showSettings.value = false;
  fetchVersions();

  sendMessage("Saved settings.");
}

onMounted(async () => {
  settings.value.fetchSettings();

  if (!settings.value.isValid()) {
    showSettings.value = true;
  }
  else {
    component.value = new Component(settings.value.TeamName);
    fetchVersions();
  }

  isLoaded.value = true;
});
</script>

<style>
.fa-triangle-exclamation {
  color: gold;
}

.fa-circle-exclamation {
  color: darkred;
}

.fa-code-merge {
  color: green;
}

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

</style>./IssueService./UserSettings