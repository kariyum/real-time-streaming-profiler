import type { DashboardEntityFirestore } from './firebase';
import type { EnhancedMetric } from './types';

export type DashboardEntity = {
	metrics: Array<EnhancedMetric>;
	description: string;
	title: string;
	date: Date;
};

export class Database {
	private static instance: Database;
	db: IDBDatabase | undefined;

	private constructor(resolve: (db: Database) => void) {
		const DBOpenRequest: IDBOpenDBRequest = indexedDB.open('metrics', 2);
		DBOpenRequest.onerror = (event) => {
			console.error('DBOpenRequest.onerror', event);
		};

		DBOpenRequest.onsuccess = (event) => {
			this.db = DBOpenRequest.result;
			console.log('resolved');
			resolve(this);
		};

		DBOpenRequest.onupgradeneeded = (event: IDBVersionChangeEvent) => {
			this.db = DBOpenRequest.result;
			const upgradeTransaction = DBOpenRequest.transaction;
			this.db.onerror = (event) => {
				console.log('Error loading database.');
			};
			if (upgradeTransaction) {
				this.migrate(
					DBOpenRequest.result,
					upgradeTransaction,
					event.oldVersion,
					event.newVersion ?? undefined
				);
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
		});
	}

	private migrate(
		db: IDBDatabase,
		transaction: IDBTransaction,
		oldVersion: number,
		newVersion?: number
	) {
		console.log('old version = ', oldVersion);
		console.log('new version = ', newVersion);
		for (let start = oldVersion + 1; start <= (newVersion ?? oldVersion); start++) {
			switch (start) {
				case 1:
					this.initSchema(db);
					break;
				case 2:
					this.wrapEntitiesInUpgrade(transaction.objectStore('dashboards'));
				default:
					break;
			}
		}
	}

	private wrapEntitiesInUpgrade(store: IDBObjectStore) {
		const cursorRequest = store.openCursor();
		cursorRequest.onsuccess = () => {
			const cursor = cursorRequest.result;
			if (cursor) {
				const value = cursor.value;
				if (!value.entity) {
					cursor.update({
						entity: {
							metrics: value.metrics,
							description: value.description,
							title: value.title,
							date: value.date
						},
						firebaseId: value.firebaseId,
						id: value.id
					});
				}
				cursor.continue();
			}
		};
	}

	private initSchema(db: IDBDatabase) {
		db.createObjectStore('dashboards', { keyPath: 'id', autoIncrement: true });
	}

}

export const dashboardsRepo = {
	getAllDashboards: async (db: IDBDatabase): Promise<DashboardEntityFirestore[]> => {
		return new Promise((resolve, reject) => {
			const transaction = db.transaction('dashboards', 'readonly');
			const objectStore = transaction.objectStore('dashboards').getAll();

			objectStore.onsuccess = () => {
				const result = objectStore.result as any[];
				const normalized = result.map((item) => {
					if (item.entity) return item as DashboardEntityFirestore;
					return {
						entity: {
							metrics: item.metrics,
							description: item.description,
							title: item.title,
							date: item.date
						},
						firebaseId: item.firebaseId,
						id: item.id
					} as DashboardEntityFirestore;
				});
				resolve(normalized);
			};

			objectStore.onerror = (event) => {
				reject(new Error('Failed to fetch user programs: ' + event.target));
			};
		});
	},

	insertDashboard: (db: IDBDatabase, data: DashboardEntityFirestore) => {
		return new Promise((resolve, reject) => {
			console.log('INSERTING', JSON.parse(JSON.stringify(data)));
			const transaction = db.transaction('dashboards', 'readwrite');
			const result = transaction.objectStore('dashboards').put(JSON.parse(JSON.stringify(data)));
			result.onerror = (event) => {
				console.log('Failed to insert user program...', event.target);
				reject(event);
			};
			result.onsuccess = () => {
				// console.log("User program inserted", event?.target.result);
				resolve('OK');
			};
		});
	},

	deleteDashboard: (db: IDBDatabase, id: number) => {
		return new Promise((resolve, reject) => {
			const transaction = db.transaction('dashboards', 'readwrite');
			const result = transaction.objectStore('dashboards').delete(id);
			result.onerror = (event) => {
				console.log('Failed to delete user program...', event);
				reject('NOT OK');
			};
			result.onsuccess = () => {
				console.log('User program deleted');
				resolve('OK');
			};
		});
	},

	updateDashboard: async (db: IDBDatabase, data: DashboardEntityFirestore) => {
		const transaction = db.transaction('dashboards', 'readwrite');
		await new Promise((resolve, reject) => {
			const result = transaction.objectStore('dashboards').put(JSON.parse(JSON.stringify(data)));
			result.onerror = (event) => {
				console.log('Failed to delete user program...', event);
				reject('NOT OK');
			};
			result.onsuccess = () => {
				console.log('User program deleted');
				resolve('OK');
			};
		});
	},

	getById: async (db: IDBDatabase, id: number): Promise<DashboardEntityFirestore> => {
		const transaction = db.transaction('dashboards', 'readonly');
		return await new Promise((resolve, reject) => {
			const result = transaction.objectStore('dashboards').get(id);
			result.onerror = (event) => {
				console.log('Failed to delete user program...', event);
				reject('NOT OK');
			};
			result.onsuccess = () => {
				const item = result.result as any;
				if (item.entity) {
					resolve(item as DashboardEntityFirestore);
				} else {
					resolve({
						entity: {
							metrics: item.metrics,
							description: item.description,
							title: item.title,
							date: item.date
						},
						firebaseId: item.firebaseId,
						id: item.id
					} as DashboardEntityFirestore);
				}
			};
		});
	}
};
