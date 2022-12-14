
import { getFirestore, updateDoc } from "firebase/firestore";
import { collection, addDoc, getDocs, deleteDoc, query, where, orderBy, limit, onSnapshot, doc} from "firebase/firestore"; 
import { initializeApp } from 'firebase/app'
import { firebaseConfig } from "../plugins/firebase_config";
import { Version } from "./Version";

export class FireStoreDb {
    app;
    db;

    constructor() {        
        this.app = initializeApp(firebaseConfig);
        this.db = getFirestore(this.app);
    }

    save = async (version: Version) => {
        try {
            const doc = await this.fetch(version.Number, version.CodeBase);
            if (doc != null) {
                await updateDoc(doc, JSON.parse(JSON.stringify(version)));       
            }
            else {
                await addDoc(collection(this.db, "versions"), JSON.parse(JSON.stringify(version)));                
            }
        }
        catch (e) {
            console.error("Error saving document: ", e);
        }       
    }

    saveAll = async (versions: Array<Version>) => {         
        versions.forEach( async (version) => {
            this.save(version);
        })               
    }

    delete = async (version: Version) => {        
        try {
            const doc = await this.fetch(version.Number, version.CodeBase);
            if (doc != null) {
                await deleteDoc(doc);       
            }
        }
        catch (e) {
            console.error("Error deleting document: ", e);
        }    
    } 

    fetch = async(versionNumber, codeBase) => {
        // Create a reference to the cities collection        
        const docRef = collection(this.db, "versions");

        // Create a query against the collection.
        const q = query(docRef, where("Number", "==", versionNumber), where("CodeBase", "==", codeBase));
        
        const querySnapshot = await getDocs(q);  
        if (querySnapshot.empty) {
            return null;
        }
        else {
            return querySnapshot.docs[0].ref;
        }
    }

    fetchAll = async() => {
        var versions = new Array<Version>();

        const docRef = collection(this.db, "versions");
        const q = query(docRef, orderBy("Number", "desc"), limit(25));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            versions.push(doc.data() as Version);
        });

        return versions;
    }

    subscribeToUpdates = async() => {         
        const docRef = collection(this.db, "versions");
        const q = query(docRef, orderBy("Number", "desc"));
            
        const unsubscribe = onSnapshot(q, (querySnapshot) => {            
            document.dispatchEvent(new CustomEvent('JcvVersionsUpdated'));
        });
    }
}