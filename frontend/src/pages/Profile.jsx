import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Check, Plus, X } from 'lucide-react';
import { getTechIconUrl } from '../utils/techIcons';
import { FaGithub, FaSlack, FaTwitter } from 'react-icons/fa';
import StaggeredGrid from '../components/StaggeredGrid';

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
    <div className="main-content" style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. TOP HEADER */}
      <div className="dashboard-header" style={{ paddingBottom: '12px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#fff' }}>My Profile Settings</h1>
          <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '4px' }}>
            Update your role, experience level, and programming tech stack.
          </p>
        </div>
      </div>

      {/* 1. GLASSMORPHISM USER PROFILE CARD (SHARP EDGES, LEFT AVATAR, NO SYNERGY STACK) */}
      <div 
        style={{
          width: '100%',
          background: 'rgba(18, 16, 26, 0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '0px', // Sharp Edges
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '24px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          boxSizing: 'border-box'
        }}
      >
        {/* Left Side: Avatar Icon */}
        <div style={{
          width: '84px',
          height: '84px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          background: 'rgba(255, 255, 255, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(191, 133, 255, 0.2)',
          borderRadius: '0px', // Sharp Edges for Avatar Box
          overflow: 'hidden',
          flexShrink: 0
        }}>
          <img 
            src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName || 'Azhaan')}`} 
            alt="Avatar"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Right Side: Name & Position Details */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
            {fullName || "Azhaan Ali Siddiqui"}
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
            <span style={{ 
              fontSize: '12px', 
              color: '#00FF66', 
              fontWeight: '700', 
              fontFamily: 'monospace', 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em',
              textShadow: '0 0 8px rgba(0, 255, 102, 0.4)'
            }}>
              {role}
            </span>
            
            <span style={{ color: '#4b5563', fontSize: '12px' }}>•</span>

            <span style={{ 
              fontSize: '11px', 
              color: '#d1d5db', 
              background: 'rgba(255, 255, 255, 0.06)', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              padding: '2px 10px', 
              borderRadius: '0px',
              fontFamily: 'monospace'
            }}>
              {experience.replace(/\s*\(.*\)/g, '')}
            </span>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE: TECH STACK STAGGERED GRID */}
      <div style={{ width: '100%' }}>
        <StaggeredGrid 
          centerText="TECH STACK"
          showFooter={false}
          bentoItems={[
            {
              id: 1,
              title: "Repository",
              subtitle: "CONNECT",
              icon: <FaGithub className="w-5 h-5 text-white" />,
              image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop"
            },
            {
              id: 2,
              title: "CONNECT",
              subtitle: "COMMUNITY",
              icon: <FaSlack className="w-5 h-5 text-white/70" />,
              image: null
            },
            {
              id: 3,
              title: "REACH",
              subtitle: "SOCIAL",
              icon: <FaTwitter className="w-5 h-5 text-white/70" />,
              image: null
            }
          ]}
          images={selectedTech.length > 0 ? selectedTech : undefined}
        />
      </div>

      {/* 3. BOTTOM: FULL-WIDTH MODIFICATION FIELDS */}
      <div 
        style={{
          width: '100%',
          background: 'rgba(18, 16, 26, 0.65)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '0px',
          padding: '32px',
          boxSizing: 'border-box'
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

          <div className="profile-section-header" style={{ marginTop: '12px' }}>/// PROFESSIONAL_LEVEL</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
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
          </div>

          <div className="profile-section-header" style={{ marginTop: '12px' }}>/// KERNEL_INTEGRATION</div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '12px' }}>Search & Select Tech Stack</label>
            <input
              type="text"
              className="form-input"
              placeholder="Search technologies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: '0px', background: 'rgba(0,0,0,0.2)', marginTop: '8px' }}>
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
                            borderRadius: '0px',
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
              <button type="button" onClick={handleAddCustom} className="btn btn-secondary" style={{ padding: '0 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0px' }}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '12px' }}>Selected Technologies</label>
            <div className="tag-input-container" style={{ background: 'rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0px' }}>
              {selectedTech.length === 0 ? (
                <span style={{ fontSize: '12px', color: '#6b7280', padding: '4px' }}>No skills integrated yet.</span>
              ) : (
                selectedTech.map(tech => (
                  <div key={tech} className="tag" style={{ background: 'rgba(236, 72, 153, 0.05)', borderColor: 'rgba(236, 72, 153, 0.15)', color: '#ffffff', borderRadius: '0px' }}>
                    {tech}
                    <X size={12} className="tag-remove" onClick={() => handleTechRemove(tech)} />
                  </div>
                ))
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px', borderRadius: '0px' }} disabled={updating}>
            <Check size={18} /> {updating ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

    </div>
  );
}