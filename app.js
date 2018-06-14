const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const path = require('path');
const paypal = require('paypal-rest-sdk');

// PayPal SDK configuration
paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': '*********************************************************************************************',
    'client_secret': '**************************************************************************************'
});

const port = process.env.PORT || 3000;

const app = express();


app.use(bodyParser.json());

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'views')));

app.get('/', (req, res) => res.render('index'));

app.post('/pay', (req, res) => {


    // 1st step: "creating payment"
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3000/success",
            "cancel_url": "http://localhost:3000/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "Alienware 13 R2",
                    "sku": "001",
                    "price": "1000.00",
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": "1000.00"
            },
            "description": "Awesome laptop!"
        }]
    };


    // 2nd step: paying
    paypal.payment.create(create_payment_json, (error, payment) => {
        if (error) {
            throw error;
        } else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
                    res.redirect(payment.links[i].href);
                }
            }
        }
    });


});


// 3rd step
app.get('/success', (req, res) => {

    const payerID = req.param('PayerID');
    const paymentId = req.param('paymentId');

    const execute_payment_json = {
        "payer_id": payerID,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": "1000.00"
            }
        }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log(JSON.stringify(payment));
            res.render('success');
        }
    });
});


// cancel route
app.get('/cancel', (req, res) => {
    res.render('cancel');

});


app.listen(port, () => console.log(`Server running on port ${port}`));