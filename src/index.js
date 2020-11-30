const request = require('request');
const fs = require('fs');
const {BigQuery} = require('@google-cloud/bigquery');
const jsoncsv = require('csvjson-json2csv');
const { Octokit } = require("@octokit/core");
const token = 'e9edd83c409c7961fda26337c19b077f6aa43318'


let rawdata = fs.readFileSync('C:/Users/yaqin/Documents/GitHub/COMP5117Project/src/new4.json');
let student = JSON.parse(rawdata);

// const ndJson = student.map(JSON.stringify).join('\n');

// fs.writeFile('C:/Users/yaqin/Documents/GitHub/COMP5117Project/src/opt2.json', ndJson, function (err) {
//     if (err) return console.log(err);
//     console.log('Hello World > helloworld.txt');
//   });

const bigqueryClient = new BigQuery();

// let buff = Buffer.from('PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHByb2pl\nY3QgeG1sbnM9Imh0dHA6Ly9tYXZlbi5hcGFjaGUub3JnL1BPTS80LjAuMCIg\neG1sbnM6eHNpPSJodHRwOi8vd3d3LnczLm9yZy8yMDAxL1hNTFNjaGVtYS1p\nbnN0YW5jZSIKICAgICAgICAgeHNpOnNjaGVtYUxvY2F0aW9uPSJodHRwOi8v\nbWF2ZW4uYXBhY2hlLm9yZy9QT00vNC4wLjAgaHR0cDovL21hdmVuLmFwYWNo\nZS5vcmcveHNkL21hdmVuLTQuMC4wLnhzZCI+CiAgICA8cGFyZW50PgogICAg\nICAgIDxhcnRpZmFjdElkPmNhbmFsLmNsaWVudC1hZGFwdGVyPC9hcnRpZmFj\ndElkPgogICAgICAgIDxncm91cElkPmNvbS5hbGliYWJhLm90dGVyPC9ncm91\ncElkPgogICAgICAgIDx2ZXJzaW9uPjEuMS4zLVNOQVBTSE9UPC92ZXJzaW9u\nPgogICAgPC9wYXJlbnQ+CiAgICA8bW9kZWxWZXJzaW9uPjQuMC4wPC9tb2Rl\nbFZlcnNpb24+CiAgICA8Z3JvdXBJZD5jb20uYWxpYmFiYS5vdHRlcjwvZ3Jv\ndXBJZD4KICAgIDxhcnRpZmFjdElkPmNsaWVudC1hZGFwdGVyLmNvbW1vbjwv\nYXJ0aWZhY3RJZD4KICAgIDxwYWNrYWdpbmc+amFyPC9wYWNrYWdpbmc+CiAg\nICA8bmFtZT5jYW5hbCBjbGllbnQgYWRhcHRlciBjb21tb24gbW9kdWxlIGZv\nciBvdHRlciAke3Byb2plY3QudmVyc2lvbn08L25hbWU+CiAgICA8ZGVwZW5k\nZW5jaWVzPgogICAgICAgIDxkZXBlbmRlbmN5PgogICAgICAgICAgICA8Z3Jv\ndXBJZD5jb20uYWxpYmFiYS5vdHRlcjwvZ3JvdXBJZD4KICAgICAgICAgICAg\nPGFydGlmYWN0SWQ+Y2FuYWwucHJvdG9jb2w8L2FydGlmYWN0SWQ+CiAgICAg\nICAgICAgIDx2ZXJzaW9uPjEuMS4zLVNOQVBTSE9UPC92ZXJzaW9uPgogICAg\nICAgIDwvZGVwZW5kZW5jeT4KICAgICAgICA8ZGVwZW5kZW5jeT4KICAgICAg\nICAgICAgPGdyb3VwSWQ+am9kYS10aW1lPC9ncm91cElkPgogICAgICAgICAg\nICA8YXJ0aWZhY3RJZD5qb2RhLXRpbWU8L2FydGlmYWN0SWQ+CiAgICAgICAg\nICAgIDx2ZXJzaW9uPjIuOS40PC92ZXJzaW9uPgogICAgICAgIDwvZGVwZW5k\nZW5jeT4KICAgICAgICA8ZGVwZW5kZW5jeT4KICAgICAgICAgICAgPGdyb3Vw\nSWQ+Y29tLmFsaWJhYmE8L2dyb3VwSWQ+CiAgICAgICAgICAgIDxhcnRpZmFj\ndElkPmRydWlkPC9hcnRpZmFjdElkPgogICAgICAgICAgICA8dmVyc2lvbj4x\nLjEuOTwvdmVyc2lvbj4KICAgICAgICA8L2RlcGVuZGVuY3k+CiAgICAgICAg\nPGRlcGVuZGVuY3k+CiAgICAgICAgICAgIDxncm91cElkPm9yZy5zcHJpbmdm\ncmFtZXdvcms8L2dyb3VwSWQ+CiAgICAgICAgICAgIDxhcnRpZmFjdElkPnNw\ncmluZy1jb250ZXh0PC9hcnRpZmFjdElkPgogICAgICAgICAgICA8dmVyc2lv\nbj41LjAuNS5SRUxFQVNFPC92ZXJzaW9uPgogICAgICAgIDwvZGVwZW5kZW5j\neT4KICAgICAgICA8ZGVwZW5kZW5jeT4KICAgICAgICAgICAgPGdyb3VwSWQ+\nb3JnLnlhbWw8L2dyb3VwSWQ+CiAgICAgICAgICAgIDxhcnRpZmFjdElkPnNu\nYWtleWFtbDwvYXJ0aWZhY3RJZD4KICAgICAgICAgICAgPHZlcnNpb24+MS4x\nOTwvdmVyc2lvbj4KICAgICAgICA8L2RlcGVuZGVuY3k+CiAgICA8L2RlcGVu\nZGVuY2llcz4KCjwvcHJvamVjdD4K\n', 'base64');
// let text = buff.toString('ascii');
updateFuncNameToFile();

