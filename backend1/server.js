require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const nodemailer = require("nodemailer");
const db = require("./db");

const app = express();

// =====================================================
// CORS
// =====================================================

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://medistock.saispv2007.workers.dev",
    "https://medistock-frontend.pages.dev"
];

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow Postman, mobile apps and server-to-server requests
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            // Allow Cloudflare Pages and Workers subdomains
            if (
                origin.endsWith(".pages.dev") ||
                origin.endsWith(".workers.dev")
            ) {
                return callback(null, true);
            }

            return callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

app.use(express.json({ limit: "1mb" }));

// =====================================================
// EMAIL TRANSPORTER
// =====================================================

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

// =====================================================
// REGISTER API
// =====================================================

app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const userName = String(name).trim();
        const userEmail = String(email).trim().toLowerCase();

        if (userName.length < 2) {
            return res.status(400).json({
                message: "Name must contain at least 2 characters"
            });
        }

        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

        if (!gmailRegex.test(userEmail)) {
            return res.status(400).json({
                message: "Please enter a valid Gmail address"
            });
        }

        if (String(password).length < 6) {
            return res.status(400).json({
                message: "Password must contain at least 6 characters"
            });
        }

        const checkUser = "SELECT user_id FROM users WHERE email = ?";

        db.query(checkUser, [userEmail], async (err, result) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (result.length > 0) {
                return res.status(409).json({
                    message: "User already exists"
                });
            }

            try {
                const hashPassword = await bcrypt.hash(password, 10);

                const sql = `
                    INSERT INTO users
                    (name, email, password, created_at, updated_at)
                    VALUES (?, ?, ?, NOW(), NOW())
                `;

                db.query(
                    sql,
                    [userName, userEmail, hashPassword],
                    async (insertErr, result) => {
                        if (insertErr) {
                            console.error(
                                "Registration Database Error:",
                                insertErr
                            );

                            return res.status(500).json({
                                message: "Registration failed"
                            });
                        }

                        console.log(
                            "User registered successfully:",
                            userEmail
                        );

                        // Send welcome email
                        try {
                            const fromEmail =
                                process.env.EMAIL_FROM ||
                                process.env.EMAIL_USER ||
                                process.env.SMTP_USER;

                            if (!fromEmail) {
                                return res.status(201).json({
                                    message:
                                        "Registration successful! Confirmation email is not configured."
                                });
                            }

                            const mailOptions = {
                                from: `"MediStock" <${fromEmail}>`,
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
                                            <strong>${userName}</strong>,
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
                                            Thank you for registering with
                                            MediStock.
                                            <br />
                                            <strong>MediStock Team</strong>
                                        </p>
                                    </div>
                                `
                            };

                            await transporter.sendMail(mailOptions);

                            console.log(
                                "Registration email sent to:",
                                userEmail
                            );

                            return res.status(201).json({
                                message:
                                    "Registration successful! A confirmation email has been sent to your inbox."
                            });
                        } catch (emailError) {
                            console.error(
                                "Email sending error:",
                                emailError.message
                            );

                            return res.status(201).json({
                                message:
                                    "Registration successful! Confirmation email could not be sent."
                            });
                        }
                    }
                );
            } catch (error) {
                console.error("Registration Error:", error);

                return res.status(500).json({
                    message: "Registration failed"
                });
            }
        });
    } catch (error) {
        console.error("Register API Error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
});

// =====================================================
// LOGIN API
// =====================================================

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const userEmail = String(email).trim().toLowerCase();

    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [userEmail], async (err, result) => {
        if (err) {
            console.error("Login Database Error:", err);

            return res.status(500).json({
                message:
                    "Database Error: Could not connect to the database"
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        try {
            const user = result[0];

            const match = await bcrypt.compare(
                String(password),
                user.password
            );

            if (!match) {
                return res.status(401).json({
                    message: "Invalid Password"
                });
            }

            return res.json({
                message: "Login Successful",
                user: {
                    user_id: user.user_id,
                    name: user.name,
                    email: user.email
                }
            });
        } catch (error) {
            console.error("Password comparison error:", error);

            return res.status(500).json({
                message: "Login failed"
            });
        }
    });
});

// =====================================================
// DASHBOARD APIs
// =====================================================

// TOTAL CUSTOMERS

app.get("/dashboard/total-customers/:user_id", (req, res) => {
    const { user_id } = req.params;

    const sql = `
        SELECT COUNT(DISTINCT customer_id) AS total_customers
        FROM customers
        WHERE user_id = ?
    `;

    db.query(sql, [user_id], (err, result) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Error fetching total customers"
            });
        }

        res.json({
            total_customers: result[0].total_customers
        });
    });
});

// TOTAL MEDICINES

app.get("/dashboard/total-medicines/:user_id", (req, res) => {
    const { user_id } = req.params;

    const sql = `
        SELECT COUNT(*) AS total_medicines
        FROM medicines
        WHERE user_id = ?
    `;

    db.query(sql, [user_id], (err, result) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Error fetching total medicines"
            });
        }

        res.json({
            total_medicines: result[0].total_medicines
        });
    });
});

// TOTAL INVOICES

app.get("/dashboard/total-invoices/:user_id", (req, res) => {
    const { user_id } = req.params;

    const sql = `
        SELECT COUNT(DISTINCT invoice_no) AS total_invoices
        FROM customers
        WHERE user_id = ?
    `;

    db.query(sql, [user_id], (err, result) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Error fetching total invoices"
            });
        }

        res.json({
            total_invoices: result[0].total_invoices
        });
    });
});

// TOTAL SALES

app.get("/dashboard/total-sales/:user_id", (req, res) => {
    const { user_id } = req.params;

    const sql = `
        SELECT COALESCE(SUM(total_amount), 0) AS total_sales
        FROM customers
        WHERE user_id = ?
    `;

    db.query(sql, [user_id], (err, result) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Error fetching total sales"
            });
        }

        res.json({
            total_sales: result[0].total_sales
        });
    });
});

// LOW STOCK COUNT

app.get("/dashboard/low-stock/:user_id", (req, res) => {
    const { user_id } = req.params;

    const sql = `
        SELECT COUNT(*) AS low_stock
        FROM medicines
        WHERE user_id = ?
        AND quantity <= 10
    `;

    db.query(sql, [user_id], (err, result) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Error fetching low stock medicines"
            });
        }

        res.json({
            low_stock: result[0].low_stock
        });
    });
});

// EXPIRED MEDICINES

app.get("/dashboard/expired-medicines/:user_id", (req, res) => {
    const { user_id } = req.params;

    const sql = `
        SELECT COUNT(*) AS expired_medicines
        FROM medicines
        WHERE user_id = ?
        AND expiry_date < CURDATE()
        AND expiry_date != '0000-00-00'
    `;

    db.query(sql, [user_id], (err, result) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Error fetching expired medicines"
            });
        }

        res.json({
            expired_medicines: result[0].expired_medicines
        });
    });
});

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

    const numericQuantity = Number(quantity);
    const numericPrice = Number(price);

    if (
        !Number.isInteger(numericQuantity) ||
        numericQuantity < 0
    ) {
        return res.status(400).json({
            message: "Quantity must be a valid non-negative number"
        });
    }

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({
            message: "Price must be a valid non-negative number"
        });
    }

    const expiry = new Date(`${expiry_date}T00:00:00`);

    if (Number.isNaN(expiry.getTime())) {
        return res.status(400).json({
            message: "Invalid expiry date"
        });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    db.query(
        sql,
        [
            user_id,
            String(medicine_name).trim(),
            String(company_name).trim(),
            String(batch_no).trim(),
            expiry_date,
            numericQuantity,
            numericPrice
        ],
        (err, result) => {
            if (err) {
                console.error("Add Medicine Error:", err);

                return res.status(500).json({
                    message: "Failed to add medicine",
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Medicine Added Successfully",
                medicine_id: result.insertId
            });
        }
    );
});

// SEARCH MEDICINE

app.get("/medicines/search/:user_id/:name", (req, res) => {
    const { user_id, name } = req.params;

    const searchName = String(name).trim();

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
        WHERE user_id = ?
        AND LOWER(medicine_name) = LOWER(?)
        LIMIT 1
    `;

    db.query(sql, [user_id, searchName], (err, result) => {
        if (err) {
            console.error("Search Medicine Error:", err);

            return res.status(500).json({
                error: err.message
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
    });
});

// LOW STOCK MEDICINES

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
        if (err) {
            console.error(err);

            return res.status(500).json({
                error: err.message
            });
        }

        res.json(result);
    });
});

// GET ALL MEDICINES

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
        WHERE user_id = ?
        ORDER BY medicine_name ASC
    `;

    db.query(sql, [user_id], (err, result) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                error: err.message
            });
        }

        res.json(result);
    });
});

// UPDATE MEDICINE

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

    if (
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

    const numericQuantity = Number(quantity);
    const numericPrice = Number(price);

    if (
        !Number.isInteger(numericQuantity) ||
        numericQuantity < 0
    ) {
        return res.status(400).json({
            message: "Quantity must be a valid non-negative number"
        });
    }

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({
            message: "Price must be a valid non-negative number"
        });
    }

    const expiry = new Date(`${expiry_date}T00:00:00`);

    if (Number.isNaN(expiry.getTime())) {
        return res.status(400).json({
            message: "Invalid expiry date"
        });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
            updated_at = NOW()
        WHERE medicine_id = ?
        AND user_id = ?
    `;

    db.query(
        sql,
        [
            String(medicine_name).trim(),
            String(company_name).trim(),
            String(batch_no).trim(),
            expiry_date,
            numericQuantity,
            numericPrice,
            medicine_id,
            user_id
        ],
        (err, result) => {
            if (err) {
                console.error("Update Medicine Error:", err);

                return res.status(500).json({
                    error: err.message
                });
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

// DELETE MEDICINE

app.delete("/medicines/:user_id/:medicine_id", (req, res) => {
    const { user_id, medicine_id } = req.params;

    const sql = `
        DELETE FROM medicines
        WHERE medicine_id = ?
        AND user_id = ?
    `;

    db.query(sql, [medicine_id, user_id], (err, result) => {
        if (err) {
            console.error("Delete Medicine Error:", err);

            return res.status(500).json({
                error: err.message
            });
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

// =====================================================
// CUSTOMER APIs
// =====================================================

// GET CUSTOMER DETAILS

app.get("/customer/:user_id/:customer_id", (req, res) => {
    const { user_id, customer_id } = req.params;

    const sql = `
        SELECT
            customer_name,
            mobile,
            doctor_name,
            visit_date
        FROM customers
        WHERE user_id = ?
        AND customer_id = ?
        ORDER BY created_at DESC
        LIMIT 1
    `;

    db.query(sql, [user_id, customer_id], (err, result) => {
        if (err) {
            console.error("Customer Error:", err);

            return res.status(500).json({
                error: err.message
            });
        }

        if (result.length === 0) {
            return res.json({
                exists: false
            });
        }

        res.json({
            exists: true,
            customer: result[0]
        });
    });
});

// =====================================================
// GENERATE BILL
// =====================================================

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
        !Array.isArray(items) ||
        items.length === 0
    ) {
        return res.status(400).json({
            success: false,
            message: "All fields are required."
        });
    }

    for (const item of items) {
        if (
            !item.medicine_id ||
            item.quantity === undefined ||
            Number(item.quantity) <= 0 ||
            !Number.isInteger(Number(item.quantity))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid medicine quantity or medicine ID."
            });
        }
    }

    let connection = null;

    try {
        connection = await db.promise().getConnection();

        await connection.beginTransaction();

        // Check customer
        const [customerResult] = await connection.query(
            `
                SELECT customer_name
                FROM customers
                WHERE user_id = ?
                AND customer_id = ?
                LIMIT 1
            `,
            [user_id, customer_id]
        );

        if (customerResult.length > 0) {
            const existingName = String(
                customerResult[0].customer_name
            )
                .trim()
                .toLowerCase();

            const enteredName = String(customer_name)
                .trim()
                .toLowerCase();

            if (existingName !== enteredName) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message:
                        "Customer Name does not match Customer ID."
                });
            }
        }

        // Generate invoice number
        const invoice_no =
            "INV" +
            Date.now() +
            Math.floor(Math.random() * 1000)
                .toString()
                .padStart(3, "0");

        let grandTotal = 0;
        const validatedItems = [];

        // Check medicines and stock
        for (const item of items) {
            const requestedQuantity = Number(item.quantity);

            const [medicineRows] = await connection.query(
                `
                    SELECT
                        medicine_id,
                        medicine_name,
                        price,
                        quantity,
                        expiry_date
                    FROM medicines
                    WHERE medicine_id = ?
                    AND user_id = ?
                    FOR UPDATE
                `,
                [item.medicine_id, user_id]
            );

            if (medicineRows.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    success: false,
                    message: "Medicine Not Found"
                });
            }

            const med = medicineRows[0];

            // Expiry check
            if (med.expiry_date) {
                const expiry = new Date(
                    `${String(med.expiry_date).substring(0, 10)}T00:00:00`
                );

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (
                    !Number.isNaN(expiry.getTime()) &&
                    expiry < today
                ) {
                    await connection.rollback();

                    return res.status(400).json({
                        success: false,
                        message: `${med.medicine_name} is expired`
                    });
                }
            }

            const availableQuantity = Number(med.quantity);

            if (availableQuantity < requestedQuantity) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: `${med.medicine_name} Out Of Stock`
                });
            }

            const price = Number(med.price);
            const total = price * requestedQuantity;

            grandTotal += total;

            validatedItems.push({
                medicine_id: item.medicine_id,
                medicine_name: med.medicine_name,
                price: price,
                quantity: requestedQuantity,
                total: total
            });
        }

        // Insert bill items and decrease stock
        for (const item of validatedItems) {
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
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    invoice_no,
                    customer_id,
                    String(customer_name).trim(),
                    String(mobile).trim(),
                    String(doctor_name).trim(),
                    item.medicine_id,
                    item.quantity,
                    item.total,
                    visit_date,
                    user_id,
                    "CLOSED"
                ]
            );

            const [updateResult] = await connection.query(
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
                    item.quantity,
                    item.medicine_id,
                    user_id,
                    item.quantity
                ]
            );

            if (updateResult.affectedRows === 0) {
                throw new Error(
                    `${item.medicine_name} stock update failed`
                );
            }
        }

        await connection.commit();

        return res.json({
            success: true,
            invoice_no: invoice_no,
            grand_total: Number(grandTotal.toFixed(2)),
            message: "Bill Generated Successfully"
        });
    } catch (err) {
        console.error(
            "Generate Bill Error:",
            err.code || "",
            err.message
        );

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Rollback Error:",
                    rollbackError.message
                );
            }
        }

        return res.status(500).json({
            success: false,
            message:
                "Bill generation failed: " +
                (err.message || "Unknown error")
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// =====================================================
// INVOICE APIs
// =====================================================

// GET INVOICE

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
        if (err) {
            console.error("Invoice Error:", err);

            return res.status(500).json({
                error: err.message
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Invoice Not Found"
            });
        }

        let grand_total = 0;

        result.forEach((item) => {
            grand_total += Number(item.total_amount || 0);
        });

        res.json({
            success: true,
            invoice_no: invoice_no,
            customer_name: result[0].customer_name,
            customer_id: result[0].customer_id,
            mobile: result[0].mobile,
            doctor_name: result[0].doctor_name,
            visit_date: result[0].visit_date,
            medicines: result,
            grand_total: Number(grand_total.toFixed(2))
        });
    });
});

