require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const nodemailer = require("nodemailer");

// =====================================================
// APP + CORS CONFIG
// =====================================================

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://medistock.saispv2007.workers.dev",
    "https://medistock-frontend.pages.dev"
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (Postman, mobile apps)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        // Allow any *.pages.dev or *.workers.dev subdomain
        if (origin.endsWith(".pages.dev") || origin.endsWith(".workers.dev")) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

const db = require("./db");

// =====================================================
// EMAIL TRANSPORTER
// =====================================================

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

// =====================================================
// REGISTER API
// =====================================================

app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const gmailRegex =
        /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    if (!gmailRegex.test(email.trim())) {
        return res.status(400).json({
            message: "Please enter a valid Gmail address"
        });
    }

    const userEmail = email.trim();

    const checkUser =
        "SELECT user_id FROM users WHERE email = ?";

    db.query(
        checkUser,
        [userEmail],
        async (err, result) => {
            if (err) {
                console.log("Database Error:", err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (result.length > 0) {
                console.log(
                    "User already exists:",
                    userEmail
                );

                return res.status(409).json({
                    message: "User already exists"
                });
            }

            try {
                const hashPassword =
                    await bcrypt.hash(password, 10);

                const date = new Date();

                const sql = `
                    INSERT INTO users
                    (name, email, password, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                `;

                db.query(
                    sql,
                    [
                        name.trim(),
                        userEmail,
                        hashPassword,
                        date,
                        date
                    ],
                    async (err, result) => {
                        if (err) {
                            console.log(
                                "Registration Database Error:",
                                err
                            );

                            return res.status(500).json({
                                message: "Registration failed"
                            });
                        }

                        console.log(
                            "User registered successfully:",
                            userEmail
                        );

                        // ---- EMAIL SENDING COMMENTED OUT (re-enable when needed) ----
                        /*
                        const mailOptions = {
                            from: `"MediStock" <${process.env.EMAIL_USER}>`,
                            to: userEmail,
                            subject:
                                "MediStock Registration Successful",
                            html: `
                                <div style="
                                    font-family: Arial, sans-serif;
                                    max-width: 600px;
                                    margin: auto;
                                    padding: 30px;
                                    border: 1px solid #e0e0e0;
                                    border-radius: 10px;
                                ">
                                    <h2 style="
                                        color: #2e86de;
                                        text-align: center;
                                    ">
                                        Welcome to MediStock 🏥
                                    </h2>

                                    <p style="font-size: 16px;">
                                        Hello
                                        <strong>${name.trim()}</strong>,
                                    </p>

                                    <p style="
                                        font-size: 15px;
                                        color: #333;
                                    ">
                                        Your registration for
                                        <strong>
                                            MediStock Inventory System
                                        </strong>
                                        has been completed successfully.
                                    </p>

                                    <hr style="
                                        border: none;
                                        border-top: 1px solid #eee;
                                    " />

                                    <p style="
                                        font-size: 13px;
                                        color: #888;
                                        text-align: center;
                                    ">
                                        Thank you for registering with MediStock.
                                        <br />
                                        <strong>MediStock Team</strong>
                                    </p>
                                </div>
                            `
                        };

                        try {
                            await transporter.sendMail(
                                mailOptions
                            );

                            console.log(
                                "Registration email sent to:",
                                userEmail
                            );

                            return res.status(201).json({
                                message:
                                    "Registration successful! A confirmation email has been sent to your inbox."
                            });
                        } catch (emailError) {
                            console.log(
                                "Email sending error:",
                                emailError.message
                            );

                            return res.status(201).json({
                                message:
                                    "Registration successful! (Confirmation email could not be sent)"
                            });
                        }
                        */
                        // ---- END EMAIL BLOCK ----

                        return res.status(201).json({
                            message: "Registration successful!"
                        });
                    }
                );
            } catch (error) {
                console.log(
                    "Registration Error:",
                    error
                );

                return res.status(500).json({
                    message: "Registration failed"
                });
            }
        }
    );
});

