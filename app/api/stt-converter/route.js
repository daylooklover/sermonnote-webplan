import { NextResponse } from 'next/server';
// 🚨 [필수] 설치한 Google Cloud Speech-to-Text 클라이언트 임포트
import { SpeechClient } from '@google-cloud/speech'; 

// 🚨 [필수] 클라이언트 초기화 (API 키 대신 서비스 계정 인증 파일 필요)
const speechClient = new SpeechClient(); 

/**
 * 오디오 버퍼를 Google Cloud STT 서비스에 전송하고 변환된 텍스트를 반환합니다.
 * @param {Buffer} audioBuffer - 클라이언트에서 받은 오디오 데이터 버퍼
 * @param {string} languageCode - 'ko-KR' 등 언어 코드
 * @returns {Promise<string>} 변환된 텍스트
 */
async function transcribeAudio(audioBuffer, languageCode) {
    
    // 📢 Google Cloud STT API 호출 로직으로 교체
    try {
        const audio = { 
            content: audioBuffer.toString('base64'), // Buffer를 base64 문자열로 변환
        };
        const config = {
            // 🚨 [필수 확인] 클라이언트 녹음 포맷과 샘플링 레이트를 확인하고 수정하세요.
            encoding: 'WEBM_OPUS', // 클라이언트에서 MediaRecorder로 녹음한 Blob의 인코딩 형식
            sampleRateHertz: 48000, // 클라이언트의 마이크 샘플링 레이트 (일반적으로 48000 또는 16000)
            languageCode: languageCode, 
        };
        const request = { audio: audio, config: config };

        console.log("STT API: Sending request to Google Cloud...");
        
        // Google Cloud Speech API 호출
        const [response] = await speechClient.recognize(request);
        
        // 응답에서 변환된 텍스트 추출
        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');
            
        return transcription; 
        
    } catch (error) {
        console.error('STT API Call Error (Google Speech):', error);
        // 클라이언트로 전송될 오류 메시지 설정
        throw new Error("음성-텍스트 변환 서비스 호출 중 오류가 발생했습니다. Google Cloud 인증 또는 설정 오류일 수 있습니다.");
    }
}


export async function POST(request) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio');
        const languageCode = formData.get('lang') || 'ko-KR';

        if (!audioFile || audioFile.size === 0) {
            return NextResponse.json({ message: "No audio file provided" }, { status: 400 });
        }
        
        const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

        // 3. STT 변환 서비스 호출
        const transcribedText = await transcribeAudio(audioBuffer, languageCode);
        
        if (!transcribedText) {
             return NextResponse.json({ message: "STT service failed to return text" }, { status: 500 });
        }

        // 4. 성공적인 JSON 응답 반환 (status 200)
        return NextResponse.json({ 
            text: transcribedText 
        });

    } catch (error) {
        console.error("STT Conversion API Error:", error);
        return NextResponse.json({ 
            message: "Internal Server Error during STT conversion", 
            detail: error.message 
        }, { status: 500 });
    }
}

export function GET() {
    return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}