// =====================================================
// CUSTOMER HISTORY
// =====================================================

// SEARCH CUSTOMER HISTORY

app.get(
    "/customers/history/search/:user_id/:keyword",
    (req, res) => {
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
            WHERE user_id = ?
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

        const search = `%${String(keyword).trim()}%`;

        db.query(
            sql,
            [user_id, search, search, search, search],
            (err, result) => {
                if (err) {
                    console.error(
                        "Customer History Search Error:",
                        err
                    );

                    return res.status(500).json({
                        error: err.message
                    });
                }

                res.json(result);
            }
        );
    }
);

// CUSTOMER HISTORY

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
        ORDER BY
            visit_date DESC,
            invoice_no DESC
    `;

    db.query(sql, [user_id], (err, result) => {
        if (err) {
            console.error("Customer History Error:", err);

            return res.status(500).json({
                error: err.message
            });
        }

        res.json(result);
    });
});

// =====================================================
// PROFILE APIs
// =====================================================

// GET PROFILE

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
        if (err) {
            console.error("Profile Error:", err);

            return res.status(500).json({
                error: err.message
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }

        res.json(result[0]);
    });
});

// UPDATE PROFILE

app.put("/profile/:user_id", (req, res) => {
    const { user_id } = req.params;
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({
            message: "All Fields Required"
        });
    }

    const userName = String(name).trim();
    const userEmail = String(email).trim().toLowerCase();

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

    if (!gmailRegex.test(userEmail)) {
        return res.status(400).json({
            message: "Please enter a valid Gmail address"
        });
    }

    const checkEmail = `
        SELECT user_id
        FROM users
        WHERE email = ?
        AND user_id != ?
    `;

    db.query(
        checkEmail,
        [userEmail, user_id],
        (checkErr, existingUsers) => {
            if (checkErr) {
                console.error(checkErr);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (existingUsers.length > 0) {
                return res.status(409).json({
                    message: "Email is already in use"
                });
            }

            const sql = `
                UPDATE users
                SET
                    name = ?,
                    email = ?,
                    updated_at = NOW()
                WHERE user_id = ?
            `;

            db.query(
                sql,
                [userName, userEmail, user_id],
                (err, result) => {
                    if (err) {
                        console.error(
                            "Profile Update Error:",
                            err
                        );

                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({
                            message: "User Not Found"
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
});

// =====================================================
// MEDISTOCK CHATBOT
// =====================================================

app.post("/chatbot", async (req, res) => {
    try {
        const { question, user_id } = req.body;

        if (!question || !String(question).trim()) {
            return res.status(400).json({
                success: false,
                message: "Question is required"
            });
        }

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const q = String(question).trim().toLowerCase();

        // Fetch user
        const [users] = await db.promise().query(
            `
                SELECT user_id, name, email
                FROM users
                WHERE user_id = ?
            `,
            [user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const currentUser = users[0];

        // Fetch medicines
        const [medicines] = await db.promise().query(
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

        // Fetch customers
        const [customers] = await db.promise().query(
            `
                SELECT
                    c.customer_id,
                    c.customer_name,
                    c.mobile,
                    c.doctor_name,
                    c.medicine_id,
                    m.medicine_name,
                    c.quantity,
                    c.total_amount,
                    c.visit_date,
                    c.bill_status,
                    c.invoice_no
                FROM customers c
                LEFT JOIN medicines m
                    ON c.medicine_id = m.medicine_id
                WHERE c.user_id = ?
                ORDER BY c.visit_date DESC
            `,
            [user_id]
        );

        // Computed statistics
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lowStock = medicines.filter(
            (m) => Number(m.quantity) <= 10
        );

        const outOfStock = medicines.filter(
            (m) => Number(m.quantity) === 0
        );

        const expiredMeds = medicines.filter((m) => {
            if (!m.expiry_date) {
                return false;
            }

            const expiry = new Date(
                `${String(m.expiry_date).substring(0, 10)}T00:00:00`
            );

            return !Number.isNaN(expiry.getTime()) && expiry < today;
        });

        const totalUnits = medicines.reduce(
            (sum, medicine) =>
                sum + Number(medicine.quantity || 0),
            0
        );

        const totalSales = customers.reduce(
            (sum, customer) =>
                sum + Number(customer.total_amount || 0),
            0
        );

        const uniqueCusts = new Set(
            customers.map((customer) => customer.customer_id)
        ).size;

        const uniqueInvs = new Set(
            customers
                .map((customer) => customer.invoice_no)
                .filter(Boolean)
        ).size;

        // Intent helper
        const has = (...words) => {
            return words.some((word) => {
                const value = String(word).toLowerCase();

                if (value.includes(" ")) {
                    return q.includes(value);
                }

                const escaped = value.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                );

                return new RegExp(`\\b${escaped}\\b`, "i").test(q);
            });
        };

        // Find medicine mentioned in question
        const matchedMedicine = medicines.find((medicine) =>
            q.includes(
                String(medicine.medicine_name).toLowerCase()
            )
        );

        let answer = null;

        // GREETING

        if (
            has(
                "hi",
                "hello",
                "hey",
                "good morning",
                "good evening",
                "good afternoon",
                "howdy",
                "sup",
                "what's up"
            )
        ) {
            answer = `Hello ${currentUser.name}! 👋 I'm your MediStock Assistant. You can ask me about medicines, stock, customers, sales, expired items, and more!`;
        }

        // THANK YOU

        else if (
            has(
                "thank",
                "thanks",
                "thank you",
                "thx",
                "ty"
            )
        ) {
            answer = `You're welcome, ${currentUser.name}! 😊 Let me know if you need anything else.`;
        }

        // GOODBYE

        else if (
            has(
                "bye",
                "goodbye",
                "see you",
                "exit",
                "logout"
            )
        ) {
            answer = `Goodbye, ${currentUser.name}! 👋 Have a great day!`;
        }

        // HELP

        else if (
            has(
                "who are you",
                "what are you",
                "what can you do",
                "help",
                "what do you know",
                "capabilities"
            )
        ) {
            answer =
                `I'm MediStock Assistant 🤖. I can answer questions about:\n` +
                `• Medicine stock & quantities\n` +
                `• Low stock or expired medicines\n` +
                `• Customer & invoice information\n` +
                `• Sales & billing totals\n` +
                `• Medicine prices & companies`;
        }

        // SPECIFIC MEDICINE QUANTITY

        else if (
            matchedMedicine &&
            has(
                "quantity",
                "stock",
                "how much",
                "how many"
            )
        ) {
            answer = `**${matchedMedicine.medicine_name}** currently has **${matchedMedicine.quantity}** units in stock.`;
        }

        // SPECIFIC MEDICINE PRICE

        else if (
            matchedMedicine &&
            has(
                "price",
                "cost",
                "rate",
                "how much does",
                "how much is"
            )
        ) {
            answer = `**${matchedMedicine.medicine_name}** is priced at **₹${matchedMedicine.price}** per unit.`;
        }

        // SPECIFIC MEDICINE COMPANY

        else if (
            matchedMedicine &&
            has(
                "company",
                "manufacturer",
                "brand",
                "made by",
                "produced by"
            )
        ) {
            answer = `**${matchedMedicine.medicine_name}** is manufactured by **${matchedMedicine.company_name}**.`;
        }

        // SPECIFIC MEDICINE EXPIRY

        else if (
            matchedMedicine &&
            has(
                "expiry",
                "expiry date",
                "expire",
                "expire date",
                "when does",
                "when expire",
                "batch"
            )
        ) {
            const expiryDate = matchedMedicine.expiry_date
                ? new Date(
                      `${String(
                          matchedMedicine.expiry_date
                      ).substring(0, 10)}T00:00:00`
                  ).toLocaleDateString("en-IN")
                : "N/A";

            answer =
                `**${matchedMedicine.medicine_name}** expires on **${expiryDate}** ` +
                `(Batch: ${matchedMedicine.batch_no || "N/A"}).`;
        }

        // TOTAL NUMBER OF MEDICINES

        else if (
            has("how many") &&
            has(
                "medicine",
                "medicines",
                "type",
                "types",
                "item",
                "items",
                "product",
                "products"
            )
        ) {
            answer = `You have **${medicines.length}** medicine type(s) in your inventory.`;
        }

        // TOTAL STOCK

        else if (
            has(
                "total stock",
                "total units",
                "total quantity",
                "all stock",
                "overall stock"
            )
        ) {
            answer = `Your total medicine stock is **${totalUnits}** units across **${medicines.length}** medicine type(s).`;
        }

        // LOW STOCK

        else if (
            has(
                "low stock",
                "low",
                "running out",
                "almost out",
                "reorder",
                "less stock",
                "shortage"
            )
        ) {
            if (lowStock.length === 0) {
                answer =
                    "✅ No medicines are currently low on stock (all above 10 units).";
            } else {
                const list = lowStock
                    .map(
                        (m) =>
                            `• ${m.medicine_name} — ${m.quantity} units`
                    )
                    .join("\n");

                answer =
                    `⚠️ **${lowStock.length}** medicine(s) are low on stock (≤10 units):\n` +
                    list;
            }
        }

        // OUT OF STOCK

        else if (
            has(
                "out of stock",
                "zero stock",
                "no stock",
                "empty",
                "finished"
            )
        ) {
            if (outOfStock.length === 0) {
                answer =
                    "✅ No medicines are currently out of stock.";
            } else {
                const list = outOfStock
                    .map((m) => `• ${m.medicine_name}`)
                    .join("\n");

                answer =
                    `🚫 **${outOfStock.length}** medicine(s) are out of stock:\n` +
                    list;
            }
        }

        // EXPIRED MEDICINES

        else if (
            has(
                "expired",
                "expiry",
                "expire",
                "expiring",
                "past date",
                "old medicine"
            )
        ) {
            if (expiredMeds.length === 0) {
                answer =
                    "✅ No expired medicines found in your inventory.";
            } else {
                const list = expiredMeds
                    .map((m) => {
                        const date = new Date(
                            `${String(
                                m.expiry_date
                            ).substring(0, 10)}T00:00:00`
                        ).toLocaleDateString("en-IN");

                        return `• ${m.medicine_name} — expired on ${date}`;
                    })
                    .join("\n");

                answer =
                    `🔴 **${expiredMeds.length}** expired medicine(s):\n` +
                    list;
            }
        }

        // LIST MEDICINES

        else if (
            has(
                "list",
                "show",
                "all medicines",
                "medicine list",
                "what medicines",
                "which medicines",
                "my medicines"
            ) ||
            (has("all") && has("medicine", "medicines"))
        ) {
            if (medicines.length === 0) {
                answer =
                    "You have no medicines in your inventory yet.";
            } else {
                const list = medicines
                    .slice(0, 15)
                    .map(
                        (m) =>
                            `• ${m.medicine_name} (${m.company_name}) — Qty: ${m.quantity}, ₹${m.price}`
                    )
                    .join("\n");

                const more =
                    medicines.length > 15
                        ? `\n...and ${
                              medicines.length - 15
                          } more.`
                        : "";

                answer =
                    `📋 Your medicines (${medicines.length} total):\n` +
                    list +
                    more;
            }
        }

        // PRICE

        else if (
            has(
                "price",
                "cost",
                "rate",
                "how much does",
                "how much is"
            )
        ) {
            if (matchedMedicine) {
                answer = `**${matchedMedicine.medicine_name}** is priced at **₹${matchedMedicine.price}** per unit.`;
            } else if (medicines.length === 0) {
                answer = "No medicines found in your inventory.";
            } else {
                const list = medicines
                    .slice(0, 10)
                    .map(
                        (m) =>
                            `• ${m.medicine_name} — ₹${m.price}`
                    )
                    .join("\n");

                answer =
                    `Here are some medicine prices:\n${list}`;
            }
        }

        // COMPANY

        else if (
            has(
                "company",
                "manufacturer",
                "brand",
                "made by",
                "produced by"
            )
        ) {
            if (matchedMedicine) {
                answer = `**${matchedMedicine.medicine_name}** is manufactured by **${matchedMedicine.company_name}**.`;
            } else if (medicines.length === 0) {
                answer = "No medicines found.";
            } else {
                const list = medicines
                    .slice(0, 10)
                    .map(
                        (m) =>
                            `• ${m.medicine_name} — ${m.company_name}`
                    )
                    .join("\n");

                answer =
                    `Medicine companies:\n${list}`;
            }
        }

        // EXPIRY

        else if (
            has(
                "expiry date",
                "expire date",
                "when does",
                "when will",
                "when expire",
                "batch"
            )
        ) {
            if (matchedMedicine) {
                const date = matchedMedicine.expiry_date
                    ? new Date(
                          `${String(
                              matchedMedicine.expiry_date
                          ).substring(0, 10)}T00:00:00`
                      ).toLocaleDateString("en-IN")
                    : "N/A";

                answer =
                    `**${matchedMedicine.medicine_name}** expires on **${date}** ` +
                    `(Batch: ${
                        matchedMedicine.batch_no || "N/A"
                    }).`;
            } else {
                answer =
                    "Please mention the medicine name to get its expiry date.";
            }
        }

        // CUSTOMERS

        else if (
            has(
                "customer",
                "customers",
                "patient",
                "patients",
                "client",
                "clients"
            )
        ) {
            if (
                has(
                    "how many",
                    "count",
                    "total",
                    "number"
                )
            ) {
                answer = `You have **${uniqueCusts}** unique customer(s) on record.`;
            } else if (
                has("list", "show", "all", "who")
            ) {
                const names = [
                    ...new Set(
                        customers.map(
                            (customer) =>
                                customer.customer_name
                        )
                    )
                ].slice(0, 15);

                answer =
                    names.length === 0
                        ? "No customers found."
                        : `👥 Customers (${uniqueCusts} total):\n${names
                              .map((name) => `• ${name}`)
                              .join("\n")}`;
            } else {
                answer =
                    `You have **${uniqueCusts}** unique customer(s) and **${uniqueInvs}** invoice(s) on record.`;
            }
        }

        // SALES

        else if (
            has(
                "sales",
                "revenue",
                "total sales",
                "earnings",
                "income",
                "total amount",
                "how much sold",
                "billing"
            )
        ) {
            answer =
                `💰 Total sales: **₹${totalSales.toFixed(
                    2
                )}** from **${uniqueInvs}** invoice(s).`;
        }

        // INVOICES

        else if (
            has("invoice", "invoices", "bill", "bills")
        ) {
            if (
                has(
                    "how many",
                    "count",
                    "total"
                )
            ) {
                answer = `You have **${uniqueInvs}** invoice(s) generated so far.`;
            } else if (
                has("recent", "latest", "last")
            ) {
                const recent = customers.slice(0, 5);

                if (recent.length === 0) {
                    answer = "No invoices found.";
                } else {
                    const list = recent
                        .map(
                            (c) =>
                                `• Invoice ${
                                    c.invoice_no || "N/A"
                                } — ${
                                    c.customer_name
                                }, ₹${c.total_amount}`
                        )
                        .join("\n");

                    answer =
                        `📄 Recent invoices:\n${list}`;
                }
            } else {
                answer =
                    `You have **${uniqueInvs}** invoice(s) with total sales of **₹${totalSales.toFixed(
                        2
                    )}**.`;
            }
        }

        // DASHBOARD

        else if (
            has(
                "dashboard",
                "summary",
                "overview",
                "stats",
                "statistics"
            )
        ) {
            answer =
                `📊 **MediStock Summary for ${currentUser.name}:**\n` +
                `• Medicines: ${medicines.length} types, ${totalUnits} units\n` +
                `• Low stock: ${lowStock.length} medicine(s)\n` +
                `• Expired: ${expiredMeds.length} medicine(s)\n` +
                `• Customers: ${uniqueCusts}\n` +
                `• Invoices: ${uniqueInvs}\n` +
                `• Total sales: ₹${totalSales.toFixed(2)}`;
        }

        // PROFILE

        else if (
            has(
                "my name",
                "who am i",
                "profile",
                "account",
                "my account",
                "my email",
                "logged in as"
            )
        ) {
            answer =
                `You are logged in as **${currentUser.name}** (${currentUser.email}).`;
        }

        // MEDICINE NAME CATCH-ALL

        else if (matchedMedicine) {
            const expiry = matchedMedicine.expiry_date
                ? new Date(
                      `${String(
                          matchedMedicine.expiry_date
                      ).substring(0, 10)}T00:00:00`
                  ).toLocaleDateString("en-IN")
                : "N/A";

            answer =
                `📦 **${matchedMedicine.medicine_name}**\n` +
                `• Company: ${matchedMedicine.company_name}\n` +
                `• Quantity: ${matchedMedicine.quantity} units\n` +
                `• Price: ₹${matchedMedicine.price}\n` +
                `• Batch: ${
                    matchedMedicine.batch_no || "N/A"
                }\n` +
                `• Expiry: ${expiry}`;
        }

        // UNKNOWN QUESTION

        else {
            answer =
                `I'm not sure about that. You can ask me:\n` +
                `• "How many medicines do I have?"\n` +
                `• "Show low stock medicines"\n` +
                `• "Show expired medicines"\n` +
                `• "Total sales"\n` +
                `• "How many customers?"\n` +
                `• "How many Paracetamol do I have?"\n` +
                `• Medicine name for full details`;
        }

        return res.json({
            success: true,
            answer
        });
    } catch (error) {
        console.error("Chatbot Error:", error);

        return res.status(500).json({
            success: false,
            message: "Chatbot server error"
        });
    }
});

