import React from 'react';
// Assuming both components are in the 'components' directory
import './App.css';
import ActivationFunctionAnimation from './components/ActivationFunctionAnimation';
import DecoderTransformerAnimation from './components/DecoderTransformerAnimation';
import GradientDescentAnimation from './components/GradientDescentAnimation'; // <--- Import the new component
import LinearRegressionAnimation from './components/LinearRegressionAnimation';
import LogisticRegressionAnimation from './components/LogisticRegressionAnimation';
import NeuralNetworkVisualization from './components/NeuralNetworkVisualization';
function App() {
  return (
    <div className="App">
      {/* Section for the Neural Network */}
      <section className="visualization-section">
        <h1>Neural Network</h1> {/* Optional Title */}
        <NeuralNetworkVisualization />
      </section>

      {/* Add a separator or spacing */}
      <hr className="section-divider" />

      {/* Section for Gradient Descent */}
      <section className="visualization-section">
         <h1>Gradient Descent</h1> {/* Optional Title */}
        <GradientDescentAnimation />
      </section>

      {/* Add a separator or spacing */}
      <hr className="section-divider" />

      {/* Section for Gradient Descent */}
      <section className="visualization-section">
         <h1>Activation Function</h1> {/* Optional Title */}
        <ActivationFunctionAnimation />
      </section>

      <hr className="section-divider" />
      <section className="visualization-section"> {/* <-- Add Section */}
         <h1>Linear Regression Animation</h1>
        <LinearRegressionAnimation />       {/* <-- Add Component */}
      </section>

      <hr className="section-divider" />
      <section className="visualization-section"> {/* <-- Add Section */}
         <h1>Linear Regression Animation</h1>
        <LogisticRegressionAnimation />       {/* <-- Add Component */}
      </section>
      
      <hr className="section-divider" />
      <section className="visualization-section"> {/* <-- Add Section */}
         <h1>Linear Regression Animation</h1>
        <DecoderTransformerAnimation />       {/* <-- Add Component */}
      </section>

      
    </div>
  );
}

export default App;