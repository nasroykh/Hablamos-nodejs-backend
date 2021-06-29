const mongoose = require('mongoose');

// mongoose.connect('mongodb://127.0.0.1:27017/hablamos', {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useUnifiedTopology: true,
//     useFindAndModify: false
// });

//OLD CLOUD DB
// mongoose.connect('mongodb+srv://nasykh:5fXrr7Yptvdcokyu@cluster0.wqtyq.mongodb.net/hablamos?retryWrites=true&w=majority', {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useUnifiedTopology: true,
//     useFindAndModify: false
// });

//NEW CLOUD DB
mongoose.connect('mongodb+srv://nasro_ykh:ASl2T1Esii9NNwcs@cluster0.tz0rx.mongodb.net/hablamos?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});