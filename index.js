import express from 'express';
import axios from 'axios';
import collection from './models/user.js'
import Product from './models/product.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'ejs');
app.use(express.static('public'));

/* CONNECTION DATABASE */
mongoose.connect(
    'mongodb+srv://temik20172:final@cluster1.iqzryhh.mongodb.net/final'
).then(() => {
    console.log('db connection')
}).catch((err) => {
    console.log('error connecting to db', err)
})

// Route to render the product page
app.get('/', async (req, res) => {
    try {
        const productData = await fetchMultipleProducts();
        res.render('product', { productData });
    } catch (error) {
        console.error('Error fetching product data:', error.message);
        res.status(500).send('Failed to fetch product data.');
    }
});

// Route to handle search functionality
app.get('/search', async (req, res) => {
    try {
        const searchTerm = req.query.q;
        const productData = await searchProducts(searchTerm);
        console.log(productData); // Log productData to console
        res.render('product', { productData });
    } catch (error) {
        console.error('Error searching products:', error.message);
        res.status(500).send('Failed to search products.');
    }
});
async function fetchMultipleProducts() {
    try {
        const productPromises = [];
        const dbProducts = await Product.find();
        console.log('Database products:', dbProducts);

        // Fetch data for 25 products from external API
        for (let i = 1; i <= 25; i++) {
            productPromises.push(axios.get(`https://dummyjson.com/products/${i}`));
        }

        // Wait for all requests to resolve
        const products = await Promise.all(productPromises);

        // Extract product data from responses
        const productData = products.map(response => response.data);
        return productData;
    } catch (error) {
        throw new Error('Failed to fetch product data.');
    }
}

// Update the searchProducts function to handle response data format
async function searchProducts(searchTerm) {
    try {
        const response = await axios.get(`https://dummyjson.com/products/search?q=${searchTerm}`);
        const responseData = response.data;

        // Ensure the response data is an array of products
        if (Array.isArray(responseData)) {
            return responseData; // Return the array of products
        } else if (typeof responseData === 'object' && responseData.products) {
            return responseData.products; // Extract products from the response object
        } else {
            throw new Error('Invalid response data format');
        }
    } catch (error) {
        throw new Error('Failed to search products.');
    }
}



/* FORM LOGIN AND REGISTER, ADMIN */
app.get('/login',(req, res) => {
    res.render('login')
})

app.get('/register',(req, res) => {
    res.render('register')
})

app.post('/signup', async (req, res) =>{
    const data = {
        name: req.body.username,
        password: req.body.password
    }

    const existingUser = await collection.findOne({name: data.name})
    if(existingUser) {
        res.send("User already exists. Please choose a new one")
    }else{
        const salt = 10;
        const hash = await bcrypt.hash(data.password,salt)

        data.password = hash
        const userData = await collection.insertMany(data)
        console.log(userData)
        res.render('login')
    }
})  
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Check if the user is an admin
        if (username === 'admin' && password === '12345') {
            // If admin credentials are correct, redirect to admin page
            res.redirect('/admin');
            return;
        }

        // If not an admin, proceed with regular user login
        const check = await collection.findOne({ name: username });
        if (!check) {
            return res.send("Username not found");
        }

        const isPasswordMatch = await bcrypt.compare(password, check.password);
        if (isPasswordMatch) {
            // Fetch product data
            const productData = await fetchMultipleProducts();
            // Render the product page with productData
            res.render('product', { productData });
        } else {
            res.send("Wrong password");
        }

        const token = jwt.sign({ userId: check._id }, 'secret123', { expiresIn: '30d' });
        console.log(token);

    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
});


// Route to render the admin panel
app.get('/admin', async (req, res) => {
    try {
        // Fetch all users
        const users = await collection.find();
        // Fetch all products
        const productData = await fetchMultipleProducts();
        res.render('admin', { users, productData });
    } catch (error) {
        console.error('Error fetching admin data:', error.message);
        res.status(500).send('Failed to fetch admin data.');
    }
});

// Route to add a new product
app.post('/admin/product/add', async (req, res) => {
    try {
        const { name, description, price, category } = req.body;
        // Create a new product instance
        const newProduct = new Product({
            name,
            description,
            price,
            category
        });
        // Save the new product to the database
        await newProduct.save();
        // Redirect back to the product page to display the updated product list
        res.redirect('/');
    } catch (error) {
        console.error('Error adding product:', error.message);
        res.status(500).send('Failed to add product.');
    }
});


// Route to delete a product
app.post('/admin/product/delete/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
        // Delete the product from the database
        await Product.findByIdAndDelete(productId);
        res.redirect('/admin'); // Redirect back to the admin panel
    } catch (error) {
        console.error('Error deleting product:', error.message);
        res.status(500).send('Failed to delete product.');
    }
});

// Route to update a product
app.post('/admin/product/update/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
        const { name, description, price, category } = req.body;
        // Find the product by ID and update its properties
        await Product.findByIdAndUpdate(productId, { name, description, price, category });
        res.redirect('/admin'); // Redirect back to the admin panel
    } catch (error) {
        console.error('Error updating product:', error.message);
        res.status(500).send('Failed to update product.');
    }
});

// Route to delete a user
app.post('/admin/user/delete/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        // Delete the user from the database
        await collection.findByIdAndDelete(userId);
        res.redirect('/admin'); // Redirect back to the admin panel
    } catch (error) {
        console.error('Error deleting user:', error.message);
        res.status(500).send('Failed to delete user.');
    }
});

// Route to update a user
app.post('/admin/user/update/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const { name, password } = req.body;
        // Find the user by ID and update its properties
        await collection.findByIdAndUpdate(userId, { name, password });
        res.redirect('/admin'); // Redirect back to the admin panel
    } catch (error) {
        console.error('Error updating user:', error.message);
        res.status(500).send('Failed to update user.');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
