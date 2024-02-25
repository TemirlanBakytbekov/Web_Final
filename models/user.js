import mongoose from 'mongoose';

const LoginSchema = new mongoose.Schema({
    name:{
        type: 'string',
        required: true,
    },
    password:{
        type: 'string',
        required: true,
    }
},{
    timestamps:true,
});

const collection = mongoose.model("users", LoginSchema);

export default collection;