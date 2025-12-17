import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SCENARIOS, ScenarioKey } from './types';
import ShaderBackground from './components/ShaderBackground';
import { useGeminiLive } from './hooks/useGeminiLive';
import { Mic, MicOff, Volume2, ArrowLeft, Activity, Radio, AlertTriangle, Globe, Search, Newspaper, Youtube, X, TrendingUp, TrendingDown, LineChart, ExternalLink, MessageSquareText } from 'lucide-react';

// Mock Stock Data for Search
const MOCK_STOCKS = [
  { name: 'KOSPI', ticker: 'INDEX', price: 3120.45, change: 1.2, sector: 'Index' },
  { name: '삼성전자', ticker: '005930.KS', price: 72800, change: 1.2, sector: 'Tech' },
  { name: 'SK하이닉스', ticker: '000660.KS', price: 164200, change: 2.5, sector: 'Tech' },
  { name: 'NVIDIA', ticker: 'NVDA', price: 880.45, change: 3.8, sector: 'Semi' },
  { name: 'Tesla', ticker: 'TSLA', price: 178.90, change: -1.5, sector: 'Auto' },
  { name: 'Apple', ticker: 'AAPL', price: 169.50, change: -0.2, sector: 'Tech' },
  { name: 'Bitcoin', ticker: 'BTC/KRW', price: 98500000, change: 4.1, sector: 'Crypto' },
  { name: 'Google', ticker: 'GOOGL', price: 155.20, change: 0.8, sector: 'Tech' },
  { name: '현대차', ticker: '005380.KS', price: 245000, change: 0.5, sector: 'Auto' },
  { name: 'POSCO홀딩스', ticker: '005490.KS', price: 415000, change: -1.2, sector: 'Steel' },
];

