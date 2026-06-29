import React from "react";
import "./ai-loader.css";

export const Component = ({ size = 180, text = "Generating", fullscreen = true }) => {
  const letters = text.split("");

  return (
    <div className={fullscreen ? "ai-loader-overlay" : "ai-loader-local"}>
      <div
        className="ai-loader-content"
        style={{ width: size, height: size }}
      >
        {letters.map((letter, index) => (
          <span
            key={index}
            className="loader-letter"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {letter === " " ? "\u00A0" : letter}
          </span>
        ))}

        <div className="loader-circle"></div>
      </div>
    </div>
  );
};
