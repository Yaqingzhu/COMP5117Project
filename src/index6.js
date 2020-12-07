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

class AssertTypeCounter {

    static assertTypeList = ['All',
        'Equals', 'NotEquals', 'Same', 'NoteSame', 'ArrayEquals', 'IterableEquals', 'LinesMatch',
        'False', 'True',
        'Null', 'NotNull',
        'Throws',
        'Timeout', 'TimeoutPreemptively'];

    constructor() {
        this._data = new Map();
        for (let t of AssertTypeCounter.assertTypeList) this._data.set(t, 0);
    }

    addCase(str) {
        for (let t of AssertTypeCounter.assertTypeList) {
            let numOccurrence = substringCount(str, 'assert' + t);
            if (numOccurrence > 0) this._data.set(t, this._data.get(t) + numOccurrence);
        }
    }
    // Adds two assertTypeCounter
    static add(a, b) {
        let ret = new AssertTypeCounter();
        for (let t of AssertTypeCounter.assertTypeList)
            ret._data.set(t, a._data.get(t) + b._data.get(t));
        return ret;
    }

    countEqualLike() {
        let equalList = ['Equals', 'NotEquals', 'Same', 'NoteSame', 'ArrayEquals', 'IterableEquals', 'LinesMatch'];
        let ret = 0;
        for (let t of equalList) ret = ret + this._data.get(t);
        return ret;
    }

    countBoolLike() {
        let boolList = ['False', 'True'];
        let ret = 0;
        for (let t of boolList) ret = ret + this._data.get(t);
        return ret;
    }

    countNullLike() {
        let nullList = ['Null', 'NotNull'];
        let ret = 0;
        for (let t of nullList) ret = ret + this._data.get(t);
        return ret;
    }

    countThrows() {
        let throwList = ['Throws'];
        let ret = 0;
        for (let t of throwList) ret = ret + this._data.get(t);
        return ret;
    }

    countTimeoutLike() {
        let timeoutList = ['Timeout', 'TimeoutPreemptively'];
        let ret = 0;
        for (let t of timeoutList) ret = ret + this._data.get(t);
        return ret;
    }

}



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

        // searchUnitTestCodeBasedOnPattern(localPath, bugFunctionName, localPathFile, sha);
        checkAssertTypes(localPath, bugFunctionName, localPathFile, sha);

    }
}

// This function checks assertType distribution for the function (@pattern)
function checkAssertTypes(localPath, pattern, initialFileName, sha)
{
    var glob = require("glob");
    let opt1 = [];

    if(!pattern) return;

    glob.sync(localPath + "/**/*.java").map( function (file)
    {
        let assertCounter = new AssertTypeCounter();
        //here, is the loop to read each java file.
        let rawdata = fs.readFileSync(file); // read the file.
        //pattern is what we want to search from each file. Now, it's the actual java function name(where the code change happened).
        // for example, the first one in dataset, the code change is done in function called fillPreviousFormValues. Then now, the code will find any other files that call fillPreviousFormValues.
        if(rawdata.includes(pattern)) {
            // if the file contains fillPreviousFormValues. We need to do more vaildation to make sure this caller function is a unit test.
            if(!file.includes(initialFileName)){
                console.log('possible file ' + file);
                //if it is unit test, then put the SHA and unit test name to a json.
                assertCounter = countAssertTypes(rawdata, pattern)
                const unitTestName = getUnitTestFuncName(rawdata, pattern);
                if(unitTestName != null){
                    opt1.push({sha:sha, unitTestName: unitTestName,
                        assertEqual: assertCounter.countEqualLike(),
                        assertBool: assertCounter.countBoolLike(),
                        assertNull: assertCounter.countNullLike(),
                        assertThrow: assertCounter.countThrows(),
                        assertTimeout:assertCounter.countTimeoutLike()
                    });
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
    fs.appendFileSync('C:/Users/yaqin/Documents/GitHub/COMP5117Project/src/sha_assertTypeDistribution.json', ndJson2);

}


// @body:       string-like, full content of a single Java source file
// @pattern:    string, name of the function to be evaluated
// Returns:     An AssertTypeCounter() object, indicating found assert counts
function countAssertTypes(body, pattern) {
    const javaCode = body.toString();
    const lines = javaCode.split(/\r\n|\r|\n/);
    let lineNum = 0;
    let assertCounter = new AssertTypeCounter()

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
                assertCounter = assertStatics(javaCode, lineNum + 1);
                break;
            }
        }
    }
    return assertCounter;
}




// function isUnitTestSelf(rawdata, pattern){
//     const lines = rawdata.toString().split(/\r\n|\r|\n/)
//     let lineNum = 0;
//
//     for(lineNum; lineNum < lines.length; lineNum++){
//         if(lines[lineNum].includes(pattern)){
//             break;
//         }
//     }
//
//     for(lineNum; lineNum >= 0; lineNum--){
//         if(lines[lineNum].includes('protected ') || lines[lineNum].includes('public ') || lines[lineNum].includes('private ')){
//             const funcName = getName(lines[lineNum]);
//             console.log(funcName);
//             break;
//         }
//     }
//     lineNum = lineNum + 1;
//     for(lineNum; lineNum < lines.length; lineNum++){
//         if(lines[lineNum - 1] && lines[lineNum - 1].charAt(0)=='}' && (lines[lineNum].includes('protected ')
//             || lines[lineNum].includes('public ') || lines[lineNum].includes('private '))){
//             return false;
//         }else if(lines[lineNum].includes('assert')){
//             return true;
//         }
//     }
// }


// this is the code to find the name of the unit test function.
function getUnitTestFuncName(body, pattern){

    const javaCode = body.toString();
    const lines = javaCode.split(/\r\n|\r|\n/);
    let lineNum = 0;
    const pat1 = pattern + '('
    const pat2 = pattern + ' ('

    for(lineNum; lineNum < lines.length; lineNum++){
        if((lines[lineNum].includes(pat1)||lines[lineNum].includes(pat2)) && (lines[lineNum].includes('protected ') ||
            lines[lineNum].includes('public ') || lines[lineNum].includes('private '))){
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



// This will do validation to see if the function name is a unit test name
// Note you should set @funcStartLineNum next line to the function declaration
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




function substringCount(string, subString, allowOverlapping) {

    string += "";
    subString += "";
    if (subString.length <= 0) return (string.length + 1);

    var n = 0,
        pos = 0,
        step = allowOverlapping ? 1 : subString.length;

    while (true) {
        pos = string.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        } else break;
    }
    return n;
}


// funcStartLineNum should be the next line to target function header
// Returns a AssertTypeCounter object
function assertStatics(body, funcStartLineNum) {
    const lines = body.split(/\r\n|\r|\n/);
    let ret = new AssertTypeCounter()
    for(funcStartLineNum; funcStartLineNum < lines.length; funcStartLineNum++){
        if(lines[funcStartLineNum].includes('protected ') || lines[funcStartLineNum].includes('public ') ||
            lines[funcStartLineNum].includes('private ')) {
            break;
        }
        ret.addCase(lines[funcStartLineNum]);
    }
    return ret;
}