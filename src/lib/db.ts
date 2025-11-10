import type { EnhancedMetric } from "./types";

export type DashboardEntity = {
    metrics: Array<EnhancedMetric>;
    description: string;
    title: string;
    date: Date;
    id?: number;
}

export class Database {
    private static instance: Database;
    db: IDBDatabase | undefined;

    private constructor(resolve: (db: Database) => void) {
        const DBOpenRequest: IDBOpenDBRequest = indexedDB.open("metrics", 1);
        DBOpenRequest.onerror = (event) => {
            console.error("DBOpenRequest.onerror", event);
        };

        DBOpenRequest.onsuccess = (event) => {
            this.db = DBOpenRequest.result;
            console.log("resolved");
            resolve(this)
        };

        DBOpenRequest.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            this.db = DBOpenRequest.result;

            this.db.onerror = (event) => {
                console.log('Error loading database.');
            };
            this.migrate(DBOpenRequest.result, event.oldVersion, event.newVersion ?? undefined);
        };
    }

    public static getInstance(): Promise<Database> {
        return new Promise<Database>((resolve, reject) => {
            if (!Database.instance) {
                Database.instance = new Database(resolve);
            } else {
                resolve(Database.instance);
            }
        })
    }

    private migrate(db: IDBDatabase, oldVersion: number, newVersion?: number) {
        for (let start = oldVersion; start <= (newVersion ?? oldVersion); start++) {
            switch (start) {
                case 1:
                    this.initSchema(db);
                    break;
                default:
                    break;
            }
        }

    }

    private initSchema(db: IDBDatabase) {
        db.createObjectStore('dashboards', { keyPath: 'id', autoIncrement: true });
    }

}

export const dashboardsRepo = {
    getAllDashboards: async (db: IDBDatabase): Promise<DashboardEntity[]> => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("dashboards", "readonly");
            const objectStore = transaction.objectStore("dashboards").getAll();

            objectStore.onsuccess = () => {
                resolve(objectStore.result as DashboardEntity[]);
            };

            objectStore.onerror = (event) => {
                reject(new Error("Failed to fetch user programs: " + event.target));
            };
        });
    },


    insertDashboard: (db: IDBDatabase, data: DashboardEntity) => {
        return new Promise((resolve, reject) => {
            console.log("INSERTING", JSON.parse(JSON.stringify(data)));
            const transaction = db.transaction("dashboards", "readwrite");
            const result = transaction.objectStore("dashboards").put(JSON.parse(JSON.stringify(data)));
            result.onerror = (event) => {
                console.log("Failed to insert user program...", event.target);
                reject(event);
            }
            result.onsuccess = () => {
                // console.log("User program inserted", event?.target.result);
                resolve("OK");
            }

        })
    },

    deleteDashboard: (db: IDBDatabase, id: number) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("dashboards", "readwrite");
            const result = transaction.objectStore("dashboards").delete(id);
            result.onerror = (event) => {
                console.log("Failed to delete user program...", event);
                reject("NOT OK");
            }
            result.onsuccess = () => {
                console.log("User program deleted");
                resolve("OK")
            }
        });
    }
}
