const request = require('request');
const fs = require('fs');
const {BigQuery} = require('@google-cloud/bigquery');
const jsoncsv = require('csvjson-json2csv');
const { Octokit } = require("@octokit/core");
const unzipper = require('unzipper');
const token = 'e9edd83c409c7961fda26337c19b077f6aa43318'

// this json file(test_zipDown) is what i generated from BQ. This json file you can find it from our project. Also, if you want to generate yours, you can use the query in readme file.
let rawdata = fs.readFileSync('C:/Users/yaqin/Documents/GitHub/COMP5117Project/src/test_zipDown.json');
let student = JSON.parse(rawdata); //parse it to json obj

unitTestFuncName();

function unitTestFuncName(){

    doProcess();
    //
}

function doProcess(){
    
    for (let key of student) {
        console.log(key);
        const keys = key.projectName.split('.')// key[0] is the owner of the project, key[1] is the name of project
        const sha = key.fixCommitSHA1;
        const year = key.commityear;
        const bugFunctionName = key.functionName;
        //for example, the first one in dataset is activiti.activiti. So, the localPath is C:/Users/yaqin/Documents/comp5117/activiti/activiti/2017
        const localPath = `C:/Users/yaqin/Documents/comp5117/${keys[0]}/${keys[1]}/${year}` //this is the path to repo.
        const localPathFile = key.bugFilePath;
        searchUnitTestCodeBasedOnPattern(localPath, bugFunctionName, localPathFile, sha);
      }
}

function searchUnitTestCodeBasedOnPattern(localPath, pattern, intialFileName, sha){
    var glob = require("glob");
    let opt1 = [];
    const pattern1 = pattern + '('
    const pattern2 = pattern + ' ('
    if(!pattern)
        return;

    // this will read all java files from above localPath, and call the function(er,files).
    glob.sync(localPath + "/**/*.java").map( function (file) {
        
    //here, is the loop to read each java file.
        let rawdata = fs.readFileSync(file); // read the file.
        //pattern is what we want to search from each file. Now, it's the actual java function name(where the code change happened).
        // for example, the first one in dataset, the code change is done in function called fillPreviousFormValues. Then now, the code will find any other files that call fillPreviousFormValues.
        if(rawdata && (rawdata.includes(pattern1) || rawdata.includes(pattern2))){
            // if the file contains fillPreviousFormValues. We need to do more vaildation to make sure this caller function is a unit test.
            if(!file.includes(intialFileName)){
                console.log('possible file ' + file);
                //if it is unit test, then put the SHA and unit test name to a json.
                const unitTestName = getUnitTestFuncName(rawdata, pattern);
                if(unitTestName){
                    opt1.push({sha:sha, unitTestName: unitTestName, isunitTest: false});
                }
            } else {
                // check if the function is unit test itself.
    
                if(isUnitTestSelf(rawdata, pattern)){
                    opt1.push({sha:sha, unitTestName: pattern, isunitTest: true});
                } else if(intialFileName.includes('src/test')){
                    opt1.push({sha:sha, unitTestName: pattern, isunitTest: true});
                }
            }
        } 
      });

      if(opt1.length == 0){
        console.log("opt is empty")
        opt1 = [{sha:sha, unitTestName: null}];
        }
        console.log(opt1)
        const ndJson = opt1.map(JSON.stringify).join('\n');
        const ndJson2 = ndJson + '\n'
        // then finally, the code output all {SHA and unittest} to files.
        fs.appendFileSync('C:/Users/yaqin/Documents/GitHub/COMP5117Project/src/sha_unittestName.json', ndJson2);
}

function isUnitTestSelf(rawdata, pattern){
    const lines = rawdata.toString().split(/\r\n|\r|\n/)
    let lineNum = 0;

    for(lineNum; lineNum < lines.length; lineNum++){
        if(lines[lineNum].includes(pattern)){
            break;
        }
    }

    for(lineNum; lineNum >= 0; lineNum--){
        if(lines[lineNum].includes('protected ') || lines[lineNum].includes('public ') || lines[lineNum].includes('private ')){
            const funcName = getName(lines[lineNum]);
            console.log(funcName);
            break;
        }
    }
    lineNum = lineNum + 1;
    for(lineNum; lineNum < lines.length; lineNum++){
        if(lines[lineNum - 1] && lines[lineNum - 1].charAt(0)=='}' && (lines[lineNum].includes('protected ') || lines[lineNum].includes('public ') || lines[lineNum].includes('private '))){
            return false;
        }else if(lines[lineNum].includes('assert')){
            return true;
        }
    }
}
// this is the code to find the name of the unit test function.
function getUnitTestFuncName(body, pattern){
    
    const javaCode = body.toString();
    const lines = javaCode.split(/\r\n|\r|\n/);
    let lineNum = 0;
    const pat1 = pattern + '('
    const pat2 = pattern + ' ('

    for(lineNum; lineNum < lines.length; lineNum++){
        if((lines[lineNum].includes(pat1)||lines[lineNum].includes(pat2)) && (lines[lineNum].includes('protected ') || lines[lineNum].includes('public ') || lines[lineNum].includes('private '))){
            return null;
        }
        if((lines[lineNum].includes(pat1)||lines[lineNum].includes(pat2))){
            break;
        }
    }
    
    if(lineNum < lines.length){
        for(lineNum; lineNum >= 0; lineNum--){
            if(lines[lineNum]){
                if(lines[lineNum].includes('protected ') || lines[lineNum].includes('public ') || lines[lineNum].includes('private ')){
                    if(isUnitTestFunction(javaCode, lineNum + 1)){
                        console.log('is unit test');
                        const funcName = getName(lines[lineNum]);
                        return funcName;
                    }
                }
            }
            
        }
    }
    

    return null;
}

// this will do validation to see if the function name is a unit test name
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