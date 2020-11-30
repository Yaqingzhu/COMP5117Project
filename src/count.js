const request = require('request');
const fs = require('fs');
const {BigQuery} = require('@google-cloud/bigquery');
const jsoncsv = require('csvjson-json2csv');

let rawdata = fs.readFileSync('C:/Users/yaqin/Documents/GitHub/COMP5117Project/src/new4.json');
let student = JSON.parse(rawdata);
console.log(student.length);
console.log(new Date(1606686669*1000));

