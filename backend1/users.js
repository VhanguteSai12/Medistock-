const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// MySQL Connection

const db = mysql.createConnection({

    host:"localhost",
    user:"root",
    password:"",
    database:"medistock"

});

db.connect((err)=>{

    if(err){
        console.log("Database Connection Failed");
    }
    else{
        console.log("Database Connected Successfully");
    }

});
//users apis

//REGISTER API

app.post("/register", async(req,res)=>{
   
    const {name,email,password}=req.body;

    if(!name || !email || !password){

        return res.json({
            message:"All fields are required"
        });

    }
// Check email already exists

    const checkUser="SELECT * FROM users WHERE email=?";

    db.query(checkUser,[email],async(err,result)=>{

        if(err){
            return res.status(500).json({
                error:err
            });
        }

        if(result.length > 0){

            return res.json({
                message:"Email already exists"
            });

        }

        // Password encryption
        const hashPassword = await bcrypt.hash(password,10);

        const sql=`

        INSERT INTO users
        (name,email,password,created_at,updated_at)

        VALUES(?,?,?,?,?)
       `;

       const date = new Date();

       db.query(
           sql,
           [
                name,
                email,
                hashPassword,
                date,
                date
            ],

            (err,result)=>{

                if(err){
                 return res.status(500).json({
                        error:err
                    });

                }

                res.json({

                    message:"Registration Successful"

                });
           }

        );
 });


});
// LOGIN API

app.post("/login",(req,res)=>{

    const {email,password}=req.body;

    const sql="SELECT * FROM users WHERE email=?";

     db.query(sql,[email],async(err,result)=>{

    if(err){
            return res.status(500).json({
                error:err
            });

        }
  if(result.length===0){

            return res.json({

                message:"User not found"

            });

        }
      const user=result[0];

      const match = await bcrypt.compare(

            password,

            user.password

        );

          if(!match){


            return res.json({

                message:"Invalid Password"

            });


        }
        res.json({

           message:"Login Successful",
           user:{
                 user_id:user.user_id,
                  name:user.name,
                  email:user.email
                 }
                });
          });
});

//dashboard apis

app.get("/dashboard/total-customers/:user_id", (req, res) => {

    const user_id = req.params.user_id;

    const sql = `
        SELECT COUNT(DISTINCT customer_id) AS total_customers
        FROM customers
        WHERE user_id = ?
    `;

    db.query(sql, [user_id], (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Error fetching total customers"
            });
        }

        res.json({
            total_customers: result[0].total_customers
        });
    });
});

app.get("/dashboard/total-medicines/:user_id", (req, res) => {

    const user_id = req.params.user_id;

    const sql = `
        SELECT COUNT(*) AS total_medicines
        FROM medicines
        WHERE user_id = ?
    `;

    db.query(sql, [user_id], (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Error fetching total medicines"
            });
        }

        res.json({
            total_medicines: result[0].total_medicines
        });
    });
});

app.get("/dashboard/total-invoices/:user_id", (req, res) => {

    const user_id = req.params.user_id;

    const sql = `
        SELECT COUNT(DISTINCT invoice_no) AS total_invoices
        FROM customers
        WHERE user_id = ?
    `;

    db.query(sql, [user_id], (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Error fetching total invoices"
            });
        }

        res.json({
            total_invoices: result[0].total_invoices
        });
    });
});

app.get("/dashboard/total-sales/:user_id", (req, res) => {

    const user_id = req.params.user_id;

    const sql = `
        SELECT COALESCE(SUM(total_amount), 0) AS total_sales
        FROM customers
        WHERE user_id = ?
    `;//If total_amount is null, it will return 0 instead of null

    db.query(sql, [user_id], (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Error fetching total sales"
            });
        }

        res.json({
            total_sales: result[0].total_sales
        });
    });
});

app.get("/dashboard/low-stock/:user_id", (req, res) => {

    const user_id = req.params.user_id;

    const sql = `
        SELECT COUNT(*) AS low_stock
        FROM medicines
        WHERE user_id = ?
        AND quantity <= 10
    `;

    db.query(sql, [user_id], (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Error fetching low stock medicines"
            });
        }

        res.json({
            low_stock: result[0].low_stock
        });
    });
});

