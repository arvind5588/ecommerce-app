const nodemailer = require('nodemailer');
let authCredential = {
    user: 'testemail@gmail.com',
    pass: '&88*9900'
}

const CreateOrder = (request, response) => {
    try {

        const user = request.body.User;
        const cart = request.body.Cart;
        const remark = request.body.Remarks;
        const totalAmount = request.body.TotalAmount;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: authCredential
        });

        let mailOptions = {
            from: 'testemail@gmail.com',
            to: `${user.Email}`,
            subject: "Congratulations! Your order placed succesfully.", // Subject line
            text: `Hello ${user.Name}`, // plain text body
            html: `<b>Hello  ${user.Name} </b>`
        }
        // send mail with defined transport object
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                return response.json(error);
            } else {
                console.log('Email sent: ' + info.response);

                let query = `INSERT INTO orders
                                (total_amount, created_on, shipped_on, status, comments, customer_id, auth_code, reference, shipping_id, tax_id)
                            VALUES
                            (
                                ${totalAmount}, 
                                CURDATE(), 
                                CURDATE(), 
                                1, 
                                '${remark}', 
                                ${user.CustomerId}, 
                                '', 
                                '', 
                                1, 
                                1
                            );`; //query database to get all the departments

                // execute query
                db.query(query, (err, result) => {
                    if (err != null) response.status(500).send({ error: error.message });
                    let values = [];
                    cart.forEach(element => {
                        let row = '';
                        row = `(
                            ${result.insertId},
                            ${element.ProductId},
                            '',
                            ${element.Quantity},
                            ${element.Price}
                        )`;
                        values.push(row);
                    });
                    let rows = values.toString();

                    let subQuery = `INSERT INTO order_detail
                                        (order_id, product_id, attributes, product_name, quantity, unit_cost)
                                    values ${rows};`; //query database to get all the departments

                    db.query(subQuery, (err, result) => {
                        if (err != null) response.status(500).send({ error: err.message });
                        return response.json(result);
                    });

                    return response.json(result);
                });
            }
        });


    } catch (error) {
        if (error != null) response.status(500).send({ error: error.message });
    }
};

const SendTestMail = async ()=> {
    let remark = 'test mail';

    let testAccount = await nodemailer.createTestAccount();

     // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        service: 'gmail',
            auth: authCredential
    });
    let mailOptions = {
        from: '"Test 👻" <no-reply@test.com>',
        to: 'testemail@gmail.com',
        subject: "Order Details", // Subject line
        text: "test purpose", // plain text body
        html: `<b>test account ${remark} </b>`
    }

    await transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return response.json(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

const CheckIfProductAvl = (request, response, next) => {
    let productId = request.query.productId;
    try {
        let query = 'SELECT count(`quantity`) as avl_qty FROM `order_detail` WHERE product_id=?'
        // execute query
        db.query(query, [productId], (err, result) => {
            if (err != null){
                response.status(500).send({ error: err.message });
            }
            if(result['avl_qty'] > 10){
                response.status(500).send({ error: 'Product is out of Stock.' });
            }
            next()
        });
    } catch (error) {
        if (error != null) response.status(500).send({ error: error.message });
    }
};

const order = {
    CreateOrder,
    SendTestMail,
    CheckIfProductAvl
};

module.exports = order;