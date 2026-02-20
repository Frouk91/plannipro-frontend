const BASE_URL = 'https://plannipro-backend-production.up.railway.app/api';

export async function login(email, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    return res.json();
}

export async function getPlanning(year, month, token) {
    const res = await fetch(`${BASE_URL}/leaves/planning?year=${year}&month=${month}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
}

export async function createLeave(data, token) {
    const res = await fetch(`${BASE_URL}/leaves`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function getLeaves(token) {
    const res = await fetch(`${BASE_URL}/leaves`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
}

export async function approveLeave(id, token) {
    const res = await fetch(`${BASE_URL}/leaves/${id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    return res.json();
}

export async function rejectLeave(id, comment, token) {
    const res = await fetch(`${BASE_URL}/leaves/${id}/reject`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ manager_comment: comment })
    });
    return res.json();
}