app.get("/dashboard/expired-medicines/:user_id", (req, res) => {

    const user_id = req.params.user_id;

    const sql = `
        SELECT COUNT(*) AS expired_medicines
        FROM medicines
        WHERE user_id = ?
        AND expiry_date < CURDATE()
        AND expiry_date != '0000-00-00'
    `;

    db.query(sql, [user_id], (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Error fetching expired medicines"
            });
        }

        res.json({
            expired_medicines: result[0].expired_medicines
        });
    });
});

app.post("/medicines", (req, res) => {

    const {
        user_id,
        medicine_name,
        company_name,
        batch_no,
        expiry_date,
        quantity,
        price
    } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiry_date);
    expiry.setHours(0, 0, 0, 0);

    // Check Expiry Date
    if (expiry < today) {
        return res.status(400).json({
            message: "Expired medicine cannot be added."
        });
    }

    const sql = `
        INSERT INTO medicines
        (
            user_id,
            medicine_name,
            company_name,
            batch_no,
            expiry_date,
            quantity,
            price,
            created_at,
            updated_at
        )
        VALUES (?,?,?,?,?,?,?,?,?)
    `;

    const date = new Date();

    db.query(
        sql,
        [
            user_id,
            medicine_name,
            company_name,
            batch_no,
            expiry_date,
            quantity,
            price,
            date,
            date
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                message: "Medicine Added Successfully",
                medicine_id: result.insertId
            });

        }
    );

});
//
app.get("/medicines/:user_id", (req, res) => {

    const { user_id } = req.params;

    const sql = `
        SELECT
    medicine_id,    
    medicine_name,
    company_name,
    batch_no,
    expiry_date,
    quantity,
    price
FROM medicines
WHERE user_id=?
ORDER BY medicine_name ASC`;

    db.query(sql, [user_id], (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json(err);
        }

        res.json(result);

    });

});


// ======================================
// GET SINGLE MEDICINE
// ======================================

 app.get("/medicine/:medicine_id/:user_id", (req, res) => {

    const { medicine_id, user_id } = req.params;

    const sql = `
        SELECT *
        FROM medicines
        WHERE medicine_id=?
        AND user_id=?
    `;

    db.query(sql, [medicine_id, user_id], (err, result) => {

        if (err)
            return res.status(500).json(err);

        if (result.length === 0) {

            return res.json({
                success: false,
                message: "Medicine Not Found"
            });

        }

        res.json(result[0]);

    });

});

app.get("/medicine/:user_id/:medicine_id", (req, res) => {

    const { user_id, medicine_id } = req.params;

    const sql = `
        SELECT *
        FROM medicines
        WHERE medicine_id = ?
        AND user_id = ?
    `;

    db.query(sql, [medicine_id, user_id], (err, result) => {

        if (err) {
            return res.status(500).json(err);
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "Medicine Not Found"
            });
        }

        res.json(result[0]);

    });

});


// =======================
// UPDATE MEDICINE API
// =======================

app.put("/medicines/:user_id/:medicine_id", (req, res) => {

    const { user_id, medicine_id } = req.params;

    const {
        medicine_name,
        company_name,
        batch_no,
        expiry_date,
        quantity,
        price
    } = req.body;

    // Check Expiry Date

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiry_date);
    expiry.setHours(0, 0, 0, 0);

    if (expiry < today) {
        return res.status(400).json({
            message: "Expired medicine cannot be updated."
        });
    }

    const sql = `
        UPDATE medicines
        SET
            medicine_name = ?,
            company_name = ?,
            batch_no = ?,
            expiry_date = ?,
            quantity = ?,
            price = ?,
            updated_at = ?
        WHERE medicine_id = ?
        AND user_id = ?
    `;

    db.query(
        sql,
        [
            medicine_name,
            company_name,
            batch_no,
            expiry_date,
            quantity,
            price,
            new Date(),
            medicine_id,
            user_id
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Medicine Not Found"
                });
            }

            res.json({
                message: "Medicine Updated Successfully"
            });

        }
    );

});

// =======================
// DELETE MEDICINE API
// =======================

