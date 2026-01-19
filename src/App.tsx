import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, ArrowRight, Database, Cpu, Calculator, Binary, Settings, ArrowDown, MonitorPlay } from 'lucide-react';

// --- Types & Constants ---

type MemoryCell = {
  address: number;
  content: string;
  type: 'instruction' | 'data' | 'empty';
  description?: string;
};

type Step = {
  id: number;
  phase: 'FETCH' | 'DECODE' | 'EXECUTE' | 'IDLE';
  title: string;
  message: string;
  activeComponents: string[]; // IDs of components to highlight
  busActive: { from: string; to: string; value: string } | null; // For animation
  pc?: number;
  ir?: string;
  acc?: number;
  mar?: number; // Memory Address Register (Virtual)
  mdr?: string; // Memory Data Register (Virtual)
  aluOperation?: string;
  memoryUpdates?: { address: number; value: string }[];
};

// Initial Memory State based on the storyboard
const INITIAL_MEMORY: MemoryCell[] = [
  { address: 0, content: 'LOAD 10', type: 'instruction', description: 'データ読込' },
  { address: 1, content: 'ADD 11', type: 'instruction', description: '加算' },
  { address: 2, content: 'STORE 12', type: 'instruction', description: '保存' },
  { address: 3, content: 'HALT', type: 'instruction', description: '終了' },
  { address: 4, content: '0000', type: 'empty' },
  { address: 10, content: '3', type: 'data', description: 'データA' },
  { address: 11, content: '5', type: 'data', description: 'データB' },
  { address: 12, content: '0', type: 'data', description: '結果格納用' },
];

