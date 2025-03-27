# Jira Version Manager

Jira Version Manager allows you to create versions and put tickets from Jira cloud into the versions. If you do not have an Versioning Agile board in Jira for your team contact your team architect to set one up for you.

## Configuration

In order to configure your versions you will need to click the cog and enter you work email, jira api key, team name, jira board number, and your slack integration group name. 

## Sub tasks

The left half of the screen will show you subtasks that are in Review, Integrating or Regression Testing (use the dropdown to choose which status you want to search.) It will list subtasks by repository name based on your teams Agile board in Jira.

## Versions

The right half of the scren will show you all the versions you have. You can create new versions by typing in your CodeBaseKey (i.e. repository name) and the version number you want for the release. The software checks for duplicate version numbers per code base.

### Release Status

A version can be planned, built and released simply by checking the boxes based on the state of your version. Planned means that you've anounced this version to the team, built means that is is built and in QA, and released means that it has been pushed to production. Checking the released box will automatically fill in the local date time.

### Version Actions

There are icons located above each version. 

* Export for Slack - the slack icon copies a formatted message to your clipboard that you can paste into your slack integration channel.
* Export for Build - the hammer icon copies a command to run a build command from your command line. You can view this for more information https://dev.azure.com/dealeron/ARCH/_git/integration-script
* Export for Excel - this exports the release for pasting into an excel spreadsheet. This process has been deprecated so it may no longer be needed.
* Delete - the trash can icon will prompt you to confirm the deletion of your version.

### Searching

On load of the page released versions will not show by defaults unless you toggle the `released` toggle located in the upper right corner. The search box allows you to search through your versions. Currently the site will only load the last 15 versions.

## Release Report
A release report is available by clicking the Report button. This will show you all the versions that have been released during the current year by code base. This report can be exported to an excel spreadsheet.

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```
