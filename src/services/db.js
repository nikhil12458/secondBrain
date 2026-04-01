import { db, storage } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, updateDoc, getDoc, writeBatch, documentId, onSnapshot, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { generateTagsAndSummary, generateEmbeddings } from './ai';

const ensureString = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return Object.values(val).map(v => typeof v === 'string' ? v : JSON.stringify(v)).join('\n\n');
  }
  return String(val);
};

const formatItem = (doc) => {
  const data = doc.data();
  
  // Ensure tags is an array of strings
  let safeTags = [];
  if (Array.isArray(data.tags)) {
    safeTags = data.tags.map(t => typeof t === 'string' ? t : JSON.stringify(t));
  }

  return {
    id: doc.id,
    ...data,
    title: ensureString(data.title),
    summary: ensureString(data.summary),
    explanation: ensureString(data.explanation),
    content: ensureString(data.content),
    type: ensureString(data.type),
    url: data.url ? ensureString(data.url) : undefined,
    tags: safeTags
  };
};

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
    const items = snapshot.docs.map(formatItem);
    callback(items);
  }, (error) => {
    console.error("Error subscribing to items:", error);
  });
}

export function subscribeToCollections(userId, callback) {
  const q = query(collection(db, 'collections'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const collections = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        name: ensureString(data.name),
        description: ensureString(data.description)
      };
    });
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
    items = snapshot.docs.map(formatItem);
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
  const aiData = await generateTagsAndSummary(data.content || '', data.type || 'note', data.title || '', data.url || '');
  
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

      // Auto-collection logic
      const collectionsQ = query(collection(db, 'collections'), where('userId', '==', userId));
      const collectionsSnap = await getDocs(collectionsQ);
      const existingCollections = collectionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      for (const tag of aiData.tags) {
        const itemsWithTag = allDocs.docs.filter(d => {
          const docTags = d.data().tags || [];
          return docTags.includes(tag);
        });

        // Add the new item to the count
        const allItemsWithTag = [...itemsWithTag.map(d => d.id), docRef.id];
        const uniqueItemIds = [...new Set(allItemsWithTag)];

        // If we have 2 or more items with this tag, group them
        if (uniqueItemIds.length >= 2) {
          const existingCol = existingCollections.find(c => c.name.toLowerCase() === tag.toLowerCase());
          
          if (existingCol) {
            // Add new item to existing collection if not already there
            if (!existingCol.itemIds.includes(docRef.id)) {
              await updateDoc(doc(db, 'collections', existingCol.id), {
                itemIds: arrayUnion(docRef.id)
              });
            }
          } else {
            // Create new auto-collection
            const newColRef = await addDoc(collection(db, 'collections'), {
              userId,
              name: tag.charAt(0).toUpperCase() + tag.slice(1),
              description: `Auto-generated collection for items related to ${tag}.`,
              itemIds: uniqueItemIds,
              isPublic: false,
              isAutoGenerated: true,
              createdAt: serverTimestamp()
            });
            
            existingCollections.push({
              id: newColRef.id,
              name: tag,
              itemIds: uniqueItemIds
            });
          }
        }
      }
    } catch (err) {
      console.warn('Could not create relations or auto-collections:', err);
    }
  }

  return docRef.id;
}