// Scenario Script (The Storyboard Implementation)
const SCENARIO: Step[] = [
  // --- Cycle 0: Intro ---
  {
    id: 0,
    phase: 'IDLE',
    title: 'シミュレーション開始',
    message: 'CPUの仕組みを学習しましょう。右側がメモリ、左側がCPUです。現在は初期状態です。これからプログラムを実行して「3 + 5」の計算を行います。',
    activeComponents: [],
    busActive: null,
    pc: 0, acc: 0, ir: ''
  },
  
  // --- Cycle 1: LOAD 10 (Fetch) ---
  {
    id: 1,
    phase: 'FETCH',
    title: '命令フェッチ (アドレス指定)',
    message: 'まず、次に実行すべき命令がどこにあるかを確認します。「プログラムカウンタ(PC)」は「0番地」を指していますね。',
    activeComponents: ['PC', 'AddressBus', 'Memory'],
    busActive: { from: 'PC', to: 'Memory', value: '0' },
    pc: 0, acc: 0, ir: ''
  },
  {
    id: 2,
    phase: 'FETCH',
    title: '命令フェッチ (命令取出し)',
    message: 'メモリの0番地から命令を取り出します。「LOAD 10」という命令が、データバスを通ってCPUの「命令レジスタ(IR)」へ運ばれます。',
    activeComponents: ['Memory', 'DataBus', 'IR'],
    busActive: { from: 'Memory', to: 'IR', value: 'LOAD 10' },
    pc: 0, acc: 0, ir: 'LOAD 10'
  },
  {
    id: 3,
    phase: 'FETCH',
    title: 'PC更新',
    message: '命令を取り出したので、プログラムカウンタ(PC)を自動的に1つ進めます。これで次の準備もOKです。',
    activeComponents: ['PC'],
    busActive: null,
    pc: 1, acc: 0, ir: 'LOAD 10'
  },
  
  // --- Cycle 1: LOAD 10 (Decode/Execute) ---
  {
    id: 4,
    phase: 'DECODE',
    title: '命令解読 (デコード)',
    message: '制御装置が「LOAD 10」を解読します。「10番地のデータを、作業机(アキュムレータ)に持ってこい」という命令ですね。',
    activeComponents: ['CU', 'IR'],
    busActive: null,
    pc: 1, acc: 0, ir: 'LOAD 10'
  },
  {
    id: 5,
    phase: 'EXECUTE',
    title: '実行 (データ読出し)',
    message: '10番地のデータを読みに行きます。メモリの10番地には「3」が入っています。',
    activeComponents: ['CU', 'AddressBus', 'Memory'],
    busActive: { from: 'CU', to: 'Memory', value: '10' },
    pc: 1, acc: 0, ir: 'LOAD 10'
  },
  {
    id: 6,
    phase: 'EXECUTE',
    title: '実行 (データ格納)',
    message: 'データ「3」がデータバスを通って、アキュムレータ(ACC)に置かれました。これで計算の準備第一段階が完了です。',
    activeComponents: ['Memory', 'DataBus', 'ACC'],
    busActive: { from: 'Memory', to: 'ACC', value: '3' },
    pc: 1, acc: 3, ir: 'LOAD 10'
  },

  // --- Cycle 2: ADD 11 (Main Event) ---
  {
    id: 7,
    phase: 'FETCH',
    title: '命令フェッチ (アドレス指定)',
    message: 'さあ、次の命令に進みます。PCは「1番地」を指しています。',
    activeComponents: ['PC', 'AddressBus', 'Memory'],
    busActive: { from: 'PC', to: 'Memory', value: '1' },
    pc: 1, acc: 3, ir: '' // Clear IR visually for effect
  },
  {
    id: 8,
    phase: 'FETCH',
    title: '命令フェッチ (命令取出し)',
    message: '1番地の命令「ADD 11」を取り出して、命令レジスタに入れます。',
    activeComponents: ['Memory', 'DataBus', 'IR'],
    busActive: { from: 'Memory', to: 'IR', value: 'ADD 11' },
    pc: 1, acc: 3, ir: 'ADD 11'
  },
  {
    id: 9,
    phase: 'FETCH',
    title: 'PC更新',
    message: 'PCを「2」に進めます。',
    activeComponents: ['PC'],
    busActive: null,
    pc: 2, acc: 3, ir: 'ADD 11'
  },
  {
    id: 10,
    phase: 'DECODE',
    title: '命令解読 (デコード)',
    message: '制御装置(監督)が考えます。「ADD…これは足し算だ！演算装置(計算係)、準備してくれ！相手は11番地のデータだ！」',
    activeComponents: ['CU', 'IR', 'ALU'],
    busActive: null,
    pc: 2, acc: 3, ir: 'ADD 11'
  },
  {
    id: 11,
    phase: 'EXECUTE',
    title: '実行 (オペランド読出し)',
    message: '計算相手のデータを呼び寄せます。11番地には「5」が入っていますね。',
    activeComponents: ['CU', 'AddressBus', 'Memory'],
    busActive: { from: 'CU', to: 'Memory', value: '11' },
    pc: 2, acc: 3, ir: 'ADD 11'
  },
  {
    id: 12,
    phase: 'EXECUTE',
    title: '実行 (演算処理)',
    message: 'データ「5」が演算装置に届きました！元々あった「3」と、今来た「5」を合体させます！',
    activeComponents: ['Memory', 'DataBus', 'ALU'],
    busActive: { from: 'Memory', to: 'ALU', value: '5' },
    pc: 2, acc: 3, ir: 'ADD 11',
    aluOperation: '3 + 5'
  },
  {
    id: 13,
    phase: 'EXECUTE',
    title: '実行 (結果書込み)',
    message: '計算完了！ 3 + 5 = 8 です。結果の「8」がアキュムレータに上書きされます。',
    activeComponents: ['ALU', 'ACC'],
    busActive: { from: 'ALU', to: 'ACC', value: '8' },
    pc: 2, acc: 8, ir: 'ADD 11',
    aluOperation: 'Done'
  },

  // --- Cycle 3: STORE 12 ---
  {
    id: 14,
    phase: 'FETCH',
    title: '命令フェッチ',
    message: '計算結果を保存しましょう。PCは「2番地」を指しています。',
    activeComponents: ['PC', 'AddressBus', 'Memory'],
    busActive: { from: 'PC', to: 'Memory', value: '2' },
    pc: 2, acc: 8, ir: ''
  },
  {
    id: 15,
    phase: 'FETCH',
    title: '命令フェッチ',
    message: '「STORE 12」命令を取り出します。',
    activeComponents: ['Memory', 'DataBus', 'IR'],
    busActive: { from: 'Memory', to: 'IR', value: 'STORE 12' },
    pc: 2, acc: 8, ir: 'STORE 12'
  },
  {
    id: 16,
    phase: 'FETCH',
    title: 'PC更新',
    message: 'PCを「3」に進めます。',
    activeComponents: ['PC'],
    busActive: null,
    pc: 3, acc: 8, ir: 'STORE 12'
  },
  {
    id: 17,
    phase: 'DECODE',
    title: '命令解読',
    message: '「STORE 12」…これは「今の値を12番地に書き込め」という命令です。',
    activeComponents: ['CU', 'IR'],
    busActive: null,
    pc: 3, acc: 8, ir: 'STORE 12'
  },
  {
    id: 18,
    phase: 'EXECUTE',
    title: '実行 (データ書込み)',
    message: 'アキュムレータにある「8」を、データバスを通じてメモリの12番地に送ります。',
    activeComponents: ['ACC', 'DataBus', 'AddressBus', 'Memory'], // Use both buses conceptually
    busActive: { from: 'ACC', to: 'Memory', value: '8' },
    pc: 3, acc: 8, ir: 'STORE 12',
    memoryUpdates: [{ address: 12, value: '8' }]
  },
  {
    id: 19,
    phase: 'IDLE',
    title: '完了',
    message: 'これで一連の処理が完了しました。メモリの12番地に正しく「8」が保存されましたね。',
    activeComponents: ['Memory'],
    busActive: null,
    pc: 3, acc: 8, ir: 'HALT'
  }
];