// =====================================================
// LOGIN API
// =====================================================

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const sql =
        "SELECT * FROM users WHERE email=?";

    db.query(
        sql,
        [email],
        async (err, result) => {
            if (err) {
                return res.status(500).json({
                    error: err
                });
            }

            if (result.length === 0) {
                return res.json({
                    message: "User not found"
                });
            }

            const user = result[0];

            const match =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if (!match) {
                return res.json({
                    message: "Invalid Password"
                });
            }

            res.json({
                message: "Login Successful",
                user: {
                    user_id: user.user_id,
                    name: user.name,
                    email: user.email
                }
            });
        }
    );
});

// =====================================================
// DASHBOARD APIs
// =====================================================

// TOTAL CUSTOMERS

app.get(
    "/dashboard/total-customers/:user_id",
    (req, res) => {
        const { user_id } = req.params;

        const sql = `
            SELECT COUNT(DISTINCT customer_id)
            AS total_customers
            FROM customers
            WHERE user_id=?
        `;

        db.query(
            sql,
            [user_id],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        message:
                            "Error fetching total customers"
                    });
                }

                res.json({
                    total_customers:
                        result[0].total_customers
                });
            }
        );
    }
);

// TOTAL MEDICINES

app.get(
    "/dashboard/total-medicines/:user_id",
    (req, res) => {
        const { user_id } = req.params;

        const sql = `
            SELECT COUNT(*) AS total_medicines
            FROM medicines
            WHERE user_id=?
        `;

        db.query(
            sql,
            [user_id],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        message:
                            "Error fetching total medicines"
                    });
                }

                res.json({
                    total_medicines:
                        result[0].total_medicines
                });
            }
        );
    }
);

// TOTAL INVOICES

app.get(
    "/dashboard/total-invoices/:user_id",
    (req, res) => {
        const { user_id } = req.params;

        const sql = `
            SELECT COUNT(DISTINCT invoice_no)
            AS total_invoices
            FROM customers
            WHERE user_id=?
        `;

        db.query(
            sql,
            [user_id],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        message:
                            "Error fetching total invoices"
                    });
                }

                res.json({
                    total_invoices:
                        result[0].total_invoices
                });
            }
        );
    }
);

// TOTAL SALES

app.get(
    "/dashboard/total-sales/:user_id",
    (req, res) => {
        const { user_id } = req.params;

        const sql = `
            SELECT
                COALESCE(SUM(total_amount),0)
                AS total_sales
            FROM customers
            WHERE user_id=?
        `;

        db.query(
            sql,
            [user_id],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        message:
                            "Error fetching total sales"
                    });
                }

                res.json({
                    total_sales:
                        result[0].total_sales
                });
            }
        );
    }
);

// LOW STOCK COUNT

app.get(
    "/dashboard/low-stock/:user_id",
    (req, res) => {
        const { user_id } = req.params;

        const sql = `
            SELECT COUNT(*) AS low_stock
            FROM medicines
            WHERE user_id=?
            AND quantity <= 10
        `;

        db.query(
            sql,
            [user_id],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        message:
                            "Error fetching low stock medicines"
                    });
                }

                res.json({
                    low_stock:
                        result[0].low_stock
                });
            }
        );
    }
);

// EXPIRED MEDICINES

app.get(
    "/dashboard/expired-medicines/:user_id",
    (req, res) => {
        const { user_id } = req.params;

        const sql = `
            SELECT COUNT(*) AS expired_medicines
            FROM medicines
            WHERE user_id=?
            AND expiry_date < CURDATE()
            AND expiry_date != '0000-00-00'
        `;

        db.query(
            sql,
            [user_id],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        message:
                            "Error fetching expired medicines"
                    });
                }

                res.json({
                    expired_medicines:
                        result[0].expired_medicines
                });
            }
        );
    }
);

// =====================================================
// MEDICINE APIs
// =====================================================

// ADD MEDICINE

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

    if (
        !user_id ||
        !medicine_name ||
        !company_name ||
        !batch_no ||
        !expiry_date ||
        quantity === undefined ||
        price === undefined
    ) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiry_date);
    expiry.setHours(0, 0, 0, 0);

    if (expiry < today) {
        return res.status(400).json({
            message:
                "Expired medicine cannot be added."
        });
    }

    if (Number(quantity) < 0) {
        return res.status(400).json({
            message:
                "Quantity cannot be negative"
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                return res.status(500).json({
                    error: err
                });
            }

            res.json({
                message:
                    "Medicine Added Successfully",
                medicine_id:
                    result.insertId
            });
        }
    );
});

