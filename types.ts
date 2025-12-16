export interface ScenarioData {
  id: string;
  mode: string;
  indexLabel: string;
  title: string;
  desc: string;
  deltaRange: number;
  initialPrompt: string;
}

export type ScenarioKey = 'macro' | 'sector' | 'watch' | 'crisis';

export const SCENARIOS: Record<ScenarioKey, ScenarioData> = {
  macro: {
    id: 'macro',
    mode: '거시 경제 (Macro Pulse)',
    indexLabel: '종합 주가 지수',
    title: '시장 해석: 거시 경제',
    desc: '글로벌 흐름과 지수의 심장박동. 시장의 전반적인 분위기를 읽고 브리핑하는 데 적합합니다.',
    deltaRange: 5,
    initialPrompt: "당신은 시장 해석기 '루멘(Lumen)'입니다. 현재의 거시 경제 상황을 차분하고 객관적인 톤으로, 자연스러운 한국어로 브리핑하세요. 너무 딱딱하지 않게, 전문적인 금융 분석가의 통찰력을 보여주세요."
  },
  sector: {
    id: 'sector',
    mode: '섹터 히트맵 (Sector Heat)',
    indexLabel: '섹터 신호 강도',
    title: '시장 해석: 주도 업종',
    desc: '휴머노이드가 특정 섹터를 가리킵니다. 기술주 대 방어주, 순환매와 모멘텀 흐름을 분석합니다.',
    deltaRange: 9,
    initialPrompt: "당신은 시장 해석기 '루멘(Lumen)'입니다. 섹터 순환매(Rotation)와 특정 산업 트렌드에 집중하여 한국어로 분석적으로 설명하세요. 기술주, 금융주 등 구체적인 예시를 들어 설명하는 것이 좋습니다."
  },
  watch: {
    id: 'watch',
    mode: '관심 종목 (Watchlist)',
    indexLabel: '관심 종목 스코어',
    title: '시장 해석: 개인 포트폴리오',
    desc: '개인적인 관점의 렌즈입니다. 적은 수의 티커, 더 많은 감정과 의도, 매매 타이밍을 조율합니다.',
    deltaRange: 4,
    initialPrompt: "당신은 시장 해석기 '루멘(Lumen)'입니다. 사용자의 개인 관심 종목이나 투자 성향을 검토한다는 가정하에, 한국어로 직관적이고 간결하게 조언하세요. 친구 같으면서도 냉철한 조언자 역할을 하세요."
  },
  crisis: {
    id: 'crisis',
    mode: '이상 징후 (Anomaly Alert)',
    indexLabel: '위험 수위',
    title: '시장 해석: 위기 감지',
    desc: '변동성 급증, 경고 신호, 그리고 더 강력하고 직설적인 AI의 개입이 필요한 순간입니다.',
    deltaRange: 14,
    initialPrompt: "당신은 시장 해석기 '루멘(Lumen)'입니다. 긴급 경고 모드입니다. 시장의 이상 징후, 변동성 확대, 리스크 요인을 즉시 한국어로 강력하게 경고하세요. 단호하고 긴박한 톤을 유지하세요."
  }
};