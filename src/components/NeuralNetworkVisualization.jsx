// NeuralNetworkVisualization.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './NeuralNetworkVisualization.css';

// --- (Keep existing Icon components) ---
const ZapIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path> </svg> );
const InfoIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <circle cx="12" cy="12" r="10"></circle> <path d="M12 16v-4"></path> <path d="M12 8h.01"></path> </svg> );
const ArrowRightIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M5 12h14"></path> <path d="m12 5 7 7-7 7"></path> </svg> );
const ArrowLeftIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M19 12H5"></path> <path d="m12 19-7-7 7-7"></path> </svg> );
// --- (End of Icon components) ---


const NeuralNetworkVisualization = () => {
  // --- (Keep existing state, layer config, utility functions) ---
  const [activeLayer, setActiveLayer] = useState(null);
  const [animationStep, setAnimationStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showInfo, setShowInfo] = useState(null);
  const [speed, setSpeed] = useState(2);
  const [showWeights, setShowWeights] = useState(false);
  const [activationFunction, setActivationFunction] = useState('relu');
  const [showActivationLayer, setShowActivationLayer] = useState(true);
  const [highlightBias, setHighlightBias] = useState(false);
  const [mode, setMode] = useState('forward');
  const [errorRate, setErrorRate] = useState(0.15);
  const [epoch, setEpoch] = useState(1);

  const layers = [
    { id: 'input', name: 'Input Layer', neurons: 4, description: 'Receives raw input data...', hasBias: false, hasActivation: false },
    { id: 'hidden1', name: 'Hidden Layer 1', neurons: 6, description: 'Processes information...', hasBias: true, hasActivation: true },
    { id: 'hidden2', name: 'Hidden Layer 2', neurons: 5, description: 'Further processes features...', hasBias: true, hasActivation: true },
    { id: 'output', name: 'Output Layer', neurons: 3, description: 'Produces the final prediction...', hasBias: true, hasActivation: true }
  ]; // Simplified descriptions

  const generateWeights = () => { /* ... keep existing ... */ const weights = {}; layers.slice(0, -1).forEach((layer, layerIndex) => { const nextLayer = layers[layerIndex + 1]; weights[`${layer.id}-${nextLayer.id}`] = Array.from({ length: layer.neurons }).map(() => Array.from({ length: nextLayer.neurons }).map(() => ((Math.random() * 2) - 1).toFixed(2)) ); }); return weights; };
  const generateBiases = () => { /* ... keep existing ... */ const biases = {}; layers.forEach(layer => { if (layer.hasBias) { biases[layer.id] = Array.from({ length: layer.neurons }).map(() => ((Math.random() * 2) - 1).toFixed(2) ); } }); return biases; };
  const generateGradients = () => { /* ... keep existing ... */ const gradients = {}; layers.slice(0, -1).forEach((layer, layerIndex) => { const nextLayer = layers[layerIndex + 1]; gradients[`${layer.id}-${nextLayer.id}`] = Array.from({ length: layer.neurons }).map(() => Array.from({ length: nextLayer.neurons }).map(() => ((Math.random() * 0.2) - 0.1).toFixed(3)) ); }); layers.forEach(layer => { if (layer.hasBias) { gradients[`bias-${layer.id}`] = Array.from({ length: layer.neurons }).map(() => ((Math.random() * 0.2) - 0.1).toFixed(3) ); } }); return gradients; };
  const activationFunctions = { /* ... keep existing ... */ relu: { name: 'ReLU', description: 'Rectified Linear Unit: f(x) = max(0, x)', function: (x) => Math.max(0, x), graph: (ctx, width, height) => { ctx.beginPath(); ctx.moveTo(0, height/2); ctx.lineTo(width/2, height/2); ctx.lineTo(width, 0); ctx.stroke(); } }, sigmoid: { name: 'Sigmoid', description: 'Sigmoid: f(x) = 1 / (1 + e^(-x))', function: (x) => 1 / (1 + Math.exp(-x)), graph: (ctx, width, height) => { ctx.beginPath(); for (let x = 0; x < width; x++) { const normalizedX = (x / width) * 10 - 5; const y = height - (height / (1 + Math.exp(-normalizedX))); if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); } }, tanh: { name: 'Tanh', description: 'Hyperbolic Tangent: f(x) = (e^x - e^(-x)) / (e^x + e^(-x))', function: (x) => Math.tanh(x), graph: (ctx, width, height) => { ctx.beginPath(); for (let x = 0; x < width; x++) { const normalizedX = (x / width) * 10 - 5; const y = height/2 * (1 - Math.tanh(normalizedX)); if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); } }, softmax: { name: 'Softmax', description: 'Softmax: converts outputs to probabilities...', function: (x) => Math.exp(x), graph: (ctx, width, height) => { ctx.beginPath(); ctx.moveTo(0, height); ctx.bezierCurveTo(width/3, height/2, width/2, 0, width, 0); ctx.stroke(); } } };


  const [weights, setWeights] = useState(() => generateWeights());
  const [biases, setBiases] = useState(() => generateBiases());
  const [gradients, setGradients] = useState(() => generateGradients());

  // --- Refs and State for Coordinates ---
  const svgRef = useRef(null);
  const visualizationContainerRef = useRef(null); // Ref for the main container
  const [neuronCoords, setNeuronCoords] = useState({});

  // --- Function to Calculate Coords ---
  // Use useCallback, but remove neuronCoords from dependencies
  const calculateCoords = useCallback(() => {
    // Ensure refs are current
    if (!svgRef.current || !visualizationContainerRef.current) {
        // console.warn("Refs not ready for coordinate calculation.");
        return;
    }

    const svgRect = svgRef.current.getBoundingClientRect();
    // Check if SVG has valid dimensions (might be 0 if hidden or not rendered)
    if (svgRect.width === 0 || svgRect.height === 0) {
        // console.warn("SVG has no dimensions, skipping coordinate calculation.");
        return;
    }

    const newCoords = {};
    // Query relative to the visualization container, not the SVG's parent
    const neuronElements = visualizationContainerRef.current.querySelectorAll('.neuron[data-layer-id]');

    if (neuronElements.length === 0) {
        // console.warn("No neuron elements found for coordinate calculation.");
        return;
    }

    neuronElements.forEach(neuronEl => {
        const layerId = neuronEl.dataset.layerId;
        const neuronIndex = parseInt(neuronEl.dataset.neuronIndex, 10);
        const key = `${layerId}-${neuronIndex}`;

        const neuronRect = neuronEl.getBoundingClientRect();
        // Check if neuron has valid dimensions
        if (neuronRect.width === 0 || neuronRect.height === 0) {
            // console.warn(`Neuron ${key} has no dimensions.`);
            return; // Skip this neuron if it has no size
        }

        const centerX = neuronRect.left + neuronRect.width / 2;
        const centerY = neuronRect.top + neuronRect.height / 2;

        // Convert to SVG coordinate space
        const svgX = centerX - svgRect.left;
        const svgY = centerY - svgRect.top;

        newCoords[key] = { x: svgX, y: svgY };
    });

    // Update state only if coords actually changed
    // Use a more robust check than JSON.stringify for objects
    const currentKeys = Object.keys(neuronCoords);
    const newKeys = Object.keys(newCoords);
    let changed = currentKeys.length !== newKeys.length;
    if (!changed) {
        for (const key of newKeys) {
            if (!neuronCoords[key] || neuronCoords[key].x !== newCoords[key].x || neuronCoords[key].y !== newCoords[key].y) {
                changed = true;
                break;
            }
        }
    }

    if (changed && newKeys.length > 0) { // Only update if changed and we have some coords
        // console.log("Updating neuron coordinates:", newCoords);
        setNeuronCoords(newCoords);
    }
  }, []); // REMOVED neuronCoords dependency

  // --- Effect to Calculate Coords on Mount and Resize ---
  useEffect(() => {
    // Initial calculation might need a slight delay if layout takes time
    const timerId = setTimeout(calculateCoords, 50); // Small delay (e.g., 50ms)

    window.addEventListener('resize', calculateCoords);
    return () => {
      clearTimeout(timerId);
      window.removeEventListener('resize', calculateCoords);
    };
  }, [calculateCoords]); // Effect depends on the stable calculateCoords function

   // Memoize updateWeights to stabilize its reference
   const updateWeights = useCallback(() => {
    const newWeights = { ...weights };
    layers.slice(0, -1).forEach((layer, layerIndex) => {
      const nextLayer = layers[layerIndex + 1];
      const weightKey = `${layer.id}-${nextLayer.id}`;
      const gradientKey = weightKey;
      if (weights[weightKey] && gradients[gradientKey]) {
        newWeights[weightKey] = weights[weightKey].map((neuronWeights, i) =>
          neuronWeights.map((weight, j) => {
            const newValue = (parseFloat(weight) - 0.1 * parseFloat(gradients[gradientKey][i][j])).toFixed(2);
            return newValue;
          })
        );
      }
    });
    const newBiases = { ...biases };
    layers.forEach(layer => {
      if (layer.hasBias) {
        const biasKey = layer.id;
        const gradientKey = `bias-${layer.id}`;
        if (biases[biasKey] && gradients[gradientKey]) {
          newBiases[biasKey] = biases[biasKey].map((bias, i) => {
            const newValue = (parseFloat(bias) - 0.1 * parseFloat(gradients[gradientKey][i])).toFixed(2);
            return newValue;
          });
        }
      }
    });
    setWeights(newWeights);
    setBiases(newBiases);
  }, [weights, biases, gradients, layers]); // Include all dependencies

  // --- Animation useEffect ---
  useEffect(() => {
    let timer;
    if (isRunning) {
      timer = setInterval(() => {
        setAnimationStep(prevStep => {
          const newStep = (prevStep + 1) % 100;
          if (mode === 'forward' && newStep === 0) {
            setMode('backward');
            setErrorRate(prev => Math.max(0.01, prev * 0.85));
            setEpoch(prev => prev + 1);
            setGradients(generateGradients()); // generateGradients doesn't depend on state, safe to call
            return 0;
          }
          if (mode === 'backward' && newStep === 0) {
            setMode('forward');
            updateWeights(); // Call the memoized version
            return 0;
          }
          return newStep;
        });
      }, 600 / speed);
    }
    return () => clearInterval(timer);
  }, [isRunning, speed, mode, updateWeights]); // Depend on the memoized updateWeights

  // --- Keep other utility functions (getSignalPosition, etc.) ---
  const getSignalPosition = (step) => { /* ... keep existing ... */ return Math.min(100, step * 1.5); };
  const getBackwardSignalPosition = (step) => { /* ... keep existing ... */ return Math.max(0, 100 - (step * 1.5)); };
  const shouldHighlightConnection = (layerIndex, fromNeuron, toNeuron) => { /* ... keep existing ... */ if (mode === 'forward') { const signalPos = getSignalPosition(animationStep); const layerSegmentWidth = 100 / (layers.length - 1); const currentSegment = Math.floor(signalPos / layerSegmentWidth); return currentSegment === layerIndex && ((animationStep % 7 === fromNeuron % 3) || (animationStep % 5 === toNeuron % 3)); } else { const signalPos = getBackwardSignalPosition(animationStep); const layerSegmentWidth = 100 / (layers.length - 1); const currentSegment = Math.floor(signalPos / layerSegmentWidth); return currentSegment === layerIndex && ((animationStep % 7 === toNeuron % 3) || (animationStep % 5 === fromNeuron % 3)); } };
  const getWeightColor = (weight) => { /* ... keep existing ... */ const value = parseFloat(weight); if (value > 0) { const intensity = Math.min(255, Math.round(Math.abs(value) * 200) + 55); return `rgb(0, ${intensity}, ${intensity})`; } else { const intensity = Math.min(255, Math.round(Math.abs(value) * 200) + 55); return `rgb(${intensity}, 0, ${intensity})`; } };
  const getGradientColor = (gradient) => { /* ... keep existing ... */ const value = parseFloat(gradient); if (value > 0) { const intensity = Math.min(255, Math.round(Math.abs(value) * 1000) + 100); return `rgb(${intensity}, ${intensity/2}, 0)`; } else { const intensity = Math.min(255, Math.round(Math.abs(value) * 1000) + 100); return `rgb(${intensity/2}, 0, ${intensity})`; } };
  const getNeuronActivation = (layerIndex, neuronIndex) => { /* ... keep existing ... */ if (mode === 'forward') { const signalPos = getSignalPosition(animationStep); const layerSegmentWidth = 100 / (layers.length - 1); const layerStart = layerIndex * layerSegmentWidth; const layerEnd = (layerIndex + 1) * layerSegmentWidth; if (signalPos >= layerStart) { if (signalPos < layerEnd) { return Math.sin((animationStep * 0.2) + (neuronIndex * 0.7)) * 0.5 + 0.5; } else { return Math.sin((animationStep * 0.1) + (neuronIndex * 0.5)) * 0.3 + 0.7; } } return 0.2; } else { const signalPos = getBackwardSignalPosition(animationStep); const layerSegmentWidth = 100 / (layers.length - 1); const layerStart = layerIndex * layerSegmentWidth; const layerEnd = (layerIndex + 1) * layerSegmentWidth; if (signalPos <= layerEnd) { if (signalPos > layerStart) { return Math.sin((animationStep * 0.2) + (neuronIndex * 0.7)) * 0.5 + 0.5; } else { return Math.sin((animationStep * 0.1) + (neuronIndex * 0.5)) * 0.3 + 0.7; } } return 0.2; } };
  const drawActivationGraph = (canvas) => { /* ... keep existing ... */ if (!canvas) return; const ctx = canvas.getContext('2d'); const width = canvas.width; const height = canvas.height; ctx.clearRect(0, 0, width, height); ctx.strokeStyle = "#555555"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, height/2); ctx.lineTo(width, height/2); ctx.moveTo(width/2, 0); ctx.lineTo(width/2, height); ctx.stroke(); ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 2; activationFunctions[activationFunction].graph(ctx, width, height); };
  const ActivationFunctionDisplay = ({ layerId }) => { /* ... keep existing ... */ const canvasRef = useRef(null); useEffect(() => { if (canvasRef.current) { drawActivationGraph(canvasRef.current); } }, [activationFunction]); return ( <div className="activation-function"> <ZapIcon /> <canvas ref={canvasRef} width={40} height={40} /> </div> ); };


  return (
    <div className="neural-network-container">
      {/* --- Keep Header, Training Info, Controls --- */}
       <div className="header"> <h2>Neural Network Architecture</h2> <div className="controls"> <button onClick={() => setIsRunning(!isRunning)} className={isRunning ? 'stop-btn' : 'start-btn'}> {isRunning ? 'Pause' : 'Animate'} </button> <div className="speed-control"> <span>Speed:</span> <input type="range" min="1" max="5" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} /> </div> </div> </div>
       <div className="training-info"> <div className="mode-indicator"> <span className="mode-label">Mode:</span> <span className={`mode-value ${mode}`}> {mode === 'forward' ? 'Forward Propagation' : 'Backpropagation'} {mode === 'forward' ? <ArrowRightIcon /> : <ArrowLeftIcon />} </span> </div> <div className="epoch-display"> <span>Epoch: {epoch}</span> </div> <div className="error-display"> <span>Error: {(errorRate * 100).toFixed(1)}%</span> <div className="error-bar"> <div className="error-fill" style={{ width: `${errorRate * 100}%` }}></div> </div> </div> </div>
       <div className="visualization-controls"> <div className="control-group"> <label> <input type="checkbox" checked={showWeights} onChange={() => setShowWeights(!showWeights)} /> Show Weights </label> </div> <div className="control-group"> <label> <input type="checkbox" checked={showActivationLayer} onChange={() => setShowActivationLayer(!showActivationLayer)} /> Show Activation Layers </label> </div> <div className="control-group"> <label> <input type="checkbox" checked={highlightBias} onChange={() => setHighlightBias(!highlightBias)} /> Highlight Bias </label> </div> <div className="control-group activation-select"> <span>Activation:</span> <select value={activationFunction} onChange={(e) => setActivationFunction(e.target.value)}> {Object.keys(activationFunctions).map(key => ( <option key={key} value={key}>{activationFunctions[key].name}</option> ))} </select> </div> </div>

      {/* Add ref to the container */}
      <div ref={visualizationContainerRef} className="network-visualization">
        <div className="network-layers">
          {/* --- Keep Layer Column and Neuron rendering (with data attributes) --- */}
           {layers.map((layer, layerIndex) => (
            <div key={layer.id} className="layer-column" onMouseEnter={() => setActiveLayer(layerIndex)} onMouseLeave={() => setActiveLayer(null)}>
              <div className="layer-header"> <button className="info-button" onClick={() => setShowInfo(showInfo === layer.id ? null : layer.id)}> <InfoIcon /> </button> <h3>{layer.name}</h3> </div>
              <div className="neurons">
                {Array.from({ length: layer.neurons }).map((_, neuronIndex) => {
                  const activation = getNeuronActivation(layerIndex, neuronIndex);
                  const biasValue = layer.hasBias && biases[layer.id] ? biases[layer.id][neuronIndex] : null;
                  const showBiasHighlight = highlightBias && biasValue !== null;
                  const biasGradient = (mode === 'backward' && layer.hasBias && gradients[`bias-${layer.id}`]) ? gradients[`bias-${layer.id}`][neuronIndex] : null;
                  const neuronStyle = { backgroundColor: `rgba(0, 255, 255, ${activation})`, boxShadow: `0 0 ${Math.round(activation * 15)}px ${Math.round(activation * 5)}px rgba(0, 255, 255, ${activation * 0.7})`, };
                  return (
                    <div key={`${layer.id}-${neuronIndex}`} className="neuron-container">
                        <div className="neuron" style={neuronStyle} data-layer-id={layer.id} data-neuron-index={neuronIndex} >
                            {layer.id === 'input' && <span className="neuron-label input-label">x{neuronIndex + 1}</span>}
                            {layer.id === 'output' && <span className="neuron-label output-label">y{neuronIndex + 1}</span>}
                            {showBiasHighlight && <div className="bias-indicator">b</div>}
                        </div>
                        {showBiasHighlight && ( <div className="bias-value"> {biasValue} {mode === 'backward' && biasGradient && ( <span className="gradient-value" style={{ color: getGradientColor(biasGradient) }}> {biasGradient > 0 ? '+' : ''}{biasGradient} </span> )} </div> )}
                    </div> );
                })}
              </div>
              {showInfo === layer.id && ( <div className="layer-info"> <h4>{layer.name}</h4> <p>{layer.description || 'Layer description placeholder.'}</p> <p><strong>Neurons:</strong> {layer.neurons}</p> {layer.hasBias && <p><strong>Bias:</strong> Yes</p>} {layer.hasActivation && ( <p><strong>Activation:</strong> {activationFunctions[activationFunction].name}</p> )} </div> )}
            </div>
          ))}
        </div>

        {/* --- Keep Activation function layers rendering --- */}
        {showActivationLayer && ( <div className="activation-layers"> {layers.map((layer) => ( <div key={`activation-${layer.id}`} className="activation-column"> {layer.hasActivation && ( <div className="activation-wrapper"> <ActivationFunctionDisplay layerId={layer.id} /> </div> )} </div> ))} </div> )}

        {/* Connections SVG (with ref) */}
        <svg ref={svgRef} className="connections-svg">
           {/* --- Keep SVG Line and Label Rendering (using neuronCoords) --- */}
           {Object.keys(neuronCoords).length > 0 && layers.slice(0, -1).map((layer, layerIndex) => {
            const nextLayer = layers[layerIndex + 1];
            const connections = [];
            const layerWeights = weights[`${layer.id}-${nextLayer.id}`] || [];
            const layerGradients = gradients[`${layer.id}-${nextLayer.id}`] || [];

            for (let i = 0; i < layer.neurons; i++) {
              const startKey = `${layer.id}-${i}`;
              const startCoord = neuronCoords[startKey];
              if (!startCoord) continue;

              for (let j = 0; j < nextLayer.neurons; j++) {
                const endKey = `${nextLayer.id}-${j}`;
                const endCoord = neuronCoords[endKey];
                if (!endCoord) continue;

                const isHighlighted = shouldHighlightConnection(layerIndex, i, j);
                const weightValue = layerWeights[i] ? layerWeights[i][j] : "0.00";
                const weightColor = getWeightColor(weightValue);
                const weightWidth = showWeights ? Math.max(0.5, Math.min(3, Math.abs(parseFloat(weightValue)) * 3)) : (isHighlighted ? 2 : 1);
                const gradientValue = mode === 'backward' && layerGradients[i] ? layerGradients[i][j] : null;
                const gradientColor = gradientValue ? getGradientColor(gradientValue) : null;

                connections.push( <line key={`${startKey}-${endKey}`} x1={startCoord.x} y1={startCoord.y} x2={endCoord.x} y2={endCoord.y} stroke={mode === 'backward' && isHighlighted && gradientValue ? gradientColor : (showWeights ? weightColor : (isHighlighted ? "#00ffff" : "#444444"))} strokeWidth={weightWidth} strokeOpacity={isHighlighted || showWeights ? 1 : 0.5} strokeDasharray={mode === 'backward' && isHighlighted ? "4 2" : "0"} /> );

                if ((showWeights && isHighlighted) || (mode === 'backward' && isHighlighted && gradientValue)) {
                    const midX = (startCoord.x + endCoord.x) / 2;
                    const midY = (startCoord.y + endCoord.y) / 2;
                    const rectHeight = mode === 'backward' && gradientValue ? 28 : 16;
                    const rectYOffset = mode === 'backward' && gradientValue ? -14 : -8;
                    const textYOffset1 = mode === 'backward' && gradientValue ? -6 : 0;
                    const textYOffset2 = 6;
                    connections.push( <g key={`label-${startKey}-${endKey}`}> <rect x={midX - 15} y={midY + rectYOffset} width="30" height={rectHeight} rx="2" fill="#222222" stroke="#444444" strokeWidth="1" /> <text x={midX} y={midY + textYOffset1} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill={weightValue >= 0 ? "#00ffff" : "#ff00ff"}> {weightValue} </text> {mode === 'backward' && gradientValue && ( <text x={midX} y={midY + textYOffset2} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill={gradientColor} > {gradientValue > 0 ? '+' : ''}{gradientValue} </text> )} </g> );
                }
              }
            }
            return connections;
          })}
        </svg>

        {/* --- Keep Data flow animation div --- */}
        <div className="signal-overlay" style={{ width: mode === 'forward' ? `${getSignalPosition(animationStep)}%` : '100%', left: mode === 'forward' ? '0' : 'auto', right: mode === 'backward' ? '0' : 'auto', background: mode === 'forward' ? 'linear-gradient(90deg, rgba(0,255,255,0.1) 0%, rgba(0,255,255,0) 100%)' : 'linear-gradient(270deg, rgba(255,165,0,0.1) 0%, rgba(255,165,0,0) 100%)' }} />

      </div>

      {/* --- Keep Legend div --- */}
      <div className="legend"> <h3>Neural Network Components</h3> <div className="legend-content"> <div className="legend-items"> <div className="legend-item"> <div className="legend-color" style={{ backgroundColor: '#00ffff', boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)' }}></div> <span className="legend-label">Neurons (process signals)</span> </div> <div className="legend-item"> <div className="legend-color" style={{ backgroundColor: '#444444' }}></div> <span className="legend-label">Connections (weighted pathways)</span> </div> <div className="legend-item"> <div className="legend-color" style={{ backgroundColor: '#ffcc00' }}></div> <span className="legend-label">Bias (trainable offset)</span> </div> <div className="legend-item"> <div className="legend-color" style={{ backgroundColor: '#00ffff', border: '1px dashed #444' }}></div> <span className="legend-label">Activation Functions</span> </div> <div className="legend-item"> <div className="legend-color" style={{ backgroundColor: 'transparent', border: '1px dashed #ff5500' }}></div> <span className="legend-label">Backpropagation Gradients</span> </div> </div> <div className="legend-description"> <p> Neural networks learn through two phases: <strong>forward propagation</strong> (computing predictions) and <strong>backpropagation</strong> (learning from errors)... </p> </div> </div> </div>

    </div>
  );
};

export default NeuralNetworkVisualization;