// =====================================================
// HEALTH / SERVER TEST
// =====================================================

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        version: "1.5.0",
        timestamp: new Date().toISOString()
    });
});

// PING

app.get("/ping", (req, res) => {
    res.json({
        status: "alive",
        timestamp: new Date().toISOString()
    });
});

// ROOT

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "MediStock Backend is Live 🚀",
        status: "Running"
    });
});

// =====================================================
// SEND EMAIL
// =====================================================

app.post("/send-email", async (req, res) => {
    try {
        const { to, subject, message } = req.body;

        if (!to || !message) {
            return res.status(400).json({
                success: false,
                message: "Recipient and message are required"
            });
        }

        const fromEmail =
            process.env.EMAIL_FROM ||
            process.env.EMAIL_USER ||
            process.env.SMTP_USER;

        if (!fromEmail) {
            return res.status(500).json({
                success: false,
                message: "Email configuration is missing"
            });
        }

        const info = await transporter.sendMail({
            from: `"MediStock" <${fromEmail}>`,
            to: String(to).trim(),
            subject: subject || "MediStock Test Email",
            text: String(message)
        });

        console.log("Email sent:", info.messageId);

        return res.json({
            success: true,
            message: "Email sent successfully"
        });
    } catch (error) {
        console.error("Email error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send email"
        });
    }
});

// =====================================================
// CORS / GENERAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
    console.error("Server Error:", err.message);

    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({
            success: false,
            message: "CORS: Origin not allowed"
        });
    }

    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

// =====================================================
// START SERVER
// =====================================================

const PORT = Number(process.env.PORT) || 1000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`MediStock Backend running on port ${PORT}`);
});