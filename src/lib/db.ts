import type { DashboardEntityFirestore } from "./firebase";
import type { EnhancedMetric } from "./types";

export type DashboardEntity = {
    metrics: Array<EnhancedMetric>;
    description: string;
    title: string;
    date: Date;
}

export class Database {
    private static instance: Database;
    db: IDBDatabase | undefined;

    private constructor(resolve: (db: Database) => void) {
        const DBOpenRequest: IDBOpenDBRequest = indexedDB.open("metrics", 2);
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
            const upgradeTransaction = DBOpenRequest.transaction;
            this.db.onerror = (event) => {
                console.log('Error loading database.');
            };
            if (upgradeTransaction) {
                this.migrate(DBOpenRequest.result, upgradeTransaction, event.oldVersion, event.newVersion ?? undefined);
            }
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

    private migrate(db: IDBDatabase, transaction: IDBTransaction, oldVersion: number, newVersion?: number) {
        console.log("old version = ", oldVersion);
        console.log("new version = ", newVersion);
        for (let start = oldVersion + 1; start <= (newVersion ?? oldVersion); start++) {
            switch (start) {
                case 1:
                    this.initSchema(db);
                    break;
                case 2:
                    this.updateEntities(transaction.objectStore("dashboards"))
                default:
                    break;
            }
        }

    }

    private initSchema(db: IDBDatabase) {
        db.createObjectStore('dashboards', { keyPath: 'id', autoIncrement: true });
    }

    private async updateEntities(store: IDBObjectStore) {
        type DashboardEntity = {
            metrics: Array<EnhancedMetric>;
            description: string;
            title: string;
            date: Date;
            id?: number;
        }

        type DashboardEntityFirestore = {
            entity: DashboardEntity,
            firebaseId: string | undefined,
            id: number | undefined
        }
        const allData: DashboardEntity[] = await new Promise((resolve, reject) => {
            const result = store.getAll()
            result.onerror = (event) => {
                console.error("Failed to get all dashboards", event);
                reject("Failed to get all dashboards");
            }
            result.onsuccess = () => {
                console.log("Fetched all entities");
                resolve(result.result as DashboardEntity[])
            }
        });


        const _ = await new Promise((resolve, reject) => {
            const result = store.clear()
            result.onerror = (event) => {
                console.error("Failed to clear entities", event);
                reject("Failed to clear entities");
            }
            result.onsuccess = () => {
                console.log("Cleared database");
                resolve("Done")
            }
        });

        return await Promise.all(
            allData.map((entity) => {
                const result: DashboardEntityFirestore = {
                    entity: entity,
                    firebaseId: undefined,
                    id: undefined
                };
                return result
            }).map((data) => {
                return new Promise((resolve, reject) => {
                    console.log("INSERTING", data.id);
                    const result = store.add(JSON.parse(JSON.stringify(data)));
                    result.onerror = (event) => {
                        console.error("Failed to insert", data.entity.id);
                        reject(event);
                    }
                    result.onsuccess = () => {
                        console.log("Inserted", data.entity.id);
                        resolve("OK");
                    }

                })

            }));
    }

}

export const dashboardsRepo = {
    getAllDashboards: async (db: IDBDatabase): Promise<DashboardEntityFirestore[]> => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("dashboards", "readonly");
            const objectStore = transaction.objectStore("dashboards").getAll();

            objectStore.onsuccess = () => {
                resolve(objectStore.result as DashboardEntityFirestore[]);
            };

            objectStore.onerror = (event) => {
                reject(new Error("Failed to fetch user programs: " + event.target));
            };
        });
    },


    insertDashboard: (db: IDBDatabase, data: DashboardEntityFirestore) => {
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
    },

    updateDashboard: async (db: IDBDatabase, data: DashboardEntityFirestore) => {
        const transaction = db.transaction("dashboards", "readwrite");
        await new Promise((resolve, reject) => {
            const result = transaction.objectStore("dashboards").put(JSON.parse(JSON.stringify(data)));
            result.onerror = (event) => {
                console.log("Failed to delete user program...", event);
                reject("NOT OK");
            }
            result.onsuccess = () => {
                console.log("User program deleted");
                resolve("OK")
            }
        });
    },

    getById: async (db: IDBDatabase, id: number): Promise<DashboardEntityFirestore> => {
        const transaction = db.transaction("dashboards", "readonly");
        return await new Promise((resolve, reject) => {
            const result = transaction.objectStore("dashboards").get(id)
            result.onerror = (event) => {
                console.log("Failed to delete user program...", event);
                reject("NOT OK");
            }
            result.onsuccess = () => {
                resolve(result.result as DashboardEntityFirestore);
            }
        });
    }
}
