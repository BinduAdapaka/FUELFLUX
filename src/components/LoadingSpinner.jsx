import React from "react";

const LoadingSpinner = ({ fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="spinner-fullscreen">
        <div className="spinner-ring" />
        <p className="spinner-text">Loading Fuel Flux...</p>
      </div>
    );
  }

  return <div className="spinner-ring small" />;
};

export default LoadingSpinner;
