import React, { useState, useEffect } from 'react';
import PlanningApp from './planning-presence';
import MobileApp from './MobileApp';
// ← Remplace par TON composant login

function App() {
    // TES states existants...
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    // TES fonctions existantes...
    const onLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    // AJOUTE CES LIGNES:
    const isMobileRoute = window.location.pathname === '/mobile';
    const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const shouldShowMobile = isMobileRoute || (isMobileDevice && !window.location.pathname.includes('/desktop'));

    // Pas connecté
    if (!token || !user) {
        return <TON_COMPOSANT_LOGIN />; // ← Adapte ici!
    }

    // Connecté: bureau ou mobile?
    return (
        <>
            {shouldShowMobile ? (
                <MobileApp currentUser={user} onLogout={onLogout} token={token} />
            ) : (
                <PlanningApp currentUser={user} onLogout={onLogout} />
            )}
        </>
    );
}

export default App;