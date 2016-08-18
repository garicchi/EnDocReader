'use strict';

import * as fs from 'fs';

export class Settings{
    public static settingModel = null;
    public static settingPath = "";
    public static isLoaded = false;

    public static load(settingFile:string){
        let jsonFile = fs.readFileSync(settingFile, 'utf8');
        this.settingModel = JSON.parse(jsonFile);
        this.settingPath = settingFile;
        this.isLoaded = true;
    }

    public static getSetting(key:string){
        return this.settingModel[key];
    }

    public static setSetting(key:string,val:any){
        this.settingModel[key] = val;
        let json = JSON.stringify(this.settingModel);
        fs.writeFileSync(this.settingPath,json,'utf8');
    }
}