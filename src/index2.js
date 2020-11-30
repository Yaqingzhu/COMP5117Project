const request = require('request');
const fs = require('fs');
const {BigQuery} = require('@google-cloud/bigquery');
const jsoncsv = require('csvjson-json2csv');
const { Octokit } = require("@octokit/core");
const unzipper = require('unzipper');
const token = 'e9edd83c409c7961fda26337c19b077f6aa43318'


let rawdata = fs.readFileSync('C:/Users/yaqin/Documents/GitHub/COMP5117Project/src/test_zipDown.json');
let student = JSON.parse(rawdata);
let repoCommitSHA = new Map();
getFunctionName();

function getFunctionName(){
    let count = 0;

    for(count; count<student.length; count++){
        doProcess(student[count]);
    }

    console.log(repoCommitSHA);
}

function doProcess(element){
    if(!repoCommitSHA.has(element.commityear + '.' + element.projectName)){
        repoCommitSHA.set(element.commityear + '.' + element.projectName, element.fixCommitSHA1);
    }
    
    for (let key of repoCommitSHA.keys()) {
        console.log(key);
        keys = key.split('.');
        const value = repoCommitSHA.get(key);
        const path = `https://github.com/${keys[1]}/${keys[2]}/archive/${value}.zip`
        const localPath = `C:/Users/yaqin/Documents/comp5117/${keys[1]}/${keys[2]}/${keys[0]}`
        const localPathFile = `C:/Users/yaqin/Documents/comp5117/${keys[1]}/${keys[2]}/${keys[0]}/${value}.zip`
        downloadZip(path, localPath, localPathFile);
      }
}

function downloadZip(path, localPath, localPathFile){
    if (!fs.existsSync(localPath)){
        fs.mkdirSync(localPath, { recursive: true });
    }

    console.log(path)
    console.log(localPath)
    request(path)
    .pipe(fs.createWriteStream(localPathFile))
    .on('close', function () {
    console.log('File written!');
        fs.createReadStream(localPathFile)
        .pipe(unzipper.Extract({ path: localPath })).on('close', function() {console.log('file unzip finished.')});
    });
}