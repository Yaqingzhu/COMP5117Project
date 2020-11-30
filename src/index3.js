const request = require('request');
const fs = require('fs');
const {BigQuery} = require('@google-cloud/bigquery');
const jsoncsv = require('csvjson-json2csv');
const { Octokit } = require("@octokit/core");
const unzipper = require('unzipper');
const token = 'e9edd83c409c7961fda26337c19b077f6aa43318'


let rawdata = fs.readFileSync('C:/Users/yaqin/Documents/GitHub/COMP5117Project/src/test_zipDown.json');
let student = JSON.parse(rawdata);

unitTestFuncName();

function unitTestFuncName(){

    doProcess();
    //
}

function doProcess(){
    
    for (let key of student) {
        console.log(key);
        const keys = key.projectName.split('.')
        const sha = key.fixCommitSHA1;
        const year = key.commityear;
        const bugFunctionName = key.functionName;
        const localPath = `C:/Users/yaqin/Documents/comp5117/${keys[0]}/${keys[1]}/${year}`
        const localPathFile = key.bugFilePath;
        searchUnitTestCodeBasedOnPattern(localPath, bugFunctionName, localPathFile, sha);
      }
}

function searchUnitTestCodeBasedOnPattern(localPath, pattern, intialFileName, sha){
    var glob = require("glob");

    glob(localPath + "/**/*.java", function (er, files) {
        let opt1 = [];
        if (er) {
            console.log('Error', er);
          } else {
            
              for(let file of files){
                let rawdata = fs.readFileSync(file);
                if(rawdata.includes(pattern)){
                    console.log('possible file ' + file);
                    if(!file.includes(intialFileName)){
                        console.log('possible file ' + file);
                        const unitTestName = getUnitTestFuncName(rawdata, pattern);
                        opt1.push({sha:sha, unitTestName: unitTestName});
                    }
                }
              }
              if(opt1.length == 0){
                console.log("opt is empty")
                opt1 = [{sha:sha, unitTestName: null}];
              }
              console.log(opt1)
              const ndJson = opt1.map(JSON.stringify).join('\n');
              const ndJson2 = ndJson + '\n'
        
              fs.appendFile('C:/Users/yaqin/Documents/GitHub/COMP5117Project/src/sha_unittestName.json', ndJson2, function (err) {
                if (err) return console.log(err);
                console.log('Hello World > helloworld.txt');
              });
          }
      });
}

function getUnitTestFuncName(body, pattern){
    
    const javaCode = body.toString();
    const lines = javaCode.split(/\r\n|\r|\n/);
    let lineNum = 0;

    for(lineNum; lineNum < lines.length; lineNum++){
        if(lines[lineNum].includes(pattern)){
            break;
        }
    }
    
    for(lineNum; lineNum >= 0; lineNum--){
        if(lines[lineNum].includes('protected ') || lines[lineNum].includes('public ') || lines[lineNum].includes('private ')){
            if(isUnitTestFunction(javaCode, lineNum + 1)){
                console.log('is unit test');
                const funcName = getName(lines[lineNum]);
                return funcName;
            }
        }
    }

    return null;
}

function isUnitTestFunction(body, funcStartLineNum){
    const lines = body.split(/\r\n|\r|\n/);
    for(funcStartLineNum; funcStartLineNum < lines.length; funcStartLineNum++){
        if(lines[funcStartLineNum].includes('protected ') || lines[funcStartLineNum].includes('public ') || lines[funcStartLineNum].includes('private ')){
            return false;
        }
        
        if(lines[funcStartLineNum].includes('assert')){
            return true;
        }
    }
    return false;
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