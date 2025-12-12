import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface ISweet {
    id?: number;
    name: string;
    category: string;
    price: number;
    quantity: number;
    createdAt?: Date;
    updatedAt?: Date;
}

class Sweet extends Model<ISweet> implements ISweet {
    public id!: number;
    public name!: string;
    public category!: string;
    public price!: number;
    public quantity!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Sweet.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: {
                    args: [2, 100],
                    msg: 'Sweet name must be at least 2 characters long'
                }
            }
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: {
                    args: [['Chocolate', 'Candy', 'Gummy', 'Hard Candy', 'Lollipop', 'Toffee', 'Caramel', 'Other']],
                    msg: 'Invalid category'
                }
            }
        },
        price: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: {
                min: {
                    args: [0],
                    msg: 'Price cannot be negative'
                }
            }
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: {
                    args: [0],
                    msg: 'Quantity cannot be negative'
                }
            }
        }
    },
    {
        sequelize,
        tableName: 'sweets',
        timestamps: true
    }
);

export { Sweet };
