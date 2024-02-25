// models/product.js

import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        enum: ['smartphones', 'laptops', 'fragrances', 'skincare', 'groceries'], // Define your categories
        required: true
    }
});

const Product = mongoose.model('Product', productSchema);

export default Product;
