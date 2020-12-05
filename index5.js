const request = require('request');
const fs = require('fs');
const {BigQuery} = require('@google-cloud/bigquery');
const jsoncsv = require('csvjson-json2csv');
const { Octokit } = require("@octokit/core");
const unzipper = require('unzipper');
const token = 'e9edd83c409c7961fda26337c19b077f6aa43318'


let rawdata = fs.readFileSync('E:/STUDY/CU/COMP5117/courseProject/COMP5117Project-main/src/test_zipDown.json');
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
        const localPath = `E:/STUDY/CU/COMP5117/courseProject/COMP5117Project-main/${keys[0]}/${keys[1]}/${year}`
        const localPathFile = key.bugFilePath;
        checkNumOfUTforScenario(localPath, bugFunctionName, localPathFile, sha);
      }
}

//when no unit test for a function, it will be 0
//when a function have unit test, it will be 1 or more 
function checkNumOfUTforScenario(localPath, pattern, intialFileName, sha)
{
    var glob = require("glob");
    let opt1 = [];

    glob.sync(localPath + "/**/*.java").map( function (file) 
    {
        let testNum = 0; //value for count the number of tests in one unit test
        let rawdata = fs.readFileSync(file); // read the file.
        //search java function
        if(rawdata.includes(pattern))
        {
            console.log('possible file ' + file);
            //check if the function is a unit test.
            if(!file.includes(intialFileName))
            {
                testNum = checkNumOfUT(rawdata, pattern); // count the number of tests in one unit test
                const unitTestName = getUnitTestFuncName(rawdata, pattern); // get the name of the unit test
                if(unitTestName!=null && testNum == 0) // if an unit test doesn't contain key word 'test', we still count this unit test have one test (itself)
                {
                    testNum = 1;
                }
                opt1.push({sha:sha, unitTestName: unitTestName, testNum: testNum});
            }
        }
    });

    if(opt1.length == 0)
    {
        console.log("opt is empty");
        opt1 = [{sha:sha, unitTestName: null, testNum: 0}];
    }

    console.log(opt1)
    const ndJson = opt1.map(JSON.stringify).join('\n');
    const ndJson2 = ndJson + '\n'
    // then finally, the code output all info to files.
    fs.appendFileSync('E:/STUDY/CU/COMP5117/courseProject/COMP5117Project-main/src/sha_NumOfunittest.json', ndJson2);
}

function checkNumOfUT(body, pattern)
{
    const javaCode = body.toString();
    const lines = javaCode.split(/\r\n|\r|\n/);
    let lineNum = 0;
    let StartLineNum = 0;
    let NumofUT = 0;

    for(lineNum; lineNum < lines.length; lineNum++)
    {
        if(lines[lineNum].includes(pattern)){
            break;
        }
    }

    for(lineNum; lineNum >= 0; lineNum--)
    {
        if(lines[lineNum].includes('protected ') || lines[lineNum].includes('public ') || lines[lineNum].includes('private ')){
            if(isUnitTestFunction(javaCode, lineNum + 1))
            {
                StartLineNum = lineNum + 1;
                for(StartLineNum; StartLineNum < lines.length; StartLineNum++)
                {
                    if(lines[StartLineNum].includes('test') || lines[StartLineNum].includes('Test'))
                    {
                        NumofUT++;
                    }
                }
            }
        }
    }
    return NumofUT;
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