// GET ALL MEDICINES

app.get(
    "/medicines/:user_id",
    (req, res) => {
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
            ORDER BY medicine_name ASC
        `;

        db.query(
            sql,
            [user_id],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        error: err
                    });
                }

                res.json(result);
            }
        );
    }
);

// UPDATE MEDICINE

app.put(
    "/medicines/:user_id/:medicine_id",
    (req, res) => {
        const {
            user_id,
            medicine_id
        } = req.params;

        const {
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

        if (expiry < today) {
            return res.status(400).json({
                message:
                    "Expired medicine cannot be updated."
            });
        }

        if (Number(quantity) < 0) {
            return res.status(400).json({
                message:
                    "Quantity cannot be negative"
            });
        }

        const sql = `
            UPDATE medicines
            SET
                medicine_name=?,
                company_name=?,
                batch_no=?,
                expiry_date=?,
                quantity=?,
                price=?,
                updated_at=?
            WHERE medicine_id=?
            AND user_id=?
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
                    return res.status(500).json({
                        error: err
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        message:
                            "Medicine Not Found"
                    });
                }

                res.json({
                    message:
                        "Medicine Updated Successfully"
                });
            }
        );
    }
);

// DELETE MEDICINE

app.delete(
    "/medicines/:user_id/:medicine_id",
    (req, res) => {
        const {
            user_id,
            medicine_id
        } = req.params;

        const sql = `
            DELETE FROM medicines
            WHERE medicine_id=?
            AND user_id=?
        `;

        db.query(
            sql,
            [medicine_id, user_id],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        error: err
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        message:
                            "Medicine Not Found"
                    });
                }

                res.json({
                    message:
                        "Medicine Deleted Successfully"
                });
            }
        );
    }
);

// SEARCH MEDICINE

app.get(
    "/medicines/search/:user_id/:name",
    (req, res) => {
        const {
            user_id,
            name
        } = req.params;

        const sql = `
            SELECT *
            FROM medicines
            WHERE user_id=?
            AND LOWER(medicine_name)
            = LOWER(?)
            LIMIT 1
        `;

        db.query(
            sql,
            [user_id, name],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        error: err
                    });
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
            }
        );
    }
);

// LOW STOCK MEDICINES

app.get(
    "/medicines/low-stock/:user_id",
    (req, res) => {
        const { user_id } = req.params;

        const sql = `
            SELECT
                medicine_id,
                medicine_name,
                quantity
            FROM medicines
            WHERE user_id=?
            AND quantity <= 10
            ORDER BY quantity ASC
        `;

        db.query(
            sql,
            [user_id],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        error: err
                    });
                }

                res.json(result);
            }
        );
    }
);

// =====================================================
// CUSTOMER APIs
// =====================================================

// GET CUSTOMER DETAILS

app.get(
    "/customer/:user_id/:customer_id",
    (req, res) => {
        const {
            user_id,
            customer_id
        } = req.params;

        const sql = `
            SELECT customer_name
            FROM customers
            WHERE user_id=?
            AND customer_id=?
            LIMIT 1
        `;

        db.query(
            sql,
            [user_id, customer_id],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        error: err
                    });
                }

                if (result.length === 0) {
                    return res.json({
                        exists: false
                    });
                }

                res.json({
                    exists: true,
                    customer: {
                        customer_name:
                            result[0].customer_name
                    }
                });
            }
        );
    }
);

// =====================================================
// GENERATE BILL
// =====================================================