// Define assets for each scenario
// 4가지 관점에 따라 로컬 이미지 경로와 분위기(필터)를 다르게 설정
const SCENARIO_ASSETS: Record<ScenarioKey, { url: string, filter: string, shadowColor: string }> = {
  macro: {
    url: "/images/macro.gif", 
    filter: "contrast(1.2) brightness(1.2) saturate(0.8)", 
    shadowColor: "rgba(0,255,255,0.5)"
  },
  sector: {
    url: "/images/sector.gif", 
    filter: "contrast(1.3) brightness(1.1) hue-rotate(45deg) saturate(1.3)", 
    shadowColor: "rgba(200, 100, 255, 0.5)"
  },
  watch: {
    url: "/images/watch.gif", 
    filter: "contrast(1.2) brightness(1.2) sepia(0.3) hue-rotate(-50deg) saturate(1.2)", 
    shadowColor: "rgba(255, 255, 100, 0.4)"
  },
  crisis: {
    url: "/images/crisis.gif", 
    filter: "contrast(1.5) brightness(0.9) grayscale(1) sepia(1) hue-rotate(-50deg) saturate(4)", 
    shadowColor: "rgba(255, 50, 50, 0.6)"
  }
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'intro' | 'app'>('intro');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>('macro');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Overlay state for Intro screen features
  const [activeOverlay, setActiveOverlay] = useState<'search' | 'chart' | 'news' | 'youtube' | null>(null);
  
  // Stock Search State (Global for app entry)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStock, setSelectedStock] = useState<typeof MOCK_STOCKS[0] | null>(null);

  // Chart Overlay Specific State
  const [chartSearchTerm, setChartSearchTerm] = useState('');
  const [chartPreviewStock, setChartPreviewStock] = useState<typeof MOCK_STOCKS[0]>(MOCK_STOCKS[0]); // Default to KOSPI

  const deckRef = useRef<HTMLDivElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Fake market data state
  const [marketData, setMarketData] = useState({
    price: 3120.45,
    trend: '안정적',
    emotion: '차분함',
    comment: '루멘 대기 중. 음성 연결을 기다리고 있습니다...'
  });

  // Determine System Instruction
  // If a stock is selected, override the scenario prompt to focus on the stock.
  const systemInstruction = useMemo(() => {
    if (selectedStock) {
      return `당신은 시장 해석기 '루멘(Lumen)'입니다. 현재 사용자가 선택한 종목인 '${selectedStock.name} (${selectedStock.ticker})'에 대해 집중 분석하세요. 현재 가격은 ${selectedStock.price}입니다. 이 종목의 기술적 위치, 최근 이슈, 그리고 투자 관점을 한국어로 전문적이고 통찰력 있게 브리핑하세요.`;
    }
    return SCENARIOS[selectedScenario].initialPrompt;
  }, [selectedStock, selectedScenario]);

  // Gemini Live Hook
  const { connect, disconnect, isConnected, isSpeaking, error, volume, aiTranscription } = useGeminiLive({
    systemInstruction
  });

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
        transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiTranscription]);

  // Mouse parallax for card deck
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!deckRef.current) return;
    const rect = deckRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const deckStyle = {
    transform: `rotateX(${-mousePos.y * 8}deg) rotateY(${mousePos.x * 10}deg)`,
    transition: 'transform 0.1s ease-out'
  };

  // Simulate market data updates
  useEffect(() => {
    if (currentView !== 'app') return;

    const interval = setInterval(() => {
      // If a stock is selected, fluctuate around its price
      // Otherwise use scenario logic
      
      const basePrice = selectedStock ? selectedStock.price : 3120.45;
      const range = selectedStock ? basePrice * 0.005 : SCENARIOS[selectedScenario].deltaRange;
      
      const delta = (Math.random() * (range * 2) - range);
      
      const trends = ['상승 중', '하락 중', '횡보 중', '급변동'];
      const emotions = ['차분함', '집중', '긴장됨', '낙관적', '불안정'];

      setMarketData(prev => {
        const newPrice = selectedStock ? prev.price + delta : prev.price + delta;
        return {
          ...prev,
          price: parseFloat(newPrice.toFixed(2)),
          trend: delta > 0 ? '상승세' : '하락세',
          emotion: emotions[Math.floor(Math.random() * emotions.length)]
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [currentView, selectedScenario, selectedStock]);

  // Handle Voice Toggle
  const toggleVoice = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  // Handle Stock Selection from Search
  const handleStockSelect = (stock: typeof MOCK_STOCKS[0]) => {
    setSelectedStock(stock);
    setMarketData({
      price: stock.price,
      trend: stock.change > 0 ? '상승세' : '하락세',
      emotion: '분석 중',
      comment: `${stock.name} 데이터 로딩 완료. AI 분석 대기 중.`
    });
    // Force switch to 'Watchlist' mode concept or just keep current scenario but context overrides
    setSelectedScenario('watch'); 
    setActiveOverlay(null);
    setCurrentView('app');
  };

  // Handle Chart Overlay Search Selection
  const handleChartPreviewSelect = (stock: typeof MOCK_STOCKS[0]) => {
    setChartPreviewStock(stock);
    setChartSearchTerm(''); // Clear search after selection
  };

  const resetToHome = () => {
    disconnect();
    setCurrentView('intro');
    setSelectedStock(null);
    setMarketData(prev => ({ ...prev, price: 3120.45 })); // Reset to index base
  };

  const renderCard = (key: ScenarioKey) => {
    const s = SCENARIOS[key];
    const isSel = selectedScenario === key;
    
    return (
      <div 
        key={key}
        onClick={() => { setSelectedScenario(key); setSelectedStock(null); }}
        className={`
          relative overflow-hidden rounded-2xl border p-5 cursor-pointer transition-all duration-300
          ${isSel 
            ? 'border-cyan-300/75 bg-black/60 shadow-[0_0_0_1px_rgba(0,255,255,0.1),0_22px_60px_rgba(0,255,255,0.12)] scale-[1.04] translate-z-8' 
            : 'border-cyan-500/20 bg-black/40 hover:scale-[1.02] hover:border-cyan-500/40 hover:brightness-110'}
        `}
      >
        {/* Card shine effect */}
        <div className={`absolute inset-[-40px] bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent rotate-[8deg] transition-opacity duration-300 ${isSel ? 'opacity-100' : 'opacity-0 hover:opacity-90'}`} />
        
        <div className="flex justify-between items-center mb-2 relative z-10">
          <div className="text-[10px] tracking-[1.6px] text-cyan-100/70 uppercase">Scenario {key}</div>
          <div className={`w-2.5 h-2.5 rounded-full ${isSel ? 'bg-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.6)]' : 'bg-cyan-900'}`} />
        </div>
        <h3 className="text-lg text-cyan-50 relative z-10 font-light break-keep">{s.mode}</h3>
        <p className="text-xs text-cyan-100/60 mt-2 leading-relaxed relative z-10 break-keep">{s.desc}</p>
      </div>
    );
  };

  // Helper for Intro Overlays
  const renderOverlayContent = () => {
    if (!activeOverlay) return null;

    // Filter stocks based on which overlay is active (Search or Chart)
    const activeSearchTerm = activeOverlay === 'search' ? searchTerm : chartSearchTerm;
    const filteredStocks = MOCK_STOCKS.filter(s => 
      s.name.toLowerCase().includes(activeSearchTerm.toLowerCase()) || 
      s.ticker.toLowerCase().includes(activeSearchTerm.toLowerCase())
    );

    return (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        onClick={() => setActiveOverlay(null)}
      >
        <div 
          className="w-full max-w-2xl bg-black/90 border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.15)] relative flex flex-col max-h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 bg-cyan-950/20">
            <h3 className="text-cyan-100 font-medium flex items-center gap-2">
              {activeOverlay === 'search' && <><Search size={18} className="text-cyan-400"/> 종목 검색 엔진</>}
              {activeOverlay === 'chart' && <><LineChart size={18} className="text-cyan-400"/> 실시간 시장 차트</>}
              {activeOverlay === 'news' && <><Newspaper size={18} className="text-cyan-400"/> 주요 금융 뉴스</>}
              {activeOverlay === 'youtube' && <><Youtube size={18} className="text-red-500"/> 주식 공부방</>}
            </h3>
            <button 
              onClick={() => setActiveOverlay(null)}
              className="p-1 rounded-full hover:bg-white/10 text-cyan-500/70 hover:text-cyan-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-0 overflow-y-auto min-h-[300px] bg-black/50">
            {activeOverlay === 'search' && (
              <div className="flex flex-col h-full">
                {/* Search Input */}
                <div className="p-4 border-b border-cyan-500/10">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500/50" size={16} />
                    <input 
                      type="text" 
                      placeholder="종목명 또는 티커 검색 (예: 삼성전자, NVDA)" 
                      className="w-full bg-cyan-950/20 border border-cyan-500/30 rounded-xl py-3 pl-10 pr-4 text-cyan-100 placeholder-cyan-500/30 focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-950/40 transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
                {/* Stock List */}
                <div className="flex-1 overflow-y-auto">
                  {filteredStocks.length > 0 ? (
                    filteredStocks.map((stock) => (
                      <div 
                        key={stock.ticker}
                        onClick={() => handleStockSelect(stock)}
                        className="flex items-center justify-between p-4 hover:bg-cyan-500/10 cursor-pointer border-b border-cyan-500/5 transition-colors group"
                      >
                        <div className="flex flex-col">
                          <span className="text-cyan-50 font-medium group-hover:text-cyan-300">{stock.name}</span>
                          <span className="text-xs text-cyan-500/50">{stock.ticker} · {stock.sector}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-cyan-100 font-mono">{stock.price.toLocaleString()}</div>
                          <div className={`text-xs flex items-center justify-end gap-1 ${stock.change > 0 ? 'text-red-400' : 'text-blue-400'}`}>
                            {stock.change > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {stock.change > 0 ? '+' : ''}{stock.change}%
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-cyan-500/40 text-sm">
                      검색 결과가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeOverlay === 'chart' && (
              <div className="flex flex-col h-full">
                {/* Chart Search Bar */}
                <div className="p-4 border-b border-cyan-500/10 z-20 relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500/50" size={14} />
                    <input 
                      type="text" 
                      placeholder="차트 종목 검색 (예: 삼성전자)" 
                      className="w-full bg-cyan-950/20 border border-cyan-500/30 rounded-lg py-2 pl-9 pr-4 text-sm text-cyan-100 placeholder-cyan-500/30 focus:outline-none focus:border-cyan-400/60 transition-all"
                      value={chartSearchTerm}
                      onChange={(e) => setChartSearchTerm(e.target.value)}
                      autoFocus
                    />
                    {/* Dropdown Results */}
                    {chartSearchTerm && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-black border border-cyan-500/30 rounded-lg shadow-xl max-h-48 overflow-y-auto z-30">
                        {filteredStocks.length > 0 ? (
                           filteredStocks.map(stock => (
                             <div 
                               key={stock.ticker}
                               onClick={() => handleChartPreviewSelect(stock)}
                               className="p-3 hover:bg-cyan-900/30 cursor-pointer flex justify-between items-center text-xs border-b border-cyan-500/10 last:border-0 transition-colors"
                             >
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-cyan-50 font-medium">{stock.name}</span>
                                    <span className="text-cyan-500/60 text-[10px]">{stock.sector}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-cyan-100 block">{stock.price.toLocaleString()}</span>
                                    <span className={`text-[10px] ${stock.change > 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                        {stock.ticker}
                                    </span>
                                </div>
                             </div>
                           ))
                        ) : (
                          <div className="p-3 text-center text-xs text-cyan-500/50">검색 결과 없음</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Chart Visualization Area */}
                <div className="p-6 flex flex-col items-center justify-center flex-1 relative min-h-[350px]">
                  
                  {/* Chart Header Info */}
                  <div className="w-full flex justify-between items-end mb-4 border-b border-cyan-500/20 pb-2">
                    <div>
                      <h2 className="text-xl text-cyan-50 font-light">{chartPreviewStock.name} <span className="text-sm text-cyan-500/60 ml-2">{chartPreviewStock.ticker}</span></h2>
                    </div>
                    <div className="text-right">
                       <div className="text-2xl font-mono text-cyan-50">{chartPreviewStock.price.toLocaleString()}</div>
                       <div className={`text-sm flex items-center justify-end gap-1 ${chartPreviewStock.change > 0 ? 'text-red-400' : 'text-blue-400'}`}>
                          {chartPreviewStock.change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {chartPreviewStock.change > 0 ? '+' : ''}{chartPreviewStock.change}%
                       </div>
                    </div>
                  </div>

                  {/* Simulated Chart SVG */}
                  <div className="w-full h-56 relative border-l border-b border-cyan-500/30 group cursor-crosshair">
                    <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor={chartPreviewStock.change > 0 ? "rgba(248, 113, 113, 0.2)" : "rgba(96, 165, 250, 0.2)"}/>
                          <stop offset="100%" stopColor={chartPreviewStock.change > 0 ? "rgba(248, 113, 113, 0)" : "rgba(96, 165, 250, 0)"}/>
                        </linearGradient>
                      </defs>
                      
                      {/* Dynamic-looking path based on change direction simulation */}
                      <path 
                        d={chartPreviewStock.change > 0 
                          ? "M0,40 Q20,45 30,35 T50,30 T70,20 T100,10" 
                          : "M0,10 Q20,15 30,25 T50,30 T70,40 T100,45"}
                        fill="none" 
                        stroke={chartPreviewStock.change > 0 ? "#F87171" : "#60A5FA"} 
                        strokeWidth="0.5" 
                        className={`drop-shadow-[0_0_4px_${chartPreviewStock.change > 0 ? 'rgba(248,113,113,0.5)' : 'rgba(96,165,250,0.5)'}]`}
                      />
                      <path 
                        d={chartPreviewStock.change > 0 
                          ? "M0,40 Q20,45 30,35 T50,30 T70,20 T100,10 V50 H0 Z"
                          : "M0,10 Q20,15 30,25 T50,30 T70,40 T100,45 V50 H0 Z"}
                        fill="url(#chartGrad)" 
                        stroke="none"
                      />
                      {/* Grid lines */}
                      <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(0,255,255,0.1)" strokeWidth="0.1" />
                      <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(0,255,255,0.1)" strokeWidth="0.1" />
                      <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(0,255,255,0.1)" strokeWidth="0.1" />
                    </svg>
                    
                    {/* Simulated Tooltip */}
                    <div className="absolute top-[10%] right-[10%] bg-black/80 border border-cyan-500/50 px-2 py-1 rounded text-[10px] text-cyan-200 backdrop-blur-sm">
                      실시간 데이터 수신 중...
                    </div>
                  </div>
                  
                  <div className="w-full flex justify-between text-[10px] text-cyan-500/50 mt-2 font-mono">
                    <span>09:00</span>
                    <span>11:00</span>
                    <span>13:00</span>
                    <span>15:30</span>
                  </div>

                  <div className="mt-6 flex gap-2 w-full justify-center">
                     <button onClick={() => window.open(`https://finance.yahoo.com/quote/${chartPreviewStock.ticker}`, '_blank')} className="px-4 py-2 bg-cyan-900/30 border border-cyan-500/20 rounded-lg text-xs hover:bg-cyan-900/50 transition-colors flex items-center gap-2">
                        <ExternalLink size={12}/> {chartPreviewStock.name} 상세 차트 보기
                     </button>
                  </div>
                </div>
              </div>
            )}

            {activeOverlay === 'news' && (
              <div className="flex flex-col">
                {[
                  { title: "美 연준, 금리 동결 시사... 시장 안도감 확산", time: "10분 전", source: "Global Finance", link: "https://www.google.com/finance" },
                  { title: "AI 반도체 섹터, 실적 발표 앞두고 변동성 확대", time: "32분 전", source: "Tech Today", link: "https://www.google.com/finance" },
                  { title: "국제 유가 2%대 급등, 지정학적 리스크 고조", time: "1시간 전", source: "Energy Watch", link: "https://www.google.com/finance" },
                  { title: "외국인 투자자, 코스피 3일 연속 순매수 행진", time: "2시간 전", source: "Market Korea", link: "https://www.google.com/finance" },
                  { title: "주요 가상자산 시세 혼조세... 비트코인 60K 방어", time: "3시간 전", source: "Crypto Daily", link: "https://www.google.com/finance" }
                ].map((item, i) => (
                  <div 
                    key={i} 
                    onClick={() => window.open(item.link, '_blank')}
                    className="p-4 border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors cursor-pointer group flex justify-between items-center"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm text-cyan-50 group-hover:text-cyan-300 transition-colors">{item.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-cyan-500/60">{item.source}</span>
                        <span className="text-[10px] text-cyan-500/40">• {item.time}</span>
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-cyan-500/30 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all"/>
                  </div>
                ))}
              </div>
            )}

            {activeOverlay === 'youtube' && (
              <div className="flex flex-col h-full">
                <div className="aspect-video w-full bg-black">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/p7HKvqRI_Bo?autoplay=1&mute=1" 
                    title="How the stock market works - Oliver Elfenbaum" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
                <div className="p-4 flex justify-between items-center bg-black/40">
                  <div className="text-xs text-cyan-500/70">주식 시장의 원리 (Stock Market Basics)</div>
                  <button 
                    onClick={() => window.open('https://www.youtube.com/watch?v=p7HKvqRI_Bo', '_blank')}
                    className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-200 transition-colors"
                  >
                    <Youtube size={14} /> 유튜브에서 보기 <ExternalLink size={10} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-screen text-cyan-100 font-sans selection:bg-cyan-500/30">
      <ShaderBackground opacity={currentView === 'app' ? 0.75 : 0.55} />

      {/* --- INTRO VIEW --- */}
      {currentView === 'intro' && (
        <>
          <section className="fixed inset-0 z-10 overflow-y-auto flex flex-col animate-in fade-in duration-500">
            <div className="relative w-[min(1100px,92vw)] m-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center z-20 p-6 py-12 lg:p-0">
              
              {/* Left Col */}
              <div className="p-4 flex flex-col justify-center">
                {/* Branding / Logo Area */}
                <div className="mb-10 animate-in slide-in-from-left-8 fade-in duration-1000 fill-mode-backwards">
                   <div className="flex items-center gap-3 mb-2 opacity-70">
                      <div className="flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                        <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse delay-75" />
                        <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse delay-150" />
                      </div>
                      <span className="text-[10px] tracking-[3px] text-cyan-300 font-mono">SYSTEM ONLINE</span>
                   </div>
                   
                   <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-600 drop-shadow-[0_0_35px_rgba(0,255,255,0.3)] select-none leading-[0.9]">
                     LUMEN
                   </h1>
                   
                   <div className="flex items-center mt-2 max-w-[280px]">
                      <div className="h-px bg-gradient-to-r from-cyan-500/50 to-transparent flex-1" />
                      <span className="mx-3 text-xs md:text-sm font-light text-cyan-400/80 tracking-[0.4em] uppercase whitespace-nowrap">
                        Market Interface
                      </span>
                      <div className="h-px bg-gradient-to-l from-cyan-500/50 to-transparent flex-1" />
                   </div>
                </div>

                <p className="text-sm text-cyan-100/60 max-w-md mb-8 leading-relaxed break-keep border-l border-cyan-500/20 pl-4 animate-in fade-in duration-1000 delay-300 fill-mode-backwards">
                  숫자를 넘어선 통찰. <br/>
                  <span className="text-cyan-200/90">AI 홀로그램 인터페이스</span>가 당신의 관점에 맞춰 시장을 재해석합니다.
                </p>
                
                {/* Feature Buttons (Replacement for Tags) */}
                <div className="flex flex-wrap gap-3 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 fill-mode-backwards">
                  <button 
                    onClick={() => setActiveOverlay('search')}
                    className="flex items-center gap-2 px-4 py-2 border border-cyan-500/30 bg-black/40 hover:bg-cyan-900/40 rounded-full text-xs transition-all hover:border-cyan-400/60 group"
                  >
                    <Search size={14} className="text-cyan-400 group-hover:scale-110 transition-transform"/> 
                    종목 검색
                  </button>
                  <button 
                    onClick={() => { setActiveOverlay('chart'); setChartPreviewStock(MOCK_STOCKS[0]); setChartSearchTerm(''); }}
                    className="flex items-center gap-2 px-4 py-2 border border-cyan-500/30 bg-black/40 hover:bg-cyan-900/40 rounded-full text-xs transition-all hover:border-cyan-400/60 group"
                  >
                    <LineChart size={14} className="text-cyan-400 group-hover:scale-110 transition-transform"/> 
                    실시간 차트
                  </button>
                  <button 
                    onClick={() => setActiveOverlay('news')}
                    className="flex items-center gap-2 px-4 py-2 border border-cyan-500/30 bg-black/40 hover:bg-cyan-900/40 rounded-full text-xs transition-all hover:border-cyan-400/60 group"
                  >
                    <Newspaper size={14} className="text-cyan-400 group-hover:scale-110 transition-transform"/> 
                    주요 뉴스
                  </button>
                  <button 
                    onClick={() => setActiveOverlay('youtube')}
                    className="flex items-center gap-2 px-4 py-2 border border-cyan-500/30 bg-black/40 hover:bg-cyan-900/40 rounded-full text-xs transition-all hover:border-cyan-400/60 group"
                  >
                    <Youtube size={14} className="text-red-400 group-hover:scale-110 transition-transform"/> 
                    주식 공부
                  </button>
                </div>

                <button 
                  onClick={() => setCurrentView('app')}
                  className="group relative px-6 py-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl overflow-hidden hover:bg-cyan-900/50 transition-all active:scale-95 animate-in fade-in duration-1000 delay-700 fill-mode-backwards w-fit"
                >
                  <div className="absolute inset-0 bg-cyan-400/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative z-10 flex items-center gap-2 text-sm font-medium tracking-wide">
                    인터페이스 진입 <Globe size={14} />
                  </span>
                </button>
              </div>

              {/* Right Col: 3D Deck */}
              <div className="h-[420px] relative perspective-[1200px]" onMouseMove={handleMouseMove} onMouseLeave={() => setMousePos({x:0,y:0})}>
                <div ref={deckRef} className="absolute inset-0 grid grid-cols-2 gap-4 content-center preserve-3d" style={deckStyle}>
                  {renderCard('macro')}
                  {renderCard('sector')}
                  {renderCard('watch')}
                  {renderCard('crisis')}
                </div>
              </div>
            </div>
          </section>
          {/* Render Overlay if Active - outside scroll container for proper fixed positioning */}
          {renderOverlayContent()}
        </>
      )}

      {/* --- DASHBOARD APP VIEW --- */}
      {currentView === 'app' && (
        <div className="relative z-20 w-full h-full flex flex-col md:flex-row animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Top Bar */}
          <div className="fixed top-4 left-4 z-50 flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-full border border-cyan-500/20 bg-black/40 backdrop-blur text-xs tracking-wider flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              MODE: {selectedStock ? selectedStock.name : SCENARIOS[selectedScenario].mode}
            </div>
            <button 
              onClick={resetToHome}
              className="p-1.5 rounded-full border border-cyan-500/10 bg-black/20 hover:bg-cyan-900/40 hover:border-cyan-500/40 transition-colors"
              title="뒤로 가기"
            >
              <ArrowLeft size={16} />
            </button>
          </div>

          {/* Left: Humanoid Viz */}
          <div className="flex-[2] relative grid place-items-center overflow-hidden p-4">
             {/* Holographic Ring -> Dynamic color based on scenario */}
             <div 
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(360px,36vw)] aspect-[320/520] border-[2px] rounded-[180px_180px_150px_150px] shadow-[0_0_50px_rgba(0,255,255,0.4)] z-10 animate-pulse pointer-events-none transition-colors duration-500" 
               style={{ 
                  borderColor: SCENARIO_ASSETS[selectedScenario].shadowColor.replace('0.4', '0.3').replace('0.5', '0.3').replace('0.6', '0.3'),
                  boxShadow: `0 0 50px ${SCENARIO_ASSETS[selectedScenario].shadowColor}`
               }}
             />
             
             {/* Humanoid Image -> Dynamic source and filter */}
             <div className="relative z-0 h-[80vh] w-full flex items-center justify-center pointer-events-none">
                 <div className="relative w-[min(520px,90vw)] aspect-[3/4] flex items-center justify-center">
                    
                    {/* 접지(바닥/뒤 톤) 레이어: 붕 뜨는 느낌 잡아줌 */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(60% 40% at 50% 65%, rgba(0,255,255,0.18), transparent 70%)," +
                          "radial-gradient(60% 40% at 50% 95%, rgba(0,0,0,0.85), transparent 65%)",
                        filter: "blur(10px)",
                        opacity: 0.9,
                      }}
                    />

                    {/* 이미지 */}
                    <img
                      src={SCENARIO_ASSETS[selectedScenario].url}
                      alt="Humanoid Interface"
                      className="absolute inset-0 w-full h-full object-contain transition-all duration-700"
                      style={{
                        // 가장자리 페더(투명도)
                        WebkitMaskImage:
                          "radial-gradient(closest-side, rgba(0,0,0,1) 72%, rgba(0,0,0,0) 100%)",
                        maskImage:
                          "radial-gradient(closest-side, rgba(0,0,0,1) 72%, rgba(0,0,0,0) 100%)",
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        WebkitMaskSize: "100% 100%",
                        maskSize: "100% 100%",

                        // 배경과 섞이게(너가 이미 쓰던 screen 계열)
                        mixBlendMode: "screen",
                        opacity: 0.95,

                        // 과한 “붕” 느낌 줄이기: 그림자는 바깥이 아니라 아주 약하게
                        filter: `${SCENARIO_ASSETS[selectedScenario].filter} contrast(1.02) saturate(1.05)`,
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.opacity = '0.3';
                      }}
                    />

                    {/* 테두리 글로우(선택): 배경과 이어주는 링 */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        boxShadow: "0 0 60px rgba(0,255,255,0.12)",
                        borderRadius: "24px",
                        mixBlendMode: "screen",
                      }}
                    />
                    
                    {/* Subtle scanline overlay for the hologram effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0)_50%,rgba(0,255,255,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[size:100%_4px,3px_100%] pointer-events-none mix-blend-screen opacity-50" />
                 </div>
             </div>

             {/* Floor Grid */}
             <div 
               className="absolute top-[65%] left-1/2 -translate-x-1/2 w-[min(680px,86vw)] h-[40vh] bg-[linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(180deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:34px_34px] mask-radial opacity-50 z-10 pointer-events-none"
               style={{ transform: 'perspective(900px) rotateX(70deg)', maskImage: 'radial-gradient(circle, black, transparent 70%)' }}
             />
          </div>

          {/* Right: Data Panel */}
          <div className="flex-1 border-l border-cyan-500/10 bg-black/40 backdrop-blur-md p-8 md:p-12 flex flex-col justify-center gap-8 relative overflow-y-auto">
            
            <div>
              <h2 className="text-cyan-200/60 text-xs tracking-widest mb-6 border-b border-cyan-500/10 pb-2">
                {selectedStock ? `ANALYSIS: ${selectedStock.name}` : SCENARIOS[selectedScenario].title}
              </h2>

              <div className="mb-8">
                <div className="text-[10px] uppercase text-cyan-400/50 mb-1">
                  {selectedStock ? `${selectedStock.ticker} PRICE` : SCENARIOS[selectedScenario].indexLabel}
                </div>
                <div className="text-4xl md:text-5xl font-light text-cyan-50 tabular-nums tracking-tight">
                  {marketData.price.toLocaleString()}
                </div>
                <div className={`text-sm mt-2 flex items-center gap-2 ${selectedScenario === 'crisis' ? (marketData.trend === '상승세' ? 'text-red-400' : 'text-orange-400') : 'text-cyan-300/80'}`}>
                  {selectedScenario === 'crisis' ? <AlertTriangle size={14}/> : <Activity size={14} />}
                  {marketData.trend}
                  {selectedStock && <span className="opacity-60 text-xs">({selectedStock.change > 0 ? '+' : ''}{selectedStock.change}%)</span>}
                </div>
              </div>

              <div className="mb-8">
                <div className="text-[10px] uppercase text-cyan-400/50 mb-1">시장 정서 (Sentiment)</div>
                <div className="text-xl text-white font-light">{marketData.emotion}</div>
              </div>

              <div className="p-4 rounded-lg bg-cyan-950/30 border border-cyan-500/20 relative">
                 <div className="absolute -top-2 left-3 px-1 bg-black text-[9px] text-cyan-500">루멘 AI 상태</div>
                 
                 {/* Status / Initial Comment */}
                 <p className="text-sm text-cyan-100/90 leading-relaxed min-h-[40px] flex items-center break-keep mb-3">
                   {isSpeaking ? (
                     <span className="flex items-center gap-2 text-cyan-300">
                       <Volume2 size={16} className="animate-pulse" /> 답변 중...
                     </span>
                   ) : isConnected ? (
                     <span className="italic opacity-70">듣고 있습니다... (질문해 보세요)</span>
                   ) : (
                     marketData.comment
                   )}
                 </p>
                 
                 {/* Voice Visualizer Bar */}
                 {isConnected && (
                   <div className="h-1 w-full bg-cyan-900/50 mb-4 rounded-full overflow-hidden">
                     <div 
                        className="h-full bg-cyan-400 transition-all duration-75 ease-out"
                        style={{ width: `${Math.min(100, volume * 500)}%` }}
                     />
                   </div>
                 )}

                 {/* Real-time Transcription Area */}
                 {isConnected && aiTranscription && (
                   <div className="relative pt-3 border-t border-cyan-500/20">
                     <div className="absolute top-3 left-0 text-[9px] text-cyan-500 uppercase tracking-widest flex items-center gap-1">
                       <MessageSquareText size={10} /> Live Transcript
                     </div>
                     <div className="mt-4 max-h-[120px] overflow-y-auto pr-1 text-xs text-cyan-50/80 leading-relaxed font-light scrollbar-thin">
                       {aiTranscription}
                       <div ref={transcriptEndRef} />
                     </div>
                   </div>
                 )}
              </div>
            </div>

            {/* Controls */}
            <div className="mt-auto">
               <div className="flex items-center gap-4">
                 <button
                    onClick={toggleVoice}
                    className={`
                      flex-1 py-4 rounded-xl border flex items-center justify-center gap-3 transition-all
                      ${isConnected 
                        ? 'bg-red-950/40 border-red-500/50 text-red-100 hover:bg-red-900/50' 
                        : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-100 hover:bg-cyan-900/50 hover:border-cyan-400/50'}
                    `}
                 >
                   {isConnected ? <MicOff size={20} /> : <Mic size={20} />}
                   <span className="text-sm tracking-wide font-medium">
                     {isConnected ? '대화 종료' : '음성 대화 시작'}
                   </span>
                 </button>
               </div>
               
               {error && (
                 <div className="mt-4 text-xs text-red-400 bg-red-950/20 p-2 rounded border border-red-500/20 text-center">
                   {error}
                 </div>
               )}
               
               <div className="mt-4 flex items-center justify-between text-[10px] text-cyan-500/40 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Radio size={10} /> 라이브 피드</span>
                  <span>Gemini v2.5 Flash</span>
               </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default App;