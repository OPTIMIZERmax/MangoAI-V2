import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'data/accounts.json');

export class AccountManager {

    constructor(){
        this.accounts = new Map();
        this.load();
    }


    save(userId, platform, credentials){

        if(!this.accounts.has(userId)){
            this.accounts.set(userId,{});
        }

        this.accounts.get(userId)[platform] = credentials;

        this.persist();
    }


    get(userId, platform){

        return this.accounts.get(userId)?.[platform] || null;

    }


    remove(userId, platform){

        this.accounts.get(userId)?.[platform] &&
        delete this.accounts.get(userId)[platform];

        this.persist();
    }


    persist(){

        fs.writeFileSync(
            file,
            JSON.stringify(
                Object.fromEntries(this.accounts),
                null,
                2
            )
        );

    }


    load(){

        if(!fs.existsSync(file)) return;

        const data=JSON.parse(fs.readFileSync(file));

        this.accounts=new Map(Object.entries(data));

    }

}


export default AccountManager;