app.post(
    "/customers/generate-bill",
    async (req, res) => {
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

            const [customerResult] =
                await connection.query(
                    `
                    SELECT customer_name
                    FROM customers
                    WHERE user_id=?
                    AND customer_id=?
                    LIMIT 1
                    `,
                    [
                        user_id,
                        customer_id
                    ]
                );

            if (customerResult.length > 0) {
                if (
                    customerResult[0]
                        .customer_name
                        .toLowerCase() !==
                    customer_name
                        .toLowerCase()
                ) {
                    await connection.rollback();

                    return res.json({
                        success: false,
                        message:
                            "Customer Name does not match Customer ID."
                    });
                }
            }

            // GENERATE INVOICE

            const invoice_no =
                "INV" + Date.now();

            let grandTotal = 0;

            // CHECK ALL MEDICINES

            for (const item of items) {
                const [medicine] =
                    await connection.query(
                        `
                        SELECT
                            medicine_name,
                            price,
                            quantity,
                            expiry_date
                        FROM medicines
                        WHERE medicine_id=?
                        AND user_id=?
                        FOR UPDATE
                        `,
                        [
                            item.medicine_id,
                            user_id
                        ]
                    );

                if (medicine.length === 0) {
                    await connection.rollback();

                    return res.json({
                        success: false,
                        message:
                            "Medicine Not Found"
                    });
                }

                const med = medicine[0];

                // EXPIRY CHECK

                if (
                    med.expiry_date &&
                    new Date(med.expiry_date) <
                        new Date()
                ) {
                    await connection.rollback();

                    return res.json({
                        success: false,
                        message:
                            `${med.medicine_name} is expired`
                    });
                }

                // QUANTITY CHECK

                const requestedQuantity =
                    Number(item.quantity);

                const availableQuantity =
                    Number(med.quantity);

                if (requestedQuantity <= 0) {
                    await connection.rollback();

                    return res.json({
                        success: false,
                        message:
                            "Invalid medicine quantity"
                    });
                }

                if (
                    availableQuantity <
                    requestedQuantity
                ) {
                    await connection.rollback();

                    return res.json({
                        success: false,
                        message:
                            `${med.medicine_name} Out Of Stock`
                    });
                }

                // CALCULATE TOTAL

                grandTotal +=
                    Number(med.price) *
                    requestedQuantity;
            }

            // INSERT BILL + DECREASE STOCK

            for (const item of items) {
                const [medicine] =
                    await connection.query(
                        `
                        SELECT
                            medicine_name,
                            price
                        FROM medicines
                        WHERE medicine_id=?
                        AND user_id=?
                        `,
                        [
                            item.medicine_id,
                            user_id
                        ]
                    );

                const med = medicine[0];

                const total =
                    Number(med.price) *
                    Number(item.quantity);

                // INSERT CUSTOMER BILL

                await connection.query(
                    `
                    INSERT INTO customers
                    (
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
                    VALUES
                    (?,?,?,?,?,?,?,?,?,?,?)
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

                // DECREASE MEDICINE STOCK

                const [updateResult] =
                    await connection.query(
                        `
                        UPDATE medicines
                        SET
                            quantity =
                                quantity - ?,
                            updated_at = ?
                        WHERE medicine_id=?
                        AND user_id=?
                        AND quantity >= ?
                        `,
                        [
                            Number(item.quantity),
                            new Date(),
                            item.medicine_id,
                            user_id,
                            Number(item.quantity)
                        ]
                    );

                if (
                    updateResult.affectedRows === 0
                ) {
                    await connection.rollback();

                    return res.json({
                        success: false,
                        message:
                            `${med.medicine_name} stock update failed`
                    });
                }
            }

            // COMMIT

            await connection.commit();

            return res.json({
                success: true,
                invoice_no,
                grand_total: grandTotal,
                message:
                    "Bill Generated Successfully"
            });
        } catch (err) {
            await connection.rollback();

            console.log(err);

            return res.status(500).json({
                success: false,
                message: "Server Error"
            });
        }
    }
);

// =====================================================
// INVOICE APIs
// =====================================================

// GET INVOICE

app.get(
    "/invoice/:invoice_no",
    (req, res) => {
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
                ON c.medicine_id=m.medicine_id
            WHERE c.invoice_no=?
        `;

        db.query(
            sql,
            [invoice_no],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        error: err
                    });
                }

                if (result.length === 0) {
                    return res.json({
                        success: false,
                        message:
                            "Invoice Not Found"
                    });
                }

                let grand_total = 0;

                result.forEach(item => {
                    grand_total +=
                        Number(
                            item.total_amount
                        );
                });

                res.json({
                    success: true,
                    invoice_no,
                    customer_name:
                        result[0].customer_name,
                    customer_id:
                        result[0].customer_id,
                    mobile:
                        result[0].mobile,
                    doctor_name:
                        result[0].doctor_name,
                    visit_date:
                        result[0].visit_date,
                    medicines: result,
                    grand_total
                });
            }
        );
    }
);

