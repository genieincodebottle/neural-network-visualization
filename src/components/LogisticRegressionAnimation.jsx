// LogisticRegressionAnimation.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './LogisticRegressionAnimation.css'; // We'll create this

const LogisticRegressionAnimation = () => {
  // --- Generate Sample Data (Linearly Separable-ish) ---
  const generateData = (numPointsPerClass = 25, noise = 0.5) => {
    const data = [];
    // Class 0 - centered roughly lower-left
    for (let i = 0; i < numPointsPerClass; i++) {
      data.push({
        x1: 2 + (Math.random() - 0.5) * 4 * noise * 2,
        x2: 3 + (Math.random() - 0.5) * 4 * noise * 2,
        y: 0 // Label for Class 0
      });
    }
    // Class 1 - centered roughly upper-right
    for (let i = 0; i < numPointsPerClass; i++) {
      data.push({
        x1: 6 + (Math.random() - 0.5) * 4 * noise * 2,
        x2: 7 + (Math.random() - 0.5) * 4 * noise * 2,
        y: 1 // Label for Class 1
      });
    }
    return data;
  };

  const initialData = useRef(generateData()).current;

  // --- State ---
  const [dataPoints, setDataPoints] = useState(initialData);
  const [weights, setWeights] = useState({ w1: 0, w2: 0 }); // Two weights for x1, x2
  const [bias, setBias] = useState(0); // Intercept/bias term
  const [learningRate, setLearningRate] = useState(0.05); // May need tuning
  const [isRunning, setIsRunning] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [loss, setLoss] = useState(null); // Log Loss (Binary Cross-Entropy)
  const [accuracy, setAccuracy] = useState(null);

  // --- Refs ---
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const isRunningRef = useRef(isRunning);

  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

  // --- Canvas and Plotting ---
  const canvasWidth = 500;
  const canvasHeight = 500; // Make it square for 2D data

  const plotParams = useMemo(() => {
    if (dataPoints.length === 0) return { /* default params */ };
    const x1Vals = dataPoints.map(p => p.x1);
    const x2Vals = dataPoints.map(p => p.x2);
    const padding = 1.5;
    const xMin = Math.min(...x1Vals) - padding;
    const xMax = Math.max(...x1Vals) + padding;
    const yMin = Math.min(...x2Vals) - padding; // y-axis represents x2 feature
    const yMax = Math.max(...x2Vals) + padding;
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;
    const scaleX = canvasWidth / xRange;
    const scaleY = canvasHeight / yRange;
    const originX = -xMin * scaleX; // Pixel X for x1=0
    const originY = yMax * scaleY;  // Pixel Y for x2=0
    return { xMin, xMax, yMin, yMax, scaleX, scaleY, originX, originY };
  }, [dataPoints, canvasWidth, canvasHeight]);

  const toPixel = useCallback((mathX1, mathX2) => {
    const { scaleX, scaleY, originX, originY } = plotParams;
    const px = originX + mathX1 * scaleX;
    const py = originY - mathX2 * scaleY; // Map x2 to canvas Y
    return { x: px, y: py };
  }, [plotParams]);

  // --- Logistic Regression Specific Functions ---
  const sigmoid = useCallback((z) => 1 / (1 + Math.exp(-z)), []);

  // Predicts the probability of class 1
  const predictProbability = useCallback((x1, x2) => {
    const z = weights.w1 * x1 + weights.w2 * x2 + bias;
    return sigmoid(z);
  }, [weights, bias, sigmoid]);

  // Log Loss (Binary Cross-Entropy)
  const calculateLogLoss = useCallback(() => {
    if (dataPoints.length === 0) return 0;
    let totalLoss = 0;
    const epsilon = 1e-9; // Small value to prevent log(0) or log(1) -> NaN

    dataPoints.forEach(point => {
      const p = predictProbability(point.x1, point.x2);
      // Clip probabilities to avoid log(0) or log(1)
      const pClipped = Math.max(epsilon, Math.min(1 - epsilon, p));
      const y = point.y; // True label (0 or 1)
      totalLoss -= (y * Math.log(pClipped) + (1 - y) * Math.log(1 - pClipped));
    });
    return totalLoss / dataPoints.length;
  }, [dataPoints, predictProbability]);

  // Accuracy Calculation
   const calculateAccuracy = useCallback(() => {
      if (dataPoints.length === 0) return 0;
      let correctPredictions = 0;
      dataPoints.forEach(point => {
        const prob = predictProbability(point.x1, point.x2);
        const prediction = prob >= 0.5 ? 1 : 0; // Threshold probability
        if (prediction === point.y) {
          correctPredictions++;
        }
      });
      return (correctPredictions / dataPoints.length) * 100; // Return as percentage
    }, [dataPoints, predictProbability]);


  // --- Effects to Update Loss/Accuracy ---
  useEffect(() => {
    setLoss(calculateLogLoss());
    setAccuracy(calculateAccuracy());
  }, [weights, bias, calculateLogLoss, calculateAccuracy]); // Recalculate when params change

  // --- Drawing Logic ---
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { originX, originY, xMin, xMax, yMin, yMax } = plotParams; // yMin/Max now refer to x2 range

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw Axes
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(0, originY); ctx.lineTo(canvasWidth, originY); // X1-Axis
    ctx.moveTo(originX, 0); ctx.lineTo(originX, canvasHeight); // X2-Axis
    ctx.stroke();
    ctx.fillStyle = '#aaa'; ctx.font = '10px Arial';
    ctx.fillText('x1', canvasWidth - 15, originY - 5);
    ctx.fillText('x2', originX + 5, 10);

    // Plot Data Points (different styles for classes)
    dataPoints.forEach(point => {
      const { x: px, y: py } = toPixel(point.x1, point.x2);
      if (point.y === 0) {
        ctx.fillStyle = '#3399ff'; // Blue circle for class 0
        ctx.beginPath(); ctx.arc(px, py, 4, 0, 2 * Math.PI); ctx.fill();
      } else {
        ctx.strokeStyle = '#ff5555'; // Red cross for class 1
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px - 3, py - 3); ctx.lineTo(px + 3, py + 3);
        ctx.moveTo(px + 3, py - 3); ctx.lineTo(px - 3, py + 3);
        ctx.stroke();
      }
    });

    // Draw Decision Boundary (Line where z = 0 => w1*x1 + w2*x2 + b = 0)
    ctx.strokeStyle = '#00ffaa'; // Greenish line
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Calculate two points on the line: x2 = (-w1*x1 - b) / w2
    // Handle vertical line case (w2 is close to 0)
    if (Math.abs(weights.w2) < 1e-6) {
        if (Math.abs(weights.w1) > 1e-6) { // Avoid drawing anything if w1 is also 0
             const boundaryX1 = -bias / weights.w1;
             const { x: boundaryPx } = toPixel(boundaryX1, 0); // Y value doesn't matter for vertical line
             ctx.moveTo(boundaryPx, 0);
             ctx.lineTo(boundaryPx, canvasHeight);
        }
    } else {
        const boundaryX2_at_xMin = (-weights.w1 * xMin - bias) / weights.w2;
        const boundaryX2_at_xMax = (-weights.w1 * xMax - bias) / weights.w2;
        const { x: px1, y: py1 } = toPixel(xMin, boundaryX2_at_xMin);
        const { x: px2, y: py2 } = toPixel(xMax, boundaryX2_at_xMax);
        ctx.moveTo(px1, py1);
        ctx.lineTo(px2, py2);
    }
    ctx.stroke();

  }, [dataPoints, plotParams, toPixel, weights, bias]); // Include weights, bias

  useEffect(() => { drawCanvas(); }, [drawCanvas]); // Redraw when necessary

  // --- Gradient Descent Step Logic ---
  const performStep = useCallback(() => {
    if (dataPoints.length === 0) {
        setIsRunning(false); return;
    }

    let gradientW1 = 0;
    let gradientW2 = 0;
    let gradientB = 0;
    const N = dataPoints.length;

    // Calculate Gradients (Average over dataset)
    dataPoints.forEach(point => {
      const p = predictProbability(point.x1, point.x2); // Predicted probability
      const error = p - point.y; // Difference between prediction and true label (0 or 1)
      gradientW1 += (1 / N) * error * point.x1;
      gradientW2 += (1 / N) * error * point.x2;
      gradientB += (1 / N) * error;
    });

    // Convergence Check (magnitude of gradients)
    const gradMagnitude = Math.sqrt(gradientW1**2 + gradientW2**2 + gradientB**2);
    const tolerance = 0.001; // Adjust tolerance as needed
    if (iteration > 10 && gradMagnitude < tolerance) {
        // console.log(`Converged at iteration ${iteration}!`);
        setIsRunning(false); // Stop animation
        return; // Exit before updating state
    }

    // Update weights and bias using functional updates
    setWeights(currentWeights => ({
        w1: currentWeights.w1 - learningRate * gradientW1,
        w2: currentWeights.w2 - learningRate * gradientW2
    }));
    setBias(currentBias => currentBias - learningRate * gradientB);
    setIteration(prev => prev + 1);

  }, [dataPoints, predictProbability, learningRate, iteration]); // Dependencies

   // --- Animation Control Effect (Keep as before) ---
   useEffect(() => {
    const loop = () => {
        if (!isRunningRef.current) return;
        performStep();
        // Check ref *again* after step, in case it converged and set isRunning to false
        if (isRunningRef.current) {
             animationFrameId.current = requestAnimationFrame(loop);
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


  // --- Handlers (Keep mostly as before) ---
  const handleStartPause = () => setIsRunning(prev => !prev);
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setWeights({ w1: 0, w2: 0 }); // Reset weights
    setBias(0);              // Reset bias
    setIteration(0);
    // Loss and Accuracy will be recalculated by their useEffect
  }, []);
  const handleLearningRateChange = (event) => {
    setLearningRate(parseFloat(event.target.value));
  };
  const handleNewData = () => {
      setIsRunning(false); // Stop if running
      const newData = generateData(); // Generate new points
      setDataPoints(newData);
      handleReset(); // Reset parameters as well
  }

  // --- JSX ---
  return (
    <div className="logistic-regression-container">
      <h3>Logistic Regression Animation</h3>
      <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} className="logr-canvas"></canvas>
      <div className="logr-controls">
        <button onClick={handleStartPause}>{isRunning ? 'Pause' : 'Start'}</button>
        <button onClick={handleReset}>Reset Params</button>
        <button onClick={handleNewData}>New Data</button> {/* Button to regenerate data */}
        <div className="logr-slider">
          <label htmlFor="lr-logr">Learning Rate (η): {learningRate.toFixed(3)}</label>
          <input
            type="range"
            id="lr-logr"
            min="0.01" // LR might need to be larger for LogReg
            max="0.5"  // Adjust max based on stability
            step="0.01"
            value={learningRate}
            onChange={handleLearningRateChange}
            disabled={isRunning}
          />
        </div>
      </div>
      <div className="logr-info">
        <span>Iteration: {iteration}</span>
        <span>w1: {weights.w1.toFixed(4)}</span>
        <span>w2: {weights.w2.toFixed(4)}</span>
        <span>Bias (b): {bias.toFixed(4)}</span>
        <span>Log Loss: {loss?.toFixed(4) ?? 'N/A'}</span>
        <span>Accuracy: {accuracy?.toFixed(2) ?? 'N/A'}%</span>
      </div>
    </div>
  );
};

export default LogisticRegressionAnimation;