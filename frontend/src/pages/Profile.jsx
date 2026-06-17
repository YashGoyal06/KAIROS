import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Check, Plus, X } from 'lucide-react';
import { getTechIconUrl } from '../utils/techIcons';

const PREDEFINED_TECH = {
  "Languages": ["Python", "JavaScript", "TypeScript", "Rust", "Go", "C++", "HTML/CSS", "Solidity"],
  "Frameworks": ["React", "Next.js", "FastAPI", "Django", "Node.js", "Express", "Svelte", "Flask"],
  "Databases": ["PostgreSQL", "Supabase", "MongoDB", "Redis", "MySQL", "DynamoDB"],
  "AI/ML": ["PyTorch", "TensorFlow", "OpenAI API", "Hugging Face", "LangChain", "Gemini API"],
  "Tools": ["Docker", "Kubernetes", "Git", "AWS", "GitHub Actions", "Vercel"]
};

export default function Profile() {
  const { profile, refreshProfile, API_BASE, user } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Frontend Developer');
  const [experience, setExperience] = useState('Intermediate');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTech, setSelectedTech] = useState([]);
  const [customTech, setCustomTech] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setRole(profile.primary_role || 'Frontend Developer');
      setExperience(profile.experience_level || 'Intermediate');
      setSelectedTech(profile.tech_stack || []);
    }
  }, [profile]);

  const handleTechSelect = (tech) => {
    if (!selectedTech.includes(tech)) {
      setSelectedTech([...selectedTech, tech]);
    }
  };

  const handleTechRemove = (tech) => {
    setSelectedTech(selectedTech.filter(t => t !== tech));
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (customTech.trim() && !selectedTech.includes(customTech.trim())) {
      setSelectedTech([...selectedTech, customTech.trim()]);
      setCustomTech('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert("Name is required.");
      return;
    }
    
    setUpdating(true);
    try {
      await axios.post(`${API_BASE}/profiles`, {
        id: user.id,
        full_name: fullName,
        primary_role: role,
        experience_level: experience,
        tech_stack: selectedTech
      });
      await refreshProfile();
      alert("Profile updated successfully!");
    } catch (err) {
      console.error('Error saving profile:', err);
      alert("Error updating profile.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="main-content" style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column' }}>
      <div className="dashboard-header" style={{ marginBottom: '16px', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#fff' }}>My Profile Settings</h1>
          <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '4px' }}>
            Update your role, experience level, and programming tech stack.
          </p>
        </div>
      </div>

      <div className="profile-grid-kairos">
        {/* Left Column: Visual Profile Card */}
        <div className="profile-card-left">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 0', width: '100%' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', textShadow: '0 0 8px rgba(236, 72, 153, 0.6)', marginTop: '8px' }}>
              {fullName || "Azhaan Ali Siddiqui"}
            </h2>
            
            <span style={{ 
              fontSize: '12px', 
              color: '#00FF66', 
              fontWeight: '700', 
              fontFamily: 'monospace', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em', 
              marginTop: '6px',
              textShadow: '0 0 8px rgba(0, 255, 102, 0.3)'
            }}>
              {role}
            </span>
            
            <span style={{ 
              fontSize: '11px', 
              color: '#9ca3af', 
              marginTop: '8px', 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.06)', 
              padding: '4px 12px', 
              borderRadius: '9999px' 
            }}>
              {experience.replace(/\s*\(.*\)/g, '')}
            </span>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', marginTop: '10px', width: '100%' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px' }}>
              /// SYNERGY_STACK ({selectedTech.length})
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', 
              gap: '10px',
              marginTop: '4px'
            }}>
              {selectedTech.length === 0 ? (
                <span style={{ fontSize: '11px', color: '#6b7280', gridColumn: '1 / -1' }}>No skills integrated yet.</span>
              ) : (
                selectedTech.map(tech => (
                  <div 
                    key={tech} 
                    title={tech}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.5)';
                      e.currentTarget.style.boxShadow = '0 0 10px rgba(236, 72, 153, 0.3)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <img 
                      src={getTechIconUrl(tech)} 
                      alt={tech} 
                      style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent && !parent.querySelector('.fallback-icon-text')) {
                          const span = document.createElement('span');
                          span.className = 'fallback-icon-text';
                          span.style.fontSize = '10px';
                          span.style.fontWeight = 'bold';
                          span.style.fontFamily = 'monospace';
                          span.style.color = '#ec4899';
                          span.innerText = tech.slice(0, 2).toUpperCase();
                          parent.appendChild(span);
                        }
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Settings Form */}
        <div className="profile-card-right">
          <form onSubmit={handleSubmit}>
            <div className="profile-section-header">/// USER_IDENTITY</div>
            
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px' }}>Full Name</label>
              <input
                type="text"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Azhaan Ali Siddiqui"
                required
              />
            </div>

            <div className="profile-section-header">/// PROFESSIONAL_LEVEL</div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px' }}>Primary Role</label>
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="AI/ML Engineer">AI/ML Engineer</option>
                <option value="UI/UX Designer">UI/UX Designer</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Research & Pitch">Research & Pitch</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px' }}>Experience Level</label>
              <select className="form-select" value={experience} onChange={(e) => setExperience(e.target.value)}>
                <option value="Beginner">Beginner (1st/2nd Hackathon)</option>
                <option value="Intermediate">Intermediate (Experienced coder)</option>
                <option value="Advanced">Advanced (Hackathon winner / Professional)</option>
              </select>
            </div>

            <div className="profile-section-header">/// KERNEL_INTEGRATION</div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px' }}>Search & Select Tech Stack</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search technologies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', marginTop: '8px' }}>
                {Object.entries(PREDEFINED_TECH).map(([category, items]) => {
                  const filtered = items.filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()));
                  if (filtered.length === 0) return null;
                  return (
                    <div key={category} style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6b7280', fontWeight: 'bold', marginBottom: '6px', fontFamily: 'monospace' }}>{category}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {filtered.map(tech => (
                          <button
                            key={tech}
                            type="button"
                            onClick={() => handleTechSelect(tech)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid rgba(255,255,255,0.08)',
                              background: selectedTech.includes(tech) ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255,255,255,0.03)',
                              color: selectedTech.includes(tech) ? '#ffffff' : '#9ca3af',
                              fontSize: '11px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              fontFamily: 'monospace'
                            }}
                          >
                            {tech}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px' }}>Add Custom Technology</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flexGrow: 1 }}
                  placeholder="e.g. Web3.js"
                  value={customTech}
                  onChange={(e) => setCustomTech(e.target.value)}
                />
                <button type="button" onClick={handleAddCustom} className="btn btn-secondary" style={{ padding: '0 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px' }}>Selected Technologies</label>
              <div className="tag-input-container" style={{ background: 'rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {selectedTech.length === 0 ? (
                  <span style={{ fontSize: '12px', color: '#6b7280', padding: '4px' }}>No skills integrated yet.</span>
                ) : (
                  selectedTech.map(tech => (
                    <div key={tech} className="tag" style={{ background: 'rgba(236, 72, 153, 0.05)', borderColor: 'rgba(236, 72, 153, 0.15)', color: '#ffffff' }}>
                      {tech}
                      <X size={12} className="tag-remove" onClick={() => handleTechRemove(tech)} />
                    </div>
                  ))
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }} disabled={updating}>
              <Check size={18} /> {updating ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
