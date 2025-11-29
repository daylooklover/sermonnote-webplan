"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
} from 'firebase/auth';
import { 
    getFirestore, collection, doc, query, orderBy, onSnapshot, addDoc, updateDoc
} from 'firebase/firestore';

// --- Global Variables (Provided by Canvas Environment) ---
// Note: Use global variables provided in the canvas environment.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

// Firestore path configuration function
const getChatCollectionPath = (userId) => {
    // Sermon drafts are stored per user (Private data)
    return `artifacts/${appId}/users/${userId}/chats`;
};

export const ChatProvider = ({ children }) => {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    
    // State for the list of all sermon drafts
    const [drafts, setDrafts] = useState([]); 
    
    const [chatHistory, setChatHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentChatId, setCurrentChatId] = useState(null);

    // 1. Firebase Initialization and Authentication
    useEffect(() => {
        const initFirebase = async () => {
            try {
                const app = initializeApp(firebaseConfig);
                const firestoreDb = getFirestore(app);
                const firebaseAuth = getAuth(app);
                
                setDb(firestoreDb);
                setAuth(firebaseAuth);

                // Sign-in anonymously or with custom token
                if (initialAuthToken) {
                    await signInWithCustomToken(firebaseAuth, initialAuthToken);
                } else {
                    await signInAnonymously(firebaseAuth);
                }

                onAuthStateChanged(firebaseAuth, (user) => {
                    if (user) {
                        setUserId(user.uid);
                    } else {
                        // For anonymous user or sign-out, generate a temporary ID
                        setUserId(crypto.randomUUID());
                    }
                    setIsAuthReady(true);
                    setIsLoading(false);
                });

            } catch (error) {
                console.error("Firebase initialization failed:", error);
                setIsLoading(false);
            }
        };

        if (Object.keys(firebaseConfig).length > 0) {
            initFirebase();
        } else {
            console.warn("Firebase config is missing. Data storage disabled.");
            setIsAuthReady(true);
            setIsLoading(false);
        }
    }, []);

    // 2. Load current chat messages (chat history)
    useEffect(() => {
        if (!isAuthReady || !userId || !db || !currentChatId) return;

        const chatDocRef = doc(db, getChatCollectionPath(userId), currentChatId);
        const messagesCollectionRef = collection(chatDocRef, 'messages');
        
        // Real-time detection of message changes in Firestore
        const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const history = snapshot.docs.map(doc => doc.data());
            setChatHistory(history);
        }, (error) => {
            console.error("Error fetching chat history:", error);
        });

        return () => unsubscribe(); // Cleanup function
    }, [isAuthReady, userId, db, currentChatId]);

    // 2.5. Load Sermon Draft List (New feature: drafts)
    useEffect(() => {
        if (!isAuthReady || !userId || !db) return;

        const draftsCollectionRef = collection(db, getChatCollectionPath(userId));
        
        // Retrieve the entire drafts list sorted by creation date
        const q = query(draftsCollectionRef, orderBy('createdAt', 'desc'));

        const unsubscribeDrafts = onSnapshot(q, (snapshot) => {
            const draftsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDrafts(draftsList);
        }, (error) => {
            console.error("Error fetching sermon drafts list:", error);
        });

        return () => unsubscribeDrafts(); // Cleanup function
    }, [isAuthReady, userId, db]);


    // 3. Start a new chat or load existing chat
    const startNewChat = async () => {
        if (!db || !userId) return;
        setIsLoading(true);
        
        // Create a new chat document (which appears in the drafts list)
        const newChatRef = await addDoc(collection(db, getChatCollectionPath(userId)), {
            createdAt: new Date(),
            updatedAt: new Date(), // Added
            title: "새 설교 초안", // Initial title
            userId: userId,
        });
        setCurrentChatId(newChatRef.id);
        setChatHistory([]); // Clear history for the new chat
        setIsLoading(false);
        return newChatRef.id;
    };

    // 4. Save message (both user and AI)
    const saveMessage = async (role, content, chatId) => {
        if (!db || !userId || !chatId) return;
        
        const chatDocRef = doc(db, getChatCollectionPath(userId), chatId);
        const messagesCollectionRef = collection(chatDocRef, 'messages');

        // Add new message to Firestore
        await addDoc(messagesCollectionRef, {
            role, // 'user' or 'model'
            content,
            timestamp: new Date(),
        });
        
        // Update 'updatedAt' of the sermon draft document whenever a message is added
        await updateDoc(chatDocRef, {
            updatedAt: new Date(),
        });
    };
    
    // Function to update the sermon title
    const updateSermonTitle = async (chatId, newTitle) => {
        if (!db || !userId || !chatId || !newTitle) return;
        
        try {
            const chatDocRef = doc(db, getChatCollectionPath(userId), chatId);
            await updateDoc(chatDocRef, {
                title: newTitle,
                updatedAt: new Date(),
            });
            // The drafts state is automatically updated by onSnapshot.
        } catch (error) {
            console.error("Error updating sermon title:", error);
        }
    };
    
    // 5. Prepare history object for the server (Gemini API format)
    const getGeminiHistory = () => {
        return chatHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant', // Will be converted to 'model' in the Next.js API route
            content: msg.content,
        }));
    };

    // 6. Set current chat ID (to load existing chat)
    const loadChat = (chatId) => {
        setCurrentChatId(chatId);
    };

    const contextValue = {
        userId,
        isAuthReady,
        isLoading,
        chatHistory,
        currentChatId,
        drafts, // Sermon draft list
        startNewChat,
        saveMessage,
        loadChat,
        getGeminiHistory,
        updateSermonTitle, // Title update function
    };

    return (
        <ChatContext.Provider value={contextValue}>
            {children}
        </ChatContext.Provider>
    );
};