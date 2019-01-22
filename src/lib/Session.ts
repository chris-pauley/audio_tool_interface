import Store from "lib/Store"
import { app_store,  AppState } from "app/app_store";
import User from "models/User";
import { warn } from "utils/console";
import { isString, isNumber } from "utils/helpers";

enum LocalStorageType { local = "local", session = "session" }

class SessionClass {
    //!- singleton logic
    private static _instance: SessionClass = new SessionClass();
    private constructor() {
        // Decide if we're creating an instance or not
        if(SessionClass._instance) {
            return SessionClass._instance;
        } 
        SessionClass._instance = this;
    }
    
    public static getInstance(){
        return SessionClass._instance;
    }
    //-!
    get store(): Store<AppState>{
        return app_store;
    }
    get user(): User {
        return this.store.state.user;
    }

    make_local_property({ key, value, default_value, storage_type = LocalStorageType.local }:
                        { key: string, value: any, default_value: any, storage_type: LocalStorageType}) {
        return new Proxy(value,{
            get(target, property, receiver) {
                var storage = storage_type == LocalStorageType.session ? window.sessionStorage : window.localStorage;
                if (!storage) {
                    warn(`Could not get ${key} because ${storage_type} storage is not available`);
                    return null;
                }
                var return_value = storage.getItem(key);
                if(isString(value) || isString(default_value)){
                    return return_value;
                } else if (isNumber(value) || isNumber(default_value)) {
                    return parseFloat(return_value);
                } else {
                    return JSON.parse(return_value);
                }
            },
            set(target, property, new_value, receiver) {
                var storage = storage_type == LocalStorageType.session ? window.sessionStorage : window.localStorage;
                if (!storage) {
                    warn(`Could not set ${key} because ${storage_type} storage is not available`);
                    return false;
                }
                return false
            }
        })
    }
}

var Session = SessionClass.getInstance();
export { Session };