app.delete("/medicines/:user_id/:medicine_id", (req, res) => {

    const { user_id, medicine_id } = req.params;

    const sql = `
        DELETE FROM medicines
        WHERE medicine_id = ?
        AND user_id = ?
    `;

    db.query(sql, [medicine_id, user_id], (err, result) => {

        if (err) {
            return res.status(500).json(err);
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Medicine Not Found"
            });
        }

        res.json({
            message: "Medicine Deleted Successfully"
        });

    });

});


// =======================
// SEARCH MEDICINE API
// =======================

app.get("/medicines/search/:user_id/:name", (req, res) => {

    const { user_id, name } = req.params;

    const sql = `
        SELECT *
        FROM medicines
        WHERE user_id = ?
        AND LOWER(medicine_name) = LOWER(?)
        LIMIT 1
    `;

    db.query(sql, [user_id, name], (err, result) => {

        if (err) {
            return res.status(500).json(err);
        }

        if (result.length === 0) {
            return res.json({
                found: false
            });
        }

        res.json({
            found: true,
            medicine: result[0]
        });

    });

});

// GENERATE BILL
app.post("/customers/generate-bill", async (req, res) => {

    const {

        customer_id,
        customer_name,
        mobile,
        doctor_name,
        visit_date,
        user_id,
        items

    } = req.body;

    if (
        !customer_id ||
        !customer_name ||
        !mobile ||
        !doctor_name ||
        !visit_date ||
        !user_id ||
        !items ||
        items.length === 0
    ) {

        return res.json({
            success: false,
            message: "All fields are required."
        });

    }

    const connection = db.promise();

    try {

        await connection.beginTransaction();

        // CHECK CUSTOMER

        const [customerResult] = await connection.query(
            `
             SELECT
                customer_name,
                mobile,
                doctor_name

            FROM customers

            WHERE user_id=?
            AND customer_id=?

            LIMIT 1

            `,

            [user_id, customer_id]

        );

        if (customerResult.length > 0) {

            const customer = customerResult[0];

            if (

                customer.customer_name !== customer_name ||
                customer.mobile !== mobile ||
                customer.doctor_name !== doctor_name

            ) {

                await connection.rollback();

                return res.json({

                    success: false,
                    message:
                        "Customer details do not match existing Customer ID."

                });

            }

        }

        // ==========================
        // GENERATE INVOICE
        // ==========================

        const invoice_no = "INV" + Date.now();

        // ==========================
        // CHECK ALL MEDICINES
        // ==========================

        let grandTotal = 0;

        for (const item of items) {

            const [medicine] = await connection.query(

                `

                SELECT
                    medicine_name,
                    price,
                    quantity

                FROM medicines

                WHERE medicine_id=?

                `,

                [item.medicine_id]

            );

            if (medicine.length === 0) {

                await connection.rollback();

                return res.json({

                    success: false,
                    message: "Medicine Not Found"

                });

            }

            if (
                Number(medicine[0].quantity) <
                Number(item.quantity)
            ) {

                await connection.rollback();

                return res.json({

                    success: false,
                    message:
                        `${medicine[0].medicine_name} Out Of Stock`

                });

            }

            grandTotal +=
                Number(medicine[0].price) *
                Number(item.quantity);

        }

        // INSERT CUSTOMER RECORDS
        // UPDATE STOCK

        for (const item of items) {

            const [medicine] = await connection.query(

                `
                SELECT
                    price
                FROM medicines
                WHERE medicine_id=?
                `,

                [item.medicine_id]

            );

            const total =
                Number(medicine[0].price) *
                Number(item.quantity);

            // Insert Customer Bill

            await connection.query(

                `

                INSERT INTO customers(

                    invoice_no,
                    customer_id,
                    customer_name,
                    mobile,
                    doctor_name,
                    medicine_id,
                    quantity,
                    total_amount,
                    visit_date,
                    user_id,
                    bill_status

                )

                VALUES(?,?,?,?,?,?,?,?,?,?,?)

                `,

                [

                    invoice_no,
                    customer_id,
                    customer_name,
                    mobile,
                    doctor_name,
                    item.medicine_id,
                    item.quantity,
                    total,
                    visit_date,
                    user_id,
                    "CLOSED"

                ]

            );

            // Update Medicine Stock

            // ==========================
// UPDATE MEDICINE STOCK
// ==========================

const [updateStock] = await connection.query(

    `
    UPDATE medicines

    SET 
        quantity = quantity - ?,
        updated_at = NOW()

    WHERE medicine_id = ?
    AND user_id = ?
    AND quantity >= ?
    `,

    [
        Number(item.quantity),
        Number(item.medicine_id),
        Number(user_id),
        Number(item.quantity)
    ]

);

// Check whether stock was actually decreased

if (updateStock.affectedRows === 0) {

    await connection.rollback();

    return res.json({

        success: false,

        message:
            "Stock could not be updated. Medicine or quantity is invalid."

    });

}
        }

        // ==========================
        // COMMIT TRANSACTION
        // ==========================

        await connection.commit();

        return res.json({

            success: true,
            invoice_no,
            grand_total: grandTotal,
            message: "Bill Generated Successfully"

        });

    }

    catch (err) {

        await connection.rollback();

        console.log(err);

        return res.status(500).json({

            success: false,
            message: "Server Error"

        });

    }

});