export async function getItems(userId) {
  const q = query(collection(db, 'items'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(formatItem);
}

export async function getGraphData(userId) {
  const itemsQ = query(collection(db, 'items'), where('userId', '==', userId));
  const relationsQ = query(collection(db, 'relations'), where('userId', '==', userId));
  
  const [itemsSnap, relationsSnap] = await Promise.all([getDocs(itemsQ), getDocs(relationsQ)]);
  
  const nodes = itemsSnap.docs.map(doc => {
    const data = doc.data();
    return { id: doc.id, name: ensureString(data.title), val: 1, group: ensureString(data.type) };
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
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      name: ensureString(data.name),
      description: ensureString(data.description)
    };
  });
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
  
  const itemIds = collSnap.data().itemIds || [];
  
  // Chunk into batches of 400 to be safe (limit is 500)
  const chunkSize = 400;
  for (let i = 0; i < itemIds.length; i += chunkSize) {
    const batch = writeBatch(db);
    if (i === 0) {
      batch.update(collRef, { isPublic });
    }
    
    const chunk = itemIds.slice(i, i + chunkSize);
    for (const itemId of chunk) {
      batch.update(doc(db, 'items', itemId), { isPublic });
    }
    
    await batch.commit();
  }
  
  // If there were no items, we still need to update the collection
  if (itemIds.length === 0) {
    const batch = writeBatch(db);
    batch.update(collRef, { isPublic });
    await batch.commit();
  }
}

export async function toggleItemPublic(itemId, isPublic) {
  const itemRef = doc(db, 'items', itemId);
  await updateDoc(itemRef, { isPublic });
}

export async function getItem(itemId) {
  const { doc, getDoc } = await import('firebase/firestore');
  const docSnap = await getDoc(doc(db, 'items', itemId));
  if (docSnap.exists()) {
    return formatItem(docSnap);
  }
  throw new Error('Item not found');
}

export async function updateItem(itemId, data) {
  const { doc, updateDoc } = await import('firebase/firestore');
  const itemRef = doc(db, 'items', itemId);
  
  // If content or title changed, we might want to regenerate embeddings/tags, 
  // but for simplicity we'll just update the provided fields.
  await updateDoc(itemRef, data);
}

export async function deleteItem(itemId) {
  const { doc, deleteDoc, query, collection, where, getDocs, writeBatch } = await import('firebase/firestore');
  
  // Delete the item itself
  await deleteDoc(doc(db, 'items', itemId));
  
  // Delete related relations
  const batch = writeBatch(db);
  
  const sourceRelationsQ = query(collection(db, 'relations'), where('sourceItemId', '==', itemId));
  const sourceRelationsSnap = await getDocs(sourceRelationsQ);
  sourceRelationsSnap.forEach(doc => batch.delete(doc.ref));
  
  const targetRelationsQ = query(collection(db, 'relations'), where('targetItemId', '==', itemId));
  const targetRelationsSnap = await getDocs(targetRelationsQ);
  targetRelationsSnap.forEach(doc => batch.delete(doc.ref));
  
  await batch.commit();
}

export async function getPublicCollection(collectionId) {
  const { doc, getDoc, query, collection, where, documentId, getDocs } = await import('firebase/firestore');
  const collectionSnap = await getDoc(doc(db, 'collections', collectionId));
  
  if (!collectionSnap.exists() || !collectionSnap.data().isPublic) {
    throw new Error('Collection not found or not public');
  }
  
  const data = collectionSnap.data();
  const collectionData = { 
    id: collectionSnap.id, 
    ...data,
    name: ensureString(data.name),
    description: ensureString(data.description)
  };
  
  let items = [];
  if (collectionData.itemIds && collectionData.itemIds.length > 0) {
    const itemIds = collectionData.itemIds;
    const chunkSize = 10;
    
    for (let i = 0; i < itemIds.length; i += chunkSize) {
      const chunk = itemIds.slice(i, i + chunkSize);
      const itemsQ = query(collection(db, 'items'), where(documentId(), 'in', chunk));
      const itemsSnap = await getDocs(itemsQ);
      const chunkItems = itemsSnap.docs.map(formatItem);
      items = [...items, ...chunkItems];
    }
  }
  
  return { collection: collectionData, items };
}

// --- Admin Functions ---

export async function getAnalytics() {
  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'analytics', 'visitors'));
  return snap.exists() ? snap.data() : { count: 0 };
}

export async function getUsers() {
  const { collection, getDocs } = await import('firebase/firestore');
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateUserRole(userId, role) {
  const { doc, updateDoc } = await import('firebase/firestore');
  await updateDoc(doc(db, 'users', userId), { role });
}

export async function updateUserPermissions(userId, permissions) {
  const { doc, updateDoc } = await import('firebase/firestore');
  await updateDoc(doc(db, 'users', userId), { permissions });
}

export async function updateUserDisabledFeatures(userId, disabledFeatures) {
  const { doc, updateDoc } = await import('firebase/firestore');
  await updateDoc(doc(db, 'users', userId), { disabledFeatures });
}

export async function deleteUserDocument(userId) {
  const { doc, deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'users', userId));
}

export async function getSettings() {
  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'settings', 'global'));
  return snap.exists() ? snap.data() : { features: {} };
}

export async function updateSettings(settings) {
  const { doc, setDoc } = await import('firebase/firestore');
  await setDoc(doc(db, 'settings', 'global'), settings, { merge: true });
}

export function subscribeToSettings(callback) {
  return onSnapshot(doc(db, 'settings', 'global'), (doc) => {
    callback(doc.exists() ? doc.data() : { features: {} });
  });
}

// --- Chat History Functions ---

export async function saveChatHistory(userId, messages) {
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  await setDoc(doc(db, 'chatHistory', userId), {
    messages,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function loadChatHistory(userId) {
  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'chatHistory', userId));
  return snap.exists() ? snap.data().messages : [];
}
