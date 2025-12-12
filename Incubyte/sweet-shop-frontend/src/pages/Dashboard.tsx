import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sweetsAPI, Sweet } from '../services/api';
import SweetCard from '../components/SweetCard';
import AddSweetModal from '../components/AddSweetModal';
import EditSweetModal from '../components/EditSweetModal';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sweets, setSweets] = useState<Sweet[]>([]);
    const [filteredSweets, setFilteredSweets] = useState<Sweet[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchName, setSearchName] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSweet, setEditingSweet] = useState<Sweet | null>(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSweets();
    }, []);

    useEffect(() => {
        filterSweets();
    }, [sweets, searchName, categoryFilter]);

    const fetchSweets = async () => {
        try {
            const response = await sweetsAPI.getAll();
            setSweets(response.data.sweets);
        } catch (error) {
            console.error('Error fetching sweets:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterSweets = () => {
        let filtered = sweets;

        if (searchName) {
            filtered = filtered.filter(sweet =>
                sweet.name.toLowerCase().includes(searchName.toLowerCase())
            );
        }

        if (categoryFilter) {
            filtered = filtered.filter(sweet => sweet.category === categoryFilter);
        }

        setFilteredSweets(filtered);
    };

    const handlePurchase = async (id: number) => {
        try {
            await sweetsAPI.purchase(id, 1);
            showMessage('Purchase successful! 🎉');
            fetchSweets();
        } catch (error: any) {
            showMessage(error.response?.data?.error || 'Purchase failed');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this sweet?')) return;

        try {
            await sweetsAPI.delete(id);
            showMessage('Sweet deleted successfully');
            fetchSweets();
        } catch (error: any) {
            showMessage(error.response?.data?.error || 'Delete failed');
        }
    };

    const handleRestock = async (id: number, quantity: number) => {
        try {
            await sweetsAPI.restock(id, quantity);
            showMessage('Restock successful! 📦');
            fetchSweets();
        } catch (error: any) {
            showMessage(error.response?.data?.error || 'Restock failed');
        }
    };

    const showMessage = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const categories = ['Chocolate', 'Candy', 'Gummy', 'Hard Candy', 'Lollipop', 'Toffee', 'Caramel', 'Other'];

    return (
        <div className="dashboard">
            <nav className="navbar">
                <div className="navbar-brand">
                    <h1>🍬 Sweet Shop</h1>
                </div>
                <div className="navbar-user">
                    <span className="user-email">{user?.email}</span>
                    {user?.isAdmin && <span className="admin-badge">Admin</span>}
                    <button onClick={handleLogout} className="logout-button">Logout</button>
                </div>
            </nav>

            {message && <div className="toast-message">{message}</div>}

            <div className="dashboard-container">
                <div className="dashboard-header">
                    <h2>Sweet Inventory</h2>
                    {user?.isAdmin && (
                        <button onClick={() => setShowAddModal(true)} className="add-button">
                            + Add New Sweet
                        </button>
                    )}
                </div>

                <div className="filters">
                    <input
                        type="text"
                        placeholder="🔍 Search sweets by name..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="search-input"
                    />

                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="category-select"
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    {(searchName || categoryFilter) && (
                        <button
                            onClick={() => {
                                setSearchName('');
                                setCategoryFilter('');
                            }}
                            className="clear-filters"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="loading">Loading sweets... 🍭</div>
                ) : filteredSweets.length === 0 ? (
                    <div className="empty-state">
                        <h3>No sweets found</h3>
                        <p>{searchName || categoryFilter ? 'Try adjusting your filters' : 'Add some sweets to get started!'}</p>
                    </div>
                ) : (
                    <div className="sweets-grid">
                        {filteredSweets.map(sweet => (
                            <SweetCard
                                key={sweet.id}
                                sweet={sweet}
                                isAdmin={user?.isAdmin || false}
                                onPurchase={handlePurchase}
                                onEdit={(sweet) => setEditingSweet(sweet)}
                                onDelete={handleDelete}
                                onRestock={handleRestock}
                            />
                        ))}
                    </div>
                )}
            </div>

            {showAddModal && (
                <AddSweetModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        showMessage('Sweet added successfully! 🍬');
                        fetchSweets();
                    }}
                />
            )}

            {editingSweet && (
                <EditSweetModal
                    sweet={editingSweet}
                    onClose={() => setEditingSweet(null)}
                    onSuccess={() => {
                        setEditingSweet(null);
                        showMessage('Sweet updated successfully! ✨');
                        fetchSweets();
                    }}
                />
            )}
        </div>
    );
};

export default Dashboard;
