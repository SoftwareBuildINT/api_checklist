const express = require('express');
const mysql = require('mysql2');
const fs = require('fs');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const bodyParser = require('body-parser');
const app = express();
app.use(cors());
const multer = require('multer');
app.set('view engine', 'ejs');
app.use(express.static('public'));
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const storage = multer.memoryStorage();
const upload = multer({ storage });
const jwt = require('jsonwebtoken');
const moment = require('moment');
const AWS = require('aws-sdk');
// const ses = new AWS.SES({
//   apiVersion: '2010-12-01',
//   accessKeyId: 'AKIATNFEXW5ZAMWNGM4Q',
//   secretAccessKey: '6KKI3taiLon4Uj3yBkZW7qRirtztirLryULXDjWz',
//   region: 'ap-south-1' // Change this to your desired AWS region
// });
// Create a MySQL database connection
const connection = mysql.createPool({
  //  host: '3.7.158.221',
  //  user: 'admin_buildINT',
  //  password: 'buildINT@2023$',
  //  database: 'checklist',
  host: '3.7.158.221',
  user: 'admin_buildINT',
  password: 'buildINT@2023$',
  database: 'checklist_uat',


});
// Connect to the MySQL database
connection.getConnection((err) => {
  if (err) {
    console.error('Error connecting to MySQL database: ' + err.message);
    return;
  }
  console.log('Connected to MySQL database');

});

// app.post('/login', (req, res) => {
//   const { contact_num } = req.body;

//   // Check if the user exists based on contact_num
//   connection.query(
//     'SELECT * FROM user_login WHERE contact_num = ?',
//     [contact_num],
//     (err, results) => {
//       if (err) {
//         console.log(err);
//         res.status(500).json({ error: 'Internal server error' });
//         return;
//       }

//       if (results.length === 0) {
//         res.status(200).json({ error: 'Invalid contact number' });
//         return;
//       }

//       // User with the provided contact_num exists; proceed to step 2 (OTP generation)
//       const user = results[0];
//       sendOTP(user.email)
//         .then(() => {
//           res.status(200).json({ message: 'OTP sent to your email for verification' });
//         })
//         .catch((error) => {
//           console.error(error);
//           res.status(500).json({ error: 'Internal server error' });
//         });
//     }
//   );
// });
// Define the sendOTP function
// function sendOTP(email) {

//   console.log(`Sending OTP to ${email}`);
//   // In a real-world scenario, you would send the OTP via email
//   return Promise.resolve(); // Resolve the Promise to mimic successful OTP sending
// }


// app.post('/login', (req, res) => {
//   const { contact_num } = req.body;

//   // Check if the user exists and the password is correct
//   connection.query(
//     'SELECT * FROM user_login WHERE contact_num=?',
//     [contact_num],
//     (err, results) => {
//       if (err) {
//         console.log(err);
//         res.status(500).json({ error: 'Internal server error' });
//         return;
//       }

//       if (results.length === 0) {
//         res.status(401).json({ error: 'Invalid contact_num' });
//         return;
//       }

//       // User is authenticated; proceed to step 2 (OTP generation)
//       const user = results[0];
//       sendOTP(user.email)
//         .then(() => {
//           res.status(200).json({ message: 'OTP sent to your email for verification' });
//         })
//         .catch((error) => {
//           console.error(error);
//           res.status(500).json({ error: 'Internal server error' });
//         });
//     }
//   );
// });
// function sendOTP(email) {
//   return new Promise((resolve, reject) => {
//     const otp = randomstring.generate({ length: 6, charset: 'numeric' });
//     const otpCreatedAt = new Date();
//     const expiration_time = new Date(
//       otpCreatedAt.setSeconds(otpCreatedAt.getSeconds() + 120)
//     );

//     // Save the OTP in the database
//     connection.query(
//       'UPDATE user_login SET otp = ?, expiration_time = ? WHERE email = ?',
//       [otp, expiration_time, email],
//       (updateErr) => {
//         if (updateErr) {
//           reject(updateErr);
//           return;
//         }

//         // Send the OTP via email
//         const params = {
//           Destination: {
//             ToAddresses: [email],
//           },
//           Message: {
//             Body: { Html: { Charset: "UTF-8", Data: `Your OTP for login is: ${otp}` } },
//             Subject: { Charset: 'UTF-8', Data: 'Your OTP for login' },
//           },
//           Source: 'alert@buildint.co', // This should be a verified SES sender email address
//         };

//         ses.sendEmail(params, (emailErr, data) => {
//           if (emailErr) {
//             reject(emailErr);
//             console.log(emailErr)
//           } else {
//             resolve();
//           }
//         });
//       }
//     );
//   });
// }

