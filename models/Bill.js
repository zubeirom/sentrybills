const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    total: {
        type: Number,
        required: true,
    },
    due: {
        type: Date,
        required: true,
    },
    note: {
        type: String,
        default: 'No Description',
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
});

const Bill = mongoose.model('Bill', BillSchema);

module.exports = Bill;