async function updateFuncNameToFile(){
    await getFunctionName();
}

async function getFunctionName(){
    let count = 8300;

    for(count; count<student.length; count++){
        await doProcess(student[count]);
    }
}

async function doProcess(element){
    const sha = element.fixCommitSHA1;
    const projectNames = String(element.projectName).split('.');
    const octokit = new Octokit({ auth: "7419f8128ff7d71c7abf3cc559fe5ddcb0c8bc88"});
    const response = await octokit.request('GET /repos/{owner}/{repo}/commits/{commit_sha}', {
        owner:projectNames[0],
        repo: projectNames[1],
        commit_sha: sha}).catch(error=> console.log(error));
        if(response){
            const info = response.data;
            console.log(response.data);
            const files = info.files;
            const len = files.length;
            element.commitDate = info.commit.author.date;
            
            let i;

            for(i = 0; i < len; i++){
                if(files[i].filename.includes(element.bugFilePath) || element.bugFilePath.includes(files[i].filename)){
                    const url2 = files[i].raw_url;
                    const options2 = {
                        url: url2,
                        headers: {
                            'User-Agent': 'request'
                        }
                        };
                    request(options2, (error, response, body) => {
                        checkFunctionName(error, response, body, element.fixLineNum, element);
                    });
                }
            }
        }
            
}

function checkFunctionName(error, response, body, lineNum, element){
    const lines = body.split(/\r\n|\r|\n/)
    
    for(lineNum; lineNum >= 0; lineNum--){
        if(lines[lineNum].includes('protected ') || lines[lineNum].includes('public ') || lines[lineNum].includes('private ')){
            const funcName = getName(lines[lineNum]);
            console.log(funcName);
            element.functionName = funcName;
            break;
        }
    }
    const aElement = [element];

    const ndJson = aElement.map(JSON.stringify).join('\n');
    const ndJson2 = ndJson + '\n'
    fs.appendFile('C:/Users/yaqin/Documents/GitHub/COMP5117Project/src/opt23.json', ndJson2, function (err) {
        if (err) return console.log(err);
        console.log('Hello World > helloworld.txt');
      });
}

function getName(l){
    const searchTerm = '(';
    const indexOfFirst = l.indexOf(searchTerm);
    let i = indexOfFirst;
    let start;
    if(l.charAt(i-1) == ' '){
        i = i-1;
    }

    for(i; i >=0; i--){
        if(l.charAt(i) == ' '){
            start = i+1;
            break;
        }
    }

    return l.substring(start,indexOfFirst);
}