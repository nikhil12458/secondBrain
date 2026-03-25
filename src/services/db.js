import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { generateTagsAndSummary, generateEmbeddings } from './ai';

export async function saveItem(userId, data) {
  const aiData = await generateTagsAndSummary(data.content || '', data.type || 'note', data.title || '');
  
  const embeddingText = `${data.title} ${data.content} ${aiData.tags.join(' ')} ${aiData.summary}`;
  const embedding = await generateEmbeddings(embeddingText);

  const itemData = {
    ...data,
    userId,
    tags: aiData.tags,
    summary: aiData.summary,
    embedding,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'items'), itemData);
  
  if (aiData.tags.length > 0) {
    const q = query(
      collection(db, 'items'), 
      where('userId', '==', userId),
      where('tags', 'array-contains-any', aiData.tags)
    );
    const similarDocs = await getDocs(q);
    
    for (const similarDoc of similarDocs.docs) {
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
