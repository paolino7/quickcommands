quickcommands
=============

Some helpfull quickcommands tool to use with Salesforce

[![Version](https://img.shields.io/npm/v/quickcommands.svg)](https://npmjs.org/package/quickcommands)
[![CircleCI](https://circleci.com/gh/paolino7/quickcommands/tree/master.svg?style=shield)](https://circleci.com/gh/paolino7/quickcommands/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/paolino7/quickcommands?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/quickcommands/branch/master)
[![Codecov](https://codecov.io/gh/paolino7/quickcommands/branch/master/graph/badge.svg)](https://codecov.io/gh/paolino7/quickcommands)
[![Greenkeeper](https://badges.greenkeeper.io/paolino7/quickcommands.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/paolino7/quickcommands/badge.svg)](https://snyk.io/test/github/paolino7/quickcommands)
[![Downloads/week](https://img.shields.io/npm/dw/quickcommands.svg)](https://npmjs.org/package/quickcommands)
[![License](https://img.shields.io/npm/l/quickcommands.svg)](https://github.com/paolino7/quickcommands/blob/master/package.json)

<!-- toc -->
* [Debugging your plugin](#debugging-your-plugin)
<!-- tocstop -->
<!-- install -->
```sh-session
$ sfdx plugins:install https://github.com/paolino7/quickcommands
$ sfdx qc
running command...
$ sfdx (-v|--version|version)
quickcommands/0.0.0 darwin-x64 node-v12.3.1
$ sfdx --help [qc]
USAGE
  $ sfdx qc
...
```
<!-- commands -->
* [`sfdx qc:call:execute [-e <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-qccallexecute--e-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx qc:data:upsert -f <filepath> -s <string> -i <string> [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-qcdataupsert--f-filepath--s-string--i-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx qc:user:create -f <filepath> [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-qcusercreate--f-filepath--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx qc:call:execute [-e <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

This command perform an upsert request of JSON array file resolving lookup with other records

```
USAGE
  $ sfdx qc:call:execute [-e <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -e, --url=url                                                                     Endpoint to call

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  $ sfdx qc:call:execute --endpoint "/services/data/v48.0/tooling" --targetusername myOrg@example.com
       {
         "tooling": "/services/data/v48.0/tooling",
         "metadata": "/services/data/v48.0/metadata"
       }
```

_See code: [lib/commands/qc/call/execute.js](https://github.com/paolino7/quickcommands/blob/v0.0.0/lib/commands/qc/call/execute.js)_

## `sfdx qc:data:upsert -f <filepath> -s <string> -i <string> [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

This command perform an upsert request of JSON array file resolving lookup with other records

```
USAGE
  $ sfdx qc:data:upsert -f <filepath> -s <string> -i <string> [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -f, --jsonfile=jsonfile                                                           (required) JSON file with records to
                                                                                    load

  -i, --externalid=externalid                                                       (required) External id field for
                                                                                    upsert operations

  -s, --sobject=sobject                                                             (required) SObject name to upsert

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  $ sfdx qc:data:upsert --jsonfile config-cpq/SBQQ__ErrorCondition__c.json --sobject SBQQ__ErrorCondition__c 
  --externalid ExternalId__c --targetusername myOrg@example.com
     Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
     My hub org id is: 00Dxx000000001234
```

_See code: [lib/commands/qc/data/upsert.js](https://github.com/paolino7/quickcommands/blob/v0.0.0/lib/commands/qc/data/upsert.js)_

## `sfdx qc:user:create -f <filepath> [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

This command perform User creation resolving profile and role id

```
USAGE
  $ sfdx qc:user:create -f <filepath> [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -f, --jsonfile=jsonfile                                                           (required) JSON file with records to
                                                                                    load

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  $ sfdx qc:user:create --jsonfile config-cpq/SBQQ__ErrorCondition__c.json --sobject SBQQ__ErrorCondition__c 
  --externalid ExternalId__c --targetusername myOrg@example.com
     Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
     My hub org id is: 00Dxx000000001234
```

_See code: [lib/commands/qc/user/create.js](https://github.com/paolino7/quickcommands/blob/v0.0.0/lib/commands/qc/user/create.js)_
<!-- commandsstop -->
<!-- debugging-your-plugin -->
# Debugging your plugin
We recommend using the Visual Studio Code (VS Code) IDE for your plugin development. Included in the `.vscode` directory of this plugin is a `launch.json` config file, which allows you to attach a debugger to the node process when running your commands.

To debug the `hello:org` command: 
1. Start the inspector
  
If you linked your plugin to the sfdx cli, call your command with the `dev-suspend` switch: 
```sh-session
$ sfdx hello:org -u myOrg@example.com --dev-suspend
```
  
Alternatively, to call your command using the `bin/run` script, set the `NODE_OPTIONS` environment variable to `--inspect-brk` when starting the debugger:
```sh-session
$ NODE_OPTIONS=--inspect-brk bin/run hello:org -u myOrg@example.com
```

2. Set some breakpoints in your command code
3. Click on the Debug icon in the Activity Bar on the side of VS Code to open up the Debug view.
4. In the upper left hand corner of VS Code, verify that the "Attach to Remote" launch configuration has been chosen.
5. Hit the green play button to the left of the "Attach to Remote" launch configuration window. The debugger should now be suspended on the first line of the program. 
6. Hit the green play button at the top middle of VS Code (this play button will be to the right of the play button that you clicked in step #5).
<br><img src=".images/vscodeScreenshot.png" width="480" height="278"><br>
Congrats, you are debugging!