// =====================================================
// CUSTOMER HISTORY APIs
// =====================================================

// CUSTOMER HISTORY

app.get(
    "/customers/history/:user_id",
    (req, res) => {
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
                SUM(total_amount)
                AS grand_total
            FROM customers
            WHERE user_id=?
            GROUP BY
                invoice_no,
                customer_id,
                customer_name,
                mobile,
                doctor_name,
                visit_date,
                bill_status
            ORDER BY
                visit_date DESC,
                invoice_no DESC
        `;

        db.query(
            sql,
            [user_id],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        error: err
                    });
                }

                res.json(result);
            }
        );
    }
);

// SEARCH CUSTOMER HISTORY

app.get(
    "/customers/history/search/:user_id/:keyword",
    (req, res) => {
        const {
            user_id,
            keyword
        } = req.params;

        const sql = `
            SELECT
                invoice_no,
                customer_id,
                customer_name,
                mobile,
                doctor_name,
                visit_date,
                bill_status,
                SUM(total_amount)
                AS grand_total
            FROM customers
            WHERE user_id=?
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
            ORDER BY
                visit_date DESC,
                invoice_no DESC
        `;

        const search =
            `%${keyword}%`;

        db.query(
            sql,
            [
                user_id,
                search,
                search,
                search,
                search
            ],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        error: err
                    });
                }

                res.json(result);
            }
        );
    }
);

// =====================================================
// PROFILE APIs
// =====================================================

// GET PROFILE

app.get(
    "/profile/:user_id",
    (req, res) => {
        const { user_id } = req.params;

        const sql = `
            SELECT
                user_id,
                name,
                email
            FROM users
            WHERE user_id=?
        `;

        db.query(
            sql,
            [user_id],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        error: err
                    });
                }

                if (result.length === 0) {
                    return res.status(404).json({
                        message:
                            "User Not Found"
                    });
                }

                res.json(result[0]);
            }
        );
    }
);

// UPDATE PROFILE

app.put(
    "/profile/:user_id",
    (req, res) => {
        const { user_id } = req.params;

        const {
            name,
            email
        } = req.body;

        if (!name || !email) {
            return res.json({
                message:
                    "All Fields Required"
            });
        }

        const sql = `
            UPDATE users
            SET
                name=?,
                email=?
            WHERE user_id=?
        `;

        db.query(
            sql,
            [
                name,
                email,
                user_id
            ],
            (err) => {
                if (err) {
                    return res.status(500).json({
                        error: err
                    });
                }

                res.json({
                    message:
                        "Profile Updated Successfully"
                });
            }
        );
    }
);

// =====================================================
// MEDISTOCK CHATBOT — LOCAL RULE-BASED ENGINE
// No external API. Instant answers from DB data.
// =====================================================

app.post(
    "/chatbot",
    async (req, res) => {
        try {
            const { question, user_id } = req.body;

            // --- VALIDATION ---
            if (!question || !question.trim()) {
                return res.status(400).json({ success: false, message: "Question is required" });
            }
            if (!user_id) {
                return res.status(400).json({ success: false, message: "User ID is required" });
            }

            const q = question.trim().toLowerCase();

            // --- FETCH USER ---
            const [users] = await db.promise().query(
                "SELECT user_id, name, email FROM users WHERE user_id = ?",
                [user_id]
            );
            if (users.length === 0) {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            const currentUser = users[0];

            // --- FETCH MEDICINES ---
            const [medicines] = await db.promise().query(
                `SELECT medicine_id, medicine_name, company_name, batch_no,
                        expiry_date, quantity, price
                 FROM medicines WHERE user_id = ? ORDER BY medicine_name ASC`,
                [user_id]
            );

            // --- FETCH CUSTOMERS / BILLS ---
            const [customers] = await db.promise().query(
                `SELECT c.customer_id, c.customer_name, c.mobile, c.doctor_name,
                        c.medicine_id, m.medicine_name, c.quantity, c.total_amount,
                        c.visit_date, c.bill_status, c.invoice_no
                 FROM customers c
                 LEFT JOIN medicines m ON c.medicine_id = m.medicine_id
                 WHERE c.user_id = ? ORDER BY c.visit_date DESC`,
                [user_id]
            );

            // --- COMPUTED STATS ---
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const lowStock      = medicines.filter(m => Number(m.quantity) <= 10);
            const outOfStock    = medicines.filter(m => Number(m.quantity) === 0);
            const expiredMeds   = medicines.filter(m => m.expiry_date && new Date(m.expiry_date) < today);
            const totalUnits    = medicines.reduce((s, m) => s + Number(m.quantity || 0), 0);
            const totalSales    = customers.reduce((s, c) => s + Number(c.total_amount || 0), 0);
            const uniqueCusts   = new Set(customers.map(c => c.customer_id)).size;
            const uniqueInvs    = new Set(customers.map(c => c.invoice_no).filter(Boolean)).size;

            // =====================================================
            // INTENT MATCHING HELPER
            // =====================================================
            const has = (...words) => words.some(w => q.includes(w));

            // =====================================================
            // RULE-BASED ANSWER ENGINE
            // =====================================================
            let answer = null;

            // ---- GREETINGS ----
            if (has("hi", "hello", "hey", "good morning", "good evening", "good afternoon", "howdy", "sup", "what's up")) {
                answer = `Hello ${currentUser.name}! 👋 I'm your MediStock Assistant. You can ask me about medicines, stock, customers, sales, expired items, and more!`;
            }

            // ---- ABOUT / HELP ----
            else if (has("who are you", "what are you", "what can you do", "help", "what do you know", "capabilities")) {
                answer = `I'm MediStock Assistant 🤖. I can answer questions about:\n• Medicine stock & quantities\n• Low stock or expired medicines\n• Customer & invoice information\n• Sales & billing totals\n• Medicine prices & companies`;
            }

            // ---- HOW MANY MEDICINES (types) ----
            else if (
                (has("how many") && has("medicine", "medicines", "type", "types", "item", "items", "product", "products")) ||
                (has("total") && has("medicine", "medicines") && !has("stock", "unit", "units", "quantity"))
            ) {
                answer = `You have **${medicines.length}** medicine type(s) in stock.`;
            }

            // ---- TOTAL STOCK / UNITS ----
            else if (has("total stock", "total units", "total quantity", "all stock", "overall stock")) {
                answer = `Your total medicine stock is **${totalUnits}** units across ${medicines.length} medicine type(s).`;
            }

            // ---- SPECIFIC MEDICINE QUANTITY ----
            else if (has("quantity", "stock", "how much", "how many") && has("medicine", "of")) {
                // Try to match a medicine name in the question
                const matched = medicines.find(m =>
                    q.includes(m.medicine_name.toLowerCase())
                );
                if (matched) {
                    answer = `**${matched.medicine_name}** currently has **${matched.quantity}** units in stock.`;
                } else if (medicines.length === 0) {
                    answer = "You have no medicines in your inventory yet.";
                } else {
                    answer = `You have **${medicines.length}** medicine type(s) with a total of **${totalUnits}** units.\n\nTo check a specific medicine's stock, mention its name (e.g., "how many Paracetamol do I have?").`;
                }
            }

            // ---- LOW STOCK ----
            else if (has("low stock", "low", "running out", "almost out", "reorder", "less stock", "shortage")) {
                if (lowStock.length === 0) {
                    answer = "✅ No medicines are currently low on stock (all above 10 units).";
                } else {
                    const list = lowStock.map(m => `• ${m.medicine_name} — ${m.quantity} units`).join("\n");
                    answer = `⚠️ **${lowStock.length}** medicine(s) are low on stock (≤10 units):\n${list}`;
                }
            }

            // ---- OUT OF STOCK ----
            else if (has("out of stock", "zero stock", "no stock", "empty", "finished")) {
                if (outOfStock.length === 0) {
                    answer = "✅ No medicines are currently out of stock.";
                } else {
                    const list = outOfStock.map(m => `• ${m.medicine_name}`).join("\n");
                    answer = `🚫 **${outOfStock.length}** medicine(s) are out of stock:\n${list}`;
                }
            }

            // ---- EXPIRED MEDICINES ----
            else if (has("expired", "expiry", "expire", "expiring", "past date", "old medicine")) {
                if (expiredMeds.length === 0) {
                    answer = "✅ No expired medicines found in your inventory.";
                } else {
                    const list = expiredMeds.map(m => {
                        const d = new Date(m.expiry_date).toLocaleDateString("en-IN");
                        return `• ${m.medicine_name} — expired on ${d}`;
                    }).join("\n");
                    answer = `🔴 **${expiredMeds.length}** expired medicine(s):\n${list}`;
                }
            }

            // ---- LIST ALL MEDICINES ----
            else if (
                has("list", "show", "all medicines", "medicine list", "what medicines", "which medicines", "my medicines") ||
                (has("all") && has("medicine", "medicines"))
            ) {
                if (medicines.length === 0) {
                    answer = "You have no medicines in your inventory yet.";
                } else {
                    const list = medicines.slice(0, 15).map(m =>
                        `• ${m.medicine_name} (${m.company_name}) — Qty: ${m.quantity}, ₹${m.price}`
                    ).join("\n");
                    const more = medicines.length > 15 ? `\n...and ${medicines.length - 15} more.` : "";
                    answer = `📋 Your medicines (${medicines.length} total):\n${list}${more}`;
                }
            }

            // ---- MEDICINE PRICE ----
            else if (has("price", "cost", "rate", "how much does", "how much is")) {
                const matched = medicines.find(m => q.includes(m.medicine_name.toLowerCase()));
                if (matched) {
                    answer = `**${matched.medicine_name}** is priced at **₹${matched.price}** per unit.`;
                } else {
                    const list = medicines.slice(0, 10).map(m =>
                        `• ${m.medicine_name} — ₹${m.price}`
                    ).join("\n");
                    answer = medicines.length === 0
                        ? "No medicines found in your inventory."
                        : `Here are some medicine prices:\n${list}`;
                }
            }

            // ---- MEDICINE COMPANY ----
            else if (has("company", "manufacturer", "brand", "made by", "produced by")) {
                const matched = medicines.find(m => q.includes(m.medicine_name.toLowerCase()));
                if (matched) {
                    answer = `**${matched.medicine_name}** is manufactured by **${matched.company_name}**.`;
                } else {
                    const list = medicines.slice(0, 10).map(m =>
                        `• ${m.medicine_name} — ${m.company_name}`
                    ).join("\n");
                    answer = medicines.length === 0
                        ? "No medicines found."
                        : `Medicine companies:\n${list}`;
                }
            }

            // ---- EXPIRY DATE ----
            else if (has("expiry date", "expire date", "when does", "when will", "when expire", "batch")) {
                const matched = medicines.find(m => q.includes(m.medicine_name.toLowerCase()));
                if (matched) {
                    const d = matched.expiry_date
                        ? new Date(matched.expiry_date).toLocaleDateString("en-IN")
                        : "N/A";
                    answer = `**${matched.medicine_name}** expires on **${d}** (Batch: ${matched.batch_no || "N/A"}).`;
                } else {
                    answer = "Please mention the medicine name to get its expiry date.";
                }
            }

            // ---- CUSTOMERS ----
            else if (has("customer", "customers", "patient", "patients", "client", "clients")) {
                if (has("how many", "count", "total", "number")) {
                    answer = `You have **${uniqueCusts}** unique customer(s) on record.`;
                } else if (has("list", "show", "all", "who")) {
                    const names = [...new Set(customers.map(c => c.customer_name))].slice(0, 15);
                    answer = names.length === 0
                        ? "No customers found."
                        : `👥 Customers (${uniqueCusts} total):\n${names.map(n => `• ${n}`).join("\n")}`;
                } else {
                    answer = `You have **${uniqueCusts}** unique customer(s) and **${uniqueInvs}** invoice(s) on record.`;
                }
            }

            // ---- SALES / REVENUE ----
            else if (has("sales", "revenue", "total sales", "earnings", "income", "total amount", "how much sold", "billing")) {
                answer = `💰 Total sales: **₹${totalSales.toFixed(2)}** from **${uniqueInvs}** invoice(s).`;
            }

            // ---- INVOICES ----
            else if (has("invoice", "invoices", "bill", "bills")) {
                if (has("how many", "count", "total")) {
                    answer = `You have **${uniqueInvs}** invoice(s) generated so far.`;
                } else if (has("recent", "latest", "last")) {
                    const recent = customers.slice(0, 5);
                    if (recent.length === 0) {
                        answer = "No invoices found.";
                    } else {
                        const list = recent.map(c =>
                            `• Invoice ${c.invoice_no || "N/A"} — ${c.customer_name}, ₹${c.total_amount}`
                        ).join("\n");
                        answer = `📄 Recent invoices:\n${list}`;
                    }
                } else {
                    answer = `You have **${uniqueInvs}** invoice(s) with a total sales of **₹${totalSales.toFixed(2)}**.`;
                }
            }

            // ---- DASHBOARD ----
            else if (has("dashboard", "summary", "overview", "stats", "statistics")) {
                answer = `📊 **MediStock Summary for ${currentUser.name}:**\n` +
                    `• Medicines: ${medicines.length} types, ${totalUnits} units\n` +
                    `• Low stock: ${lowStock.length} medicine(s)\n` +
                    `• Expired: ${expiredMeds.length} medicine(s)\n` +
                    `• Customers: ${uniqueCusts}\n` +
                    `• Invoices: ${uniqueInvs}\n` +
                    `• Total sales: ₹${totalSales.toFixed(2)}`;
            }

            // ---- USER / PROFILE ----
            else if (has("my name", "who am i", "profile", "account", "my account", "my email", "logged in as")) {
                answer = `You are logged in as **${currentUser.name}** (${currentUser.email}).`;
            }

            // ---- THANK YOU ----
            else if (has("thank", "thanks", "thank you", "thx", "ty")) {
                answer = `You're welcome, ${currentUser.name}! 😊 Let me know if you need anything else.`;
            }

            // ---- GOODBYE ----
            else if (has("bye", "goodbye", "see you", "exit", "logout")) {
                answer = `Goodbye, ${currentUser.name}! 👋 Have a great day!`;
            }

            // ---- SPECIFIC MEDICINE INFO (catch-all name lookup) ----
            else {
                const matched = medicines.find(m => q.includes(m.medicine_name.toLowerCase()));
                if (matched) {
                    const exp = matched.expiry_date
                        ? new Date(matched.expiry_date).toLocaleDateString("en-IN")
                        : "N/A";
                    answer = `📦 **${matched.medicine_name}**\n` +
                        `• Company: ${matched.company_name}\n` +
                        `• Quantity: ${matched.quantity} units\n` +
                        `• Price: ₹${matched.price}\n` +
                        `• Batch: ${matched.batch_no || "N/A"}\n` +
                        `• Expiry: ${exp}`;
                } else {
                    answer = `I'm not sure about that. You can ask me:\n` +
                        `• "How many medicines do I have?"\n` +
                        `• "Show low stock medicines"\n` +
                        `• "Show expired medicines"\n` +
                        `• "Total sales"\n` +
                        `• "How many customers?"\n` +
                        `• Medicine name for full details`;
                }
            }

            return res.json({ success: true, answer });

        } catch (error) {
            console.error("Chatbot Error:", error);
            return res.status(500).json({
                success: false,
                message: "Chatbot server error"
            });
        }
    }
);


// =====================================================
// HOME / SERVER TEST ROUTE
// =====================================================

app.get("/health", (req, res) => {
    res.json({ status: "ok", version: "1.3.0", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
    res.json({
        success: true,
        message:
            "MediStock Backend is Live 🚀",
        status: "Running"
    });
});
// SERVER
// =====================================================

// Keep-alive ping — prevents Render free tier from sleeping
// Frontend pings this every 14 minutes
app.get("/ping", (req, res) => {
    res.json({ status: "alive", timestamp: new Date().toISOString() });
});

// Home / health check route
app.get("/", (req, res) => {
    res.json({ success: true, message: "MediStock Backend is Live 🚀", status: "Running" });
});

const PORT = process.env.PORT || 1000;

app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            `Server running on port ${PORT}`
        );
    }
);
