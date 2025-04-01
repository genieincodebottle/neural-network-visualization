// GradientDescentAnimation.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './GradientDescentAnimation.css';

const GradientDescentAnimation = () => {
  // --- State & Refs ---
  const [x, setX] = useState(8.0);
  const [startX, setStartX] = useState(8.0);
  const [learningRate, setLearningRate] = useState(0.3);
  const [isRunning, setIsRunning] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [history, setHistory] = useState(() => [{ x: 8.0, y: 0.1 * 8.0 * 8.0 + Math.cos(8.0) }]);
  const [gradientVis, setGradientVis] = useState({ x1: 0, y1: 0, x2: 0, y2: 0 });
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const isRunningRef = useRef(isRunning); // Keep the ref

  // Sync ref with state
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // --- Functions & Plotting Params (Keep as before) ---
  const func = useCallback((x) => 0.1 * x * x + Math.cos(x), []);
  const gradientFunc = useCallback((x) => 0.2 * x - Math.sin(x), []);
  const canvasWidth = 600; const canvasHeight = 400;
  const plotParams = useMemo(() => { /* ... */ const xMin = -10; const xMax = 10; const yMin = -2; const yMax = 15; const xRange = xMax - xMin; const yRange = yMax - yMin; const scaleX = canvasWidth / xRange; const scaleY = canvasHeight / yRange; const originX = -xMin * scaleX; const originY = yMax * scaleY; return { xMin, xMax, yMin, yMax, scaleX, scaleY, originX, originY }; }, [canvasWidth, canvasHeight]);
  const toPixel = useCallback((mathX, mathY) => { /* ... */ const { scaleX, scaleY, originX, originY } = plotParams; const px = originX + mathX * scaleX; const py = originY - mathY * scaleY; return { x: px, y: py }; }, [plotParams]);
  const calculateGradientVis = useCallback((targetX) => { /* ... */ const targetY = func(targetX); const grad = gradientFunc(targetX); const { x: pxCurrent, y: pyCurrent } = toPixel(targetX, targetY); const tangentLength = 30; const mathDx = 0.5; const mathDy = grad * mathDx; const pixelDx = mathDx * plotParams.scaleX; const pixelDy = -mathDy * plotParams.scaleY; const magnitude = Math.sqrt(pixelDx * pixelDx + pixelDy * pixelDy); let unitDx = 0, unitDy = 0; if (magnitude > 1e-6) { unitDx = (pixelDx / magnitude) * tangentLength; unitDy = (pixelDy / magnitude) * tangentLength; } setGradientVis({ x1: pxCurrent - unitDx / 2, y1: pyCurrent - unitDy / 2, x2: pxCurrent + unitDx / 2, y2: pyCurrent + unitDy / 2 }); }, [func, gradientFunc, toPixel, plotParams]);
  const drawCanvas = useCallback(() => { /* ... */ const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); const { originX, originY } = plotParams; ctx.clearRect(0, 0, canvasWidth, canvasHeight); ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(canvasWidth, originY); ctx.moveTo(originX, 0); ctx.lineTo(originX, canvasHeight); ctx.stroke(); ctx.fillStyle = '#aaa'; ctx.font = '10px Arial'; ctx.fillText('x', canvasWidth - 10, originY - 5); ctx.fillText('f(x)', originX + 5, 10); ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2; ctx.beginPath(); for (let px = 0; px < canvasWidth; px++) { const mathX = (px - originX) / plotParams.scaleX; const mathY = func(mathX); const { y: py } = toPixel(mathX, mathY); if (px === 0) { ctx.moveTo(px, py); } else { ctx.lineTo(px, py); } } ctx.stroke(); if (history.length > 1) { ctx.strokeStyle = 'rgba(255, 100, 0, 0.5)'; ctx.lineWidth = 1; ctx.beginPath(); history.forEach((point, index) => { const { x: px, y: py } = toPixel(point.x, point.y); if (index === 0) { ctx.moveTo(px, py); } else { ctx.lineTo(px, py); } }); ctx.stroke(); } const currentY = func(x); const { x: currentPx, y: currentPy } = toPixel(x, currentY); ctx.fillStyle = '#ff5500'; ctx.beginPath(); ctx.arc(currentPx, currentPy, 5, 0, 2 * Math.PI); ctx.fill(); ctx.strokeStyle = '#ff00ff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gradientVis.x1, gradientVis.y1); ctx.lineTo(gradientVis.x2, gradientVis.y2); ctx.stroke(); }, [x, history, func, gradientVis, plotParams, toPixel, canvasWidth, canvasHeight]);

  // --- Effects for Drawing & Gradient Vis (Keep as before) ---
  useEffect(() => { drawCanvas(); }, [drawCanvas]);
  useEffect(() => { calculateGradientVis(x); }, [x, calculateGradientVis]);

  // --- Gradient Descent Step Function (Callback) ---
  const performStep = useCallback(() => {
    const currentGradient = gradientFunc(x);
    
    if (Math.abs(currentGradient) < 0.001) {
      setIsRunning(false);
      return;
    }
    
    const newX = x - learningRate * currentGradient;
    setX(newX);
    setHistory(prev => [...prev, { x: newX, y: func(newX) }]);
    setIteration(prev => prev + 1);
  }, [x, learningRate, gradientFunc, func]);

  // --- Animation Control Effect ---
  useEffect(() => {
    let frameId = null;
    
    const animate = () => {
      if (isRunningRef.current) {
        performStep();
        frameId = requestAnimationFrame(animate);
      }
    };
    
    if (isRunning) {
      frameId = requestAnimationFrame(animate);
    }
    
    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [isRunning, performStep]);

  // --- Handlers (Keep as before) ---
  const handleStartPause = () => {
    setIsRunning(prev => !prev);
  };
  
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setX(startX);
    setIteration(0);
    setHistory([{ x: startX, y: func(startX) }]);
    calculateGradientVis(startX);
  }, [startX, func, calculateGradientVis]);
  
  const handleLearningRateChange = (event) => {
    setLearningRate(parseFloat(event.target.value));
  };
  
  const handleStartXChange = useCallback((event) => {
    const newStart = parseFloat(event.target.value);
    setStartX(newStart);
    if (!isRunningRef.current) {
      setX(newStart);
      setIteration(0);
      setHistory([{ x: newStart, y: func(newStart) }]);
      calculateGradientVis(newStart);
    }
  }, [func, calculateGradientVis]);

  // --- JSX (Keep as before) ---
  return (
    <div className="gradient-descent-container">
      <h3>Gradient Descent Animation</h3>
      <p>Minimizing function: <code>f(x) = 0.1*x² + cos(x)</code></p>
      <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} className="gd-canvas"></canvas>
      <div className="gd-controls">
        <button onClick={handleStartPause}>{isRunning ? 'Pause' : 'Start'}</button>
        <button onClick={handleReset}>Reset</button>
        <div className="gd-slider">
          <label htmlFor="lr">Learning Rate (η): {learningRate.toFixed(2)}</label>
          <input
            type="range"
            id="lr"
            min="0.01"
            max="1.5"
            step="0.01"
            value={learningRate}
            onChange={handleLearningRateChange}
            disabled={isRunning}
          />
        </div>
        <div className="gd-input">
          <label htmlFor="startX">Start X:</label>
          <input
            type="number"
            id="startX"
            step="0.1"
            value={startX}
            onChange={handleStartXChange}
            disabled={isRunning}
          />
        </div>
      </div>
      <div className="gd-info">
        <span>Iteration: {iteration}</span>
        <span>Current x: {x.toFixed(4)}</span>
        <span>f(x): {func(x).toFixed(4)}</span>
        <span>Gradient f'(x): {gradientFunc(x).toFixed(4)}</span>
      </div>
    </div>
  );
};

export default GradientDescentAnimation;