app.post('/login', (req, res) => {
  const { contact_num } = req.body;

  // Check if the user exists in the database
  const checkQuery = 'SELECT * FROM user_login WHERE contact_num = ?';
  connection.query(checkQuery, [contact_num], (err, results) => {
    if (err) {
      console.error('Error checking user:', err);
      res.status(500).json({ error: 'Internal Server Errorss' });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Assuming email is retrieved from results, modify accordingly if not
    const { email } = results[0]; // Assuming email is retrieved from the first result

    // Generate a random 6-digit OTP
    const otp = randomstring.generate({ length: 6, charset: 'numeric' });

    // Save the OTP in the database
    const updateQuery = 'UPDATE user_login SET otp = ? WHERE email = ?';
    connection.query(updateQuery, [otp, email], (updateErr) => {
      if (updateErr) {
        console.error('Error updating OTP in the database:', updateErr);
        res.status(500).json({ error: 'Internal Server Errorpp' });
        return;
      }
      const transporter = nodemailer.createTransport({
        host: 'smtp.rediffmailpro.com',
        port: 465,  
        secure: true, // for SSL
        auth: {
          user: 'trainee.software@buildint.co',
          pass: 'BuildINT@123',
        },
        tls: {
          // Do not fail on invalid certificates
          rejectUnauthorized: false
        }
      });
      
      const mailOptions = {
        from: 'trainee.software@buildint.co',
        to: email,
        subject: 'Your OTP for Login',
        text: `Your OTP for login is: ${otp}`,
      };

      transporter.sendMail(mailOptions, (emailErr) => {
        if (emailErr) {
          console.error('Error sending email:', emailErr);
          res.status(500).json({ error: 'Internal dddServer Error' });
          return;
        }

        res.status(200).json({ message: 'OTP sent to your email for login' });
      });
    });
  });
});

// Step 2: OTP Verification and Token Generation
app.post('/verify', (req, res) => {
  const { contact_num, otp } = req.body;
  // Check if the provided OTP matches the one in the database
  connection.query(
    'SELECT * FROM user_login WHERE contact_num = ? AND otp = ?',
    [contact_num, otp],
    (err, results) => {
      if (err) {
        console.error('Error checking OTP:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      if (results.length === 0) {
        res.status(200).json({ error: 'Invalid OTP' });
        return;
      }

      const currentTime = new Date(); // get current Time
      const otpExpiretime = new Date(currentTime.getTime() + 5 * 60 * 1000); 
      if (currentTime < otpExpiretime) {
        // OTP is valid; generate a JWT token
        const user = results[0];
        const token = jwt.sign(
          { contact_num: user.contact_num, role: user.role },
          'secretkey',
          {
            expiresIn: '6h', // Token expires in 1 hour
          }
        );

        // Update the database with the JWT token
        connection.query(
          'UPDATE user_login SET jwt_token = ? WHERE contact_num = ?',
          [token, contact_num],
          (updateErr) => {
            if (updateErr) {
              console.error(
                'Error updating JWT token in the database:',
                updateErr
              );
              res.status(500).json({
                error: 'Failed to update JWT token in the database',
              });
              return;
            }

            res.status(200).json({ token, role: results[0].role });
          }
        );
      } else {
        res.status(200).json({ error: 'OTP has expired' });
      }
    }
  );
});

function authenticateToken(req, res, next) {
  // Get the token from the request headers
  const token = req.headers['authorization'];

  if (!token) {
    // Token is missing, return a 401 Unauthorized response
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Verify the token
  jwt.verify(token, 'secretkey', (err, decoded) => {
    if (err) {
      // Token is not valid, return a 403 Forbidden response
      return res.status(403).json({ message: 'Forbidden', 'error': err });
    }
    // Token is valid, you can access user information in `decoded`
    // User information: decoded.id, decoded.email, decoded.role
    req.user = decoded;
    next();
  });
}

// Protected route that requires authentication
app.get('/tokenVerify', authenticateToken, (req, res) => {
  // You can access user information from `req.user`
  res.json({ message: 'Success', 'user_details': req.user });
});

// routes
app.post('/master',authenticateToken, (req, res) => {
  const {
    after_inst_images,
    atm_asset_report,
    ba_inst_images,
    project_engg,
    atm_id,
    m_id
  } = req.body;

  // Use Moment.js to format the current date and time
  const utcDate = new Date()
  const date_time = moment(utcDate).format('YYYY-MM-DD HH:mm:ss');

  // Check if the record already exists in the database based on atm_id
  const selectSql = 'SELECT m_id FROM master WHERE m_id = ?';
  const selectValues = [m_id];

  connection.query(selectSql, selectValues, (selectErr, selectResults) => {
    if (selectErr) {
      console.error('Error checking if the record exists in MySQL:', selectErr);
      return res.status(500).json({ message: 'Error checking the database.' });
    }

    if (selectResults.length === 0) {
      // If no record with the given atm_id exists, insert a new record
      const insertSql = `INSERT INTO master (
        after_inst_images,
        atm_asset_report,
        ba_inst_images,
        project_engg,
        atm_id,
        date_time
      ) VALUES (?, ?, ?, ?, ?, ?)`;

      const insertValues = [
        after_inst_images,
        atm_asset_report,
        ba_inst_images,
        project_engg,
        atm_id,
        date_time,
      ];

      connection.query(insertSql, insertValues, (insertErr, insertResults) => {
        if (insertErr) {
          console.error('Error inserting data into MySQL:', insertErr);
          return res.status(500).json({ message: 'Error inserting data into the database.' });
        }

        return res.json({ message: 'Item added successfully', insertedId: insertResults.insertId });
      });
    } else {
      // If a record with the given atm_id exists, update the existing record
      const updateSql = `UPDATE master SET
        after_inst_images = ?,
        atm_asset_report = ?,
        ba_inst_images = ?,
        project_engg = ?,
        date_time = ?,
        atm_id = ?
      WHERE m_id = ${m_id}`;

      const updateValues = [
        after_inst_images,
        atm_asset_report,
        ba_inst_images,
        project_engg,
        date_time,
        atm_id,
      ];

      connection.query(updateSql, updateValues, (updateErr, updateResults) => {
        if (updateErr) {
          console.error('Error updating data in MySQL:', updateErr);
          return res.status(500).json({ message: 'Error updating data in the database.' });
        }

        return res.json({ message: 'Item updated successfully' });
      });
    }
  });
});

//Routes
app.post('/masterpost',authenticateToken, (req, res) => {
  const { atm_id } = req.body; // Assuming you send JSON data in the request body with atm_id

  const queryAll = `SELECT * FROM master ORDER BY m_id DESC`;
  const queryByAtm = `SELECT * FROM master WHERE atm_id = ? ORDER BY m_id DESC`;

  if (atm_id != null) {
    // If atm_id is provided, execute queryByAtm
    connection.query(queryByAtm, [atm_id], (err, atmResults) => {
      if (err) {
        console.error('Error executing MySQL query:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      res.json({ atmData: atmResults });
    });
  } else {
    // If atm_id is not provided, execute queryAll
    connection.query(queryAll, (err, allResults) => {
      if (err) {
        console.error('Error executing MySQL query:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      res.json({ allData: allResults });
    });
  }
});
//Routes
app.post('/assets', authenticateToken,(req, res) => {
  const {
    atm_id,
    city_name,
    date_of_visit,
    atm_site_address,
    mse_name,
    mse_cnct_no,
    mse_email,
    ac1_type,
    ac1_make_model,
    ac1_qty,
    ac1_capacity,
    ac1_communication,
    ac2_type,
    ac2_make_model,
    ac2_qty,
    ac2_capacity,
    ac2_communication,
    ups_make_model,
    ups_capacity_output,
    ups_total_no_batt,
    ups_batt_voltage,
    elec_sys_sld,
    elec_sys_tot_no_panels,
    light_led,
    light_no_of_lights,
    signage_status,
    signage_timing,
    atm_door_status,
    door_sensor,
    atm_count,
    site_images,
    timer_signage,
    timer_ac1,
    timer_ac2,
    other_asset_details_desc1,
    other_asset_details_desc2,
    details_desc_remarks1,
    details_desc_remarks2,
    area_1,
    area_2,
    remarks,
    engg_name,
    engg_cont_no
  } = req.body;

  // Insert form data into the MySQL database
  const sql = `INSERT INTO atm_asset_report (
    atm_id,
    city_name,
    date_of_visit,
    atm_site_address,
    mse_name,
    mse_cnct_no,
    mse_email,
    ac1_type,
    ac1_make_model,
    ac1_qty,
    ac1_capacity,
    ac1_communication,
    ac2_type,
    ac2_make_model,
    ac2_qty,
    ac2_capacity,
    ac2_communication,
    ups_make_model,
    ups_capacity_output,
    ups_total_no_batt,
    ups_batt_voltage,
    elec_sys_sld,
    elec_sys_tot_no_panels,
    light_led,
    light_no_of_lights,
    signage_status,
    signage_timing,
    atm_door_status,
    door_sensor,
    atm_count,
    site_images,
    timer_signage,
    timer_ac1,
    timer_ac2,
    other_asset_details_desc1,
    other_asset_details_desc2,
    details_desc_remarks1,
    details_desc_remarks2,
    area_1,
    area_2,
    remarks,
    engg_name,
    engg_cont_no
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)`;

  const values = [
    atm_id,
    city_name,
    date_of_visit,
    atm_site_address,
    mse_name,
    mse_cnct_no,
    mse_email,
    ac1_type,
    ac1_make_model,
    ac1_qty,
    ac1_capacity,
    ac1_communication,
    ac2_type,
    ac2_make_model,
    ac2_qty,
    ac2_capacity,
    ac2_communication,
    ups_make_model,
    ups_capacity_output,
    ups_total_no_batt,
    ups_batt_voltage,
    elec_sys_sld,
    elec_sys_tot_no_panels,
    light_led,
    light_no_of_lights,
    signage_status,
    signage_timing,
    atm_door_status,
    door_sensor,
    atm_count,
    site_images,
    timer_signage,
    timer_ac1,
    timer_ac2,
    other_asset_details_desc1,
    other_asset_details_desc2,
    details_desc_remarks1,
    details_desc_remarks2,
    area_1,
    area_2,
    remarks,
    engg_name,
    engg_cont_no
  ];

  connection.query(sql, values, (err, results) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      return res.status(500).json({ message: 'Error inserting data into the database.' });
    }

    return res.json({ message: 'Item added successfully', insertId: results.insertId });
  });
});

app.post('/AssetsUpdate',authenticateToken, (req, res) => {
  const {
    atm_id,
    city_name,
    date_of_visit,
    atm_site_address,
    mse_name,
    mse_cnct_no,
    mse_email,
    ac1_type,
    ac1_make_model,
    ac1_qty,
    ac1_capacity,
    ac1_communication,
    ac2_type,
    ac2_make_model,
    ac2_qty,
    ac2_capacity,
    ac2_communication,
    ups_make_model,
    ups_capacity_output,
    ups_total_no_batt,
    ups_batt_voltage,
    elec_sys_sld,
    elec_sys_tot_no_panels,
    light_led,
    light_no_of_lights,
    signage_status,
    signage_timing,
    atm_door_status,
    door_sensor,
    atm_count,
    site_images,
    timer_signage,
    timer_ac1,
    timer_ac2,
    other_asset_details_desc1,
    other_asset_details_desc2,
    details_desc_remarks1,
    details_desc_remarks2,
    area_1,
    area_2,
    remarks,
    engg_name,
    engg_cont_no,
    c_id
  } = req.body;

  // Insert form data into the MySQL database
  const sql = `UPDATE atm_asset_report
    SET 
    atm_id = ?,
    city_name = ?,
    date_of_visit = ?,
    atm_site_address = ?,
    mse_name = ?,
    mse_cnct_no = ?,
    mse_email = ?,
    ac1_type = ?,
    ac1_make_model = ?,
    ac1_qty = ?,
    ac1_capacity = ?,
    ac1_communication = ?,
    ac2_type = ?,
    ac2_make_model = ?,
    ac2_qty = ?,
    ac2_capacity = ?,
    ac2_communication = ?,
    ups_make_model = ?,
    ups_capacity_output = ?,
    ups_total_no_batt = ?,
    ups_batt_voltage = ?,
    elec_sys_sld = ?,
    elec_sys_tot_no_panels = ?,
    light_led = ?,
    light_no_of_lights = ?,
    signage_status = ?,
    signage_timing = ?,
    atm_door_status = ?,
    door_sensor = ?,
    atm_count = ?,
    site_images = ?,
    timer_signage = ?,
    timer_ac1 = ?,
    timer_ac2 = ?,
    other_asset_details_desc1 = ?,
    other_asset_details_desc2 = ?,
    details_desc_remarks1 = ?,
    details_desc_remarks2 = ?,
    area_1 = ?,
    area_2 = ?,
    remarks = ?,
    engg_name = ?,
    engg_cont_no = ?
  WHERE c_id = ?;`;

  const values = [
    atm_id,
    city_name,
    date_of_visit,
    atm_site_address,
    mse_name,
    mse_cnct_no,
    mse_email,
    ac1_type,
    ac1_make_model,
    ac1_qty,
    ac1_capacity,
    ac1_communication,
    ac2_type,
    ac2_make_model,
    ac2_qty,
    ac2_capacity,
    ac2_communication,
    ups_make_model,
    ups_capacity_output,
    ups_total_no_batt,
    ups_batt_voltage,
    elec_sys_sld,
    elec_sys_tot_no_panels,
    light_led,
    light_no_of_lights,
    signage_status,
    signage_timing,
    atm_door_status,
    door_sensor,
    atm_count,
    site_images,
    timer_signage,
    timer_ac1,
    timer_ac2,
    other_asset_details_desc1,
    other_asset_details_desc2,
    details_desc_remarks1,
    details_desc_remarks2,
    area_1,
    area_2,
    remarks,
    engg_name,
    engg_cont_no,
    c_id
  ];

  connection.query(sql, values, (err, results) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      return res.status(500).json({ message: 'Error inserting data into the database.' });
    }

    return res.json({ message: 'Item added successfully', insertId: results.insertId });
  });
});
// Create an API endpoint to fetch data from the database
app.get('/enggdata',authenticateToken, (req, res) => {
  const query = 'SELECT e_id,engg_name FROM engg_sign ';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Database query error: ' + err);
      res.status(500).json({ error: 'An error occurred while fetching data', insertId: results["insertId"] });
    } else {
      res.json(results);
    }
  });
});


