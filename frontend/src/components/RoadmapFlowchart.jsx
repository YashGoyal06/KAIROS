import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Clock, AlertTriangle, CheckCircle2, Play, Circle, 
  Minimize2, Maximize2, Download, ChevronDown, Edit3, X,
  Globe, Cpu, Database, Share2, MessageSquare, Terminal, Plus
} from 'lucide-react';
import { toPng, toJpeg, toSvg } from 'html-to-image';

export default function RoadmapFlowchart({ roadmap = [], tasks = [], blockers = [], onNodeClick }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  
  const downloadRef = useRef(null);

  const safeRoadmap = Array.isArray(roadmap) ? roadmap : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeBlockers = Array.isArray(blockers) ? blockers : [];

  const handleDownload = (format) => {
    if (!downloadRef.current) return;
    setShowDropdown(false);

    const options = {
      backgroundColor: '#0f0d14',
      style: {
        transform: 'scale(1)',
        maxHeight: 'none',
        overflow: 'visible'
      },
      quality: 0.95
    };

    let downloadFn;
    let filename = `roadmap_${Date.now()}.${format}`;

    if (format === 'png') {
      downloadFn = toPng;
    } else if (format === 'jpg') {
      downloadFn = toJpeg;
    } else if (format === 'svg') {
      downloadFn = toSvg;
    }

    if (!downloadFn) return;

    downloadFn(downloadRef.current, options)
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Export failed:', err);
        alert('Failed to generate image file.');
      });
  };

  // Pre-defined node design settings styled with pastel brand colors
  const nodeStyles = [
    { bg: 'rgba(244, 63, 94, 0.06)', border: 'rgba(244, 63, 94, 0.3)', color: '#f43f5e', icon: Globe, name: 'Webhooks' },
    { bg: 'rgba(56, 189, 248, 0.06)', border: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8', icon: Share2, name: 'Slack Link' },
    { bg: 'rgba(251, 146, 60, 0.06)', border: 'rgba(251, 146, 60, 0.3)', color: '#fb923c', icon: Cpu, name: 'AI Core' },
    { bg: 'rgba(52, 211, 153, 0.06)', border: 'rgba(52, 211, 153, 0.3)', color: '#34d399', icon: Database, name: 'Google Drive' },
    { bg: 'rgba(167, 139, 250, 0.06)', border: 'rgba(167, 139, 250, 0.3)', color: '#a78bfa', icon: Terminal, name: 'Automation' },
    { bg: 'rgba(244, 114, 182, 0.06)', border: 'rgba(244, 114, 182, 0.3)', color: '#f472b6', icon: MessageSquare, name: 'Discord Bot' }
  ];

  const getNodeLayout = (index) => {
    // Lay out in a winding flow:
    // Node 0: Top-Left, Node 1: Top-Right
    // Node 2: Middle-Right, Node 3: Middle-Left
    // Node 4: Bottom-Left, Node 5: Bottom-Right
    const layout = [
      { x: 22, y: 15 }, // Node 0
      { x: 70, y: 15 }, // Node 1
      { x: 70, y: 50 }, // Node 2
      { x: 22, y: 50 }, // Node 3
      { x: 22, y: 85 }, // Node 4
      { x: 70, y: 85 }  // Node 5
    ];
    return layout[index % layout.length];
  };

  const renderContent = () => {
    return (
      <div 
        ref={downloadRef}
        className={`roadmap-sh-container ${isFullscreen ? 'fullscreen' : 'pane-mode'}`}
        style={{
          position: isFullscreen ? 'fixed' : 'relative',
          top: isFullscreen ? 0 : 'auto',
          left: isFullscreen ? 0 : 'auto',
          width: '100%',
          height: isFullscreen ? '100vh' : '100%',
          backgroundColor: '#0f0d14',
          backgroundImage: 'radial-gradient(rgba(191, 133, 255, 0.04) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          color: '#ffffff',
          fontFamily: '"Outfit", sans-serif',
          overflow: 'hidden',
          border: isFullscreen ? 'none' : '1px solid rgba(255, 255, 255, 0.04)',
          borderRadius: isFullscreen ? '0' : '20px',
          boxShadow: isFullscreen ? 'none' : '0 12px 40px rgba(0, 0, 0, 0.4)',
          boxSizing: 'border-box',
          zIndex: isFullscreen ? 9999999 : 1
        }}
      >
        {/* Controls Bar */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'flex',
          gap: '8px',
          zIndex: 100000
        }}>
          {/* Download Dropdown Container */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)} 
              className="ctrl-btn-action"
            >
              <Download size={13} />
              Export
              <ChevronDown size={12} />
            </button>

            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: '36px',
                right: 0,
                background: 'rgba(22, 19, 28, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                width: '120px',
                zIndex: 100001
              }}>
                <button className="dropdown-item" onClick={() => handleDownload('png')}>PNG Image</button>
                <button className="dropdown-item" onClick={() => handleDownload('jpg')}>JPG Image</button>
                <button className="dropdown-item" onClick={() => handleDownload('svg')}>SVG Vector</button>
              </div>
            )}
          </div>

          {/* Fullscreen Button */}
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)} 
            className="ctrl-btn-action"
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </button>
        </div>

        {/* Graph Canvas */}
        <div style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          padding: '40px',
          boxSizing: 'border-box'
        }}>
          {/* SVG Background Connections */}
          <svg style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1
          }}>
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 2 L 8 5 L 0 8 z" fill="#bf85ff" />
              </marker>
            </defs>

            {safeRoadmap.map((_, idx) => {
              if (idx === safeRoadmap.length - 1) return null;
              
              const startPos = getNodeLayout(idx);
              const endPos = getNodeLayout(idx + 1);
              
              // Map coordinates to approximate pixels based on percentage
              const x1 = `${startPos.x}%`;
              const y1 = `${startPos.y}%`;
              const x2 = `${endPos.x}%`;
              const y2 = `${endPos.y}%`;

              // Generate bezier control points for curved paths matching reference style
              // If col is same, curve it right/left
              // If row is same, draw direct line
              return (
                <path
                  key={`path-${idx}`}
                  d={`M ${startPos.x} ${startPos.y} C ${startPos.x} ${(startPos.y + endPos.y) / 2}, ${endPos.x} ${(startPos.y + endPos.y) / 2}, ${endPos.x} ${endPos.y}`}
                  pathLength="100"
                  style={{
                    fill: 'none',
                    stroke: 'rgba(191, 133, 255, 0.4)',
                    strokeWidth: 3,
                    strokeDasharray: '4 4',
                    transform: 'scale(1)',
                    markerEnd: 'url(#arrow)'
                  }}
                />
              );
            })}
          </svg>

          {/* Render Nodes */}
          {safeRoadmap.map((milestone, idx) => {
            const pos = getNodeLayout(idx);
            const style = nodeStyles[idx % nodeStyles.length];
            const Icon = style.icon;
            
            const phaseName = milestone?.phase || `Phase ${idx + 1}`;
            const phaseKey = String(phaseName).toLowerCase().replace(' ', '_');
            
            const milestoneTasks = safeTasks.filter(t => 
              t.milestone_id?.toLowerCase() === phaseKey || 
              t.milestone_id?.toLowerCase() === `phase_${idx + 1}`
            );
            const milestoneBlockers = safeBlockers.filter(b => 
              milestoneTasks.some(t => t.id === b.task_id)
            );

            return (
              <React.Fragment key={`node-container-${idx}`}>
                {/* Midpoint edit circular badge */}
                {idx < safeRoadmap.length - 1 && (() => {
                  const startPos = getNodeLayout(idx);
                  const endPos = getNodeLayout(idx + 1);
                  const midX = (startPos.x + endPos.x) / 2;
                  const midY = (startPos.y + endPos.y) / 2;
                  return (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${midX}%`,
                        top: `${midY}%`,
                        transform: 'translate(-50%, -50%)',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#1a1722',
                        border: '1.5px solid rgba(191, 133, 255, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#bf85ff',
                        zIndex: 3,
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                      }}
                      title="Edit Connection"
                    >
                      <Edit3 size={11} />
                    </div>
                  );
                })()}

                {/* Node Box */}
                <div
                  onClick={() => setSelectedNode({ milestone, index: idx, tasks: milestoneTasks, blockers: milestoneBlockers })}
                  style={{
                    position: 'absolute',
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '180px',
                    padding: '20px 16px',
                    borderRadius: '28px',
                    backgroundColor: '#14111a',
                    border: `1.5px solid ${style.border}`,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 2,
                    transition: 'all 0.25s ease'
                  }}
                  className="flow-node-box"
                >
                  {/* Top Connector Plus */}
                  <div className="conn-plus" style={{ top: '-8px' }}><Plus size={8} /></div>

                  {/* Icon Panel */}
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '16px',
                    backgroundColor: style.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: style.color,
                    marginBottom: '10px',
                    boxShadow: `0 0 15px ${style.bg}`
                  }}>
                    <Icon size={20} />
                  </div>

                  {/* Title / Subtitle */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#fff', marginBottom: '2px' }}>
                      {style.name}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#a1a1aa' }}>
                      {milestone.title || 'Execute phase'}
                    </div>
                  </div>

                  {/* Bottom Connector Plus */}
                  <div className="conn-plus" style={{ bottom: '-8px' }}><Plus size={8} /></div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Side Details Drawer */}
        {selectedNode && (
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '320px',
            height: '100%',
            backgroundColor: '#14111a',
            borderLeft: '1.5px solid rgba(191, 133, 255, 0.2)',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
            zIndex: 1000,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            animation: 'slideIn 0.25s ease-out'
          }}>
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#bf85ff', textTransform: 'uppercase' }}>
                  {selectedNode.milestone.phase}
                </span>
                <h3 style={{ fontSize: '16px', color: '#fff', margin: 0 }}>
                  {selectedNode.milestone.title}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', outline: 'none' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px' }}>
              {/* Deliverables */}
              <div>
                <span style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                  Primary Deliverable
                </span>
                <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', color: '#d1d5db' }}>
                  {selectedNode.milestone.deliverable}
                </p>
              </div>

              {/* Specs */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <div className="spec-badge">
                  <Clock size={11} />
                  <span>{selectedNode.milestone.duration_estimate || 'N/A'}</span>
                </div>
                <div className={`spec-badge risk-${selectedNode.milestone.risk_level}`}>
                  <span>{selectedNode.milestone.risk_level} Risk</span>
                </div>
              </div>

              {/* Tasks List */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                <span style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                  Tasks
                </span>
                {selectedNode.tasks.length === 0 ? (
                  <span style={{ fontSize: '11px', color: '#71717a', fontStyle: 'italic' }}>No tasks assigned.</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedNode.tasks.map(t => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        {t.status === 'completed' ? (
                          <CheckCircle2 size={13} style={{ color: '#34d399', flexShrink: 0 }} />
                        ) : t.status === 'in_progress' ? (
                          <Play size={13} style={{ color: '#3b82f6', flexShrink: 0 }} />
                        ) : (
                          <Circle size={13} style={{ color: '#71717a', flexShrink: 0 }} />
                        )}
                        <span style={{ fontSize: '11.5px', color: '#e4e4e7', textDecoration: t.status === 'completed' ? 'line-through' : 'none', opacity: t.status === 'completed' ? 0.6 : 0.9 }}>
                          {t.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Blockers */}
              {selectedNode.blockers.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                  <span style={{ fontSize: '10px', color: '#f87171', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                    Active Blockers
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedNode.blockers.map(b => (
                      <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(248, 113, 113, 0.05)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(248, 113, 113, 0.2)', color: '#fca5a5' }}>
                        <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '11.5px' }}>{b.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <style>{`
          .ctrl-btn-action {
            background: rgba(22, 19, 28, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.04);
            border-radius: 8px;
            padding: 6px 12px;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 600;
            font-size: 11.5px;
            color: #fff;
            transition: all 0.15s ease;
            backdrop-filter: blur(10px);
          }
          .ctrl-btn-action:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.1);
          }
          .dropdown-item {
            background: transparent;
            border: none;
            padding: 8px 12px;
            text-align: left;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            color: #d1d5db;
            transition: background-color 0.15s ease, color 0.15s ease;
          }
          .dropdown-item:hover {
            background-color: rgba(255, 255, 255, 0.04);
            color: #fff;
          }
          .dropdown-item:not(:last-child) {
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          }
          .flow-node-box:hover {
            transform: translate(-50%, -54%) scale(1.03) !important;
            box-shadow: 0 15px 40px rgba(191, 133, 255, 0.15) !important;
            background-color: #1a1722 !important;
          }
          .conn-plus {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background-color: #14111a;
            border: 1px solid rgba(255,255,255,0.08);
            display: flex;
            align-items: center;
            justify: center;
            color: rgba(255,255,255,0.4);
            justify-content: center;
          }
          .spec-badge {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.06);
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 10.5px;
            display: flex;
            align-items: center;
            gap: 4px;
            color: #a1a1aa;
          }
          .spec-badge.risk-high {
            background-color: rgba(248, 113, 113, 0.08);
            border-color: rgba(248, 113, 113, 0.25);
            color: #fca5a5;
          }
          .spec-badge.risk-medium {
            background-color: rgba(251, 191, 36, 0.08);
            border-color: rgba(251, 191, 36, 0.25);
            color: #fde047;
          }
          .spec-badge.risk-low {
            background-color: rgba(52, 211, 153, 0.08);
            border-color: rgba(52, 211, 153, 0.25);
            color: #a7f3d0;
          }
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          .roadmap-sh-container.fullscreen {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
            z-index: 9999999 !important;
          }
        `}</style>
      </div>
    );
  };

  const stretchStyle = isFullscreen ? {} : {
    resize: 'both',
    overflow: 'auto',
    minHeight: '480px',
    height: '520px',
    position: 'relative'
  };

  return (
    <div style={stretchStyle}>
      {isFullscreen ? createPortal(renderContent(), document.body) : renderContent()}
      
      {/* Visual Resize Grab Handle in Bottom-Right */}
      {!isFullscreen && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          width: '8px',
          height: '8px',
          borderRight: '2px solid rgba(191, 133, 255, 0.4)',
          borderBottom: '2px solid rgba(191, 133, 255, 0.4)',
          pointerEvents: 'none',
          zIndex: 10
        }} />
      )}
    </div>
  );
}
