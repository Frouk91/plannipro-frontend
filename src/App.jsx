import React, { useState, useEffect } from 'react';
import PlanningApp from './planning-presence';
import MobileApp from './MobileApp';
import LoginForm from './LoginForm'; // À adapter selon votre code

function App() {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(true);

    // Vérifier le token au chargement
    useEffect(() => {
        if (token) {
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, [token]);

    // Fonction de déconnexion
    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    }

    // Fonction de connexion
    function handleLogin(tokenData, userData) {
        localStorage.setItem('token', tokenData);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(tokenData);
        setUser(userData);
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div>Chargement...</div>
            </div>
        );
    }

    // Pas connecté = afficher login
    if (!token || !user) {
        return <LoginForm onLogin={handleLogin} />;
    }

    // === DÉTECTION MOBILE ===
    // Option 1: Via URL
    const isMobileRoute = window.location.pathname === '/mobile';

    // Option 2: Via détection device
    const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Option 3: Combinaison (route /mobile OU device détecté ET pas /desktop)
    const shouldShowMobile = isMobileRoute || (isMobileDevice && !window.location.pathname.includes('/desktop'));

    // === RENDER ===
    return (
        <>
            {shouldShowMobile ? (
                // VERSION MOBILE
                <MobileApp
                    currentUser={user}
                    onLogout={handleLogout}
                    token={token}
                />
            ) : (
                // VERSION BUREAU
                <PlanningApp
                    currentUser={user}
                    onLogout={handleLogout}
                />
            )}

            {/* Lien rapide bureau/mobile (DEV only) */}
            {process.env.NODE_ENV === 'development' && (
                <div style={{ position: 'fixed', bottom: 10, right: 10, fontSize: 10, zIndex: 9999 }}>
                    <a href={shouldShowMobile ? '/?desktop' : '/mobile'} style={{ color: '#666', textDecoration: 'none' }}>
                        {shouldShowMobile ? '🖥️ Bureau' : '📱 Mobile'}
                    </a>
                </div>
            )}
        </>
    );
}

export default App;