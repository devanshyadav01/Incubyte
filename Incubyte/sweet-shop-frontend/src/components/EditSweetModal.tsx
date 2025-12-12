import React, { useState } from 'react';
import { sweetsAPI, Sweet } from '../services/api';
import '../styles/Modal.css';

interface EditSweetModalProps {
    sweet: Sweet;
    onClose: () => void;
    onSuccess: () => void;
}

const EditSweetModal: React.FC<EditSweetModalProps> = ({ sweet, onClose, onSuccess }) => {
    const [name, setName] = useState(sweet.name);
    const [category, setCategory] = useState(sweet.category);
    const [price, setPrice] = useState(sweet.price.toString());
    const [quantity, setQuantity] = useState(sweet.quantity.toString());
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const categories = ['Chocolate', 'Candy', 'Gummy', 'Hard Candy', 'Lollipop', 'Toffee', 'Caramel', 'Other'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await sweetsAPI.update(sweet._id, {
                name,
                category,
                price: parseFloat(price),
                quantity: parseInt(quantity)
            });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to update sweet');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Edit Sweet</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="name">Sweet Name *</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="category">Category *</label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="price">Price ($) *</label>
                            <input
                                type="number"
                                id="price"
                                step="0.01"
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="quantity">Quantity *</label>
                            <input
                                type="number"
                                id="quantity"
                                min="0"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="cancel-button">
                            Cancel
                        </button>
                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Sweet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSweetModal;