// Routes
app.post('/project',authenticateToken, (req, res) => {
  const {
    location,
    atm_id,
    mse_name,
    site_per_name,
    site_per_cont_no,
    date_of_visit,
    visit_in_time,
    ac1,
    ac1_remark,
    ac2,
    ac2_remark,
    lobby,
    lobby_remark,
    signage,
    signage_remark,
    temp_hum,
    temp_hum_remark,
    door_sensor,
    door_sensor_remark,
    earthing,
    earthing_remark,
    ups_charg_op,
    ups_charg_op_remark,
    iatm_box,
    iatm_remark,
    router,
    router_remark,
    battery,
    battery_remark,
    atm_machine,
    atm_machine_remark,
    visit_out_time,
    issue_resolved,
    remark,
    engg_name,
    engg_cont_no,
  } = req.body;

  // Insert form data into the MySQL database
  const sql = `INSERT INTO project_engg (
    location, atm_id, mse_name, site_per_name, site_per_cont_no,
    date_of_visit, visit_in_time, ac1, ac1_remark, ac2, ac2_remark,
    lobby, lobby_remark, signage, signage_remark, temp_hum, temp_hum_remark,
    door_sensor, door_sensor_remark, earthing, earthing_remark, ups_charg_op,
    ups_charg_op_remark, iatm_box, iatm_remark, router, router_remark,
    battery, battery_remark, atm_machine, atm_machine_remark,
    visit_out_time, issue_resolved, remark, engg_name, engg_cont_no
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?)`;

  const values = [
    location, atm_id, mse_name, site_per_name, site_per_cont_no,
    date_of_visit, visit_in_time, ac1, ac1_remark, ac2, ac2_remark,
    lobby, lobby_remark, signage, signage_remark, temp_hum, temp_hum_remark,
    door_sensor, door_sensor_remark, earthing, earthing_remark, ups_charg_op,
    ups_charg_op_remark, iatm_box, iatm_remark, router, router_remark,
    battery, battery_remark, atm_machine, atm_machine_remark,
    visit_out_time, issue_resolved, remark, engg_name, engg_cont_no
  ];

  connection.query(sql, values, (err, results) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      return res.status(500).json({ message: 'Error inserting data into the database.' });
    }

    return res.json({ message: 'Item added successfully', insertId: results["insertId"] });
  });
});

// Routes 
app.post('/ProjectUpdate',authenticateToken, (req, res) => {
  const {
    location,
    atm_id,
    mse_name,
    site_per_name,
    site_per_cont_no,
    date_of_visit,
    visit_in_time,
    ac1,
    ac1_remark,
    ac2,
    ac2_remark,
    lobby,
    lobby_remark,
    signage,
    signage_remark,
    temp_hum,
    temp_hum_remark,
    door_sensor,
    door_sensor_remark,
    earthing,
    earthing_remark,
    ups_charg_op,
    ups_charg_op_remark,
    iatm_box,
    iatm_remark,
    router,
    router_remark,
    battery,
    battery_remark,
    atm_machine,
    atm_machine_remark,
    visit_out_time,
    issue_resolved,
    remark,
    engg_name,
    engg_cont_no,
    c_id
  } = req.body;

  // Insert form data into the MySQL database
  const sql = `UPDATE project_engg
    SET
      location=?, atm_id=?, mse_name=?, site_per_name=?, site_per_cont_no=?,
      date_of_visit=?, visit_in_time=?, ac1=?, ac1_remark=?, ac2=?, ac2_remark=?,
      lobby=?, lobby_remark=?, signage=?, signage_remark=?, temp_hum=?, temp_hum_remark=?,
      door_sensor=?, door_sensor_remark=?, earthing=?, earthing_remark=?, ups_charg_op=?,
      ups_charg_op_remark=?, iatm_box=?, iatm_remark=?, router=?, router_remark=?,
      battery=?, battery_remark=?, atm_machine=?, atm_machine_remark=?,
      visit_out_time=?, issue_resolved=?, remark=?, engg_name=?, engg_cont_no=?
      WHERE c_id = ?;`;
  const values = [
    location, atm_id, mse_name, site_per_name, site_per_cont_no,
    date_of_visit, visit_in_time, ac1, ac1_remark, ac2, ac2_remark,
    lobby, lobby_remark, signage, signage_remark, temp_hum, temp_hum_remark,
    door_sensor, door_sensor_remark, earthing, earthing_remark, ups_charg_op,
    ups_charg_op_remark, iatm_box, iatm_remark, router, router_remark,
    battery, battery_remark, atm_machine, atm_machine_remark,
    visit_out_time, issue_resolved, remark, engg_name, engg_cont_no, c_id
  ];

  connection.query(sql, values, (err, results) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      return res.status(500).json({ message: 'Error inserting data into the database.' });
    }

    return res.json({ message: 'Item added successfully', insertId: results["insertId"] });
  });
});
// Create an API endpoint to fetch data from the database
app.get('/enggdataproject',authenticateToken, (req, res) => {
  const query = 'SELECT e_id,engg_name,contact_no FROM engg_sign ';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Database query error: ' + err);
      res.status(500).json({ error: 'An error occurred while fetching data', insertId: results["insertId"] });
    } else {
      res.json(results);
    }
  });
});


