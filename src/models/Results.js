import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
matiere: {
    type: String,
    required: true,
},

note: {
    type: Number,
    required: true,
},


coefficient: {
    type: Number,
    required: true,
},

user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
},

quiz_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
},

createdAt: {
    type: Date,
    default: Date.now
}   
});

const Results = mongoose.model('Results', resultSchema);

export default Results;



