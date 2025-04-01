// LinearRegressionAnimation.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './LinearRegressionAnimation.css';

const LinearRegressionAnimation = () => {
  // --- Initial Data, State, Refs (Keep as before) ---
  const initialData = useRef([ { x: 1, y: 2.1 }, { x: 1.5, y: 3.5 }, { x: 2, y: 3.9 }, { x: 2.5, y: 5.1 }, { x: 3, y: 6.2 }, { x: 3.5, y: 6.8 }, { x: 4, y: 8.1 }, { x: 4.5, y: 9.2 }, { x: 5, y: 9.8 }, { x: 5.5, y: 11.5 } ]).current;
  const [dataPoints, setDataPoints] = useState(initialData);
  const [m, setM] = useState(0);
  const [b, setB] = useState(0);
  const [learningRate, setLearningRate] = useState(0.01);
  const [isRunning, setIsRunning] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [loss, setLoss] = useState(null);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const isRunningRef = useRef(isRunning);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

  // --- Canvas, Plotting, Predict, Loss (Keep as before) ---
  const canvasWidth = 600; const canvasHeight = 400;
  const plotParams = useMemo(() => { if (dataPoints.length === 0) { return { xMin: 0, xMax: 10, yMin: 0, yMax: 15, scaleX: 60, scaleY: 26.67, originX: 0, originY: 400 }; } const xVals = dataPoints.map(p => p.x); const yVals = dataPoints.map(p => p.y); const xPadding = 1; const yPadding = 2; const xMin = Math.min(...xVals) - xPadding; const xMax = Math.max(...xVals) + xPadding; const yMin = Math.min(...yVals) - yPadding; const yMax = Math.max(...yVals) + yPadding; const xRange = xMax - xMin || 1; const yRange = yMax - yMin || 1; const scaleX = canvasWidth / xRange; const scaleY = canvasHeight / yRange; const originX = -xMin * scaleX; const originY = yMax * scaleY; return { xMin, xMax, yMin, yMax, scaleX, scaleY, originX, originY }; }, [dataPoints, canvasWidth, canvasHeight]);
  const toPixel = useCallback((mathX, mathY) => { const { scaleX, scaleY, originX, originY } = plotParams; const px = originX + mathX * scaleX; const py = originY - mathY * scaleY; return { x: px, y: py }; }, [plotParams]);
  const predict = useCallback((xInput) => m * xInput + b, [m, b]);
  const calculateLoss = useCallback(() => { if (dataPoints.length === 0) return 0; let sumSquaredError = 0; dataPoints.forEach(point => { const prediction = predict(point.x); const error = point.y - prediction; sumSquaredError += error * error; }); return sumSquaredError / dataPoints.length; }, [dataPoints, predict]);
  useEffect(() => { setLoss(calculateLoss()); }, [m, b, calculateLoss]);
  const drawCanvas = useCallback(() => { const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); const { originX, originY, xMin, xMax } = plotParams; ctx.clearRect(0, 0, canvasWidth, canvasHeight); ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(canvasWidth, originY); ctx.moveTo(originX, 0); ctx.lineTo(originX, canvasHeight); ctx.stroke(); ctx.fillStyle = '#aaa'; ctx.font = '10px Arial'; ctx.fillText('x', canvasWidth - 10, originY - 5); ctx.fillText('y', originX + 5, 10); ctx.fillStyle = '#00aaff'; dataPoints.forEach(point => { const { x: px, y: py } = toPixel(point.x, point.y); ctx.beginPath(); ctx.arc(px, py, 4, 0, 2 * Math.PI); ctx.fill(); }); ctx.strokeStyle = '#ff5500'; ctx.lineWidth = 2; ctx.beginPath(); const yStart = predict(xMin); const yEnd = predict(xMax); const { x: startPx, y: startPy } = toPixel(xMin, yStart); const { x: endPx, y: endPy } = toPixel(xMax, yEnd); ctx.moveTo(startPx, startPy); ctx.lineTo(endPx, endPy); ctx.stroke(); }, [dataPoints, plotParams, toPixel, predict, m, b]);
  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  // --- Gradient Descent Step Logic ---
  const performStep = useCallback(() => {
    if (dataPoints.length === 0) {
        setIsRunning(false);
        return;
    }

    let gradientM = 0;
    let gradientB = 0;
    const N = dataPoints.length;

    // Calculate Gradients using current m and b from state
    dataPoints.forEach(point => {
      const prediction = predict(point.x); // Uses state m, b via predict's closure
      const error = point.y - prediction;
      // Accumulate gradients
      gradientM += (-2 / N) * point.x * error;
      gradientB += (-2 / N) * error;
    });

     // --- Convergence Check ---
     // Check BEFORE updating state if the *current* gradients are small enough
     // Allow a few iterations before checking convergence strictly
     const tolerance = 0.001;
     if (iteration > 10 && Math.abs(gradientM) < tolerance && Math.abs(gradientB) < tolerance) {
      //   console.log(`Converged at iteration ${iteration}!` );
        setIsRunning(false); // Stop the animation loop trigger
        return; // *** Exit the function here - DO NOT update state further ***
     }

    // --- State Updates (Only if not converged) ---
    setM(currentM => currentM - learningRate * gradientM);
    setB(currentB => currentB - learningRate * gradientB);
    setIteration(prev => prev + 1);

  }, [dataPoints, predict, learningRate, iteration]); // Added iteration dependency for convergence check

   // --- Animation Control Effect (Keep as before) ---
   useEffect(() => {
    const loop = () => {
        if (!isRunningRef.current) return;
        performStep(); // Calculate and potentially update state
        // Check the ref *again* in case performStep set isRunning to false
        if (isRunningRef.current) {
             animationFrameId.current = requestAnimationFrame(loop); // Schedule next
        }
    };

    if (isRunning) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(animationFrameId.current);
    }
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [isRunning, performStep]);


  // --- Handlers (Keep as before) ---
  const handleStartPause = () => setIsRunning(prev => !prev);
  const handleReset = useCallback(() => { setIsRunning(false); setM(0); setB(0); setIteration(0); setLoss(null); }, []); // No need for func/calculateGradientVis
  const handleLearningRateChange = (event) => { setLearningRate(parseFloat(event.target.value)); };


  // --- JSX (Keep as before) ---
  return (
    <div className="linear-regression-container">
      <h3>Linear Regression Animation (Gradient Descent)</h3>
      <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} className="lr-canvas"></canvas>
      <div className="lr-controls"> <button onClick={handleStartPause}>{isRunning ? 'Pause' : 'Start'}</button> <button onClick={handleReset}>Reset</button> <div className="lr-slider"> <label htmlFor="lr-gd">Learning Rate (η): {learningRate.toFixed(3)}</label> <input type="range" id="lr-gd" min="0.001" max="0.05" step="0.001" value={learningRate} onChange={handleLearningRateChange} disabled={isRunning} /> </div> </div>
      <div className="lr-info"> <span>Iteration: {iteration}</span> <span>Slope (m): {m.toFixed(4)}</span> <span>Intercept (b): {b.toFixed(4)}</span> <span>Loss (MSE): {loss?.toFixed(4) ?? 'N/A'}</span> </div>
    </div>
  );
};

export default LinearRegressionAnimation;