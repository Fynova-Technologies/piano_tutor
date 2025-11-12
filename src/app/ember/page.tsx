'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

const LuxuryFoodCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Luxury food items with placeholder images
  const foodItems = [
    {
      name: 'Wagyu Steak',
      image: '/ember/casey-lee-awj7sRviVXo-unsplash.jpg',
      description: 'Premium A5 Japanese Wagyu'
    },
    {
      name: 'Lobster Thermidor',
      image: '/ember/chad-montano-eeqbbemH9-c-unsplash.jpg',
      description: 'Fresh Atlantic Lobster'
    },
    {
      name: 'Truffle Risotto',
      image: '/ember/eiliv-aceron-ZuIDLSz3XLg-unsplash.jpg',
      description: 'Black Truffle & Parmesan'
    },
    {
      name: 'Caviar Selection',
      image: '/ember/joseph-gonzalez-fdlZBWIP0aM-unsplash.jpg',
      description: 'Beluga & Oscietra Caviar'
    },
    {
      name: 'Foie Gras',
      image: '/ember/joseph-gonzalez-zcUgjyqEwe8-unsplash.jpg',
      description: 'Pan-Seared with Fig Compote'
    },
    {
      name: 'Gold Leaf Dessert',
      image: '/ember/odiseo-castrejon-1SPu0KT-Ejg-unsplash.jpg',
      description: 'Chocolate Fondant with 24K Gold'
    }
  ];

  // Handle scroll to change images
  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      setIsSpinning(true);
      
      // Rotate on scroll
      setRotation(prev => prev + 60);
      
      scrollTimeoutRef.current = setTimeout(() => {
        setIsSpinning(false);
        // Change to next image
        setCurrentIndex(prev => (prev + 1) % foodItems.length);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [foodItems.length]);

  // Auto-rotate animation
  const handleSpin = () => {
    setIsSpinning(true);
    setRotation(prev => prev + 360);
    
    setTimeout(() => {
      setIsSpinning(false);
      setCurrentIndex(prev => (prev + 1) % foodItems.length);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex  py-20">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(234, 179, 8) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-6xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              Culinary Excellence
            </h1>
            <p className="text-xl text-gray-400 mb-8">Scroll or click to explore our premium selection</p>
          </div>

          {/* Plate Container */}
          <div className="flex flex-col items-center justify-center">
            <div 
              ref={containerRef}
              className="relative w-96 h-96 cursor-pointer"
              onClick={handleSpin}
            >
              {/* Golden Plate */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-700 shadow-2xl transform transition-transform duration-300 hover:scale-105">
                {/* Inner Plate Shadow */}
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-yellow-700 via-yellow-600 to-yellow-500 shadow-inner"></div>
                
                {/* Plate Center */}
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-gray-900 via-black to-gray-800 shadow-2xl overflow-hidden">
                  {/* Food Image */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out"
                    style={{
                      transform: `rotate(${rotation}deg) scale(${isSpinning ? 0.8 : 1})`,
                      opacity: isSpinning ? 0.5 : 1
                    }}
                  >
                    <Image 
                      src={foodItems[currentIndex].image}
                      alt={foodItems[currentIndex].name}
                      className="w-full h-full object-cover rounded-full"
                      height={640}
                      width={640}

                    />
                    {/* Gold Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/30 to-transparent rounded-full"></div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute inset-0">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-3 h-3 bg-yellow-400 rounded-full"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `rotate(${i * 45}deg) translateX(170px) translateY(-50%)`,
                        boxShadow: '0 0 10px rgba(234, 179, 8, 0.8)'
                      }}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Rotating Border */}
              <div 
                className="absolute inset-0 rounded-full transition-transform duration-1000 ease-out"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  background: 'conic-gradient(from 0deg, transparent 0%, rgba(234, 179, 8, 0.3) 50%, transparent 100%)',
                  filter: 'blur(8px)'
                }}
              ></div>
            </div>

            {/* Food Info */}
            <div className="mt-12 text-center">
              <h2 className="text-4xl font-bold mb-2 text-yellow-500">
                {foodItems[currentIndex].name}
              </h2>
              <p className="text-xl text-gray-400">
                {foodItems[currentIndex].description}
              </p>
              <div className="mt-6 flex items-center justify-center gap-2">
                {foodItems.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === currentIndex 
                        ? 'bg-yellow-500 w-8' 
                        : 'bg-gray-600'
                    }`}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center mt-16">
            <p className="text-gray-500 text-sm">
              Click the plate or scroll down to view more dishes
            </p>
          </div>
        </div>
      </div>

      {/* Scroll Content */}
      <div className="relative py-32 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-5xl font-bold text-center mb-16 text-yellow-500">
            Our Menu
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {foodItems.map((item, idx) => (
              <div 
                key={idx}
                className="group relative bg-gradient-to-br from-gray-900 to-black rounded-lg overflow-hidden border border-yellow-900/30 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/20"
              >
                <div className="aspect-square overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                    height={640}
                    width={640}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-2xl font-bold text-yellow-500 mb-2">{item.name}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LuxuryFoodCarousel;