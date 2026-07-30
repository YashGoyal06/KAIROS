import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, Plus, X, User, Edit3, Sparkles } from 'lucide-react';
import { FaLinkedin, FaGithub } from 'react-icons/fa';
import { FloatingIconsHero } from '../components/ui/floating-icons-hero-section';

const PREDEFINED_TECH = {
  "Languages": ["Python", "JavaScript", "TypeScript", "Rust", "Go", "C++", "HTML/CSS", "Solidity"],
  "Frameworks": ["React", "Next.js", "FastAPI", "Django", "Node.js", "Express", "Svelte", "Flask"],
  "Databases": ["PostgreSQL", "Supabase", "MongoDB", "Redis", "MySQL", "DynamoDB"],
  "AI/ML": ["PyTorch", "TensorFlow", "OpenAI API", "Hugging Face", "LangChain", "Gemini API"],
  "Tools": ["Docker", "Kubernetes", "Git", "AWS", "GitHub Actions", "Vercel"]
};

export default function Profile() {
  const { profile, refreshProfile, API_BASE, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [isEditMode, setIsEditMode] = useState(searchParams.get('edit') === 'true');

  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Frontend Developer');
  const [experience, setExperience] = useState('Intermediate');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTech, setSelectedTech] = useState([]);
  const [customTech, setCustomTech] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setIsEditMode(searchParams.get('edit') === 'true');
  }, [searchParams]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setRole(profile.primary_role || 'Frontend Developer');
      setExperience(profile.experience_level || 'Intermediate');
      setSelectedTech(profile.tech_stack || []);
      setLinkedinUrl(profile.linkedin_url || '');
      setGithubUrl(profile.github_url || '');
    }
  }, [profile]);

  const toggleMode = (edit) => {
    setIsEditMode(edit);
    if (edit) {
      setSearchParams({ edit: 'true' });
    } else {
      setSearchParams({});
    }
  };

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
        tech_stack: selectedTech,
        linkedin_url: linkedinUrl,
        github_url: githubUrl
      });
      await refreshProfile();
      alert("Profile updated successfully!");
      toggleMode(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert("Error updating profile.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="main-content" style={{
      padding: '32px',
      maxWidth: '100%',
      margin: '0',
      width: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Header & Mode Switcher */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '800',
            color: '#ffffff',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>{isEditMode ? 'Edit Profile' : 'User Profile'}</span>
            <Sparkles size={22} style={{ color: '#c084fc' }} />
          </h1>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px', margin: 0 }}>
            {isEditMode 
              ? 'Update your bio, tech stack, and social connections' 
              : 'Overview of your developer identity and integrated floating tech stack'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '4px',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => toggleMode(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              background: !isEditMode ? 'linear-gradient(135deg, #a855f7, #ec4899)' : 'transparent',
              color: !isEditMode ? '#ffffff' : '#9ca3af',
              transition: 'all 0.2s ease'
            }}
          >
            <User size={15} />
            <span>View Profile</span>
          </button>

          <button
            type="button"
            onClick={() => toggleMode(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              background: isEditMode ? 'linear-gradient(135deg, #a855f7, #ec4899)' : 'transparent',
              color: isEditMode ? '#ffffff' : '#9ca3af',
              transition: 'all 0.2s ease'
            }}
          >
            <Edit3 size={15} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* VIEW PROFILE PAGE (Floating Icons Hero with Center Name, Role, Socials, Surrounding Tech Stack) */}
      {!isEditMode ? (
        <div style={{ width: '100%' }}>
          <FloatingIconsHero
            name={fullName}
            role={role}
            experience={experience}
            linkedinUrl={linkedinUrl}
            githubUrl={githubUrl}
            techStack={selectedTech}
          />
        </div>
      ) : (
        /* EDIT PROFILE FORM PAGE */
        <div style={{
          width: '100%',
          maxWidth: '750px',
          margin: '0 auto',
          backgroundColor: 'rgba(18, 16, 25, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '32px',
          boxSizing: 'border-box'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Identity Header */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#c084fc', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                /// PERSONAL IDENTITY
              </span>
            </div>

            {/* Full Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#d4d4d8', textTransform: 'uppercase' }}>Full Name</label>
              <input
                type="text"
                style={{
                  width: '100%',
                  backgroundColor: '#0c0a12',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Yash Goyal"
                required
              />
            </div>

            {/* Social URLs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#d4d4d8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaLinkedin size={14} style={{ color: '#60a5fa' }} /> LinkedIn URL
                </label>
                <input
                  type="url"
                  style={{
                    width: '100%',
                    backgroundColor: '#0c0a12',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#ffffff',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#d4d4d8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaGithub size={14} style={{ color: '#ffffff' }} /> GitHub URL
                </label>
                <input
                  type="url"
                  style={{
                    width: '100%',
                    backgroundColor: '#0c0a12',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#ffffff',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                />
              </div>
            </div>

            {/* Role & Experience */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginTop: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#f472b6', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                /// ROLE & EXPERIENCE
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#d4d4d8', textTransform: 'uppercase' }}>Primary Role</label>
              <select 
                style={{
                  width: '100%',
                  backgroundColor: '#0c0a12',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                value={role} 
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="AI/ML Engineer">AI/ML Engineer</option>
                <option value="UI/UX Designer">UI/UX Designer</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Research & Pitch">Research & Pitch</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#d4d4d8', textTransform: 'uppercase' }}>Experience Level</label>
              <select 
                style={{
                  width: '100%',
                  backgroundColor: '#0c0a12',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                value={experience} 
                onChange={(e) => setExperience(e.target.value)}
              >
                <option value="Beginner">Beginner (1st/2nd Hackathon)</option>
                <option value="Intermediate">Intermediate (Experienced coder)</option>
                <option value="Advanced">Advanced (Hackathon winner / Professional)</option>
              </select>
            </div>

            {/* Tech Stack */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginTop: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#818cf8', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                /// TECH STACK SELECTION
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#d4d4d8', textTransform: 'uppercase' }}>Search Technologies</label>
              <input
                type="text"
                style={{
                  width: '100%',
                  backgroundColor: '#0c0a12',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="Type technology name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <div style={{
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '12px',
                backgroundColor: '#0c0a12',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginTop: '6px'
              }}>
                {Object.entries(PREDEFINED_TECH).map(([category, items]) => {
                  const filtered = items.filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()));
                  if (filtered.length === 0) return null;
                  return (
                    <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', fontFamily: 'monospace', textTransform: 'uppercase' }}>{category}</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {filtered.map(tech => (
                          <button
                            key={tech}
                            type="button"
                            onClick={() => handleTechSelect(tech)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: selectedTech.includes(tech) ? '1px solid rgba(192, 132, 252, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                              backgroundColor: selectedTech.includes(tech) ? 'rgba(192, 132, 252, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                              color: selectedTech.includes(tech) ? '#ffffff' : '#9ca3af',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
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

            {/* Custom Tech */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#d4d4d8', textTransform: 'uppercase' }}>Add Custom Technology</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  style={{
                    flex: 1,
                    backgroundColor: '#0c0a12',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#ffffff',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="e.g. Web3.js"
                  value={customTech}
                  onChange={(e) => setCustomTech(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddCustom}
                  style={{
                    padding: '0 20px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Selected Tech Chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#d4d4d8', textTransform: 'uppercase' }}>
                Selected ({selectedTech.length})
              </label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                padding: '12px',
                backgroundColor: '#0c0a12',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                minHeight: '50px',
                alignItems: 'center'
              }}>
                {selectedTech.length === 0 ? (
                  <span style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>No skills selected yet.</span>
                ) : (
                  selectedTech.map(tech => (
                    <div
                      key={tech}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(192, 132, 252, 0.15)',
                        border: '1px solid rgba(192, 132, 252, 0.3)',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}
                    >
                      <span>{tech}</span>
                      <X
                        size={14}
                        style={{ cursor: 'pointer', color: '#9ca3af' }}
                        onClick={() => handleTechRemove(tech)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={updating}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '14px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                border: 'none',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 10px 25px rgba(168, 85, 247, 0.3)'
              }}
            >
              <Check size={18} />
              <span>{updating ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}