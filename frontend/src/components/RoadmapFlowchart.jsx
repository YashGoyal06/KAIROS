import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  CheckCircle2, Play, Circle, AlertTriangle, Clock, 
  Minimize2, Maximize2, Download, ChevronDown
} from 'lucide-react';
import { toPng, toJpeg, toSvg } from 'html-to-image';

export default function RoadmapFlowchart({ roadmap = [], tasks = [], blockers = [], onNodeClick }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState({});
  const [showDropdown, setShowDropdown] = useState(false);
  
  const downloadRef = useRef(null);

  const safeRoadmap = Array.isArray(roadmap) ? roadmap : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeBlockers = Array.isArray(blockers) ? blockers : [];

  const toggleExpand = (idx) => {
    setExpandedPhases(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const getPhaseColor = (idx) => {
    const colors = ['#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#10b981'];
    return colors[idx % colors.length] || '#f59e0b';
  };

  const handleDownload = (format) => {
    if (!downloadRef.current) return;
    setShowDropdown(false);

    // Options to optimize quality and background
    const options = {
      backgroundColor: '#0a0b10',
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
          maxHeight: isFullscreen ? '100vh' : '100%',
          backgroundColor: '#0a0b10',
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          color: '#ffffff',
          fontFamily: '"Inter", system-ui, sans-serif',
          overflowY: 'auto',
          overflowX: 'hidden',
          border: isFullscreen ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: isFullscreen ? '0' : '12px',
          boxShadow: isFullscreen ? 'none' : '0 12px 40px rgba(0, 0, 0, 0.4)',
          transition: 'all 0.25s ease',
          padding: isFullscreen ? '60px 40px' : '20px 12px',
          boxSizing: 'border-box',
          zIndex: isFullscreen ? 9999999 : 1
        }}
      >
        {/* Controls Bar */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          gap: '8px',
          zIndex: 10000000
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
                background: 'rgba(15, 17, 26, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                width: '120px',
                zIndex: 10000001
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
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>

        {/* Main timeline wrapper */}
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', minHeight: '100%', paddingTop: '20px' }}>
          
          {/* Central Spine / Left Spine */}
          {safeRoadmap.length > 0 && (
            <div 
              className="timeline-spine"
              style={{
                position: 'absolute',
                left: isFullscreen ? '50%' : '30px',
                top: '20px',
                bottom: '20px',
                width: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                transform: 'translateX(-50%)',
                zIndex: 1
              }}
            />
          )}

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative', zIndex: 2 }}>
            {safeRoadmap.map((milestone, mIdx) => {
              const phaseName = milestone?.phase || `Phase ${mIdx + 1}`;
              const phaseKey = String(phaseName).toLowerCase().replace(' ', '_');
              const phaseColor = getPhaseColor(mIdx);
              
              const milestoneTasks = safeTasks.filter(t => 
                t.milestone_id?.toLowerCase() === phaseKey || 
                t.milestone_id?.toLowerCase() === `phase_${mIdx + 1}`
              );
              const milestoneBlockers = safeBlockers.filter(b => 
                milestoneTasks.some(t => t.id === b.task_id)
              );

              const isLeft = mIdx % 2 === 0;
              const isExpanded = expandedPhases[mIdx];
              const tasksToShow = isExpanded ? milestoneTasks : milestoneTasks.slice(0, 3);

              if (!isFullscreen) {
                return (
                  <div 
                    key={`milestone-${mIdx}`} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start',
                      gap: '16px',
                      width: '100%',
                      paddingLeft: '15px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center', width: '30px', marginTop: '14px', flexShrink: 0, zIndex: 3 }}>
                      <div 
                        onClick={() => onNodeClick && onNodeClick({ type: 'milestone', data: milestone, index: mIdx })}
                        className="spine-dot-node"
                        style={{
                          borderColor: phaseColor,
                          boxShadow: `0 0 10px ${phaseColor}40`,
                        }}
                      >
                        {mIdx + 1}
                      </div>
                    </div>

                    <div style={{ width: '12px', borderTop: `3px dashed ${phaseColor}`, marginTop: '24px', opacity: 0.6, flexShrink: 0 }} />

                    <div className="roadmap-sh-card interactive-hover" style={{ flexGrow: 1, maxWidth: 'calc(100% - 70px)', border: `1px solid ${phaseColor}40` }}>
                      <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${phaseColor}20` }}>
                        <span style={{ color: phaseColor }}>{milestone.phase} : {milestone.title}</span>
                        <span className={`metadata-tag risk-${milestone.risk_level}`} style={{ fontSize: '8px' }}>
                          {milestone.risk_level}
                        </span>
                      </div>
                      
                      <div className="card-body" style={{ gap: '10px' }}>
                        <p style={{ margin: 0, fontSize: '11px', lineHeight: '1.4', color: '#94a3b8' }}>
                          <strong>Deliverable:</strong> {milestone.deliverable}
                        </p>

                        <div style={{ display: 'flex', gap: '6px', fontSize: '9px', color: '#64748b' }}>
                          <Clock size={11} /> Est: {milestone.duration_estimate || 'N/A'}
                        </div>

                        {milestoneTasks.length > 0 && (
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '9px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Tasks</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {tasksToShow.map(t => (
                                <div key={t.id} className="sub-node">
                                  {t.status === 'completed' ? (
                                    <CheckCircle2 size={12} style={{ color: '#10b981', flexShrink: 0 }} />
                                  ) : t.status === 'in_progress' ? (
                                    <Play size={12} style={{ color: '#3b82f6', flexShrink: 0 }} />
                                  ) : (
                                    <Circle size={12} style={{ color: '#64748b', flexShrink: 0 }} />
                                  )}
                                  <span className="task-text" style={{ 
                                    textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                                    opacity: t.status === 'completed' ? 0.5 : 0.9,
                                    color: '#d1d5db'
                                  }}>
                                    {t.name}
                                  </span>
                                </div>
                              ))}
                              {milestoneTasks.length > 3 && (
                                <button className="expand-toggle-btn" onClick={() => toggleExpand(mIdx)}>
                                  {isExpanded ? 'Show Less' : `+ ${milestoneTasks.length - 3} More`}
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {milestoneBlockers.length > 0 && (
                          <div style={{ borderTop: '1px solid rgba(239, 68, 68, 0.2)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {milestoneBlockers.map(b => (
                              <div key={b.id} className="sub-node blocker-node">
                                <AlertTriangle size={11} style={{ color: '#ef4444', flexShrink: 0 }} />
                                <span>{b.description}</span>
                              </div>
                            ))}
                          </div>
                        )}

                      </div>
                    </div>

                  </div>
                );
              } else {
                return (
                  <div 
                    key={`milestone-${mIdx}`} 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 140px 1fr', 
                      alignItems: 'center',
                      width: '100%',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                      {isLeft ? (
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'flex-end' }}>
                          <div className="roadmap-sh-card interactive-hover" style={{ border: `1px solid ${phaseColor}40` }}>
                            <div className="card-title" style={{ borderBottom: `1px solid ${phaseColor}20`, color: phaseColor }}>Tasks & Goals</div>
                            <div className="card-body">
                              {milestoneTasks.length === 0 ? (
                                <div className="empty-text">No active tasks assigned</div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {tasksToShow.map(t => (
                                    <div key={t.id} className="sub-node">
                                      {t.status === 'completed' ? (
                                        <CheckCircle2 size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                                      ) : t.status === 'in_progress' ? (
                                        <Play size={13} style={{ color: '#3b82f6', flexShrink: 0 }} />
                                      ) : (
                                        <Circle size={13} style={{ color: '#64748b', flexShrink: 0 }} />
                                      )}
                                      <span className="task-text" style={{ 
                                        textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                                        opacity: t.status === 'completed' ? 0.5 : 0.9,
                                        color: '#d1d5db'
                                      }}>
                                        {t.name}
                                      </span>
                                    </div>
                                  ))}
                                  {milestoneTasks.length > 3 && (
                                    <button className="expand-toggle-btn" onClick={() => toggleExpand(mIdx)}>
                                      {isExpanded ? 'Show Less' : `+ ${milestoneTasks.length - 3} More`}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="branch-line branch-right" style={{ borderTop: `3px dashed ${phaseColor}`, opacity: 0.6 }} />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'flex-end' }}>
                          <div className="roadmap-sh-card detail-card interactive-hover" style={{ border: `1px solid ${phaseColor}40` }}>
                            <div className="card-title text-blue" style={{ borderBottom: `1px solid ${phaseColor}20`, color: phaseColor }}>Deliverables & Risks</div>
                            <div className="card-body">
                              <p style={{ margin: '0 0 10px 0', fontSize: '12px', lineHeight: '1.4', fontWeight: '600', color: '#d1d5db' }}>
                                {milestone.deliverable}
                              </p>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                                <span className="metadata-tag">
                                  <Clock size={11} /> {milestone.duration_estimate}
                                </span>
                                <span className={`metadata-tag risk-${milestone.risk_level}`}>
                                  {milestone.risk_level} Risk
                                </span>
                              </div>
                              {milestoneBlockers.length > 0 && (
                                <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                                  <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', color: '#ef4444' }}>
                                    Blockers
                                  </div>
                                  {milestoneBlockers.map(b => (
                                    <div key={b.id} className="sub-node blocker-node">
                                      <AlertTriangle size={12} style={{ color: '#ef4444', flexShrink: 0 }} />
                                      <span>{b.description}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="branch-line branch-right" style={{ borderTop: `3px dashed ${phaseColor}`, opacity: 0.6 }} />
                        </div>
                      )}
                    </div>

                    <div style={{ justifySelf: 'center', display: 'flex', alignItems: 'center', zIndex: 3 }}>
                      <div 
                        onClick={() => onNodeClick && onNodeClick({ type: 'milestone', data: milestone, index: mIdx })}
                        className="spine-dot-node"
                        style={{
                          borderColor: phaseColor,
                          boxShadow: `0 0 10px ${phaseColor}40`,
                        }}
                      >
                        {mIdx + 1}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%' }}>
                      {!isLeft ? (
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'flex-start' }}>
                          <div className="branch-line branch-left" style={{ borderTop: `3px dashed ${phaseColor}`, opacity: 0.6 }} />
                          <div className="roadmap-sh-card interactive-hover" style={{ border: `1px solid ${phaseColor}40` }}>
                            <div className="card-title" style={{ borderBottom: `1px solid ${phaseColor}20`, color: phaseColor }}>Tasks & Goals</div>
                            <div className="card-body">
                              {milestoneTasks.length === 0 ? (
                                <div className="empty-text">No active tasks assigned</div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {tasksToShow.map(t => (
                                    <div key={t.id} className="sub-node">
                                      {t.status === 'completed' ? (
                                        <CheckCircle2 size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                                      ) : t.status === 'in_progress' ? (
                                        <Play size={13} style={{ color: '#3b82f6', flexShrink: 0 }} />
                                      ) : (
                                        <Circle size={13} style={{ color: '#64748b', flexShrink: 0 }} />
                                      )}
                                      <span className="task-text" style={{ 
                                        textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                                        opacity: t.status === 'completed' ? 0.5 : 0.9,
                                        color: '#d1d5db'
                                      }}>
                                        {t.name}
                                      </span>
                                    </div>
                                  ))}
                                  {milestoneTasks.length > 3 && (
                                    <button className="expand-toggle-btn" onClick={() => toggleExpand(mIdx)}>
                                      {isExpanded ? 'Show Less' : `+ ${milestoneTasks.length - 3} More`}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'flex-start' }}>
                          <div className="branch-line branch-left" style={{ borderTop: `3px dashed ${phaseColor}`, opacity: 0.6 }} />
                          <div className="roadmap-sh-card detail-card interactive-hover" style={{ border: `1px solid ${phaseColor}40` }}>
                            <div className="card-title text-blue" style={{ borderBottom: `1px solid ${phaseColor}20`, color: phaseColor }}>Deliverables & Risks</div>
                            <div className="card-body">
                              <p style={{ margin: '0 0 10px 0', fontSize: '12px', lineHeight: '1.4', fontWeight: '600', color: '#d1d5db' }}>
                                {milestone.deliverable}
                              </p>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                                <span className="metadata-tag">
                                  <Clock size={11} /> {milestone.duration_estimate}
                                </span>
                                <span className={`metadata-tag risk-${milestone.risk_level}`}>
                                  {milestone.risk_level} Risk
                                </span>
                              </div>
                              {milestoneBlockers.length > 0 && (
                                <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                                  <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', color: '#ef4444' }}>
                                    Blockers
                                  </div>
                                  {milestoneBlockers.map(b => (
                                    <div key={b.id} className="sub-node blocker-node">
                                      <AlertTriangle size={12} style={{ color: '#ef4444', flexShrink: 0 }} />
                                      <span>{b.description}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>

        <style>{`
          .ctrl-btn-action {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 6px;
            padding: 6px 12px;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 800;
            font-size: 11px;
            color: #fff;
            transition: all 0.15s ease;
            backdrop-filter: blur(10px);
          }
          .ctrl-btn-action:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.15);
          }
          .dropdown-item {
            background: transparent;
            border: none;
            padding: 8px 12px;
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            width: 100%;
            color: #d1d5db;
            transition: background-color 0.15s ease, color 0.15s ease;
          }
          .dropdown-item:hover {
            background-color: rgba(255, 255, 255, 0.05);
            color: #fff;
          }
          .dropdown-item:not(:last-child) {
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }
          .spine-dot-node {
            background-color: #0a0b10;
            border: 3px solid #2563eb;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 13px;
            color: #fff;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
          }
          .spine-dot-node:hover {
            transform: scale(1.1);
            background-color: rgba(255,255,255,0.03);
          }
          .roadmap-sh-card {
            background-color: rgba(15, 17, 26, 0.75);
            backdrop-filter: blur(12px);
            border-radius: 12px;
            width: 100%;
            max-width: 280px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: all 0.25s ease;
            z-index: 5;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          }
          .interactive-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
          }
          .card-title {
            background-color: rgba(255, 255, 255, 0.02);
            padding: 8px 12px;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .card-body {
            padding: 12px;
            display: flex;
            flex-direction: column;
          }
          .sub-node {
            background-color: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 6px;
            padding: 5px 8px;
            font-size: 11px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 6px;
            color: #d1d5db;
            text-align: left;
            transition: background-color 0.15s ease;
          }
          .sub-node:hover {
            background-color: rgba(255, 255, 255, 0.05);
          }
          .blocker-node {
            background-color: rgba(239, 68, 68, 0.05);
            border-color: rgba(239, 68, 68, 0.2);
            color: #fca5a5;
          }
          .empty-text {
            font-size: 11px;
            color: #64748b;
            font-style: italic;
            padding: 4px;
          }
          .metadata-tag {
            font-size: 9px;
            font-weight: 800;
            background-color: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 2px 5px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
            width: fit-content;
            color: #94a3b8;
          }
          .metadata-tag.risk-high {
            background-color: rgba(239, 68, 68, 0.08);
            border-color: rgba(239, 68, 68, 0.25);
            color: #fca5a5;
          }
          .metadata-tag.risk-medium {
            background-color: rgba(245, 158, 11, 0.08);
            border-color: rgba(245, 158, 11, 0.25);
            color: #fde047;
          }
          .metadata-tag.risk-low {
            background-color: rgba(16, 185, 129, 0.08);
            border-color: rgba(16, 185, 129, 0.25);
            color: #a7f3d0;
          }
          .expand-toggle-btn {
            background: none;
            border: none;
            color: #3b82f6;
            font-size: 10px;
            font-weight: 800;
            cursor: pointer;
            text-align: left;
            padding: 4px 0 0 0;
            text-transform: uppercase;
          }
          .expand-toggle-btn:hover {
            text-decoration: underline;
            color: #60a5fa;
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

  if (isFullscreen) {
    return createPortal(renderContent(), document.body);
  }
  return renderContent();
}
