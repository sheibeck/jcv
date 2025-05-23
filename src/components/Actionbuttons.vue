<template>
    <button type="button" class="btn btn-sm btn-primary me-2" @click="copyVersionForSlack(version.Number, version.CodeBase)" title="Export Version for Slack">
      <i class="fa-brands fa-slack"></i>
    </button>
    <button type="button" class="btn btn-sm btn-primary me-2" @click="copyVersionForBuild(version.Number, version.CodeBase)" title="Export Version for Build">
      <i class="fa-solid"></i>
    </button>
    <button type="button" class="btn btn-sm btn-secondary me-2" @click="copyVersionForExcel(version.Number, version.CodeBase)" title="Export Version for Excel">
      <i class="fa-regular fa-file-excel"></i>
    </button>
    <button type="button" class="btn btn-sm btn-danger" @click="removeVersion(version.Number, version.CodeBase)" title="Delete this version">
      <i role="button" class="fas"></i>
    </button> 
</template>

<script setup lang="ts">
import type { Version } from "@/Version";
import { deleteItem } from "@/CosmosDb";
import { sendMessage } from "@/UserMessageService";
import { getIssueUrl, hasValue, isRegression } from "@/Utils";
import type { UserSettings } from "@/UserSettings";

const props = defineProps<{
    versions: Array<Version>;
    version: Version;
    callback: Function;
    settings: UserSettings;
}>();

const removeVersion = async(versionNumber: string, codeBase: string) =>{
  const verifyDelete = window.confirm("Are you sure you want to delete this version?");
  if (verifyDelete) {
    const v = props.versions.find( v => v.Number === versionNumber && v.CodeBase === codeBase);
    if (v) {
      var index = props.versions.indexOf(v);
      if (index > -1) {
        props.versions.splice(index, 1);
      }
  
      await deleteItem(v);
    }
    props.callback();

    sendMessage(`Version ${versionNumber} deleted from ${codeBase}`);
  }  
}

const copyVersionForSlack = function(versionNumber: string, codeBase: string) {
  const v = props.versions.find( v => v.Number === versionNumber && v.CodeBase == codeBase);
  if (v) {
    let slackGroups = [props.settings?.SlackGroup];   

    let output = `\r\n`;
    output += `${v.FullVersion}\r\n`;
    v.Issues.forEach( (issue) => {
      const team = props.settings.SlackGroups[issue.Team];
      if(hasValue(team) && !slackGroups.includes(team!)) {
          slackGroups.push(team!);
      }
      output += `[${issue.Number}](${getIssueUrl(issue.Number)}) ${hasValue(issue.Team) ? `[${issue.Team}]` : ""} - ${issue.Summary} ${issue.IsSev ? ` [${issue.Priority}]` : ""}${isRegression(issue) ? ` [regression]` : ""} \r\n`;
    });
    
    output = slackGroups.join(" ") + output;

    // Copy the text inside the text field
    navigator.clipboard.writeText(output);

    sendMessage("copied for Slack");
  }
}

const copyVersionForBuild = function(versionNumber: string, codeBase: string) {
  const v = props.versions.find( v => v.Number === versionNumber && v.CodeBase == codeBase);
  if (v) {
    let output = `/c/dealeron/integrate.sh -v ${versionNumber} -b 1 `;
    v.Issues.forEach( (issue) => {
      output += `${issue.Number} `;
    });
    output += `\r\n`;

    // Copy the text inside the text field
    navigator.clipboard.writeText(output);

    sendMessage("copied for integrate.sh");
  }
}

const copyVersionForExcel = function(versionNumber: string, codeBase: string) {
  const v = props.versions.find( v => v.Number === versionNumber && v.CodeBase == codeBase);
  if (v) {
    const hasSev = v.Issues.findIndex(i => i.IsSev) > -1;
    let output = `v${v.Number}\t`;
    output += `${v.Number}+?\t`;
    output += `${"PI?"}\t`;
    output += `\t`;
    output += `${getFormattedDate().toString()}\t`
    output += `Regular\t`
    output += `${ hasSev ? "SEV" : ""}\t"`;

    //H
    v.Issues.forEach( (issue) => {
      output += `${issue.Number}${issue.IsSev ? ` [${issue.Priority}]` : ""}\n`;
    });

    output += `"\t${hasSev ? "Yes" : "No"}`;

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

</script>