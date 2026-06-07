import { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { X } from '@phosphor-icons/react';


// Hardcoded stadiums data
const STADIUMS = [
  { id: 1, name: "MetLife Stadium", city: "New York/New Jersey", country: "USA", countryCode: "US", lat: 40.8135, lng: -74.0745, capacity: 82500, matches: ["Brazil vs Morocco", "France vs Senegal", "Final"] },
  { id: 2, name: "AT&T Stadium", city: "Dallas", country: "USA", countryCode: "US", lat: 32.7480, lng: -97.0930, capacity: 80000, matches: ["Group Stage Matches"] },
  { id: 3, name: "SoFi Stadium", city: "Los Angeles", country: "USA", countryCode: "US", lat: 33.9534, lng: -118.3392, capacity: 70240, matches: ["Group Stage Matches"] },
  { id: 4, name: "Hard Rock Stadium", city: "Miami", country: "USA", countryCode: "US", lat: 25.9580, lng: -80.2389, capacity: 64767, matches: ["Group Stage Matches"] },
  { id: 5, name: "Mercedes-Benz Stadium", city: "Atlanta", country: "USA", countryCode: "US", lat: 33.7554, lng: -84.4009, capacity: 71000, matches: ["Group Stage Matches"] },
  { id: 6, name: "NRG Stadium", city: "Houston", country: "USA", countryCode: "US", lat: 29.6847, lng: -95.4107, capacity: 72220, matches: ["Group Stage Matches"] },
  { id: 7, name: "Lincoln Financial Field", city: "Philadelphia", country: "USA", countryCode: "US", lat: 39.9008, lng: -75.1675, capacity: 69796, matches: ["Group Stage Matches"] },
  { id: 8, name: "Levi's Stadium", city: "San Francisco", country: "USA", countryCode: "US", lat: 37.4033, lng: -121.9694, capacity: 68500, matches: ["Group Stage Matches"] },
  { id: 9, name: "Lumen Field", city: "Seattle", country: "USA", countryCode: "US", lat: 47.5952, lng: -122.3316, capacity: 69000, matches: ["Group Stage Matches"] },
  { id: 10, name: "Gillette Stadium", city: "Boston", country: "USA", countryCode: "US", lat: 42.0909, lng: -71.2643, capacity: 65878, matches: ["Group Stage Matches"] },
  { id: 11, name: "Arrowhead Stadium", city: "Kansas City", country: "USA", countryCode: "US", lat: 39.0489, lng: -94.4839, capacity: 76416, matches: ["Group Stage Matches"] },
  { id: 12, name: "Estadio Azteca", city: "Mexico City", country: "Mexico", countryCode: "MX", lat: 19.3029, lng: -99.1505, capacity: 87523, matches: ["Opening Match", "Group Stage Matches"] },
  { id: 13, name: "Estadio Akron", city: "Guadalajara", country: "Mexico", countryCode: "MX", lat: 20.6719, lng: -103.4680, capacity: 48071, matches: ["Group Stage Matches"] },
  { id: 14, name: "Estadio BBVA", city: "Monterrey", country: "Mexico", countryCode: "MX", lat: 25.6693, lng: -100.2442, capacity: 53500, matches: ["Group Stage Matches"] },
  { id: 15, name: "BC Place", city: "Vancouver", country: "Canada", countryCode: "CA", lat: 49.2767, lng: -123.1116, capacity: 54500, matches: ["Group Stage Matches"] },
  { id: 16, name: "BMO Field", city: "Toronto", country: "Canada", countryCode: "CA", lat: 43.6333, lng: -79.4167, capacity: 30000, matches: ["Group Stage Matches"] }
];

const INDIA_PIN = {
  name: "You are here 🇮🇳",
  city: "India",
  country: "India",
  lat: 20.5937,
  lng: 78.9629,
  isIndia: true,
  matches: ["All times shown in IST (UTC+5:30)"]
};

// Conversions
function latLngToVector3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Inner Globe component inside Suspense
function EarthGlobe({ onHoverStadium, onSelectStadium, onMouseMove, isDark, visibleStadiums }) {
  const globeRef = useRef();
  const earthTexture = useTexture(isDark ? 'https://unpkg.com/three-globe/example/img/earth-night.jpg' : 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');

  // Rotate globe slowly
  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.0025;
    }
  });

  const getPinColor = (stadium) => {
    if (stadium.isIndia) return '#FF3366'; // Pink
    if (stadium.countryCode === 'US') return '#00FF87'; // Neon Green
    if (stadium.countryCode === 'MX') return '#FFD700'; // Gold
    return '#FF6B35'; // Orange
  };

  // Convert all items
  const pins = useMemo(() => {
    const all = [...visibleStadiums, INDIA_PIN];
    return all.map((s) => {
      const pos = latLngToVector3(s.lat, s.lng, 2.0);
      const dir = pos.clone().normalize();
      // Cylinder starts slightly inside the surface and extends outwards
      const cylinderHeight = 0.15;
      const cylinderPos = dir.clone().multiplyScalar(2.0 + cylinderHeight / 2);
      
      return {
        stadium: s,
        pinPos: dir.clone().multiplyScalar(2.0 + cylinderHeight),
        cylinderPos,
        cylinderHeight,
        dir,
        color: getPinColor(s)
      };
    });
  }, [visibleStadiums]);

  return (
    <group ref={globeRef}>
      {/* Perfect Sphere (Earth) */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[2.0, 64, 64]} />
        <meshStandardMaterial 
          map={earthTexture}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Atmosphere Glow (Slightly larger transparent sphere) */}
      <mesh>
        <sphereGeometry args={[2.06, 64, 64]} />
        <meshPhongMaterial
          color="#00FF87"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Pins and connection cylinders */}
      {pins.map(({ stadium, pinPos, cylinderPos, cylinderHeight, dir, color }) => (
        <group key={stadium.isIndia ? 'india' : stadium.id}>
          {/* Cylinder stalk pointing outwards */}
          <mesh 
            position={cylinderPos}
            ref={(el) => {
              if (el) {
                const localUp = new THREE.Vector3(0, 1, 0);
                el.quaternion.setFromUnitVectors(localUp, dir);
              }
            }}
          >
            <cylinderGeometry args={[0.01, 0.015, cylinderHeight, 8]} />
            <meshBasicMaterial color={color} opacity={0.7} transparent />
          </mesh>

          {/* Glowing pin sphere */}
          <mesh 
            position={pinPos}
            onPointerOver={(e) => {
              e.stopPropagation();
              if (e.pointerType === 'mouse') {
                onHoverStadium(stadium);
                onMouseMove(e);
              }
            }}
            onPointerOut={(e) => {
              if (e.pointerType === 'mouse') {
                onHoverStadium(null);
              }
            }}
            onPointerMove={(e) => {
              if (e.pointerType === 'mouse') {
                onMouseMove(e);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectStadium(stadium);
            }}
          >
            <sphereGeometry args={[stadium.isIndia ? 0.06 : 0.04, 16, 16]} />
            <meshBasicMaterial color={color} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function GlobeLocator({ isDark }) {
  const [hoveredStadium, setHoveredStadium] = useState(null);
  const [selectedStadium, setSelectedStadium] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [showAllStadiums, setShowAllStadiums] = useState(false);
  const scrollContainerRef = useRef(null);
  const visibleStadiums = showAllStadiums ? STADIUMS : STADIUMS.slice(0, 3);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseMove = (e) => {
    if (e.clientX && e.clientY) {
      setHoverPosition({ x: e.clientX, y: e.clientY });
    }
  };



  // Scroll stadium list row helper
  const handleCardClick = (stadium) => {
    if (isMobile) {
      setSelectedStadium(stadium);
    } else {
      setHoveredStadium(stadium);
      setTimeout(() => setHoveredStadium(null), 3000);
    }
  };

  return (
    <section className={`relative w-full py-16 px-4 flex flex-col items-center border-t border-b transition-colors ${isDark ? 'bg-[#050508] border-white/5' : 'bg-white border-[#10164f]/10'}`}>
      {/* Title */}
      <div className="text-center mb-8 max-w-2xl">
        <h2 
          className={`text-4xl sm:text-6xl font-black tracking-wider transition-colors ${isDark ? 'text-[#00FF87]' : 'text-[#10164f]'}`}
          style={{ fontFamily: '"FWC26", sans-serif' }}
        >
          STADIUM UNIVERSE
        </h2>
        <p className={`text-xs uppercase tracking-[0.2em] mt-2 transition-colors ${isDark ? 'text-white/50' : 'text-[#10164f]/60'}`}>
          Hover any pin to explore World Cup 2026 venues
        </p>
      </div>

      {/* Render Globe / Mobile Fallback */}
      <div className={`relative w-full max-w-5xl flex items-center justify-center ${isMobile ? 'h-[45vh]' : 'h-[55vh]'}`}>
        <Canvas 
          camera={{ position: [0, 0, 4.5], fov: 60 }}
          style={{ width: '100%', height: '100%' }}
        >
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1.5} />
            <pointLight position={[-5, -5, -5]} intensity={0.5} />
            <Suspense fallback={null}>
              <EarthGlobe 
                onHoverStadium={setHoveredStadium}
                onSelectStadium={setSelectedStadium}
                onMouseMove={handleMouseMove}
                isDark={isDark}
                visibleStadiums={visibleStadiums}
              />
            </Suspense>
            <OrbitControls 
              enableZoom={true} 
              enableRotate={true} // OrbitControls handles the mouse drag rotation beautifully!
              minDistance={3.2}
              maxDistance={7.5}
            />
          </Canvas>

          {/* Floating Hover Card */}
          {hoveredStadium && (
            <div
              className={`fixed pointer-events-none z-[9999] p-5 rounded-2xl shadow-2xl border flex flex-col gap-2 transition-transform duration-200 transform scale-100 opacity-100 animate-slideup-modal ${isDark ? 'text-white' : 'text-[#10164f]'}`}
              style={{
                left: `${hoverPosition.x + 15}px`,
                top: `${hoverPosition.y + 15}px`,
                background: isDark ? '#0a0b10' : '#ffffff',
                borderLeft: `5px solid ${isDark ? '#00FF87' : '#10164f'}`,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(16, 22, 79, 0.15)',
                maxWidth: '280px',
              }}
            >
              <h4 className={`text-lg font-bold uppercase tracking-widest ${isDark ? 'text-[#00FF87]' : 'text-[#10164f]'}`} style={{ fontFamily: '"FWC26", sans-serif' }}>
                {hoveredStadium.name}
              </h4>
              <p className={`text-[10px] ${isDark ? 'opacity-80' : 'opacity-60'}`}>📍 {hoveredStadium.city}, {hoveredStadium.country}</p>
              
              {!hoveredStadium.isIndia ? (
                <>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${isDark ? 'bg-white/10 text-white' : 'bg-[#10164f]/5 text-[#10164f]'}`}>
                      Capacity: {hoveredStadium.capacity?.toLocaleString()}
                    </span>
                  </div>
                  <div className={`mt-2.5 pt-2.5 border-t ${isDark ? 'border-white/10' : 'border-[#10164f]/10'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isDark ? 'text-[#FFD700]' : 'text-[#304ffe]'}`}>Key Matches</p>
                    <ul className="space-y-1">
                      {hoveredStadium.matches.map((m, idx) => (
                        <li key={idx} className="text-[11px] opacity-90 list-disc list-inside truncate">{m}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className={`mt-1 pt-2 border-t text-[11px] font-bold ${isDark ? 'border-white/10 text-pink-400' : 'border-[#10164f]/10 text-pink-600'}`}>
                  All match times displayed automatically in IST!
                </div>
              )}
            </div>
          )}
        </div>

      {/* Mobile List Fallback view */}
      {isMobile && (
        <div className="w-full max-w-md grid grid-cols-1 gap-3.5 mb-6 px-4 mt-6">
          <div className={`p-4 rounded-xl border text-center flex flex-col items-center gap-1 ${isDark ? 'border-pink-500/30 bg-pink-500/5 text-pink-400' : 'border-pink-500/20 bg-pink-500/[0.03] text-pink-700'}`}>
            <span className="text-xl">🇮🇳</span>
            <h5 className="font-bold text-xs uppercase tracking-wider">Watching from India</h5>
            <p className="text-[10px] opacity-75">All match dates/times converted to IST (+5:30) automatically.</p>
          </div>
          {visibleStadiums.map((s) => (
            <button
              key={s.id}
              onClick={() => handleCardClick(s)}
              className={`p-4 rounded-xl border text-left transition-colors relative flex items-center justify-between group cursor-pointer ${isDark ? 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]' : 'border-[#10164f]/10 bg-[#10164f]/[0.02] hover:bg-[#10164f]/[0.05]'}`}
            >
              <div>
                <h4 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#10164f]'}`} style={{ fontFamily: '"FWC26", sans-serif' }}>
                  {s.name}
                </h4>
                <p className={`text-[10px] ${isDark ? 'text-white/50' : 'text-[#10164f]/60'}`}>{s.city}, {s.country}</p>
              </div>
              <span className={`text-[10px] font-semibold ${isDark ? 'text-[#00FF87]' : 'text-[#10164f]'}`}>
                {s.capacity.toLocaleString()}
              </span>
            </button>
          ))}
          {!showAllStadiums && (
            <button
              onClick={() => setShowAllStadiums(true)}
              className={`mt-2 py-3 w-full rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors ${isDark ? 'border-white/20 bg-white/5 hover:bg-white/10 text-white' : 'border-[#10164f]/20 bg-[#10164f]/5 hover:bg-[#10164f]/10 text-[#10164f]'}`}
            >
              View All Stadiums
            </button>
          )}

          {/* Mobile Overlay Card */}
          {selectedStadium && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80" onClick={() => setSelectedStadium(null)}>
              <div 
                className={`w-full max-w-xs p-6 rounded-2xl border flex flex-col gap-3.5 transition-colors ${isDark ? 'bg-[#0b0c15] border-white/10 text-white' : 'bg-white border-[#10164f]/10 text-[#10164f]'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start">
                  <h4 className={`text-2xl font-bold uppercase tracking-wider ${isDark ? 'text-[#00FF87]' : 'text-[#10164f]'}`} style={{ fontFamily: '"FWC26", sans-serif' }}>
                    {selectedStadium.name}
                  </h4>
                  <button onClick={() => setSelectedStadium(null)} className={`${isDark ? 'text-white/60 hover:text-white' : 'text-[#10164f]/60 hover:text-[#10164f]'}`}><X size={16} /></button>
                </div>
                <p className={`text-xs ${isDark ? 'opacity-75' : 'opacity-60'}`}>📍 {selectedStadium.city}, {selectedStadium.country}</p>
                <p className={`text-xs font-bold py-1 px-2.5 rounded border self-start ${isDark ? 'bg-white/5 border-white/10' : 'bg-[#10164f]/5 border-[#10164f]/10'}`}>
                  Capacity: {selectedStadium.capacity?.toLocaleString()}
                </p>
                <div className={`border-t pt-3 mt-1 ${isDark ? 'border-white/10' : 'border-[#10164f]/10'}`}>
                  <p className={`text-[10px] font-black uppercase mb-1 ${isDark ? 'text-[#FFD700]' : 'text-[#10164f]'}`}>Key Matches</p>
                  <ul className="space-y-1">
                    {selectedStadium.matches.map((m, idx) => (
                      <li key={idx} className={`text-xs list-disc list-inside ${isDark ? 'opacity-80' : 'opacity-70'}`}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Horizontal mini-cards row for desktop */}
      {!isMobile && (
        <div className="w-full flex flex-col items-center gap-4">
          <div 
            ref={scrollContainerRef}
            className="w-full max-w-6xl overflow-x-auto scrollbar-hide flex gap-4 px-4 py-2 mt-6 justify-center"
          >
            {visibleStadiums.map((s) => {
              const isHovered = hoveredStadium?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleCardClick(s)}
                  className="flex-shrink-0 p-4 rounded-xl border text-left transition-all w-[180px] cursor-pointer"
                  style={{
                    background: isHovered 
                      ? (isDark ? 'rgba(0, 255, 135, 0.08)' : 'rgba(16, 22, 79, 0.05)') 
                      : (isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(16, 22, 79, 0.03)'),
                    borderColor: isHovered 
                      ? (isDark ? '#00FF87' : '#10164f') 
                      : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 22, 79, 0.1)'),
                  }}
                >
                  <h5 className={`text-xs font-bold truncate uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#10164f]'}`} style={{ fontFamily: '"FWC26", sans-serif' }}>
                    {s.name}
                  </h5>
                  <p className={`text-[9px] truncate mt-0.5 ${isDark ? 'text-white/50' : 'text-[#10164f]/60'}`}>{s.city}</p>
                  <span className={`text-[10px] font-semibold block mt-2 ${isDark ? 'text-[#00FF87]' : 'text-[#10164f]'}`}>
                    {s.capacity.toLocaleString()} seats
                  </span>
                </button>
              );
            })}
          </div>
          {!showAllStadiums && (
            <button
              onClick={() => setShowAllStadiums(true)}
              className={`mt-2 py-3 px-8 rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${isDark ? 'border-white/20 bg-white/5 hover:bg-white/10 text-white' : 'border-[#10164f]/20 bg-[#10164f]/5 hover:bg-[#10164f]/10 text-[#10164f]'}`}
            >
              View All Stadiums
            </button>
          )}
        </div>
      )}
    </section>
  );
}
