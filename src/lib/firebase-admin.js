import admin from 'firebase-admin';

if (!admin.apps.find(app => app.name === 'sermon-admin')) {
  try {
    const saKey = process.env.SA_KEY_BASE64;
    if (saKey && saKey !== 'dummy') {
      const decodedKey = JSON.parse(Buffer.from(saKey.trim(), 'base64').toString());
      admin.initializeApp({
        credential: admin.credential.cert(decodedKey)
      }, 'sermon-admin'); // 이름을 'sermon-admin'으로 명시
      console.log("✅ Firebase Admin 초기화 성공");
    }
  } catch (error) {
    console.error("🚨 Admin 초기화 에러:", error.message);
  }
}

// 사용할 때는 해당 인스턴스 참조
const adminApp = admin.app('sermon-admin');
export const db = adminApp.firestore();