// ======================================
// GET SINGLE INVOICE
// ======================================

app.get("/invoice/:invoice_no", (req, res) => {

    const { invoice_no } = req.params;

    const sql = `
        SELECT
            c.customer_name,
            c.customer_id,
            c.mobile,
            c.doctor_name,
            c.visit_date,
            c.invoice_no,
            m.medicine_name,
            m.price,
            c.quantity,
            c.total_amount
        FROM customers c
        INNER JOIN medicines m
        ON c.medicine_id = m.medicine_id
        WHERE c.invoice_no = ?
    `;

    db.query(sql, [invoice_no], (err, result) => {

        if (err)
            return res.status(500).json(err);

        if (result.length === 0) {

            return res.json({

                success: false,
                message: "Invoice Not Found"

            });

        }

        let grand_total = 0;

        result.forEach(item => {

            grand_total += Number(item.total_amount);

        });

        res.json({

            success: true,
            invoice_no,
            customer_name: result[0].customer_name,
            customer_id: result[0].customer_id,
            mobile: result[0].mobile,
            doctor_name: result[0].doctor_name,
            visit_date: result[0].visit_date,
            medicines: result,
            grand_total

        });

    });

});

// =====================================
// GET CURRENT BILL OF CUSTOMER
// =====================================

app.get("/customers/bill/:invoice_no", (req, res) => {

    const { invoice_no } = req.params;

    const sql = `
        SELECT
            c.customer_item_id,
            c.invoice_no,
            m.medicine_name,
            c.quantity,
            m.price,
            c.total_amount
        FROM customers c
        JOIN medicines m
        ON c.medicine_id = m.medicine_id
        WHERE c.invoice_no=?
        ORDER BY c.customer_item_id ASC
    `;

    db.query(sql,[invoice_no],(err,result)=>{

        if(err)
            return res.status(500).json(err);

        res.json(result);

    });

});

// =====================================
// GENERATE INVOICE
// =====================================

app.get("/customers/invoice/:invoice_no",(req,res)=>{

    const {invoice_no}=req.params;

    const sql=`
    SELECT
        c.invoice_no,
        c.customer_name,
        c.mobile,
        c.doctor_name,
        c.visit_date,
        m.medicine_name,
        c.quantity,
        m.price,
        c.total_amount
    FROM customers c
    JOIN medicines m
    ON c.medicine_id=m.medicine_id
    WHERE c.invoice_no=?
    `;

    db.query(sql,[invoice_no],(err,result)=>{

        if(err)
            return res.status(500).json(err);

        if(result.length==0){
            return res.json({
                message:"Invoice Not Found"
            });
        }

        let grandTotal=0;

        result.forEach(item=>{
            grandTotal+=Number(item.total_amount);
        });

        res.json({

            invoice_no:result[0].invoice_no,
            customer_name:result[0].customer_name,
            mobile:result[0].mobile,
            doctor_name:result[0].doctor_name,
            visit_date:result[0].visit_date,

            medicines:result.map(item=>({

                medicine_name:item.medicine_name,
                quantity:item.quantity,
                price:item.price,
                total:item.total_amount

            })),

            grand_total:grandTotal

        });

    });

});
app.get("/medicines/low-stock/:user_id", (req, res) => {

    const { user_id } = req.params;

    const sql = `
        SELECT
            medicine_id,
            medicine_name,
            quantity
        FROM medicines
        WHERE user_id = ?
        AND quantity <= 10
        ORDER BY quantity ASC
    `;

    db.query(sql, [user_id], (err, result) => {

        if (err)
            return res.status(500).json(err);

        res.json(result);

    });

});

