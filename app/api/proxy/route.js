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
    
    const items = xmlText.match(/<item>([\s\S]*?)<\/item>/g) || [];
    
    const parsedItems = items.map(item => {
      const extract = (tag) => {
        const match = item.match(new RegExp(`<${tag}><!\[CDATA\[([\s\S]*?)\]\]><\/${tag}>|<${tag}>([\s\S]*?)<\/${tag}>`, 'i'));
        return match ? (match[1] || match[2] || '').trim() : '';
      };
      
      return {
        판례번호: extract('precedentNo'),
        사건명: extract('caseName'),
        법원명: extract('courtName'), 
        선고일자: extract('judgmentDate'),
        사건결과: extract('caseResult'),
        사건유형: extract('kindA'),
        질병구분: extract('kindB')
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
