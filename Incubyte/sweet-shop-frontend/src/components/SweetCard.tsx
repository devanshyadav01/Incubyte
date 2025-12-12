import React, { useState } from 'react';
import { Sweet } from '../services/api';
import '../styles/SweetCard.css';

interface SweetCardProps {
    sweet: Sweet;
    isAdmin: boolean;
    onPurchase: (id: number) => void;
    onEdit: (sweet: Sweet) => void;
    onDelete: (id: number) => void;
    onRestock: (id: number, quantity: number) => void;
}

const SweetCard: React.FC<SweetCardProps> = ({
    sweet,
    isAdmin,
    onPurchase,
    onEdit,
    onDelete,
    onRestock
}) => {
    const [restockQuantity, setRestockQuantity] = useState(10);
    const [showRestockInput, setShowRestockInput] = useState(false);

    const handleRestockSubmit = () => {
        if (restockQuantity > 0) {
            onRestock(sweet.id, restockQuantity);
            setShowRestockInput(false);
            setRestockQuantity(10);
        }
    };

    const getCategoryEmoji = (category: string) => {
        const emojiMap: { [key: string]: string } = {
            'Chocolate': '🍫',
            'Candy': '🍬',
            'Gummy': '🍡',
            'Hard Candy': '🍭',
            'Lollipop': '🍭',
            'Toffee': '🍮',
            'Caramel': '🍯',
            'Other': '🍰'
        };
        return emojiMap[category] || '🍬';
    };

    return (
        <div className="sweet-card">
            <div className="sweet-icon">{getCategoryEmoji(sweet.category)}</div>

            <div className="sweet-info">
                <h3 className="sweet-name">{sweet.name}</h3>
                <span className="sweet-category">{sweet.category}</span>
            </div>

            <div className="sweet-details">
                <div className="price-tag">
                    <span className="price">${sweet.price.toFixed(2)}</span>
                </div>

                <div className={`stock ${sweet.quantity === 0 ? 'out-of-stock' : sweet.quantity < 10 ? 'low-stock' : ''}`}>
                    <span className="stock-label">Stock:</span>
                    <span className="stock-value">{sweet.quantity}</span>
                </div>
            </div>

            <div className="sweet-actions">
                <button
                    onClick={() => onPurchase(sweet.id)}
                    disabled={sweet.quantity === 0}
                    className="purchase-button"
                >
                    {sweet.quantity === 0 ? '❌ Out of Stock' : '🛒 Purchase'}
                </button>

                {isAdmin && (
                    <div className="admin-actions">
                        <button onClick={() => onEdit(sweet)} className="edit-button">
                            ✏️ Edit
                        </button>
                        <button onClick={() => onDelete(sweet.id)} className="delete-button">
                            🗑️ Delete
                        </button>

                        {!showRestockInput ? (
                            <button onClick={() => setShowRestockInput(true)} className="restock-button">
                                📦 Restock
                            </button>
                        ) : (
                            <div className="restock-input-group">
                                <input
                                    type="number"
                                    min="1"
                                    value={restockQuantity}
                                    onChange={(e) => setRestockQuantity(parseInt(e.target.value))}
                                    className="restock-input"
                                    placeholder="Qty"
                                />
                                <button onClick={handleRestockSubmit} className="restock-confirm">
                                    ✓
                                </button>
                                <button onClick={() => setShowRestockInput(false)} className="restock-cancel">
                                    ✗
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SweetCard;
