const mongoose = require('mongoose');


mongoose.connect('mongodb://127.0.0.1:27017/hablamos', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

// mongoose.connect('mongodb+srv://nasykh:5fXrr7Yptvdcokyu@cluster0.wqtyq.mongodb.net/hablamos?retryWrites=true&w=majority', {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useUnifiedTopology: true,
//     useFindAndModify: false
// });