// =====================================
// GET ALL CUSTOMERS
// =====================================

app.get("/customers/:user_id",(req,res)=>{

    const {user_id}=req.params;

    const sql=`
    SELECT DISTINCT
        customer_id,
        customer_name,
        mobile,
        doctor_name,
        visit_date
    FROM customers
    WHERE user_id=?
    ORDER BY customer_name
    `;

    db.query(sql,[user_id],(err,result)=>{

        if(err)
            return res.status(500).json(err);

        res.json(result);

    });

});


app.get("/customer/:user_id/:customer_id", (req, res) => {

    const { user_id, customer_id } = req.params;

    const sql = `
        SELECT
            customer_name,
            mobile,
            doctor_name
        FROM customers
        WHERE user_id = ?
        AND customer_id = ?
        LIMIT 1
    `;

    db.query(sql, [user_id, customer_id], (err, result) => {

        if (err)
            return res.status(500).json(err);

        if (result.length > 0) {

            return res.json({
                exists: true,
                customer: result[0]
            });

        }

        res.json({
            exists: false
        });

    });

});

// ======================================
// GET CUSTOMER HISTORY
// ======================================

app.get("/customers/history/:user_id", (req, res) => {

    const { user_id } = req.params;

    const sql = `
        SELECT
            invoice_no,
            customer_id,
            customer_name,
            mobile,
            doctor_name,
            visit_date,
            bill_status,
            SUM(total_amount) AS grand_total
        FROM customers
        WHERE user_id = ?
        GROUP BY
            invoice_no,
            customer_id,
            customer_name,
            mobile,
            doctor_name,
            visit_date,
            bill_status
        ORDER BY visit_date DESC, invoice_no DESC
    `;

    db.query(sql, [user_id], (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json(err);
        }

        res.json(result);

    });

});

app.get("/customers/history/search/:user_id/:keyword", (req, res) => {

    const { user_id, keyword } = req.params;

    const sql = `
        SELECT
            invoice_no,
            customer_id,
            customer_name,
            mobile,
            doctor_name,
            visit_date,
            bill_status,
            SUM(total_amount) AS grand_total
        FROM customers
        WHERE
            user_id = ?
            AND (
                invoice_no LIKE ?
                OR CAST(customer_id AS CHAR) LIKE ?
                OR customer_name LIKE ?
                OR mobile LIKE ?
            )
        GROUP BY
            invoice_no,
            customer_id,
            customer_name,
            mobile,
            doctor_name,
            visit_date,
            bill_status
        ORDER BY visit_date DESC, invoice_no DESC
    `;

    const search = `%${keyword}%`;

    db.query(
        sql,
        [user_id, search, search, search, search],
        (err, result) => {

            if (err) {
                console.log(err);
                return res.status(500).json(err);
            }

            res.json(result);

        }
    );

});

// ======================================
// GET USER PROFILE
// ======================================

app.get("/profile/:user_id", (req, res) => {

    const { user_id } = req.params;

    const sql = `
        SELECT
            user_id,
            name,
            email
        FROM users
        WHERE user_id = ?
    `;

    db.query(sql, [user_id], (err, result) => {

        if (err)
            return res.status(500).json(err);

        if (result.length === 0) {

            return res.status(404).json({
                message: "User Not Found"
            });

        }

        res.json(result[0]);

    });

});

// ======================================
// UPDATE PROFILE
// ======================================

app.put("/profile/:user_id", (req, res) => {

    const { user_id } = req.params;

    const { name, email } = req.body;

    if (!name || !email) {

        return res.json({
            message: "All Fields Required"
        });

    }

    const sql = `
        UPDATE users
        SET
            name=?,
            email=?
        WHERE user_id=?
    `;

    db.query(sql, [name, email, user_id], (err) => {

        if (err)
            return res.status(500).json(err);

        res.json({
            message: "Profile Updated Successfully"
        });

    });

});


app.listen(1000,()=>{

    console.log("Server running on port 1000");

});