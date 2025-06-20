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
      오류: 'ServiceKey가 필요합니다',
      사용법: '?ServiceKey=YOUR_KEY&pageNo=1&numOfRows=10'
    }, { status: 400 });
  }
  
  let apiUrl = `https://apis.data.go.kr/B490001/sjbPrecedentInfoService/getSjbPrecedentNaeyongPstate?ServiceKey=${cGnyjDsjAqd6Bb1Q8GIvLq2b0NCzxq9x2zk8LsuqlJYN7QK6d4G3S7LhXylldwNKFYvz1SRT/WjCutEL4wa/MQ==}&pageNo=${pageNo}&numOfRows=${numOfRows}`;
  
  if (kindA) apiUrl += `&kindA=${encodeURIComponent(kindA)}`;
  if (kindB) apiUrl += `&kindB=${encodeURIComponent(kindB)}`;
  if (kindC) apiUrl += `&kindC=${encodeURIComponent(kindC)}`;
  
  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    
    // API 에러 응답 확인
    if (xmlText.includes('<resultCode>') && !xmlText.includes('<resultCode>00</resultCode>')) {
      const errorCodeMatch = xmlText.match(/<resultCode>([^<]+)<\/resultCode>/);
      const errorMsgMatch = xmlText.match(/<resultMsg>([^<]+)<\/resultMsg>/);
      
      return NextResponse.json({
        성공: false,
        오류: `API 에러 - 코드: ${errorCodeMatch?.[1] || '알 수 없음'}, 메시지: ${errorMsgMatch?.[1] || '알 수 없음'}`
      }, { status: 400 });
    }
    
    // item 태그 추출
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    
    if (items.length === 0) {
      return NextResponse.json({
        성공: true,
        총건수: 0,
        메시지: '검색 결과가 없습니다',
        판례목록: []
      });
    }
    
    const parsedItems = items.map((item, index) => {
      const extractTag = (tagName) => {
        try {
          // CDATA 우선 시도
          const cdataMatch = item.match(new RegExp(`<${tagName}><\\!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`, 'i'));
          if (cdataMatch) return cdataMatch[1].trim();
          
          // 일반 태그 시도
          const normalMatch = item.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
          if (normalMatch) return normalMatch[1].trim();
          
          return '';
        } catch (error) {
          console.error(`태그 추출 오류 (${tagName}):`, error);
          return '';
        }
      };
      
      // 실제 API 응답 구조에 맞춘 태그명 사용
      const parsedItem = {
        순번: index + 1,
        사건번호: extractTag('accnum'),
        법원명: extractTag('courtname'),
        제목: extractTag('title'),
        사건결과A: extractTag('kinda'),
        사건유형B: extractTag('kindb'),
        질병구분C: extractTag('kindc'),
        판결문내용: extractTag('noncontent')
      };
      
      // 빈 값 정리
      Object.keys(parsedItem).forEach(key => {
        if (parsedItem[key] === '' || parsedItem[key] === null || parsedItem[key] === undefined) {
          parsedItem[key] = '정보없음';
        }
      });
      
      return parsedItem;
    });
    
    // 전체 건수 추출 (totalCount 태그에서)
    const totalCountMatch = xmlText.match(/<totalCount>([^<]+)<\/totalCount>/);
    const totalCount = totalCountMatch ? parseInt(totalCountMatch[1]) : parsedItems.length;
    
    return NextResponse.json({ 
      성공: true,
      요청정보: {
        페이지번호: parseInt(pageNo),
        페이지당건수: parseInt(numOfRows),
        필터: {
          사건결과A: kindA || '전체',
          사건유형B: kindB || '전체', 
          질병구분C: kindC || '전체'
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
    console.error('API 처리 오류:', error);
    
    return NextResponse.json({ 
      성공: false, 
      오류: error.message,
      디버그정보: {
        요청URL: apiUrl,
        타임스탬프: new Date().toISOString()
      }
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  }
}

// OPTIONS 메서드 처리 (CORS preflight)
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

