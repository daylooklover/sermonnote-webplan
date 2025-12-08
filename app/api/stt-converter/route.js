import { NextResponse } from 'next/server';
// 🚨 [필수] 설치한 Google Cloud Speech-to-Text 클라이언트 임포트
import { SpeechClient } from '@google-cloud/speech'; 

// 🚨 [필수] 클라이언트 초기화 (서비스 계정 JSON 파일을 환경 변수를 통해 자동 인증)
const speechClient = new SpeechClient(); 

/**
 * 오디오 버퍼를 Google Cloud STT 서비스에 전송하고 변환된 텍스트를 반환합니다.
 * * @param {Buffer} audioBuffer - 클라이언트에서 받은 오디오 데이터 버퍼
 * @param {string} languageCode - 'ko-KR' 등 언어 코드
 * @returns {Promise<string>} 변환된 텍스트
 */
async function transcribeAudio(audioBuffer, languageCode) {
    
    // Base64로 인코딩된 오디오 데이터는 최대 1분까지 인식 가능합니다.
    try {
        const audio = { 
            // Buffer를 Base64 문자열로 변환하여 API로 전송
            content: audioBuffer.toString('base64'), 
        };
        const config = {
            // 🚨 [핵심 수정/확인] 클라이언트(MediaRecorder)에서 녹음한 포맷과 정확히 일치해야 합니다.
            // 웹 브라우저 MediaRecorder의 일반적인 기본값: WEBM_OPUS, 48000Hz
            encoding: 'WEBM_OPUS', 
            sampleRateHertz: 48000, 
            languageCode: languageCode, 
        };
        const request = { audio: audio, config: config };

        console.log(`STT API: Sending request to Google Cloud with lang: ${languageCode}, encoding: ${config.encoding}, sampleRate: ${config.sampleRateHertz}Hz...`);
        
        // Google Cloud Speech API 호출
        const [response] = await speechClient.recognize(request);
        
        // 응답에서 변환된 텍스트 추출
        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');
            
        return transcription; 
        
    } catch (error) {
        console.error('STT API Call Error (Google Speech):', error);
        // Google STT API에서 발생한 구체적인 오류를 서버 콘솔에 기록하고, 클라이언트에게 오류 메시지를 던집니다.
        throw new Error(`STT 서비스 호출 오류: ${error.message || "Google Cloud 인증 또는 설정 오류"} - Encoding/SampleRate를 확인하세요.`);
    }
}


export async function POST(request) {
    try {
        const formData = await request.formData();
        
        // Next.js FormData의 Blob/File 객체를 가져옵니다.
        const audioFile = formData.get('audio');
        const languageCode = formData.get('lang') || 'ko-KR'; // 기본값을 ko-KR로 설정

        if (!audioFile || audioFile.size === 0) {
            return NextResponse.json({ message: "오디오 파일이 제공되지 않았거나 비어 있습니다." }, { status: 400 });
        }
        
        // Blob/File 객체를 Buffer로 변환
        const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

        // 3. STT 변환 서비스 호출
        const transcribedText = await transcribeAudio(audioBuffer, languageCode);
        
        if (!transcribedText || transcribedText.length === 0) {
             // 500 오류가 아닌 200 성공 코드와 함께, 텍스트가 없다는 명확한 메시지를 반환합니다.
             // Google Cloud는 인식에 실패하면 빈 결과를 반환할 수 있습니다.
             return NextResponse.json({ 
                 text: "", 
                 message: "음성이 인식되지 않았거나 STT 서비스가 텍스트를 반환하지 않았습니다." 
             }, { status: 200 }); 
        }

        // 4. 성공적인 JSON 응답 반환 (status 200)
        return NextResponse.json({ 
            text: transcribedText 
        });

    } catch (error) {
        // transcribeAudio에서 던진 상세 오류를 포함하여 500 응답을 반환
        console.error("STT Conversion API Global Error:", error);
        return NextResponse.json({ 
            message: "STT 변환 중 내부 서버 오류 발생", 
            detail: error.message || "알 수 없는 오류"
        }, { status: 500 });
    }
}

export function GET() {
    return NextResponse.json({ message: "Method not allowed (POST만 허용)" }, { status: 405 });
}