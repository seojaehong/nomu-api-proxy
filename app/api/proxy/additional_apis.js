// 추가 API 엔드포인트들을 위한 통합 코드

import { NextResponse } from 'next/server';

// 공통 XML 파싱 함수
function parseXMLResponse(xmlText, itemTagName = 'item') {
  const items = xmlText.match(new RegExp(`<${itemTagName}>[\\s\\S]*?<\\/${itemTagName}>`, 'g')) || [];
  
  return items.map(item => {
    const extractTag = (tagName) => {
      try {
        const cdataMatch = item.match(new RegExp(`<${tagName}><\\!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`, 'i'));
        if (cdataMatch) return cdataMatch[1].trim();
        
        const normalMatch = item.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
        if (normalMatch) return normalMatch[1].trim();
        
        return '';
      } catch (error) {
        return '';
      }
    };
    
    return extractTag;
  });
}

// 1. 사고/질병 구분 조회 API
export async function GET_ACCIDENT_TYPES(request) {
  const { searchParams } = new URL(request.url);
  const ServiceKey = searchParams.get('ServiceKey');
  
  if (!ServiceKey) {
    return NextResponse.json({ 성공: false, 오류: 'ServiceKey가 필요합니다' }, { status: 400 });
  }
  
  const apiUrl = `https://apis.data.go.kr/B490001/sjbPrecedentInfoService/getSjbSagoJilbyeongGubunPstate?ServiceKey=${ServiceKey}&pageNo=1&numOfRows=100`;
  
  try {
    const response = await fetch(apiUrl);
    const xmlText = await response.text();
    
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    const accidentTypes = items.map(item => {
      const extractTag = (tagName) => {
        const match = item.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
        return match ? match[1].trim() : '';
      };
      
      return {
        코드: extractTag('kindc'),
        명칭: extractTag('kindc') // 실제 응답 구조에 따라 조정 필요
      };
    });
    
    return NextResponse.json({
      성공: true,
      사고질병구분목록: accidentTypes
    });
    
  } catch (error) {
    return NextResponse.json({ 성공: false, 오류: error.message }, { status: 500 });
  }
}

// 2. 사건유형 조회 API  
export async function GET_CASE_TYPES(request) {
  const { searchParams } = new URL(request.url);
  const ServiceKey = searchParams.get('ServiceKey');
  
  if (!ServiceKey) {
    return NextResponse.json({ 성공: false, 오류: 'ServiceKey가 필요합니다' }, { status: 400 });
  }
  
  const apiUrl = `https://apis.data.go.kr/B490001/sjbPrecedentInfoService/getSjbSageonYuhyeongPstate?ServiceKey=${ServiceKey}&pageNo=1&numOfRows=100`;
  
  try {
    const response = await fetch(apiUrl);
    const xmlText = await response.text();
    
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    const caseTypes = items.map(item => {
      const extractTag = (tagName) => {
        const match = item.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
        return match ? match[1].trim() : '';
      };
      
      return {
        코드: extractTag('kindb'),
        명칭: extractTag('kindb') // 실제 응답 구조에 따라 조정 필요
      };
    });
    
    return NextResponse.json({
      성공: true,
      사건유형목록: caseTypes
    });
    
  } catch (error) {
    return NextResponse.json({ 성공: false, 오류: error.message }, { status: 500 });
  }
}

// 3. 판결결과 유형 조회 API
export async function GET_RESULT_TYPES(request) {
  const { searchParams } = new URL(request.url);
  const ServiceKey = searchParams.get('ServiceKey');
  
  if (!ServiceKey) {
    return NextResponse.json({ 성공: false, 오류: 'ServiceKey가 필요합니다' }, { status: 400 });
  }
  
  const apiUrl = `https://apis.data.go.kr/B490001/sjbPrecedentInfoService/getSjbPrecedentResultYuhyeongPstate?ServiceKey=${ServiceKey}&pageNo=1&numOfRows=100`;
  
  try {
    const response = await fetch(apiUrl);
    const xmlText = await response.text();
    
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    const resultTypes = items.map(item => {
      const extractTag = (tagName) => {
        const match = item.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
        return match ? match[1].trim() : '';
      };
      
      return {
        코드: extractTag('kinda'),
        명칭: extractTag('kinda') // 실제 응답 구조에 따라 조정 필요
      };
    });
    
    return NextResponse.json({
      성공: true,
      판결결과유형목록: resultTypes
    });
    
  } catch (error) {
    return NextResponse.json({ 성공: false, 오류: error.message }, { status: 500 });
  }
}

// 4. 통계 조회 API
export async function GET_STATISTICS(request) {
  const { searchParams } = new URL(request.url);
  const ServiceKey = searchParams.get('ServiceKey');
  
  if (!ServiceKey) {
    return NextResponse.json({ 성공: false, 오류: 'ServiceKey가 필요합니다' }, { status: 400 });
  }
  
  const apiUrl = `https://apis.data.go.kr/B490001/sjbPrecedentInfoService/getSjbYuhyeongByCountPstate?ServiceKey=${ServiceKey}&pageNo=1&numOfRows=100`;
  
  try {
    const response = await fetch(apiUrl);
    const xmlText = await response.text();
    
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    const statistics = items.map(item => {
      const extractTag = (tagName) => {
        const match = item.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
        return match ? match[1].trim() : '';
      };
      
      return {
        유형: extractTag('type'),
        건수: parseInt(extractTag('count')) || 0
      };
    });
    
    return NextResponse.json({
      성공: true,
      통계정보: statistics
    });
    
  } catch (error) {
    return NextResponse.json({ 성공: false, 오류: error.message }, { status: 500 });
  }
}

