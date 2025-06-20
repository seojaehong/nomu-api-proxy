import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ServiceKey = searchParams.get('ServiceKey');
  const pageNo = searchParams.get('pageNo') || '1';
  const numOfRows = searchParams.get('numOfRows') || '10';
  const kindA = searchParams.get('kindA');
  const kindB = searchParams.get('kindB');
  const kindC = searchParams.get('kindC');
  
  if (!ServiceKey) {
    return NextResponse.json({ error: 'ServiceKey가 필요합니다' }, { status: 400 });
  }
  
  let apiUrl = `https://apis.data.go.kr/B490001/sjbPrecedentInfoService/getSjbPrecedentNaeyongPstate?ServiceKey=${ServiceKey}&pageNo=${pageNo}&numOfRows=${numOfRows}`;
  
  if (kindA) apiUrl += `&kindA=${encodeURIComponent(kindA)}`;
  if (kindB) apiUrl += `&kindB=${encodeURIComponent(kindB)}`;
  if (kindC) apiUrl += `&kindC=${encodeURIComponent(kindC)}`;
  
  try {
    const response = await fetch(apiUrl);
    const xmlText = await response.text();
    
    // 간단한 XML 파싱 방법으로 변경
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    
    const parsedItems = items.map(item => {
      const extractTag = (tagName) => {
        // CDATA 우선 시도
        const cdataMatch = item.match(new RegExp(`<${tagName}><\\!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`, 'i'));
        if (cdataMatch) return cdataMatch[1].trim();
        
        // 일반 태그 시도
        const normalMatch = item.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
        if (normalMatch) return normalMatch[1].trim();
        
        return '';
      };
      
      return {
        판례번호: extractTag('precedentNo'),
        사건명: extractTag('caseName'),
        법원명: extractTag('courtName'), 
        선고일자: extractTag('judgmentDate'),
        사건결과: extractTag('caseResult'),
        사건유형: extractTag('kindA'),
        질병구분: extractTag('kindB'),
        내용: extractTag('caseContent')
      };
    });
    
    return NextResponse.json({ 
      성공: true,
      총건수: parsedItems.length,
      판례목록: parsedItems 
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      }
    });
    
  } catch (error) {
    return NextResponse.json({ 성공: false, 오류: error.message }, { status: 500 });
  }
}
