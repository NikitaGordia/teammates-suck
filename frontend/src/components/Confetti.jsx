import React, { useEffect, useState } from 'react';
import './Confetti.css';

const Confetti = ({ isActive, duration = 3000 }) => {
  const [particles, setParticles] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      
      // Generate confetti particles
      const newParticles = [];
      const particleCount = 50; // Number of confetti pieces
      
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          left: Math.random() * 100, // Random horizontal position (%)
          animationDelay: Math.random() * 3, // Random delay (seconds)
          animationDuration: 3 + Math.random() * 2, // Random duration (3-5 seconds)
          color: getRandomColor(),
          shape: getRandomShape(),
          size: 0.5 + Math.random() * 0.5, // Random size (0.5-1rem)
        });
      }
      
      setParticles(newParticles);
      
      // Hide confetti after duration
      const timer = setTimeout(() => {
        console.log('reset')
        setIsVisible(false);
        setParticles([]);
      }, duration);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setParticles([]);
    }
  }, [isActive, duration]);

  const getRandomColor = () => {
    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#96CEB4', // Green
      '#FFEAA7', // Yellow
      '#DDA0DD', // Plum
      '#98D8C8', // Mint
      '#F7DC6F', // Light Yellow
      '#BB8FCE', // Light Purple
      '#85C1E9', // Light Blue
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getRandomShape = () => {
    const shapes = ['circle', 'square', 'triangle'];
    return shapes[Math.floor(Math.random() * shapes.length)];
  };

  if (!isVisible) return null;

  return (
    <div className="confetti-container">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`confetti-particle confetti-${particle.shape}`}
          style={{
            left: `${particle.left}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.animationDelay}s`,
            animationDuration: `${particle.animationDuration}s`,
            fontSize: `${particle.size}rem`,
            '--particle-color': particle.color,
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
