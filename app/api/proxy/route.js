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
    return NextResponse.json({ 
      성공: false, 
      오류: 'ServiceKey가 필요합니다' 
    }, { status: 400 });
  }
  
  // API URL 구성 (올바른 방식)
  let apiUrl = `https://apis.data.go.kr/B490001/sjbPrecedentInfoService/getSjbPrecedentNaeyongPstate?ServiceKey=${ServiceKey}&pageNo=${pageNo}&numOfRows=${numOfRows}`;
  
  if (kindA ) apiUrl += `&kindA=${encodeURIComponent(kindA)}`;
  if (kindB) apiUrl += `&kindB=${encodeURIComponent(kindB)}`;
  if (kindC) apiUrl += `&kindC=${encodeURIComponent(kindC)}`;
  
  try {
    const response = await fetch(apiUrl);
    const xmlText = await response.text();
    
    // API 에러 확인
    if (xmlText.includes('<resultCode>') && !xmlText.includes('<resultCode>00</resultCode>')) {
      const errorCodeMatch = xmlText.match(/<resultCode>([^<]+)<\/resultCode>/);
      const errorMsgMatch = xmlText.match(/<resultMsg>([^<]+)<\/resultMsg>/);
      
      return NextResponse.json({
        성공: false,
        오류: 'API 에러',
        에러코드: errorCodeMatch?.[1] || '알 수 없음',
        에러메시지: errorMsgMatch?.[1] || '알 수 없음'
      }, { status: 400 });
    }
    
    // item 태그 추출
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    
    if (items.length === 0) {
      return NextResponse.json({
        성공: true,
        총건수: 0,
        메시지: '검색 조건에 맞는 판례가 없습니다',
        판례목록: []
      });
    }
    
    // 데이터 파싱
    const parsedItems = items.map((item, index) => {
      const extractTag = (tagName) => {
        const cdataMatch = item.match(new RegExp(`<${tagName}><\\!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`, 'i'));
        if (cdataMatch) return cdataMatch[1].trim();
        
        const normalMatch = item.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
        if (normalMatch) return normalMatch[1].trim();
        
        return '';
      };
      
      return {
        순번: index + 1,
        사건번호: extractTag('accnum') || '정보없음',
        법원명: extractTag('courtname') || '정보없음',
        제목: extractTag('title') || '정보없음',
        사건결과: extractTag('kinda') || '정보없음',
        사건유형: extractTag('kindb') || '정보없음',
        질병구분: extractTag('kindc') || '정보없음',
        판결문내용: extractTag('noncontent') || '정보없음'
      };
    });
    
    const totalCountMatch = xmlText.match(/<totalCount>([^<]+)<\/totalCount>/);
    const totalCount = totalCountMatch ? parseInt(totalCountMatch[1]) : parsedItems.length;
    
    return NextResponse.json({ 
      성공: true,
      타임스탬프: new Date().toISOString(),
      요청정보: {
        페이지번호: parseInt(pageNo),
        페이지당건수: parseInt(numOfRows),
        적용된필터: {
          사건결과: kindA || '전체',
          사건유형: kindB || '전체', 
          질병구분: kindC || '전체'
        }
      },
      응답정보: {
        총건수: totalCount,
        현재페이지건수: parsedItems.length,
        전체페이지수: Math.ceil(totalCount / parseInt(numOfRows))
      },
      판례목록: parsedItems
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
    
  } catch (error) {
    return NextResponse.json({ 
      성공: false, 
      오류: error.message
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
