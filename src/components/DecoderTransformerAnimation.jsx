// DecoderTransformerAnimation.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './DecoderTransformerAnimation.css';

// --- Constants ---
const NUM_LAYERS = 3;
const MAX_SEQ_LEN = 10;
const VOCAB = ["<start>", "The", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", ".", "<end>"];
// REMOVED: const ANIMATION_DELAY_MS = 400;

const DecoderTransformerAnimation = () => {
  // --- State ---
  const [sequence, setSequence] = useState(["<start>"]);
  const [currentStep, setCurrentStep] = useState('idle');
  const [processingTokenIndex, setProcessingTokenIndex] = useState(0);
  const [currentLayerViz, setCurrentLayerViz] = useState(0);
  const [attentionHighlight, setAttentionHighlight] = useState({ active: false, targetIdx: -1, sourceIdx: -1 });
  const [predictedToken, setPredictedToken] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [animationDelay, setAnimationDelay] = useState(500); // <-- Add speed state (default 500ms)

  // --- Refs ---
  const timeoutId = useRef(null);
  const isRunningRef = useRef(isRunning);

  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

  // --- Helper: Get next likely token (Keep as before) ---
  const getNextToken = useCallback((currentSequence) => { /* ... same ... */ const lastToken = currentSequence[currentSequence.length - 1]; const currentIndex = VOCAB.indexOf(lastToken); if (currentIndex === -1 || lastToken === "." || lastToken === "<end>") { return "<end>"; } if (currentIndex >= VOCAB.length - 2) { return "<end>"; } return VOCAB[currentIndex + 1]; }, []);

  // --- Animation Step Logic (Use animationDelay state) ---
  const runAnimationStep = useCallback(() => {
    setSequence(prevSequence => {
        const currentProcessIdx = prevSequence.length - 1;
        let nextSeq = prevSequence;
        let nextStep = currentStep;
        let nextLayer = currentLayerViz;
        let nextAttention = { active: false, targetIdx: -1, sourceIdx: -1 };
        let nextPredicted = predictedToken;
        let shouldStop = false;

         if (currentStep === 'idle' || currentStep === 'append') {
              if (prevSequence.length >= MAX_SEQ_LEN || prevSequence[prevSequence.length-1] === '<end>') {
                  shouldStop = true;
                  nextStep = 'idle';
              }
         }

         if (!shouldStop) {
             switch (currentStep) { // Logic based on `currentStep` read from state
                 case 'idle':
                 case 'append':
                     nextStep = 'embedding'; nextLayer = 0; nextPredicted = null;
                     break;
                 case 'embedding':
                     nextStep = 'layer_process'; nextLayer = 0;
                     break;
                 case 'layer_process':
                     nextStep = 'attention'; nextAttention = { active: true, targetIdx: currentProcessIdx, sourceIdx: currentProcessIdx };
                     break;
                 case 'attention':
                     if (attentionHighlight.sourceIdx > 0) {
                         nextAttention = { active: true, targetIdx: currentProcessIdx, sourceIdx: attentionHighlight.sourceIdx - 1 }; nextStep = 'attention';
                     } else {
                         nextAttention = { active: false, targetIdx: -1, sourceIdx: -1 }; nextStep = 'ffn';
                     }
                     break;
                 case 'ffn':
                     if (currentLayerViz < NUM_LAYERS - 1) {
                         nextLayer = currentLayerViz + 1; nextStep = 'layer_process';
                     } else {
                         nextStep = 'predict';
                     }
                     break;
                 case 'predict':
                     nextPredicted = getNextToken(prevSequence); nextStep = 'append';
                     break;
                 default:
                     nextStep = 'idle'; shouldStop = true;
                     break;
             }
         }

         setCurrentStep(nextStep);
         setCurrentLayerViz(nextLayer);
         setAttentionHighlight(nextAttention);
         setPredictedToken(nextPredicted);
         setProcessingTokenIndex(prevSequence.length);

         if (nextStep === 'append') {
             if (nextPredicted && nextPredicted !== '<end>' && prevSequence.length < MAX_SEQ_LEN) {
                 nextSeq = [...prevSequence, nextPredicted];
             } else if (prevSequence[prevSequence.length-1] !== '<end>') {
                 nextSeq = [...prevSequence, '<end>']; shouldStop = true; setCurrentStep('idle');
             } else {
                 shouldStop = true; setCurrentStep('idle');
             }
         } else if (shouldStop) {
             setCurrentStep('idle');
         }

         clearTimeout(timeoutId.current);
         if (isRunningRef.current && !shouldStop) {
            // Use animationDelay state here
            timeoutId.current = setTimeout(runAnimationStep, animationDelay);
         } else if (shouldStop) {
            setIsRunning(false);
         }

         return nextSeq;
    });

  }, [currentStep, currentLayerViz, attentionHighlight, predictedToken, getNextToken, animationDelay]); // Added animationDelay dependency


   // --- Animation Control Effect ---
   useEffect(() => {
     if (isRunning) {
       clearTimeout(timeoutId.current);
       // Use animationDelay state for the first step too
       timeoutId.current = setTimeout(runAnimationStep, animationDelay / 2); // Start slightly faster
     } else {
       clearTimeout(timeoutId.current);
     }
     return () => clearTimeout(timeoutId.current);
     // Added animationDelay dependency here too
   }, [isRunning, runAnimationStep, animationDelay]);


  // --- Handlers ---
  const handleStartPause = () => setIsRunning(prev => !prev);
  const handleReset = () => {
    setIsRunning(false);
    clearTimeout(timeoutId.current);
    setSequence(["<start>"]);
    setCurrentStep('idle');
    setProcessingTokenIndex(0);
    setCurrentLayerViz(0);
    setAttentionHighlight({ active: false, targetIdx: -1, sourceIdx: -1 });
    setPredictedToken(null);
  };
  const handleAddToken = () => { /* ... same ... */ if (!isRunning && sequence[sequence.length-1] !== '<end>' && sequence.length < MAX_SEQ_LEN) { const nextToken = getNextToken(sequence); if (nextToken) { if (nextToken === '<end>') { if(sequence[sequence.length - 1] !== '<end>') { setSequence(prev => [...prev, nextToken]); } } else if (sequence.length < MAX_SEQ_LEN) { setSequence(prev => [...prev, nextToken]); } } setCurrentStep('idle'); } };
  // Handler for speed slider
  const handleSpeedChange = (event) => {
      setAnimationDelay(parseInt(event.target.value, 10));
  };

  // --- Rendering Logic (Keep as before) ---
  const renderToken = (token, index) => { /* ... same ... */ const isProcessing = currentStep !== 'idle' && currentStep !== 'append' && index === sequence.length - 1; const isAttentionSource = attentionHighlight.active && index === attentionHighlight.sourceIdx; const isAttentionTarget = attentionHighlight.active && index === attentionHighlight.targetIdx; const isEmbedding = currentStep === 'embedding' && index === sequence.length -1; let classes = "token"; if (isProcessing && !isAttentionSource) classes += " token-processing"; if (isEmbedding) classes += " token-embedding"; if (isAttentionSource) classes += " token-attention-source"; if (isAttentionTarget && !isAttentionSource) classes += " token-attention-target"; return <div key={index} className={classes}>{token}</div>; };
  const renderLayer = (layerIndex) => { /* ... same ... */ const isLayerActive = currentStep !== 'idle' && currentStep !== 'embedding' && currentStep !== 'predict' && currentStep !== 'append' && currentLayerViz === layerIndex; const isAttentionActive = isLayerActive && currentStep === 'attention'; const isFfnActive = isLayerActive && currentStep === 'ffn'; return ( <div key={layerIndex} className={`transformer-layer ${isLayerActive ? 'layer-active' : ''}`}> <div className={`layer-block block-attention ${isAttentionActive ? 'block-active' : ''}`}> Masked Self-Attention {isAttentionActive && attentionHighlight.active && ( <div className="attention-arrow" style={{ top: `${50}%`, left: `${((attentionHighlight.sourceIdx + 0.5) / (sequence.length || 1)) * 100}%`, width: `${Math.max(0, (attentionHighlight.targetIdx - attentionHighlight.sourceIdx) / (sequence.length || 1)) * 100}%`, opacity: 1 }}></div> )} </div> <div className={`layer-block block-ffn ${isFfnActive ? 'block-active' : ''}`}> Feed Forward </div> </div> ); };

  // --- JSX ---
  return (
    <div className="transformer-container">
      <h3>Decoder-Only Transformer (Conceptual Animation)</h3>
      <div className="transformer-controls">
        <button onClick={handleStartPause}>{isRunning ? 'Pause Gen' : 'Start Gen'}</button>
        <button onClick={handleReset}>Reset</button>
        <button onClick={handleAddToken} disabled={isRunning || sequence[sequence.length-1] === '<end>' || sequence.length >= MAX_SEQ_LEN}>
             Next Token Step (Manual)
        </button>
        {/* Speed Slider */}
        <div className="control-slider">
            <label htmlFor="tf-speed">Speed (Delay ms): {animationDelay}</label>
            <input
                type="range"
                id="tf-speed"
                min="100"  // Fastest (100ms delay)
                max="1500" // Slowest (1.5s delay)
                step="50"
                value={animationDelay}
                onChange={handleSpeedChange}
                // disabled={isRunning} // Optional: disable slider while running?
            />
        </div>
      </div>

      {/* Rest of the JSX remains the same */}
      <div className="sequence-container input-sequence"> <div className="sequence-label">Input Sequence:</div> <div className="tokens"> {sequence.map(renderToken)} {(currentStep !== 'idle' && currentStep !== 'append' && sequence[sequence.length-1] !== '<end>' && sequence.length < MAX_SEQ_LEN) && <div className="token token-predicting">?</div>} </div> </div>
      <div className={`embedding-layer ${currentStep === 'embedding' ? 'embedding-active' : ''}`}> Input + Positional Embeddings </div>
      <div className="transformer-stack"> {Array.from({ length: NUM_LAYERS }).map((_, i) => renderLayer(i))} </div>
      <div className={`output-layer ${currentStep === 'predict' || currentStep === 'append' ? 'output-active' : ''}`}> Linear + Softmax (Prediction) {predictedToken && <div className="predicted-token">Predicted: <strong>{predictedToken}</strong></div>} </div>
      <div className="transformer-info"> <span>Status: {currentStep}</span> <span>Len: {sequence.length}</span> <span>Layer: {currentStep === 'layer_process' || currentStep === 'attention' || currentStep === 'ffn' ? currentLayerViz + 1 : 'N/A'}</span> </div>

    </div>
  );
};

export default DecoderTransformerAnimation;