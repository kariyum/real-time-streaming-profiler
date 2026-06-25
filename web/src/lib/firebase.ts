// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
    deleteDoc
} from 'firebase/firestore/lite';
import { getAnalytics } from 'firebase/analytics';
import type { DashboardEntity } from './db';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export type DashboardEntityFirestore = {
    entity: DashboardEntity;
    firebaseId: string | undefined;
    id: number | undefined;
};

export const dashboardsRepoFirebase = {
    readById: async (id: string): Promise<DashboardEntity | undefined> => {
        const docRef = doc(db, 'dashboards', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                ...data,
                date: new Date(data.date)
            } as DashboardEntity;
        }
    },

    add: async (dashboard: DashboardEntity): Promise<string> => {
        const data = {
            ...dashboard,
            date: dashboard.date instanceof Date ? dashboard.date.toISOString() : String(dashboard.date)
        };
        const docRef = await addDoc(collection(db, 'dashboards'), data);
        return docRef.id;
    },

    readAll: async (): Promise<DashboardEntityFirestore[]> => {
        const querySnapshot = await getDocs(collection(db, 'dashboards'));
        return querySnapshot.docs.map((doc) => {
            const data = doc.data();
            const date = data.date?.toDate
                ? data.date.toDate()
                : new Date(data.date);
            const entity = {
                ...data,
                date
            } as DashboardEntity;
            return {
                entity,
                firebaseId: doc.id,
                id: undefined
            };
        });
    },
    delete: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, 'dashboards', id);
            await deleteDoc(docRef);
            console.log('Deleted from firebase');
            return;
        } catch (error) {
            console.error('Error deleting document from firestore ', id);
        }
    }
};