// before Routes
app.post('/baimage',authenticateToken, upload.fields([{ name: 'ATMOutdoorPhoto', maxCount: 1 }, { name: 'ACCompressor', maxCount: 1 }, { name: 'DoorPhoto_VisibleSensor', maxCount: 1 }, { name: 'ATMMachine', maxCount: 1 }, { name: 'TempreatureSensorMounting', maxCount: 1 }, { name: 'AtmPanelBackroom', maxCount: 1 }, { name: 'SurviellancePanel', maxCount: 1 }, { name: 'UPS', maxCount: 1 }, { name: 'Batteries', maxCount: 1 }, { name: 'VsatRouter', maxCount: 1 }, { name: 'PorchLight', maxCount: 1 }, { name: 'Signage', maxCount: 1 }, { name: 'iATMBoxMountingPlace', maxCount: 1 }, { name: 'LightPanelLobbyLight', maxCount: 1 }, { name: 'AC1', maxCount: 1 }, { name: 'AC2', maxCount: 1 }]), (req, res) => {

  const AC1 = req.files['AC1'][0].buffer;
  const AC2 = req.files['AC2'][0].buffer;
  const ATMOutdoorPhoto = req.files['ATMOutdoorPhoto'][0].buffer;
  const Signage = req.files['Signage'][0].buffer;
  const ACCompressor = req.files['ACCompressor'][0].buffer;
  const DoorPhoto_VisibleSensor = req.files['DoorPhoto_VisibleSensor'][0].buffer;
  const ATMMachine = req.files['ATMMachine'][0].buffer;
  const TempreatureSensorMounting = req.files['TempreatureSensorMounting'][0].buffer;
  const AtmPanelBackroom = req.files['AtmPanelBackroom'][0].buffer;
  const SurviellancePanel = req.files['SurviellancePanel'][0].buffer;
  const UPS = req.files['UPS'][0].buffer;
  const Batteries = req.files['Batteries'][0].buffer;
  const VsatRouter = req.files['VsatRouter'][0].buffer;
  const PorchLight = req.files['PorchLight'][0].buffer;
  const LightPanelLobbyLight = req.files['LightPanelLobbyLight'][0].buffer;
  const iATMBoxMountingPlace = req.files['iATMBoxMountingPlace'][0].buffer;
  const atmaddress = req.body.atmaddress
  const atm_id = req.body.atm_id
  const sql = `INSERT INTO ba_inst_images(
         AC1, AC2, atm_id,ATMOutdoorPhoto,Signage,ACCompressor,DoorPhoto_VisibleSensor,ATMMachine,TempreatureSensorMounting,
         AtmPanelBackroom,SurviellancePanel,UPS,Batteries,VsatRouter,PorchLight,LightPanelLobbyLight,iATMBoxMountingPlace,atmaddress
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const values = [AC1, AC2, atm_id, ATMOutdoorPhoto, Signage, ACCompressor, DoorPhoto_VisibleSensor, ATMMachine, TempreatureSensorMounting,
    AtmPanelBackroom, SurviellancePanel, UPS, Batteries, VsatRouter, PorchLight, LightPanelLobbyLight, iATMBoxMountingPlace, atmaddress];
  connection.query(sql, values, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ status: 500, message: 'Error inserting data into the database.' });
    } else {
      console.log(results);
      return res.json({ status: 200, message: 'Item added successfully', insertId: results["insertId"] });
    }
  })
});

// Routes
app.post('/beforeupdt',authenticateToken, upload.fields([{ name: 'ATMOutdoorPhoto', maxCount: 1 }, { name: 'ACCompressor', maxCount: 1 }, { name: 'DoorPhoto_VisibleSensor', maxCount: 1 }, { name: 'ATMMachine', maxCount: 1 }, { name: 'TempreatureSensorMounting', maxCount: 1 }, { name: 'AtmPanelBackroom', maxCount: 1 }, { name: 'SurviellancePanel', maxCount: 1 }, { name: 'UPS', maxCount: 1 }, { name: 'Batteries', maxCount: 1 }, { name: 'VsatRouter', maxCount: 1 }, { name: 'PorchLight', maxCount: 1 }, { name: 'Signage', maxCount: 1 }, { name: 'iATMBoxMountingPlace', maxCount: 1 }, { name: 'LightPanelLobbyLight', maxCount: 1 }, { name: 'AC1', maxCount: 1 }, { name: 'AC2', maxCount: 1 }]), (req, res) => {

  const AC1 = req.files['AC1'][0].buffer;
  const AC2 = req.files['AC2'][0].buffer;
  const ATMOutdoorPhoto = req.files['ATMOutdoorPhoto'][0].buffer;
  const Signage = req.files['Signage'][0].buffer;
  const ACCompressor = req.files['ACCompressor'][0].buffer;
  const DoorPhoto_VisibleSensor = req.files['DoorPhoto_VisibleSensor'][0].buffer;
  const ATMMachine = req.files['ATMMachine'][0].buffer;
  const TempreatureSensorMounting = req.files['TempreatureSensorMounting'][0].buffer;
  const AtmPanelBackroom = req.files['AtmPanelBackroom'][0].buffer;
  const SurviellancePanel = req.files['SurviellancePanel'][0].buffer;
  const UPS = req.files['UPS'][0].buffer;
  const Batteries = req.files['Batteries'][0].buffer;
  const VsatRouter = req.files['VsatRouter'][0].buffer;
  const PorchLight = req.files['PorchLight'][0].buffer;
  const LightPanelLobbyLight = req.files['LightPanelLobbyLight'][0].buffer;
  const iATMBoxMountingPlace = req.files['iATMBoxMountingPlace'][0].buffer;
  const atmaddress = req.body.atmaddress
  const atm_id = req.body.atm_id
  const c_id = req.body.c_id
  const sql = `UPDATE ba_inst_images 
  SET
  AC1=?, AC2=?, atm_id=?, ATMOutdoorPhoto=?, Signage=?, ACCompressor=?, DoorPhoto_VisibleSensor=?, ATMMachine=?, TempreatureSensorMounting=?,
  AtmPanelBackroom=?, SurviellancePanel=?, UPS=?, Batteries=?, VsatRouter=?, PorchLight=?, LightPanelLobbyLight=?, iATMBoxMountingPlace=?, atmaddress=?
  WHERE c_id=?`;

  const values = [AC1, AC2, atm_id, ATMOutdoorPhoto, Signage, ACCompressor, DoorPhoto_VisibleSensor, ATMMachine, TempreatureSensorMounting,
    AtmPanelBackroom, SurviellancePanel, UPS, Batteries, VsatRouter, PorchLight, LightPanelLobbyLight, iATMBoxMountingPlace, atmaddress, c_id];

  connection.query(sql, values, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ status: 500, message: 'Error inserting data into the database.' });
    } else {
      console.log(results);
      return res.json({ status: 200, message: 'Item added successfully', insertId: results["insertId"] });
    }
  })
});

app.post('/afterimage',authenticateToken, upload.fields([{ name: 'iATMBox', maxCount: 1 }, { name: 'ATMOutdoorPhoto', maxCount: 1 }, { name: 'ACCompressor', maxCount: 1 }, { name: 'DoorPhoto_VisibleSensor', maxCount: 1 }, { name: 'ATMMachine', maxCount: 1 }, { name: 'TempreatureSensorMounting', maxCount: 1 }, { name: 'AtmPanelBackroom', maxCount: 1 }, { name: 'SurviellancePanel', maxCount: 1 }, { name: 'UPS', maxCount: 1 }, { name: 'Batteries', maxCount: 1 }, { name: 'VsatRouter', maxCount: 1 }, { name: 'PorchLight', maxCount: 1 }, { name: 'Signage', maxCount: 1 }, { name: 'LightPanelLobbyLight', maxCount: 1 }, { name: 'AC1', maxCount: 1 }, { name: 'AC2', maxCount: 1 }]), (req, res) => {

  const AC1 = req.files['AC1'][0].buffer;
  const AC2 = req.files['AC2'][0].buffer;
  const ATMOutdoorPhoto = req.files['ATMOutdoorPhoto'][0].buffer;
  const Signage = req.files['Signage'][0].buffer;
  const ACCompressor = req.files['ACCompressor'][0].buffer;
  const DoorPhoto_VisibleSensor = req.files['DoorPhoto_VisibleSensor'][0].buffer;
  const ATMMachine = req.files['ATMMachine'][0].buffer;
  const TempreatureSensorMounting = req.files['TempreatureSensorMounting'][0].buffer;
  const AtmPanelBackroom = req.files['AtmPanelBackroom'][0].buffer;
  const SurviellancePanel = req.files['SurviellancePanel'][0].buffer;
  const UPS = req.files['UPS'][0].buffer;
  const Batteries = req.files['Batteries'][0].buffer;
  const VsatRouter = req.files['VsatRouter'][0].buffer;
  const PorchLight = req.files['PorchLight'][0].buffer;
  const LightPanelLobbyLight = req.files['LightPanelLobbyLight'][0].buffer;
  const iATMBox = req.files['iATMBox'][0].buffer;
  const atmaddress = req.body.atmaddress
  const atm_id = req.body.atm_id
  const sql = `INSERT INTO after_inst_images(
         AC1, AC2, atm_id,ATMOutdoorPhoto,Signage,ACCompressor,DoorPhoto_VisibleSensor,ATMMachine,TempreatureSensorMounting,
         AtmPanelBackroom,SurviellancePanel,iATMBox,UPS,Batteries,VsatRouter,PorchLight,LightPanelLobbyLight,atmaddress
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const values = [AC1, AC2, atm_id, ATMOutdoorPhoto, Signage, ACCompressor, DoorPhoto_VisibleSensor, ATMMachine, TempreatureSensorMounting,
    AtmPanelBackroom, SurviellancePanel, UPS, Batteries, VsatRouter, iATMBox, PorchLight, LightPanelLobbyLight, atmaddress];
  connection.query(sql, values, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ status: 500, message: 'Error inserting data into the database.' });
    } else {
      console.log(results);
      return res.json({ status: 200, message: 'Item added successfully', insertId: results["insertId"] });
    }
  })
});

// Routes
app.post('/afterupdt',authenticateToken, upload.fields([{ name: 'iATMBox', maxCount: 1 }, { name: 'ATMOutdoorPhoto', maxCount: 1 }, { name: 'ACCompressor', maxCount: 1 }, { name: 'DoorPhoto_VisibleSensor', maxCount: 1 }, { name: 'ATMMachine', maxCount: 1 }, { name: 'TempreatureSensorMounting', maxCount: 1 }, { name: 'AtmPanelBackroom', maxCount: 1 }, { name: 'SurviellancePanel', maxCount: 1 }, { name: 'UPS', maxCount: 1 }, { name: 'Batteries', maxCount: 1 }, { name: 'VsatRouter', maxCount: 1 }, { name: 'PorchLight', maxCount: 1 }, { name: 'Signage', maxCount: 1 }, { name: 'LightPanelLobbyLight', maxCount: 1 }, { name: 'AC1', maxCount: 1 }, { name: 'AC2', maxCount: 1 }]), (req, res) => {

  // Extract file buffers
  const AC1 = req.files['AC1'][0].buffer;
  const AC2 = req.files['AC2'][0].buffer;
  const ATMOutdoorPhoto = req.files['ATMOutdoorPhoto'][0].buffer;
  const Signage = req.files['Signage'][0].buffer;
  const ACCompressor = req.files['ACCompressor'][0].buffer;
  const DoorPhoto_VisibleSensor = req.files['DoorPhoto_VisibleSensor'][0].buffer;
  const ATMMachine = req.files['ATMMachine'][0].buffer;
  const TempreatureSensorMounting = req.files['TempreatureSensorMounting'][0].buffer;
  const AtmPanelBackroom = req.files['AtmPanelBackroom'][0].buffer;
  const SurviellancePanel = req.files['SurviellancePanel'][0].buffer;
  const UPS = req.files['UPS'][0].buffer;
  const Batteries = req.files['Batteries'][0].buffer;
  const VsatRouter = req.files['VsatRouter'][0].buffer;
  const PorchLight = req.files['PorchLight'][0].buffer;
  const LightPanelLobbyLight = req.files['LightPanelLobbyLight'][0].buffer;
  const iATMBox = req.files['iATMBox'][0].buffer;

  // Extract form data
  const atmaddress = req.body.atmaddress;
  const atm_id = req.body.atm_id;
  const c_id = req.body.c_id;

  // Construct the SQL query for updating
  const sql = `UPDATE after_inst_images
  SET
  AC1=?, AC2=?, atm_id=?, ATMOutdoorPhoto=?, Signage=?, ACCompressor=?, DoorPhoto_VisibleSensor=?, ATMMachine=?, TempreatureSensorMounting=?,
  AtmPanelBackroom=?, SurviellancePanel=?, iATMBox=?, UPS=?, Batteries=?, VsatRouter=?, PorchLight=?, LightPanelLobbyLight=?, atmaddress=?
  WHERE c_id=?`;

  // Prepare the values array
  const values = [AC1, AC2, atm_id, ATMOutdoorPhoto, Signage, ACCompressor, DoorPhoto_VisibleSensor, ATMMachine, TempreatureSensorMounting,
    AtmPanelBackroom, SurviellancePanel, iATMBox, UPS, Batteries, VsatRouter, PorchLight, LightPanelLobbyLight, atmaddress, c_id];

  // Execute the database update query
  connection.query(sql, values, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ status: 500, message: 'Error updating data in the database.' });
    } else {
      console.log(results);
      return res.json({ status: 200, message: 'Item updated successfully', insertId: results["insertId"] });
    }
  });
});
// app.get('/api/data', (req, res) => {
//   b_id=''
//   const query = `
//     SELECT * 
//     FROM ba_inst_images
//     JOIN atm_asset_report ON ba_inst_images.atm_id = atm_asset_report.atm_id
//     JOIN project_engg ON ba_inst_images.atm_id = project_engg.atm_id
//     where atm_id=?
//   `;

