// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, deleteDoc } from 'firebase/firestore/lite';
import { getAnalytics } from "firebase/analytics";
import type { DashboardEntity } from "./db";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCSbtjaXomtofg-iLn23Gtihisxm7atkQg",
    authDomain: "insight-e7dff.firebaseapp.com",
    projectId: "insight-e7dff",
    storageBucket: "insight-e7dff.firebasestorage.app",
    messagingSenderId: "212475143212",
    appId: "1:212475143212:web:019a5c6917de6362f19d89",
    measurementId: "G-XGKDN5RLTE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app)

export type DashboardEntityFirestore = {
    entity: DashboardEntity,
    firebaseId: string | undefined,
    id: number | undefined
}

export const dashboardsRepoFirebase = {
    readById: async (id: string): Promise<DashboardEntity | undefined> => {
        const docRef = doc(db, "dashboards", id);
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
            return docSnap.data() as DashboardEntity
        }
    },

    add: async (dashboard: DashboardEntity): Promise<string> => {
        const docRef = await addDoc(collection(db, "dashboards"), dashboard);
        return docRef.id
    },

    readAll: async (): Promise<DashboardEntityFirestore[]> => {
        const querySnapshot = await getDocs(collection(db, "dashboards"));
        return querySnapshot
            .docs
            .map((doc) => {
                const res: DashboardEntityFirestore = {
                    entity: doc.data() as DashboardEntity,
                    firebaseId: doc.id,
                    id: undefined
                }
                return res
            })
    },
    delete: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, "dashboards", id);
            await deleteDoc(docRef)
            console.log("Deleted from firebase")
            return
        } catch (error) {
            console.error("Error deleting document from firestore ", id);
        }
    },
}
