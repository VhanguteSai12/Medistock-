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
// MEDISTOCK AI CHATBOT
// =====================================================

app.post(
    "/chatbot",
    async (req, res) => {
        try {
            const {
                question,
                user_id
            } = req.body;

            // VALIDATION

            if (
                !question ||
                !question.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Question is required"
                });
            }

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message:
                        "User ID is required"
                });
            }

            // CURRENT DATE

            const [dateResult] =
                await db.promise().query(
                    `SELECT CURDATE() AS today`
                );

            const today =
                dateResult[0].today;

            // LOGGED-IN USER

            const [users] =
                await db.promise().query(
                    `
                    SELECT
                        user_id,
                        name,
                        email
                    FROM users
                    WHERE user_id = ?
                    `,
                    [user_id]
                );

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "User not found"
                });
            }

            const currentUser =
                users[0];

            // MEDICINES

            const [medicines] =
                await db.promise().query(
                    `
                    SELECT
                        medicine_id,
                        medicine_name,
                        company_name,
                        batch_no,
                        expiry_date,
                        quantity,
                        price
                    FROM medicines
                    WHERE user_id = ?
                    ORDER BY medicine_name ASC
                    `,
                    [user_id]
                );

            // CUSTOMERS / BILL ITEMS

            const [customers] =
                await db.promise().query(
                    `
                    SELECT
                        c.customer_item_id,
                        c.invoice_no,
                        c.customer_id,
                        c.customer_name,
                        c.mobile,
                        c.doctor_name,
                        c.medicine_id,
                        m.medicine_name,
                        m.company_name,
                        m.price,
                        c.quantity,
                        c.total_amount,
                        c.visit_date,
                        c.bill_status
                    FROM customers c
                    LEFT JOIN medicines m
                        ON c.medicine_id =
                           m.medicine_id
                    WHERE c.user_id = ?
                    ORDER BY c.visit_date DESC
                    `,
                    [user_id]
                );

            // LOW STOCK

            const lowStockMedicines =
                medicines.filter(
                    medicine =>
                        Number(
                            medicine.quantity
                        ) <= 10
                );

            // EXPIRED MEDICINES

            const expiredMedicines =
                medicines.filter(
                    medicine => {
                        if (
                            !medicine.expiry_date
                        ) {
                            return false;
                        }

                        return (
                            new Date(
                                medicine.expiry_date
                            ) <
                            new Date(today)
                        );
                    }
                );

            // UNIQUE CUSTOMERS

            const uniqueCustomers =
                new Set(
                    customers.map(
                        customer =>
                            customer.customer_id
                    )
                );

            // UNIQUE INVOICES

            const uniqueInvoices =
                new Set(
                    customers
                        .map(
                            customer =>
                                customer.invoice_no
                        )
                        .filter(Boolean)
                );

            // TOTAL SALES

            const totalSales =
                customers.reduce(
                    (total, customer) => {
                        return (
                            total +
                            Number(
                                customer.total_amount ||
                                0
                            )
                        );
                    },
                    0
                );

            // TOTAL MEDICINE STOCK

            const totalMedicineUnits =
                medicines.reduce(
                    (total, medicine) => {
                        return (
                            total +
                            Number(
                                medicine.quantity ||
                                0
                            )
                        );
                    },
                    0
                );

            // MEDISTOCK DATA

            const medistockData = {
                current_user: {
                    user_id:
                        currentUser.user_id,
                    name:
                        currentUser.name,
                    email:
                        currentUser.email
                },

                summary: {
                    total_medicine_types:
                        medicines.length,

                    total_medicine_units:
                        totalMedicineUnits,

                    low_stock_count:
                        lowStockMedicines.length,

                    expired_medicine_count:
                        expiredMedicines.length,

                    total_customers:
                        uniqueCustomers.size,

                    total_invoice_count:
                        uniqueInvoices.size,

                    total_bill_items:
                        customers.length,

                    total_sales:
                        totalSales
                },

                medicines: {
                    all: medicines,

                    low_stock:
                        lowStockMedicines,

                    expired:
                        expiredMedicines
                },

                customers: {
                    all: customers
                },

                invoices: {
                    all: customers
                }
            };

            // SYSTEM PROMPT

            const systemPrompt = `
You are "MediStock Assistant".

You are the personalized AI assistant of the
MediStock Inventory Management System.

The user is currently logged into MediStock.

Your job is to answer ANY natural-language question
related to the MediStock Inventory System.

There is NO fixed question list.

The user can ask the same thing using different
words or sentence structures. Understand the meaning
of the question instead of checking for exact keywords.

==========================================
MEDISTOCK TOPICS
==========================================

You can answer questions about:

- Login
- Registration
- Dashboard
- Medicines
- Medicine stock
- Medicine quantity
- Medicine price
- Medicine company
- Batch number
- Expiry date
- Low stock
- Expired medicines
- Adding medicines
- Editing medicines
- Deleting medicines
- Customers
- Customer details
- Customer history
- Bills
- Invoices
- Invoice details
- Sales
- Total sales
- Searching records
- Profile
- MediStock system usage
- General MediStock functionality

==========================================
IMPORTANT DATA RULES
==========================================

1. The database data below belongs ONLY to the
   CURRENT LOGGED-IN USER.

2. Always answer using the current user's data.

3. NEVER mix data from another user.

4. NEVER invent medicine names, quantities,
   prices, customers, invoices or sales.

5. If the question asks for actual database data,
   use the provided database information.

6. If the requested database information does not
   exist in the provided data, say:

   "This information is not available in your
   MediStock data."

7. If the question is about how to use MediStock,
   answer normally using your knowledge of the
   MediStock system.

8. Understand natural language.

9. For medicine stock questions, use the actual
   quantity from the database.

10. LOW STOCK RULE:
    A medicine is considered low stock when:
    quantity <= 10

11. EXPIRED RULE:
    A medicine is expired when:
    expiry_date < today's date

12. Today's database date is:
    ${today}

13. For count questions, give the correct number.

14. For list questions, give the relevant names.

15. For price questions, give the actual price.

16. For company questions, give the actual company.

17. For expiry questions, give the actual expiry date.

18. For customer questions, use actual database
    information.

19. For invoice questions, use actual invoice data.

20. For sales questions, use actual sales data.

21. Keep answers SHORT and clear.

22. Normally answer in 1-2 sentences.

23. If the user asks for a list, provide a short list.

24. Do not give unnecessary explanations.

==========================================
GENERAL MEDISTOCK KNOWLEDGE
==========================================

Login:
The user can login using the Login page with their
registered credentials.

Register:
A new user can create an account using the Register page.

Add Medicine:
The user can go to Medicines, enter medicine details
and click Add Medicine.

Medicine Management:
The Medicines page allows the user to manage medicine
records and stock.

Customers:
The Customers page is used to enter customer and
medicine/billing information.

History:
The History page displays previous customer/bill records
and allows the user to search history.

Dashboard:
The Dashboard provides an overview of MediStock data.

Profile:
The Profile page contains the logged-in user's information.

==========================================
CURRENT USER DATA
==========================================

${JSON.stringify(medistockData, null, 2)}

==========================================
FINAL INSTRUCTION
==========================================

Answer the user's question directly.

Do not say that you need a fixed question list.

Do not ask the user to provide database data when
the required data is already present above.

Do not invent information.

Keep the response concise.
`;

            // OPENROUTER API

            const response = await fetch(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${process.env.OPENROUTER_API_KEY}`
                    },

                    body: JSON.stringify({
                        model:
                            "openai/gpt-4o-mini",

                        messages: [
                            {
                                role: "system",
                                content:
                                    systemPrompt
                            },
                            {
                                role: "user",
                                content:
                                    question.trim()
                            }
                        ],

                        temperature: 0,

                        max_tokens: 150
                    })
                }
            );

            // OPENROUTER RESPONSE

            const data =
                await response.json();

            // API ERROR

            if (!response.ok) {
                console.log(
                    "OpenRouter Error:",
                    data
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Chatbot AI service error"
                });
            }

            // AI ANSWER

            const answer =
                data?.choices?.[0]
                    ?.message?.content;

            if (!answer) {
                return res.status(500).json({
                    success: false,
                    message:
                        "No answer received from chatbot"
                });
            }

            // SEND ANSWER

            return res.json({
                success: true,
                answer: answer.trim()
            });

        } catch (error) {
            console.error(
                "Chatbot Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Chatbot server error"
            });
        }
    }
);

// =====================================================
// HOME / SERVER TEST ROUTE
// =====================================================

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