//   connection.query(query, (err, results) => {
//     if (err) {
//       console.error('Error executing MySQL query:', err);
//       res.status(500).json({ error: 'Internal server error' });
//       return;
//     }
//     res.json(results);
//   });
// });

function generatePDFprojectengg(data, project) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [595.28, 955.89] });

    // Buffer to store PDF data
    const buffers = [];
    doc.on('data', (buffer) => buffers.push(buffer));
    doc.on('project', (buffer) => buffers.push(buffer));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    data.project_engg.forEach(row => {
      doc.rect(50, 50, 514, 60).stroke();
      doc.image('./path-to-your-image.jpg', 207, 55, { width: 200, height: 50 });
      doc.rect(50, 110, 514, 50).stroke();
      doc.font('Times-Bold').fontSize(14).text('PROJECT ENGINEER CHECKIST', 55, 115, { width: 504, height: 35, align: 'center' })
      doc.font('Times-Bold').fontSize(10).text('6 Floor, C Wing, Lotus Corporate Park,Off Western Express Highway, Goregaon(East), Mumbai-400063 Contact Number: +917400074047, Email: support@buildint.co', 55, 131, { width: 504, height: 35, align: 'center' })
      doc.rect(50, 160, 290, 15).stroke();
      doc.font('Times-Bold').fontSize(10).text('Date: ', 55, 165, { width: 280, height: 5, align: 'right' })
      doc.rect(340, 160, 224, 15).stroke();
      doc.font('Times-Bold').fontSize(10).text(moment(row.date_of_visit).format("YYYY-MM-DD"), 345, 165, { width: 160, height: 5, align: 'left' })
      doc.rect(50, 175, 290, 50).stroke();
      doc.font('Times-Bold').fontSize(11).text(`Location: ${row.location}`, 55, 185, { width: 280, height: 40, align: 'left' })
      doc.rect(50, 225, 290, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text(`ATM: ${row.atm_id}`, 55, 230, { width: 280, height: 15, align: 'left' })
      doc.rect(50, 245, 290, 70).stroke();
      doc.font('Times-Bold').fontSize(10).text(`MSE: ${row.mse_name}`, 55, 250, { width: 280, height: 78, align: 'left' })
      doc.font('Times-Bold').fontSize(10).text(`Site Person Name: ${row.site_per_name}`, 55, 265, { width: 280, height: 78, align: 'left' })
      doc.font('Times-Bold').fontSize(10).text('Site Person Number: ' + row.site_per_cont_no, 55, 282, { width: 280, height: 78, align: 'left' })
      doc.rect(340, 175, 224, 140).stroke();
      doc.font('Times-Bold').fontSize(10).text('In Time: ' + row.visit_in_time, 345, 180, { width: 160, height: 65, align: 'left' })
      doc.font('Times-Bold').fontSize(10).text('Out Time: ' + row.visit_out_time, 345, 210, { width: 160, height: 65, align: 'left' })
      doc.rect(50, 315, 290, 15).stroke();
      doc.font('Times-Bold').fontSize(10).text('Problems: ', 55, 320, { width: 280, height: 5, align: 'left' })
      doc.rect(340, 315, 224, 15).stroke();
      doc.font('Times-Bold').fontSize(10).text('Issue Resolved', 345, 320, { width: 160, height: 5, align: 'left' })
      //(row.ac1_remark == null ? "" : row.ac1_remark)
      doc.rect(50, 330, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('PARTICULAR', 55, 335, { width: 135, height: 20, align: 'center' })
      doc.rect(195, 330, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('CONNECTED', 200, 335, { width: 135, height: 20, align: 'center' })
      doc.rect(340, 330, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('Remarks', 345, 335, { width: 214, height: 20, align: 'center' })

      doc.rect(50, 360, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('AC1', 55, 365, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 360, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.ac1), 200, 365, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 360, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.ac1_remark == null ? "" : row.ac1_remark), 345, 365, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 390, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('AC2', 55, 395, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 390, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.ac2), 200, 395, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 390, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.ac2_remark == null ? "" : row.ac2_remark), 345, 395, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 420, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('Lobby Light', 55, 425, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 420, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.lobby), 200, 425, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 420, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.lobby_remark == null ? "" : row.lobby_remark), 345, 425, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 450, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('Signage', 55, 455, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 450, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.signage), 200, 455, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 450, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.signage_remark == null ? "" : row.signage_remark), 345, 455, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 480, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('Temprature & Humidity', 55, 485, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 480, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.temp_hum), 200, 485, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 480, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.temp_hum_remark == null ? "" : row.temp_hum_remark), 345, 485, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 510, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('Door sensor', 55, 515, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 510, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.door_sensor), 200, 515, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 510, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.door_sensor_remark == null ? "" : row.door_sensor_remark), 345, 515, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 540, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('Earting', 55, 545, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 540, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.earthing), 200, 545, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 540, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.earthing_remark == null ? "" : row.earthing_remark), 345, 545, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 570, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('UPS Charging & Output', 55, 575, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 570, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.ups_charg_op), 200, 575, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 570, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.ups_charg_op_remark == null ? "" : row.ups_charg_op_remark), 345, 575, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 600, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('iATM Box', 55, 605, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 600, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.iatm_box), 200, 605, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 600, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.iatm_remark == null ? "" : row.iatm_remark), 345, 605, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 630, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('Router', 55, 635, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 630, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.router), 200, 635, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 630, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.router_remark == null ? "" : row.router_remark), 345, 635, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 660, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('Bettery', 55, 665, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 660, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.battery), 200, 665, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 660, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.battery_remark == null ? "" : row.battery_remark), 345, 665, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 690, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('ATM Machine', 55, 695, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 690, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.atm_machine), 200, 695, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 690, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.atm_machine_remark == null ? "" : row.atm_machine_remark), 345, 695, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 720, 514, 50).stroke();
      doc.font('Times-Bold').fontSize(10).text('Remarks: ' + row.remark, 55, 725, { width: 504, height: 40, align: 'left' })
      doc.rect(50, 770, 290, 150).stroke();
      doc.font('Times-Bold').fontSize(10).text('Authorised Signature: ', 55, 775, { width: 504, height: 40, align: 'left' })
      doc.image('./authorised_signature.png', 55, 787, { width: 200, height: 80, align: 'center', valign: 'center' });
    });
    data.engg_sign.forEach((row) => {
      doc.rect(340, 770, 224, 150).stroke();
      doc.font('Times-Bold').fontSize(10).text('Engineer Name: ' + row.engg_name, 345, 775, { width: 504, height: 40, align: 'left' })
      doc.font('Times-Bold').fontSize(10).text('Engineer Number: ' + row.contact_no, 345, 787, { width: 504, height: 40, align: 'left' })
      doc.font('Times-Bold').fontSize(10).text('Signature: ', 345, 799, { width: 504, height: 40, align: 'left' })
      doc.image(row.sign, 391, 848, { width: 100, height: 40 })
    });
    doc.end(); // Finish the PDF document
  });
}