export default function CpuSimulator() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [memory, setMemory] = useState<MemoryCell[]>(INITIAL_MEMORY);
  const [isAnimating, setIsAnimating] = useState(false);

  // Current Step Data
  const step = SCENARIO[currentStepIndex];

  // Reset simulation
  const handleReset = () => {
    setCurrentStepIndex(0);
    setMemory(INITIAL_MEMORY);
    setIsAnimating(false);
  };

  // Move to next step
  const handleNext = () => {
    if (currentStepIndex < SCENARIO.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const nextStep = SCENARIO[nextIndex];
      
      // Apply memory updates if any happen in the upcoming step
      if (nextStep.memoryUpdates) {
        const newMemory = [...memory];
        nextStep.memoryUpdates.forEach(update => {
          const cell = newMemory.find(m => m.address === update.address);
          if (cell) cell.content = update.value;
        });
        setMemory(newMemory);
      }
      
      setCurrentStepIndex(nextIndex);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000); // Reset animation flag
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      // Ideally we would revert memory, but for this simple sim, we can just reset memory on backward or keep it simple
      // For simplicity in this demo, going back doesn't revert "STORE" action on memory array visually immediately unless we structured history.
      // Re-sync memory to initial if we go back before step 18
      if (currentStepIndex <= 18) {
         const newMem = [...INITIAL_MEMORY];
         // If we are past step 18 in the *current* state (before clicking back), we might need to clear. 
         // But simplest is: if back is clicked, just reset memory to initial if index < 19.
         setMemory(INITIAL_MEMORY);
      }
    }
  };

  // --- Helper to check if component is active ---
  const isActive = (compName: string) => step.activeComponents.includes(compName);

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <header className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-indigo-700 flex items-center gap-2">
              <Cpu className="w-8 h-8" />
              CPU動作シミュレーター
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              フェッチ・デコード・実行の流れを体験しよう
            </p>
          </div>
          <div className="flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-lg">
             <div className="text-center">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">State</p>
                <p className={`font-bold ${
                  step.phase === 'FETCH' ? 'text-blue-600' : 
                  step.phase === 'DECODE' ? 'text-purple-600' : 
                  step.phase === 'EXECUTE' ? 'text-orange-600' : 'text-slate-600'
                }`}>
                  {step.phase}
                </p>
             </div>
             <div className="h-8 w-px bg-slate-300"></div>
             <div className="text-center">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Step</p>
                <p className="font-mono font-bold text-slate-700">{currentStepIndex + 1} / {SCENARIO.length}</p>
             </div>
          </div>
        </header>

        {/* Main Simulation Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          
          {/* LEFT: CPU */}
          <div className="lg:col-span-5 bg-white p-6 rounded-xl shadow-lg border-2 border-indigo-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-br-lg text-sm font-bold z-10">CPU (中央処理装置)</div>
            
            <div className="flex flex-col gap-8 mt-6">
              
              {/* Control Unit */}
              <div className={`border-2 rounded-lg p-4 transition-all duration-300 ${isActive('CU') ? 'border-purple-500 bg-purple-50 shadow-md scale-105' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center gap-2 mb-3 border-b border-slate-200 pb-2">
                  <Settings className={`w-5 h-5 ${isActive('CU') ? 'text-purple-600 animate-spin-slow' : 'text-slate-400'}`} />
                  <span className="font-bold text-slate-700">制御装置 (Control Unit)</span>
                </div>
                
                <div className="space-y-3">
                  {/* PC */}
                  <div className={`flex items-center justify-between p-2 rounded border transition-colors ${isActive('PC') ? 'bg-blue-100 border-blue-400' : 'bg-white border-slate-200'}`}>
                    <span className="text-xs font-bold text-slate-500">PC (プログラムカウンタ)</span>
                    <span className="font-mono text-xl font-bold text-blue-700">{step.pc}</span>
                  </div>

                  {/* IR */}
                  <div className={`flex items-center justify-between p-2 rounded border transition-colors ${isActive('IR') ? 'bg-purple-100 border-purple-400' : 'bg-white border-slate-200'}`}>
                    <span className="text-xs font-bold text-slate-500">IR (命令レジスタ)</span>
                    <span className="font-mono text-lg font-bold text-purple-700">{step.ir || "----"}</span>
                  </div>
                </div>
              </div>

              {/* ALU */}
              <div className={`border-2 rounded-lg p-4 transition-all duration-300 ${isActive('ALU') ? 'border-orange-500 bg-orange-50 shadow-md scale-105' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center gap-2 mb-3 border-b border-slate-200 pb-2">
                  <Calculator className={`w-5 h-5 ${isActive('ALU') ? 'text-orange-600' : 'text-slate-400'}`} />
                  <span className="font-bold text-slate-700">演算装置 (ALU)</span>
                </div>

                <div className="space-y-3">
                   {/* ALU Animation Display */}
                   <div className="h-16 flex items-center justify-center bg-slate-800 rounded text-green-400 font-mono text-sm relative overflow-hidden">
                      {isActive('ALU') && step.aluOperation ? (
                        <div className="animate-pulse flex flex-col items-center">
                           <span>CALCULATING...</span>
                           <span className="text-lg">{step.aluOperation}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">IDLE</span>
                      )}
                   </div>

                  {/* ACC */}
                  <div className={`flex items-center justify-between p-2 rounded border transition-colors ${isActive('ACC') ? 'bg-orange-100 border-orange-400' : 'bg-white border-slate-200'}`}>
                    <span className="text-xs font-bold text-slate-500">ACC (アキュムレータ)</span>
                    <span className="font-mono text-xl font-bold text-orange-700">{step.acc}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* MIDDLE: BUS Connections */}
          <div className="lg:col-span-2 flex flex-col justify-center items-center relative py-8">
            {/* Address Bus */}
            <div className="w-full h-8 bg-slate-200 relative mb-12 rounded-full border border-slate-300 flex items-center justify-center">
               <span className="absolute -top-5 text-xs text-slate-500 font-bold tracking-widest">ADDRESS BUS</span>
               {isActive('AddressBus') && (
                 <div className="w-full h-full bg-blue-100 rounded-full animate-pulse flex items-center justify-center overflow-hidden">
                    <ArrowRight className="text-blue-500 w-6 h-6 animate-slide-right" />
                 </div>
               )}
            </div>

            {/* Data Bus */}
            <div className="w-full h-12 bg-slate-200 relative mt-12 rounded-full border border-slate-300 flex items-center justify-center">
               <span className="absolute -top-5 text-xs text-slate-500 font-bold tracking-widest">DATA BUS</span>
               {isActive('DataBus') && (
                 <div className="w-full h-full bg-green-100 rounded-full animate-pulse flex items-center justify-center overflow-hidden">
                    <div className="flex gap-4">
                      <ArrowRight className="text-green-600 w-6 h-6" />
                      <ArrowRight className="text-green-600 w-6 h-6" />
                      <ArrowRight className="text-green-600 w-6 h-6" />
                    </div>
                 </div>
               )}
            </div>

            {/* Flying Packet Animation (Overlay) */}
            {step.busActive && (
              <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
                 <div className={`
                    bg-yellow-400 text-black font-bold px-4 py-2 rounded-full shadow-xl border-2 border-white
                    flex items-center gap-2 transform transition-all duration-1000
                    ${isAnimating ? 'opacity-100 scale-110 translate-y-0' : 'opacity-0 scale-75 translate-y-4'}
                 `}>
                    <span className="text-xs uppercase mr-1 opacity-70">DATA:</span>
                    {step.busActive.value}
                 </div>
              </div>
            )}
          </div>

          {/* RIGHT: MEMORY */}
          <div className="lg:col-span-5 bg-white p-6 rounded-xl shadow-lg border-2 border-green-100 relative">
             <div className="absolute top-0 right-0 bg-green-100 text-green-800 px-3 py-1 rounded-bl-lg text-sm font-bold z-10">Main Memory (主記憶装置)</div>
            
             <div className="mt-6 flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2">
                {memory.map((cell) => {
                  const isTarget = isActive('Memory') && (
                    (step.busActive?.to === 'Memory' && step.busActive?.value === cell.content) || 
                    (step.busActive?.from === 'Memory' && step.busActive?.value === cell.content) ||
                    (step.busActive?.from === 'CU' && step.busActive?.value === String(cell.address)) ||
                    (step.busActive?.from === 'PC' && step.busActive?.value === String(cell.address)) ||
                    (step.memoryUpdates?.some(u => u.address === cell.address))
                  );
                  
                  // Simple check: if the address bus has this address, highlight it
                  const isAddressed = isActive('AddressBus') && (String(step.busActive?.value) === String(cell.address));

                  return (
                    <div 
                      key={cell.address}
                      className={`
                        flex items-center p-2 rounded border-2 transition-all duration-300
                        ${isAddressed || isTarget ? 'border-yellow-400 bg-yellow-50 shadow-md ring-2 ring-yellow-200' : 'border-slate-100 hover:border-slate-200'}
                      `}
                    >
                      <div className="w-8 h-8 flex items-center justify-center bg-slate-200 text-slate-600 font-mono text-xs font-bold rounded mr-3">
                        {String(cell.address).padStart(2, '0')}
                      </div>
                      <div className="flex-1">
                         <div className={`font-mono font-bold ${cell.type === 'instruction' ? 'text-blue-700' : 'text-green-700'}`}>
                           {cell.content}
                         </div>
                         {cell.description && (
                           <div className="text-xs text-slate-400">{cell.description}</div>
                         )}
                      </div>
                      {cell.type === 'instruction' && <Binary className="w-4 h-4 text-blue-200" />}
                      {cell.type === 'data' && <Database className="w-4 h-4 text-green-200" />}
                    </div>
                  );
                })}
             </div>
          </div>
        </div>

        {/* BOTTOM: EXPLANATION PANEL */}
        <div className="bg-slate-800 text-white p-6 rounded-xl shadow-xl flex gap-6 items-start relative overflow-hidden">
           {/* Teacher Icon */}
           <div className="flex-shrink-0 z-10 hidden sm:block">
              <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center border-4 border-indigo-300">
                 <MonitorPlay className="w-8 h-8 text-white" />
              </div>
           </div>
           
           <div className="flex-1 z-10">
              <h3 className="text-indigo-300 font-bold mb-1 flex items-center gap-2">
                 {step.title}
              </h3>
              <p className="text-lg leading-relaxed font-medium">
                 {step.message}
              </p>
           </div>

           {/* Controls */}
           <div className="flex gap-2 z-10 mt-4 sm:mt-0">
              <button 
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 disabled:opacity-50 transition-colors text-sm font-bold flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> 戻る
              </button>
              
              {currentStepIndex < SCENARIO.length - 1 ? (
                <button 
                  onClick={handleNext}
                  className="px-6 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-105 active:scale-95 text-sm font-bold flex items-center gap-2"
                >
                  次へ進む <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={handleReset}
                  className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded shadow-lg transition-all text-sm font-bold flex items-center gap-2"
                >
                  最初からやり直す <RotateCcw className="w-4 h-4" />
                </button>
              )}
           </div>

           {/* Background Decoration */}
           <div className="absolute -right-10 -bottom-10 opacity-10">
              <Cpu className="w-40 h-40 text-white" />
           </div>
        </div>

      </div>

      <style>{`
        @keyframes slide-right {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        .animate-slide-right {
          animation: slide-right 1s infinite linear;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}