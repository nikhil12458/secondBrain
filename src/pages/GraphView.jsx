import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToGraphData } from '../services/db';
import ForceGraph2D from 'react-force-graph-2d';
import { motion } from 'motion/react';

export default function GraphView() {
  const { user } = useAuth();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    
    const unsub = subscribeToGraphData(user.uid, (data) => {
      setGraphData(data);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const getNodeColor = (type) => {
    switch (type) {
      case 'article': return '#60A5FA'; // blue-400
      case 'video': return '#F87171'; // red-400
      case 'image': return '#4ADE80'; // green-400
      case 'pdf': return '#FB923C'; // orange-400
      case 'social': return '#F472B6'; // pink-400
      case 'journal': return '#C084FC'; // purple-400
      default: return '#FACC15'; // yellow-400
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)]">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Knowledge Graph</h1>
        <p className="text-zinc-400">Visualize connections between your saved items.</p>
      </header>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        ref={containerRef} 
        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden relative shadow-xl"
      >
        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel="name"
            nodeColor={(node) => getNodeColor(node.group)}
            linkColor={() => '#3f3f46'} // zinc-700
            backgroundColor="#18181b" // zinc-900
            nodeRelSize={6}
            linkWidth={1.5}
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.005}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
            Add items to see your knowledge graph.
          </div>
        )}
      </motion.div>
    </div>
  );
}