app.get('/generatepdfprojectengg', async (req, res) => {
  try {
    // Replace 123 with the specific ATM ID you want to query
    const { project_engg, engg_sign } = req.query;

    const query3 = 'SELECT * FROM project_engg WHERE c_id = ?';
    const query5 = 'SELECT * FROM engg_sign WHERE engg_name = ?';

    const values = [project_engg, engg_sign];
    const results = {};

    async function executeQuery(query, value, key) {
      return new Promise((resolve, reject) => {
        connection.query(query, value, (err, result) => {
          if (err) {
            reject(err);
          } else {
            results[key] = result;
            resolve();
          }
        });
      });
    }

    const queries = [query3, query5];
    const keys = ['project_engg', 'engg_sign'];

    const promises = [];

    for (let i = 0; i < queries.length; i++) {
      promises.push(executeQuery(queries[i], values[i], keys[i]));
    }

    await Promise.all(promises);
    const data = results;
    if (data.length === 0) {
      return res.status(404).json({ message: 'No data found' });
    }

    const pdfData = await generatePDFprojectengg(data);
    // Send the generated PDF as a response
    res.setHeader('Content-Disposition', 'attachment; filename="output.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    res.status(200).end(pdfData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


function generatePDF(data, project) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [700, 955.89] });

    // Buffer to store PDF data
    const buffers = [];
    doc.on('data', (buffer) => buffers.push(buffer));
    doc.on('project', (buffer) => buffers.push(buffer));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    data.atm_asset_report.forEach(row => {
      // Pipe the PDF to a writable stream (in this case, a file)
      const stream = fs.createWriteStream('output.pdf');
      doc.pipe(stream);
      // firt container and image

      doc.rect(8, 50, 684, 65).stroke();
      doc.image('./path-to-your-image.jpg', 257, 55, { width: 170, height: 35 });
      doc.font('Times-Bold').fontSize(14).text('ASSEST REPORT FOR iATM IOT SOLUTION', 13, 95, { width: 674, height: 60, align: 'center' })
      // second container 
      doc.rect(8, 115, 684, 151).stroke();
      doc.font('Times-Roman').fontSize(12).text('City Name: ' + row.city_name, 13, 120, { width: 674, height: 16, align: 'left' })
      doc.font('Times-Bold').fontSize(12).text('ATM ID : ' + row.atm_id, 13, 137, { width: 674, height: 16, align: 'left' })
      doc.font('Times-Roman').fontSize(12).text('Date: ' + moment(row.date_of_visit).format('DD-MM-YYYY'), 13, 154, { width: 674, height: 16, align: 'left' })
      doc.font('Times-Roman').fontSize(12).text('ATM Site Address: ' + row.atm_site_address, 13, 171, { width: 674, height: 30, align: 'left' })
      doc.font('Times-Roman').fontSize(12).text('MSE Name: ' + row.mse_name, 13, 200, { width: 674, height: 16, align: 'left' })
      doc.font('Times-Roman').fontSize(12).text('MSE Contact Number: ' + row.mse_cnct_no, 13, 217, { width: 674, height: 16, align: 'left' })
      doc.font('Times-Roman').fontSize(12).text('Email ID: ' + row.mse_email, 13, 234, { width: 674, height: 16, align: 'left' })
      doc.font('Times-Bold').fontSize(12).text('HVAC DETAILS ', 13, 251, { width: 674, height: 16, align: 'left' })
      // third container
      doc.rect(8, 266, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('AREA ', 13, 271, { width: 104, height: 10, align: 'left' })
      doc.rect(122, 266, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('AC Type ', 127, 271, { width: 104, height: 10, align: 'left' })
      doc.rect(236, 266, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('Makes & Model ', 241, 271, { width: 104, height: 10, align: 'left' })
      doc.rect(350, 266, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('QTY ', 355, 271, { width: 104, height: 10, align: 'left' })
      doc.rect(464, 266, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('Capacity ', 469, 271, { width: 104, height: 10, align: 'left' })
      doc.rect(578, 266, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('Communication', 583, 271, { width: 104, height: 10, align: 'left' })

      doc.rect(8, 286, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('', 13, 291, { width: 104, height: 10, align: 'left' })
      doc.rect(122, 286, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('' + row.ac1_type, 127, 291, { width: 104, height: 10, align: 'left' })
      doc.rect(236, 286, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('' + row.ac1_make_model, 241, 291, { width: 104, height: 10, align: 'left' })
      doc.rect(350, 286, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('' + row.ac1_qty, 355, 291, { width: 104, height: 10, align: 'left' })
      doc.rect(464, 286, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('' + row.ac1_capacity, 469, 291, { width: 104, height: 10, align: 'left' })
      doc.rect(578, 286, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('' + row.ac1_communication, 583, 291, { width: 104, height: 10, align: 'left' })

      doc.rect(8, 306, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('', 13, 311, { width: 104, height: 10, align: 'left' })
      doc.rect(122, 306, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('' + row.ac2_type, 127, 311, { width: 104, height: 10, align: 'left' })
      doc.rect(236, 306, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('' + row.ac2_make_model, 241, 311, { width: 104, height: 10, align: 'left' })
      doc.rect(350, 306, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('' + row.ac2_qty, 355, 311, { width: 104, height: 10, align: 'left' })
      doc.rect(464, 306, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('' + row.ac2_capacity, 469, 311, { width: 104, height: 10, align: 'left' })
      doc.rect(578, 306, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('' + row.ac2_communication, 583, 311, { width: 104, height: 10, align: 'left' })

      doc.rect(8, 326, 684, 20).stroke();
      doc.rect(8, 346, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('Sr. No.', 13, 351, { width: 104, height: 10, align: 'center' })
      doc.rect(122, 346, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('Items', 127, 351, { width: 104, height: 10, align: 'center' })
      doc.rect(236, 346, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('Description', 241, 351, { width: 104, height: 10, align: 'center' })
      doc.rect(350, 346, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('Remarks', 355, 351, { width: 332, height: 10, align: 'center' })

      doc.rect(8, 366, 114, 100).stroke();
      doc.font('Times-Bold').fontSize(12).text('1', 13, 401, { width: 104, height: 70, align: 'center' })
      doc.rect(122, 366, 114, 100).stroke();
      doc.font('Times-Bold').fontSize(12).text('UPS', 127, 401, { width: 104, height: 70, align: 'center' })

      doc.rect(236, 366, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('Make/Model', 241, 371, { width: 104, height: 10, align: 'left' })
      doc.rect(236, 386, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('Capacity/Output', 241, 391, { width: 104, height: 10, align: 'left' })
      doc.rect(236, 406, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('Total No. of Battries', 241, 411, { width: 104, height: 10, align: 'left' })
      doc.rect(236, 426, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('Battery Voltage', 241, 431, { width: 104, height: 10, align: 'left' })
      doc.rect(236, 446, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('Type Of Batteries', 241, 451, { width: 104, height: 10, align: 'left' })

      doc.rect(350, 366, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('' + row.ups_make_model, 355, 371, { width: 332, height: 10, align: 'left' })
      doc.rect(350, 386, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('' + row.ups_capacity_output, 355, 391, { width: 332, height: 10, align: 'left' })
      doc.rect(350, 406, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('' + row.ups_total_no_batt, 355, 411, { width: 332, height: 10, align: 'left' })
      doc.rect(350, 426, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('' + row.ups_batt_voltage, 355, 431, { width: 332, height: 10, align: 'left' })
      doc.rect(350, 446, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('' + row.types_of_batt, 355, 451, { width: 332, height: 10, align: 'left' })



      doc.rect(8, 466, 114, 40).stroke();
      doc.font('Times-Bold').fontSize(12).text('2', 13, 486, { width: 104, height: 30, align: 'center' })
      doc.rect(122, 466, 114, 40).stroke();
      doc.font('Times-Bold').fontSize(12).text('Electrical System', 127, 481, { width: 104, height: 30, align: 'center' })
      doc.rect(236, 466, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('Electrical SLD', 241, 471, { width: 104, height: 10, align: 'left' })
      doc.rect(236, 486, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('Total No. of Panels', 241, 491, { width: 104, height: 10, align: 'left' })

      doc.rect(350, 466, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('' + row.elec_sys_sld, 355, 471, { width: 332, height: 10, align: 'left' })
      doc.rect(350, 486, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('' + row.elec_sys_tot_no_panels, 355, 491, { width: 332, height: 10, align: 'left' })

      doc.rect(8, 506, 114, 80).stroke();
      doc.font('Times-Bold').fontSize(12).text('3', 13, 536, { width: 104, height: 30, align: 'center' })
      doc.rect(122, 506, 114, 80).stroke();
      doc.font('Times-Bold').fontSize(12).text(' Light', 127, 541, { width: 104, height: 30, align: 'center' })



      doc.rect(236, 506, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('Type', 241, 511, { width: 104, height: 10, align: 'left' })
      doc.rect(236, 526, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('No. of Lights', 241, 531, { width: 104, height: 10, align: 'left' })
      doc.rect(236, 546, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('Lollipop Light', 241, 551, { width: 104, height: 10, align: 'left' })
      doc.rect(236, 566, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('Porch Light', 241, 571, { width: 104, height: 10, align: 'left' })

      doc.rect(350, 506, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('' + row.light_led, 355, 511, { width: 332, height: 10, align: 'left' })
      doc.rect(350, 526, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('' + row.light_no_of_lights, 355, 531, { width: 332, height: 10, align: 'left' })
      doc.rect(350, 546, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('' + row.lollipop_light, 355, 551, { width: 332, height: 10, align: 'left' })
      doc.rect(350, 566, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('' + row.porch_light, 355, 571, { width: 332, height: 10, align: 'left' })


      doc.rect(8, 586, 114, 40).stroke();
      doc.font('Times-Bold').fontSize(12).text('4', 13, 606, { width: 104, height: 30, align: 'center' })
      doc.rect(122, 586, 114, 40).stroke();
      doc.font('Times-Bold').fontSize(12).text(' Signage', 127, 601, { width: 104, height: 30, align: 'center' })
      doc.rect(236, 586, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('Signage Status', 241, 591, { width: 104, height: 10, align: 'left' })
      doc.rect(236, 606, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('Timing', 241, 611, { width: 104, height: 10, align: 'left' })
      doc.rect(350, 586, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('' + row.signage_status, 355, 591, { width: 332, height: 10, align: 'left' })
      doc.rect(350, 606, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('' + row.signage_timing, 355, 611, { width: 332, height: 10, align: 'left' })



      doc.rect(8, 626, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('5', 13, 631, { width: 104, height: 10, align: 'center' })
      doc.rect(122, 626, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text(' ATM Door Stopper', 127, 631, { width: 104, height: 30, align: 'center' })
      doc.rect(236, 626, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('Door Sensor Available', 241, 631, { width: 104, height: 10, align: 'left' })
      doc.rect(350, 626, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('' + row.atm_door_status, 355, 631, { width: 332, height: 10, align: 'left' })



      doc.rect(8, 646, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('6', 13, 651, { width: 104, height: 10, align: 'center' })
      doc.rect(122, 646, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text(' Door Sensor', 127, 651, { width: 104, height: 10, align: 'center' })
      doc.rect(236, 646, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('Yes/No', 241, 651, { width: 104, height: 10, align: 'left' })
      doc.rect(350, 646, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('' + row.door_sensor, 355, 651, { width: 332, height: 10, align: 'left' })


      doc.rect(8, 666, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('7', 13, 671, { width: 104, height: 10, align: 'center' })
      doc.rect(122, 666, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('ATM', 127, 671, { width: 104, height: 10, align: 'center' })
      doc.rect(236, 666, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('ATM Count', 241, 671, { width: 104, height: 10, align: 'left' })
      doc.rect(350, 666, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('' + row.atm_count, 355, 671, { width: 332, height: 10, align: 'left' })


      doc.rect(8, 686, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text('8', 13, 691, { width: 104, height: 10, align: 'center' })
      doc.rect(122, 686, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(12).text(' Site Images', 127, 691, { width: 104, height: 10, align: 'center' })
      doc.rect(236, 686, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('Yes/No', 241, 691, { width: 104, height: 10, align: 'left' })
      doc.rect(350, 686, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('' + row.site_images, 355, 691, { width: 332, height: 10, align: 'left' })


      doc.rect(8, 706, 114, 40).stroke();
      doc.font('Times-Bold').fontSize(12).text('9', 13, 716, { width: 104, height: 30, align: 'center' })
      doc.rect(122, 706, 114, 40).stroke();
      doc.font('Times-Bold').fontSize(12).text('Timer', 127, 716, { width: 104, height: 30, align: 'center' })
      doc.rect(236, 706, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('Singage-Digital/Analog', 241, 711, { width: 104, height: 10, align: 'left' })
      doc.rect(236, 726, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('AC Timer-Dig/Ana', 241, 731, { width: 104, height: 10, align: 'left' })
      doc.rect(350, 706, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('' + row.timer_signage, 355, 711, { width: 332, height: 10, align: 'left' })
      doc.rect(350, 726, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text('' + row.timer_ac1, 355, 731, { width: 332, height: 10, align: 'left' })

      doc.rect(8, 746, 114, 40).stroke();
      doc.font('Times-Bold').fontSize(12).text('10', 13, 761, { width: 104, height: 30, align: 'center' })
      doc.rect(122, 746, 114, 40).stroke();
      doc.font('Times-Bold').fontSize(12).text('Other Assest Details', 127, 761, { width: 104, height: 30, align: 'center' })
      doc.rect(236, 746, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text(row.other_asset_details_desc1, 241, 751, { width: 104, height: 10, align: 'left' })
      doc.rect(236, 766, 114, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text(row.other_asset_details_desc2, 241, 751, { width: 104, height: 10, align: 'left' })
      doc.rect(350, 746, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text(row.details_desc_remarks1, 355, 691, { width: 332, height: 10, align: 'left' })
      doc.rect(350, 766, 342, 20).stroke();
      doc.font('Times-Bold').fontSize(10).text(row.details_desc_remarks2, 355, 711, { width: 332, height: 10, align: 'left' })

      // problem pending

      doc.rect(8, 786, 684, 150).stroke();
      doc.font('Times-Bold').fontSize(12).text('Remarks:  ' + row.remarks, 13, 791, { width: 504, height: 141, align: 'left' })
      //doc.rect(50, 806, 290, 150).stroke();
      doc.font('Times-Bold').fontSize(12).text('Authorized Signature: ', 13, 841, { width: 504, height: 141, align: 'left' })
      doc.image('./authorised_signature.png', 55, 861, { width: 100, height: 40, align: 'center', valign: 'center' });
    });
    data.engg_sign.forEach((row) => {
      doc.font('Times-Bold').fontSize(12).text('Engineer Name: ' + row.engg_name, 345, 841, { width: 504, height: 141, align: 'left' })
      doc.font('Times-Bold').fontSize(12).text('Engineer No.: ' + row.contact_no, 345, 861, { width: 504, height: 141, align: 'left' })
      doc.font('Times-Bold').fontSize(12).text('Signature:', 345, 881, { width: 342, height: 141, align: 'left' })
      doc.image(row.sign, 405, 875, { width: 100, height: 40 })
    });

    doc.addPage();
    doc.fontSize(18).text('BEFORE INSTALLATION IMAGES', { align: 'center' });

    data.ba_inst_images.forEach((row) => {
      doc.image(row.DoorPhoto_VisibleSensor, { width: 300 }).fillColor('white').text('.').fillColor('black').text('DoorPhoto_VisibleSensor').fillColor('white').text('.').fillColor('white').text('');
      doc.image(row.ATMOutdoorPhoto, { width: 300 }).fillColor('white').text('.').fillColor('black').text('ATMOutdoorPhoto').fillColor('white').text('.').fillColor('white').text('');
      doc.image(row.Signage, { width: 300 }).fillColor('white').text('.').fillColor('black').text('Signage').fillColor('white').text('.').fillColor('white').text('');
      doc.addPage();
      doc.image(row.AC1, { width: 300 }).fillColor('white').text('.').fillColor('black').text('AC1').fillColor('white').text('.').fillColor('white').text('');
      doc.image(row.AC2, { width: 300 }).fillColor('white').text('.').fillColor('black').text('AC2').fillColor('white').text('.').fillColor('white').text('');
      doc.image(row.ACCompressor, { width: 300 }).fillColor('white').text('.').fillColor('black').text('ACCompressor').fillColor('white').text('.').fillColor('white').text('');
      doc.addPage();
      doc.image(row.ATMMachine, { width: 300 }).fillColor('white').text('.').fillColor('black').text('ATMMachine').fillColor('white').text('.').fillColor('white').text('');
      doc.image(row.TempreatureSensorMounting, { width: 300 }).fillColor('white').text('.').fillColor('black').text('TempreatureSensorMounting').fillColor('white').text('.').fillColor('white').text('');
      doc.image(row.AtmPanelBackroom, { width: 300 }).fillColor('white').text('.').fillColor('black').text('AtmPanelBackroom').fillColor('white').text('.').fillColor('white').text('');
      doc.addPage();
      doc.image(row.SurviellancePanel, { width: 300 }).fillColor('white').text('.').fillColor('black').text('SurviellancePanel').fillColor('white').text('.').fillColor('white').text('');
      doc.image(row.UPS, { width: 300 }).fillColor('white').text('.').fillColor('black').text('UPS').fillColor('white').text('.').fillColor('white').text('');
      doc.image(row.Batteries, { width: 300 }).fillColor('white').text('.').fillColor('black').text('Batteries').fillColor('white').text('.').fillColor('white').text('');
      doc.addPage();
      doc.image(row.VsatRouter, { width: 300 }).fillColor('white').text('.').fillColor('black').text('VsatRouter').fillColor('white').text('.').fillColor('white').text('');
      doc.image(row.PorchLight, { width: 300 }).fillColor('white').text('.').fillColor('black').text('PorchLight').fillColor('white').text('.').fillColor('white').text('');
      doc.image(row.LightPanelLobbyLight, { width: 300 }).fillColor('white').text('.').fillColor('black').text('LightPanelLobbyLight').fillColor('white').text('.').fillColor('white').text('');
      doc.addPage();
      doc.image(row.iATMBoxMountingPlace, { width: 300 }).fillColor('white').text('.').fillColor('black').text('iATMBoxMountingPlace').fillColor('white').text('.').fillColor('white').text('');

    });

    doc.addPage();
    data.after_inst_images.forEach((row) => {
      doc.fontSize(18).text('AFTER INSTALLATION IMAGES', { align: 'center' });

      // doc.image(row.iATMBoxMountingPlace, {width:300}).text('Proportional to width', 0, 0);
      // doc.image(row.iATMBoxMountingPlace, {width:300}).text('Proportional to width', 0, 0);
      doc.image(row.DoorPhoto_VisibleSensor, { width: 300 }).fillColor('white').text('.').fillColor('black').text('DoorPhoto_VisibleSensor').fillColor('white').text('.').fillColor('white').text('');
      doc.image(row.ATMOutdoorPhoto, { width: 300 }).fillColor('white').text('.').fillColor('black').text('ATMOutdoorPhoto').fillColor('white').text('.').fillColor('white').text('');
      doc.image(row.Signage, { width: 300 }).fillColor('white').text('.').fillColor('black').text('Signage').fillColor('white').text('.').fillColor('white').text('');
      doc.addPage();
      doc.image(row.AC1, { width: 300 }).fillColor('white').text('.').fillColor('black').text('AC1').fillColor('white').text('.').fillColor('white').text('');
      doc.image(row.AC2, { width: 300 }).fillColor('white').text('.').fillColor('black').text('AC2').fillColor('white').text('.').fillColor('white').text('');
      doc.image(row.ACCompressor, { width: 300 }).fillColor('white').text('.').fillColor('black').text('ACCompressor').fillColor('white').text('.').fillColor('white').text('');
      doc.addPage();
      doc.image(row.ATMMachine, { width: 300 }).fillColor('white').text('.').fillColor('black').text('ATMMachine').fillColor('white').text('.').fillColor('white').text('');
      doc.image(row.TempreatureSensorMounting, { width: 300 }).fillColor('white').text('.').fillColor('black').text('TempreatureSensorMounting').fillColor('white').text('.').fillColor('white').text('');
      doc.image(row.AtmPanelBackroom, { width: 300 }).fillColor('white').text('.').fillColor('black').text('AtmPanelBackroom').fillColor('white').text('.').fillColor('white').text('');
      doc.addPage();
      doc.image(row.SurviellancePanel, { width: 300 }).fillColor('white').text('.').fillColor('black').text('SurviellancePanel').fillColor('white').text('.').fillColor('white').text('');
      doc.image(row.UPS, { width: 300 }).fillColor('white').text('.').fillColor('black').text('UPS').fillColor('white').text('.').fillColor('white').text('');
      doc.image(row.Batteries, { width: 300 }).fillColor('white').text('.').fillColor('black').text('Batteries').fillColor('white').text('.').fillColor('white').text('');
      doc.addPage();
      doc.image(row.VsatRouter, { width: 300 }).fillColor('white').text('.').fillColor('black').text('VsatRouter').fillColor('white').text('.').fillColor('white').text('');
      doc.image(row.PorchLight, { width: 300 }).fillColor('white').text('.').fillColor('black').text('PorchLight').fillColor('white').text('.').fillColor('white').text('');
      doc.image(row.LightPanelLobbyLight, { width: 300 }).fillColor('white').text('.').fillColor('black').text('LightPanelLobbyLight').fillColor('white').text('.').fillColor('white').text('');
      doc.addPage();
      doc.image(row.iATMBox, { width: 300 }).fillColor('white').text('.').fillColor('black').text('iATMBox').fillColor('white').text('.').fillColor('white').text('');
    });
    doc.end(); // Finish the PDF document
  });
}


app.get('/generatepdfassest', async (req, res) => {
  try {
    // Replace 123 with the specific ATM ID you want to query
    const { atm_asset_report, ba_inst_images, after_inst_images, engg_sign } = req.query;

    const query1 = 'SELECT * FROM atm_asset_report WHERE c_id = ?';
    const query2 = 'SELECT * FROM ba_inst_images WHERE c_id = ?';
    const query4 = 'SELECT * FROM after_inst_images WHERE c_id = ?';
    const query5 = 'SELECT * FROM engg_sign WHERE engg_name = ?';

    const values = [atm_asset_report, ba_inst_images, after_inst_images, engg_sign];

    const results = {};

    async function executeQuery(query, value, key) {
      return new Promise((resolve, reject) => {
        connection.query(query, value, (err, result) => {
          if (err) {
            reject(err);
          } else {
            results[key] = result;
            resolve();
          }
        });
      });
    }

    const queries = [query1, query2, query4, query5];
    const keys = ['atm_asset_report', 'ba_inst_images', 'after_inst_images', 'engg_sign'];

    const promises = [];

    for (let i = 0; i < queries.length; i++) {
      promises.push(executeQuery(queries[i], values[i], keys[i]));
    }

    await Promise.all(promises);
    const data = results;
    if (data.length === 0) {
      return res.status(404).json({ message: 'No data found' });
    }

    const pdfData = await generatePDF(data);
    // Send the generated PDF as a response
    res.setHeader('Content-Disposition', 'attachment; filename="output.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    res.status(200).end(pdfData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Start the server
const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
//***************************************************Revisit************************************************

// Routes 
app.post('/updtRevisit-Project', authenticateToken, (req, res) => {
  const {
    location, atm_id, mse_name, site_per_name, site_per_cont_no,
    date_of_visit, visit_in_time, ac1, ac1_remark, ac2, ac2_remark,
    lobby, lobby_remark, signage, signage_remark, temp_hum, temp_hum_remark,
    door_sensor, door_sensor_remark, earthing, earthing_remark, ups_charg_op,
    ups_charg_op_remark, iatm_box, iatm_remark, router, router_remark,
    battery, battery_remark, atm_machine, atm_machine_remark,
    visit_out_time, issue_resolved, remark, engg_name, engg_cont_no,
    ServiceSupportName, c_id
  } = req.body;

  const sql = `UPDATE Revisiteng SET
    location=?, atm_id=?, mse_name=?, site_per_name=?, site_per_cont_no=?,
    date_of_visit=?, visit_in_time=?, ac1=?, ac1_remark=?, ac2=?, ac2_remark=?,
    lobby=?, lobby_remark=?, signage=?, signage_remark=?, temp_hum=?, temp_hum_remark=?,
    door_sensor=?, door_sensor_remark=?, earthing=?, earthing_remark=?, ups_charg_op=?,
    ups_charg_op_remark=?, iatm_box=?, iatm_remark=?, router=?, router_remark=?,
    battery=?, battery_remark=?, atm_machine=?, atm_machine_remark=?,
    visit_out_time=?, issue_resolved=?, remark=?, engg_name=?, engg_cont_no=?, ServiceSupportName=?
    WHERE c_id = ?;`;

  const values = Object.values(req.body).concat(c_id);

  connection.query(sql, values, (err, results) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      return res.status(500).json({ message: 'Error inserting data into the database.' });
    }

    return res.json({ message: 'Item update successfully', insertId: results["insertId"] });
  });
});
app.post('/Revisit-Project',authenticateToken, (req, res) => {
  const {
    location,
    atm_id,
    mse_name,
    site_per_name,
    site_per_cont_no,
    date_of_visit,
    visit_in_time,
    ac1,
    ac1_remark,
    ac2,
    ac2_remark,
    lobby,
    lobby_remark,
    signage,
    signage_remark,
    temp_hum,
    temp_hum_remark,
    door_sensor,
    door_sensor_remark,
    earthing,
    earthing_remark,
    ups_charg_op,
    ups_charg_op_remark,
    iatm_box,
    iatm_remark,
    router,
    router_remark,
    battery,
    battery_remark,
    atm_machine,
    atm_machine_remark,
    visit_out_time,
    issue_resolved,
    remark,
    engg_name,
    engg_cont_no,
    ServiceSupportName
  } = req.body;

  // Insert form data into the MySQL database
  const sql = `INSERT INTO Revisiteng (
    location, atm_id, mse_name, site_per_name, site_per_cont_no,
    date_of_visit, visit_in_time, ac1, ac1_remark, ac2, ac2_remark,
    lobby, lobby_remark, signage, signage_remark, temp_hum, temp_hum_remark,
    door_sensor, door_sensor_remark, earthing, earthing_remark, ups_charg_op,
    ups_charg_op_remark, iatm_box, iatm_remark, router, router_remark,
    battery, battery_remark, atm_machine, atm_machine_remark,
    visit_out_time, issue_resolved, remark, engg_name, engg_cont_no,ServiceSupportName
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?)`;

  const values = [
    location, atm_id, mse_name, site_per_name, site_per_cont_no,
    date_of_visit, visit_in_time, ac1, ac1_remark, ac2, ac2_remark,
    lobby, lobby_remark, signage, signage_remark, temp_hum, temp_hum_remark,
    door_sensor, door_sensor_remark, earthing, earthing_remark, ups_charg_op,
    ups_charg_op_remark, iatm_box, iatm_remark, router, router_remark,
    battery, battery_remark, atm_machine, atm_machine_remark,
    visit_out_time, issue_resolved, remark, engg_name, engg_cont_no,ServiceSupportName
  ];

  connection.query(sql, values, (err, results) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      return res.status(500).json({ message: 'Error inserting data into the database.' });
    }

    return res.json({ message: 'Item added successfully', insertId: results["insertId"] });
  });
});