import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ServiceKey = searchParams.get('ServiceKey');
  const pageNo = searchParams.get('pageNo') || '1';
  const numOfRows = searchParams.get('numOfRows') || '10';
  const kindA = searchParams.get('kindA');
  const kindB = searchParams.get('kindB');
  const kindC = searchParams.get('kindC');
  
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
  };
  
  if (!ServiceKey) {
    return NextResponse.json({ 
      성공: false, 
      오류: 'ServiceKey가 필요합니다',
      사용법: {
        기본: '?ServiceKey=YOUR_KEY&pageNo=1&numOfRows=10',
        필터링: '?ServiceKey=YOUR_KEY&kindA=기각&kindB=요양'
      }
    }, { status: 400, headers });
  }
  
  // API URL 구성
  let apiUrl = `https://apis.data.go.kr/B490001/sjbPrecedentInfoService/getSjbPrecedentNaeyongPstate?ServiceKey=${cGnyjDsjAqd6Bb1Q8GIvLq2b0NCzxq9x2zk8LsuqlJYN7QK6d4G3S7LhXylldwNKFYvz1SRT/WjCutEL4wa/MQ==}&pageNo=${pageNo}&numOfRows=${numOfRows}`;
  
  if (kindA) apiUrl += `&kindA=${encodeURIComponent(kindA)}`;
  if (kindB) apiUrl += `&kindB=${encodeURIComponent(kindB)}`;
  if (kindC) apiUrl += `&kindC=${encodeURIComponent(kindC)}`;
  
  try {
    console.log('🔍 API 호출 시작:', new Date().toISOString());
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP 오류: ${response.status} ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    console.log('📄 XML 응답 길이:', xmlText.length);
    
    // API 에러 응답 확인
    if (xmlText.includes('<resultCode>') && !xmlText.includes('<resultCode>00</resultCode>')) {
      const errorCodeMatch = xmlText.match(/<resultCode>([^<]+)<\/resultCode>/);
      const errorMsgMatch = xmlText.match(/<resultMsg>([^<]+)<\/resultMsg>/);
      
      return NextResponse.json({
        성공: false,
        오류: 'API 에러 발생',
        에러코드: errorCodeMatch?.[1] || '알 수 없음',
        에러메시지: errorMsgMatch?.[1] || '알 수 없음'
      }, { status: 400, headers });
    }
    
    // item 태그 추출
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    
    if (items.length === 0) {
      return NextResponse.json({
        성공: true,
        총건수: 0,
        메시지: '검색 조건에 맞는 판례가 없습니다',
        판례목록: []
      }, { headers });
    }
    
    // 데이터 파싱 (실제 XML 구조에 맞춤)
    const parsedItems = items.map((item, index) => {
      const extractTag = (tagName) => {
        try {
          // CDATA 섹션 처리
          const cdataMatch = item.match(new RegExp(`<${tagName}><\\!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`, 'i'));
          if (cdataMatch) return cdataMatch[1].trim();
          
          // 일반 태그 처리
          const normalMatch = item.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
          if (normalMatch) return normalMatch[1].trim();
          
          return '';
        } catch (error) {
          console.error(`❌ 태그 추출 오류 (${tagName}):`, error);
          return '';
        }
      };
      
      // 실제 API 응답에서 확인된 태그명 사용
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
    
    // 전체 건수 추출
    const totalCountMatch = xmlText.match(/<totalCount>([^<]+)<\/totalCount>/);
    const totalCount = totalCountMatch ? parseInt(totalCountMatch[1]) : parsedItems.length;
    
    // 성공 응답
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
        전체페이지수: Math.ceil(totalCount / parseInt(numOfRows)),
        다음페이지: parseInt(pageNo) < Math.ceil(totalCount / parseInt(numOfRows)) ? parseInt(pageNo) + 1 : null
      },
      판례목록: parsedItems,
      분석정보: {
        주요법원: [...new Set(parsedItems.map(item => item.법원명).filter(court => court !== '정보없음'))],
        사건결과분포: [...new Set(parsedItems.map(item => item.사건결과).filter(result => result !== '정보없음'))],
        사건유형분포: [...new Set(parsedItems.map(item => item.사건유형).filter(type => type !== '정보없음'))]
      },
      사용팁: {
        필터링: 'kindA, kindB, kindC 파라미터로 원하는 조건의 판례만 검색 가능',
        페이징: 'pageNo를 증가시켜 더 많은 결과 확인 가능',
        내용확인: '판결문내용 필드에서 실제 판결 내용 확인 가능'
      }
    }, { headers });
    
  } catch (error) {
    console.error('💥 API 처리 오류:', error);
    
    return NextResponse.json({ 
      성공: false, 
      오류: error.message,
      오류유형: error.name,
      디버그정보: {
        요청시간: new Date().toISOString(),
        파라미터: { ServiceKey: ServiceKey ? '제공됨' : '누락', pageNo, numOfRows, kindA, kindB, kindC }
      }
    }, { status: 500, headers });
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
