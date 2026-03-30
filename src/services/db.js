import { db, storage } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, updateDoc, getDoc, writeBatch, documentId, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { generateTagsAndSummary, generateEmbeddings } from './ai';

export async function uploadImage(file, userId) {
  if (!file) return null;
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const storageRef = ref(storage, `images/${fileName}`);
  
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

export function subscribeToItems(userId, callback) {
  const q = query(collection(db, 'items'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(items);
  }, (error) => {
    console.error("Error subscribing to items:", error);
  });
}

export function subscribeToCollections(userId, callback) {
  const q = query(collection(db, 'collections'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const collections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(collections);
  }, (error) => {
    console.error("Error subscribing to collections:", error);
  });
}

export function subscribeToGraphData(userId, callback) {
  const itemsQ = query(collection(db, 'items'), where('userId', '==', userId));
  const relationsQ = query(collection(db, 'relations'), where('userId', '==', userId));
  
  let items = [];
  let relations = [];
  let itemsLoaded = false;
  let relationsLoaded = false;
  
  const updateGraph = () => {
    if (!itemsLoaded || !relationsLoaded) return;
    const nodes = items.map(item => ({ id: item.id, name: item.title, val: 1, group: item.type }));
    const links = relations.map(rel => ({ source: rel.sourceItemId, target: rel.targetItemId }));
    callback({ nodes, links });
  };

  const unsubItems = onSnapshot(itemsQ, (snapshot) => {
    items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    itemsLoaded = true;
    updateGraph();
  });

  const unsubRelations = onSnapshot(relationsQ, (snapshot) => {
    relations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    relationsLoaded = true;
    updateGraph();
  });

  return () => {
    unsubItems();
    unsubRelations();
  };
}

export async function saveItem(userId, data) {
  const aiData = await generateTagsAndSummary(data.content || '', data.type || 'note', data.title || '');
  
  const embeddingText = `${data.title} ${data.content} ${aiData.tags.join(' ')} ${aiData.summary} ${aiData.explanation}`;
  const embedding = await generateEmbeddings(embeddingText);

  const itemData = {
    ...data,
    userId,
    tags: aiData.tags,
    summary: aiData.summary,
    explanation: aiData.explanation,
    embedding,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'items'), itemData);
  
  if (aiData.tags && aiData.tags.length > 0) {
    try {
      const q = query(
        collection(db, 'items'), 
        where('userId', '==', userId)
      );
      const allDocs = await getDocs(q);
      
      const similarDocs = allDocs.docs.filter(d => {
        const docTags = d.data().tags || [];
        return docTags.some(t => aiData.tags.includes(t));
      });
      
      for (const similarDoc of similarDocs) {
        if (similarDoc.id !== docRef.id) {
          await addDoc(collection(db, 'relations'), {
            userId,
            sourceItemId: docRef.id,
            targetItemId: similarDoc.id,
            type: 'similar',
            weight: 1,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (err) {
      console.warn('Could not create relations:', err);
    }
  }

  return docRef.id;
}

export async function getItems(userId) {
  const q = query(collection(db, 'items'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getGraphData(userId) {
  const itemsQ = query(collection(db, 'items'), where('userId', '==', userId));
  const relationsQ = query(collection(db, 'relations'), where('userId', '==', userId));
  
  const [itemsSnap, relationsSnap] = await Promise.all([getDocs(itemsQ), getDocs(relationsQ)]);
  
  const nodes = itemsSnap.docs.map(doc => {
    const data = doc.data();
    return { id: doc.id, name: data.title, val: 1, group: data.type };
  });
  
  const links = relationsSnap.docs.map(doc => {
    const data = doc.data();
    return { source: data.sourceItemId, target: data.targetItemId };
  });
  
  return { nodes, links };
}

export async function getCollections(userId) {
  const q = query(collection(db, 'collections'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createCollection(userId, name, description) {
  const docRef = await addDoc(collection(db, 'collections'), {
    userId,
    name,
    description,
    itemIds: [],
    isPublic: false,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function addItemToCollection(collectionId, itemId) {
  const { doc, updateDoc, arrayUnion, getDoc } = await import('firebase/firestore');
  const collRef = doc(db, 'collections', collectionId);
  
  // Add item to collection
  await updateDoc(collRef, {
    itemIds: arrayUnion(itemId)
  });
  
  // If collection is public, make item public too
  const collSnap = await getDoc(collRef);
  if (collSnap.exists() && collSnap.data().isPublic) {
    await updateDoc(doc(db, 'items', itemId), { isPublic: true });
  }
}

export async function toggleCollectionPublic(collectionId, isPublic) {
  // Update the collection
  const collRef = doc(db, 'collections', collectionId);
  const collSnap = await getDoc(collRef);
  
  if (!collSnap.exists()) return;
  
  const batch = writeBatch(db);
  batch.update(collRef, { isPublic });
  
  // Update all items in the collection
  const itemIds = collSnap.data().itemIds || [];
  for (const itemId of itemIds) {
    batch.update(doc(db, 'items', itemId), { isPublic });
  }
  
  await batch.commit();
}

export async function getPublicCollection(collectionId) {
  const collectionSnap = await getDoc(doc(db, 'collections', collectionId));
  
  if (!collectionSnap.exists() || !collectionSnap.data().isPublic) {
    throw new Error('Collection not found or not public');
  }
  
  const collectionData = { id: collectionSnap.id, ...collectionSnap.data() };
  
  let items = [];
  if (collectionData.itemIds && collectionData.itemIds.length > 0) {
    // Note: 'in' queries are limited to 10 items. For a real app, chunking is needed.
    // For this prototype, we'll just fetch the first 10.
    const itemIds = collectionData.itemIds.slice(0, 10);
    const itemsQ = query(collection(db, 'items'), where(documentId(), 'in', itemIds));
    const itemsSnap = await getDocs(itemsQ);
    items = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  
  return { collection: collectionData, items };
}
