import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, Compass, PlusSquare, LayoutDashboard, User, LogOut, ChevronDown, MessageSquare, Shield } from 'lucide-react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { useWalletModal } from '@provablehq/aleo-wallet-adaptor-react-ui';
import { AnimatePresence, motion } from 'framer-motion';
import { usePrivTokState } from '../PrivTokState.jsx';

const Header = () => {
    const { connected, address, disconnect } = useWallet();
    const { setVisible } = useWalletModal();
    const { privTokState, setDashboardMode } = usePrivTokState();
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const dropdownRef = useRef(null);

    const isActive = (path) => location.pathname === path;

    // Check if user is a creator (has CreatorTicket or public mapping)
    const isCreator = privTokState?.hasProfile;
    const mode = privTokState?.dashboardMode || 'user';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="nav">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white' }}>
                <div style={{ background: 'var(--primary)', padding: '2px', borderRadius: '10px', display: 'flex', overflow: 'hidden' }}>
                    <img src="/logo.png" alt="PrivTok Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
                </div>
                <h1 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800, color: 'white', background: 'none', WebkitTextFillColor: 'unset', letterSpacing: '-0.5px' }}>
                    Priv<span style={{ color: 'var(--primary)' }}>Tok</span>
                </h1>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {connected && (
                    <>
                        <Link to="/hub" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            textDecoration: 'none',
                            color: isActive('/hub') ? 'white' : 'var(--text-muted)',
                            background: isActive('/hub') ? 'rgba(255,255,255,0.05)' : 'transparent',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: isActive('/hub') ? 700 : 500,
                            transition: 'all 0.2s'
                        }} className="nav-link">
                            <Compass size={18} color={isActive('/hub') ? 'var(--primary)' : 'currentColor'} />
                            <span>Hub</span>
                        </Link>

                        {(isCreator || mode === 'creator') && (
                            <Link to="/upload" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                textDecoration: 'none',
                                color: isActive('/upload') ? 'white' : 'var(--text-muted)',
                                background: isActive('/upload') ? 'rgba(255,255,255,0.05)' : 'transparent',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontWeight: isActive('/upload') ? 700 : 500,
                                transition: 'all 0.2s'
                            }} className="nav-link">
                                <PlusSquare size={18} color={isActive('/upload') ? 'var(--primary)' : 'currentColor'} />
                                <span>Upload</span>
                            </Link>
                        )}

                        <Link to="/studio" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            textDecoration: 'none',
                            color: isActive('/studio') ? 'white' : 'var(--text-muted)',
                            background: isActive('/studio') ? 'rgba(255,255,255,0.05)' : 'transparent',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: isActive('/studio') ? 700 : 500,
                            transition: 'all 0.2s'
                        }} className="nav-link">
                            <LayoutDashboard size={18} color={isActive('/studio') ? 'var(--primary)' : 'currentColor'} />
                            <span>{mode === 'creator' ? 'Studio' : 'Library'}</span>
                        </Link>

                        <Link to="/messages" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            textDecoration: 'none',
                            color: isActive('/messages') ? 'white' : 'var(--text-muted)',
                            background: isActive('/messages') ? 'rgba(255,255,255,0.05)' : 'transparent',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: isActive('/messages') ? 700 : 500,
                            transition: 'all 0.2s'
                        }} className="nav-link">
                            <MessageSquare size={18} color={isActive('/messages') ? 'var(--primary)' : 'currentColor'} />
                            <span>Messages</span>
                        </Link>
                    </>
                )}

                {/* Mode Switcher - Show to all connected users to allow onboarding */}
                {connected && (
                    <button
                        onClick={() => setDashboardMode(mode === 'creator' ? 'user' : 'creator')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            background: mode === 'creator' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                            border: mode === 'creator' ? '1px solid rgba(255, 0, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: mode === 'creator' ? 'var(--primary)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            transition: 'all 0.2s'
                        }}
                        className="mode-switcher"
                    >
                        {mode === 'creator' ? <Shield size={16} /> : <User size={16} />}
                        <span>{mode === 'creator' ? 'Creator' : 'Individual'}</span>
                        <ChevronDown size={12} style={{ opacity: 0.7 }} />
                    </button>
                )}

                <div style={{ position: 'relative' }} ref={dropdownRef}>
                    {connected ? (
                        <>
                            <button
                                className="btn-secondary"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
                            >
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                                {address?.substring(0, 5)}...{address?.substring(address.length - 4)}
                                <ChevronDown size={14} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>

                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        style={{
                                            position: 'absolute',
                                            top: 'calc(100% + 12px)',
                                            right: 0,
                                            width: '200px',
                                            background: '#1C1C1C',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '12px',
                                            padding: '8px',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                            zIndex: 2000
                                        }}
                                    >
                                        <Link
                                            to={`/creator/${address}`}
                                            onClick={() => setIsDropdownOpen(false)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '12px',
                                                color: 'white',
                                                textDecoration: 'none',
                                                borderRadius: '8px',
                                                fontSize: '0.9rem',
                                                transition: 'background 0.2s'
                                            }}
                                            className="hover-bg-muted"
                                        >
                                            <User size={18} />
                                            View Profile
                                        </Link>

                                        {/* Mode Switcher in Dropdown */}
                                        <>
                                            <div style={{ height: '1px', background: 'var(--glass-border)', margin: '4px 0' }} />
                                            <button
                                                onClick={() => {
                                                    setDashboardMode(mode === 'creator' ? 'user' : 'creator');
                                                    setIsDropdownOpen(false);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    padding: '12px',
                                                    color: 'var(--primary)',
                                                    background: 'none',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                                className="hover-bg-muted"
                                            >
                                                {mode === 'creator' ? <User size={18} /> : <Shield size={18} />}
                                                Switch to {mode === 'creator' ? 'Individual' : 'Creator'} Mode
                                            </button>
                                        </>
                                        <div style={{ height: '1px', background: 'var(--glass-border)', margin: '4px 0' }} />
                                        <button
                                            onClick={() => {
                                                setShowLogoutModal(true);
                                                setIsDropdownOpen(false);
                                            }}
                                            style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '12px',
                                                color: '#ef4444',
                                                background: 'none',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            className="hover-bg-muted"
                                        >
                                            <LogOut size={18} />
                                            Disconnect
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    ) : (
                        <button
                            className="btn-primary"
                            onClick={() => setVisible(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px' }}
                        >
                            <Wallet size={18} />
                            Connect Wallet
                        </button>
                    )}
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.8)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '24px'
                        }}
                        onClick={() => setShowLogoutModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card"
                            style={{
                                padding: '32px',
                                maxWidth: '400px',
                                width: '90%',
                                textAlign: 'center'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <LogOut size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
                            <h3 style={{ marginBottom: '8px' }}>Confirm Logout</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                                Are you sure you want to disconnect your wallet?
                            </p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="btn-secondary"
                                    style={{ padding: '8px 20px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        disconnect();
                                        setShowLogoutModal(false);
                                    }}
                                    className="btn-primary"
                                    style={{ padding: '8px 20px' }}
                                >
                                    Logout
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Header;