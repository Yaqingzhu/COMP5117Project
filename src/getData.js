class BQdata{
    constructor(bugType, sha, filePath, fileName, projectName, lineNumber, sourceBefore, sourceAfter){
        this.sourceAfter = sourceAfter;
        this.sourceBefore = sourceBefore;
        this.lineNumber = lineNumber;
        this.projectName = projectName;
        this.fileName = fileName;
        this.filePath = filePath;
        this.sha = sha;
        this.bugType = bugType;
    }

    get fullCode() {
        return this._fullCode;
      }
    
      set fullCode(value) {
        this._fullCode = value;
      }


}