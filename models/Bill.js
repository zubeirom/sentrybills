const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    total: {
        type: Number,
        required: true,
        default: 0,
    },
    due: {
        type: Date,
        required: true,
    },
    note: {
        type: String,
        default: 'No Description',
    },
    balanced: {
        type: Boolean,
        required: true,
        default: false,
    },
    addToCal: {
        type: Boolean,
        required: true,
        default: false,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
});

const Bill = mongoose.model('Bill', BillSchema);

module.exports = Bill;
