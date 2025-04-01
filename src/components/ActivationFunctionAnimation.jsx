// ActivationFunctionAnimation.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './ActivationFunctionAnimation.css'; // We'll create this

const ActivationFunctionAnimation = () => {
  // --- Activation Functions Definition ---
  const activationFunctions = useMemo(() => ({
    linear: {
      name: 'Linear (Identity)',
      description: 'Outputs the input directly: f(z) = z',
      func: (z) => z,
      range: [-2, 2], // Typical output range shown
    },
    relu: {
      name: 'ReLU',
      description: 'Rectified Linear Unit: f(z) = max(0, z)',
      func: (z) => Math.max(0, z),
      range: [0, 2],
    },
    sigmoid: {
      name: 'Sigmoid',
      description: 'Sigmoid: f(z) = 1 / (1 + e^-z)',
      func: (z) => 1 / (1 + Math.exp(-z)),
      range: [0, 1],
    },
    tanh: {
      name: 'Tanh',
      description: 'Hyperbolic Tangent: f(z) = tanh(z)',
      func: (z) => Math.tanh(z),
      range: [-1, 1],
    },
     step: {
      name: 'Step Function',
      description: 'Outputs 1 if z >= 0, else 0: f(z) = z >= 0 ? 1 : 0',
      func: (z) => (z >= 0 ? 1 : 0),
      range: [0, 1],
    },
  }), []);

  // --- State ---
  const [selectedFuncId, setSelectedFuncId] = useState('relu');
  const [zValue, setZValue] = useState(-5.0); // Current input value for animation
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(0.05); // Units per step
  const [direction, setDirection] = useState(1); // 1 for right, -1 for left
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const isRunningRef = useRef(isRunning);

  // Sync ref with state
   useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // --- Canvas and Plotting ---
  const canvasWidth = 500;
  const canvasHeight = 400;
  const plotParams = useMemo(() => {
    const zMin = -5;
    const zMax = 5;
    // Adjust y range dynamically slightly beyond function's typical range for padding
    const funcRange = activationFunctions[selectedFuncId]?.range || [-1, 1];
    const yPadding = 0.5;
    const yMin = funcRange[0] - yPadding;
    const yMax = funcRange[1] + yPadding;

    const zRange = zMax - zMin;
    const yRange = yMax - yMin;
    const scaleX = canvasWidth / zRange;
    const scaleY = canvasHeight / yRange;
    const originX = -zMin * scaleX; // Pixel X for z=0
    const originY = yMax * scaleY;  // Pixel Y for a=0
    return { zMin, zMax, yMin, yMax, scaleX, scaleY, originX, originY };
  }, [selectedFuncId, activationFunctions, canvasWidth, canvasHeight]);

  const toPixel = useCallback((mathZ, mathA) => {
    const { scaleX, scaleY, originX, originY } = plotParams;
    const px = originX + mathZ * scaleX;
    const py = originY - mathA * scaleY; // Y is inverted
    return { x: px, y: py };
  }, [plotParams]);

  // --- Drawing Logic ---
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { originX, originY, zMin, zMax } = plotParams;
    const currentFunc = activationFunctions[selectedFuncId]?.func;
    if (!currentFunc) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw Axes
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(0, originY); ctx.lineTo(canvasWidth, originY); // Z-Axis
    ctx.moveTo(originX, 0); ctx.lineTo(originX, canvasHeight); // A-Axis
    ctx.stroke();
    ctx.fillStyle = '#aaa'; ctx.font = '10px Arial';
    ctx.fillText('z (Input)', canvasWidth - 50, originY - 5);
    ctx.fillText('a=f(z) (Output)', originX + 5, 15);

    // Plot Activation Function Curve
    ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2; ctx.beginPath();
    let firstPoint = true;
    for (let px = 0; px < canvasWidth; px++) {
      const mathZ = (px - originX) / plotParams.scaleX;
      const mathA = currentFunc(mathZ);
      const { y: py } = toPixel(mathZ, mathA);
      // Avoid drawing huge jumps for step function by checking distance
       if (!firstPoint) {
           const prevMathZ = (px - 1 - originX) / plotParams.scaleX;
           const prevMathA = currentFunc(prevMathZ);
           const { y: prevPy } = toPixel(prevMathZ, prevMathA);
           if (Math.abs(py - prevPy) > canvasHeight / 2) { // If jump is too large, lift pen
               ctx.stroke(); // Finish previous segment
               ctx.beginPath(); // Start new segment
               firstPoint = true; // Treat next point as start
           }
       }

      if (firstPoint) {
        ctx.moveTo(px, py);
        firstPoint = false;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // --- Animation Elements ---
    const currentA = currentFunc(zValue);
    const { x: zPx, y: zAxisPy } = toPixel(zValue, 0); // Point on Z-axis
    const { x: curvePx, y: curvePy } = toPixel(zValue, currentA); // Point on Curve
    const { x: aAxisPx, y: aPy } = toPixel(0, currentA); // Point on A-axis

    // Draw point on Z-axis
    ctx.fillStyle = '#ffaa00'; ctx.beginPath();
    ctx.arc(zPx, originY, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Draw point on Curve
    ctx.fillStyle = '#ff5500'; ctx.beginPath();
    ctx.arc(curvePx, curvePy, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Draw helper lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(zPx, originY);
    ctx.lineTo(curvePx, curvePy);
    ctx.stroke();
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(curvePx, curvePy);
    ctx.lineTo(originX, aPy);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dashes


  }, [zValue, selectedFuncId, activationFunctions, plotParams, toPixel, canvasWidth, canvasHeight]);

  // --- Effects ---
  useEffect(() => { drawCanvas(); }, [drawCanvas]); // Redraw when necessary

  // Animation Step Logic
  const step = useCallback(() => {
    let nextZ = zValue + direction * speed;
    let nextDirection = direction;

    // Bounce off edges
    if (nextZ >= plotParams.zMax) {
      nextZ = plotParams.zMax;
      nextDirection = -1;
    } else if (nextZ <= plotParams.zMin) {
      nextZ = plotParams.zMin;
      nextDirection = 1;
    }

    setZValue(nextZ);
    setDirection(nextDirection);

  }, [zValue, direction, speed, plotParams.zMin, plotParams.zMax]);


   // Animation Control Effect
   useEffect(() => {
     const loop = () => {
        if (!isRunningRef.current) return; // Check ref before stepping
        step();
        animationFrameId.current = requestAnimationFrame(loop); // Schedule next frame
     };

     if (isRunning) {
        cancelAnimationFrame(animationFrameId.current); // Clear previous
        animationFrameId.current = requestAnimationFrame(loop); // Start
     } else {
        cancelAnimationFrame(animationFrameId.current); // Stop
     }

     return () => cancelAnimationFrame(animationFrameId.current); // Cleanup
   }, [isRunning, step]); // Depend on isRunning and the stable step function


  // --- Handlers ---
  const handleStartPause = () => setIsRunning(prev => !prev);
  const handleReset = () => {
    setIsRunning(false);
    setZValue(plotParams.zMin); // Reset to start
    setDirection(1);
  };
  const handleFuncChange = (event) => {
    setIsRunning(false); // Stop animation on function change
    setSelectedFuncId(event.target.value);
     // Optional: Reset zValue when function changes?
     setZValue(plotParams.zMin);
     setDirection(1);
  };
   const handleSpeedChange = (event) => {
    setSpeed(parseFloat(event.target.value));
  };

  // --- JSX ---
  const currentFuncData = activationFunctions[selectedFuncId];

  return (
    <div className="activation-function-container">
      <h3>Activation Function Animation</h3>
      <p>Visualizing: <strong>{currentFuncData?.name}</strong></p>
      <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} className="af-canvas"></canvas>
      <div className="af-controls">
        <button onClick={handleStartPause}>{isRunning ? 'Pause' : 'Start'}</button>
        <button onClick={handleReset}>Reset</button>
        <div className="af-select">
          <label htmlFor="af-func">Function:</label>
          <select id="af-func" value={selectedFuncId} onChange={handleFuncChange}>
            {Object.entries(activationFunctions).map(([id, { name }]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
        <div className="af-slider">
          <label htmlFor="af-speed">Speed: {speed.toFixed(2)}</label>
          <input
            type="range"
            id="af-speed"
            min="0.01"
            max="0.2" // Adjust max speed
            step="0.01"
            value={speed}
            onChange={handleSpeedChange}
          />
        </div>
      </div>
       <div className="af-info">
        <span>Input (z): {zValue.toFixed(3)}</span>
        <span>Output (a): {currentFuncData?.func(zValue)?.toFixed(3) ?? 'N/A'}</span>
      </div>
       <p className="af-description">{currentFuncData?.description}</p>
    </div>
  );
};

export default ActivationFunctionAnimation;