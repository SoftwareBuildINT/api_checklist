const express = require('express');
const mysql = require('mysql2');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const bodyParser = require('body-parser');
const app = express();
const multer = require('multer');
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
// Helper function to send OTP via email
const AWS = require('aws-sdk');
const moment = require('moment');

const ses = new AWS.SES({
  apiVersion: '2010-12-01',
  accessKeyId: 'AKIATNFEXW5ZAMWNGM4Q',
  secretAccessKey: '6KKI3taiLon4Uj3yBkZW7qRirtztirLryULXDjWz',
  region: 'ap-south-1' // Change this to your desired AWS region
});

const jwt = require('jsonwebtoken');
// Create a MySQL database connection
const connection = mysql.createPool({
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
// Routes
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Check if the user exists and the password is correct
  connection.query(
    'SELECT * FROM user_login WHERE username = ? AND password = ?',
    [username, password],
    (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      if (results.length === 0) {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
      }

      // User is authenticated; proceed to step 2 (OTP generation)
      const user = results[0];
      sendOTP(user.email)
        .then(() => {
          res.status(200).json({ message: 'OTP sent to your email for verification' });
        })
        .catch((error) => {
          console.error(error);
          res.status(500).json({ error: 'Internal server error' });
        });
    }
  );
});

// Step 2: OTP Verification and Token Generation
app.post('/verify', (req, res) => {
  const { username, otp } = req.body;
  // Check if the provided OTP matches the one in the database
  connection.query(
    'SELECT * FROM user_login WHERE username = ? AND otp = ?',
    [username, otp],
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
      const otpExpiretime = new Date(results[0].expiration_time);
      if (currentTime < otpExpiretime) {
        // OTP is valid; generate a JWT token
        const user = results[0];
        const token = jwt.sign(
          { id: user.id, email: user.email, role_id: user.role_id },
          'secretkey',
          {
            expiresIn: '1h', // Token expires in 1 hour
          }
        );

        // Update the database with the JWT token
        connection.query(
          'UPDATE user_login SET jwt_token = ? WHERE username = ?',
          [token, username],
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

            res.status(200).json({ token });
          }
        );
      } else {
        res.status(200).json({ error: 'OTP has expired' });
      }
    }
  );
});

function sendOTP(email) {
  return new Promise((resolve, reject) => {
    const otp = randomstring.generate({ length: 6, charset: 'numeric' });
    const otpCreatedAt = new Date();
    const expiration_time = new Date(
      otpCreatedAt.setSeconds(otpCreatedAt.getSeconds() + 120)
    );

    // Save the OTP in the database
    connection.query(
      'UPDATE user_login SET otp = ?, expiration_time = ? WHERE email = ?',
      [otp, expiration_time, email],
      (updateErr) => {
        if (updateErr) {
          reject(updateErr);
          return;
        }

        // Send the OTP via email
        const params = {
          Destination: {
            ToAddresses: [email],
          },
          Message: {
            Body: { Html: { Charset: "UTF-8", Data: `Your OTP for login is: ${otp}` } },
            Subject: { Charset: 'UTF-8', Data: 'Your OTP for login' },
          },
          Source: 'trainee.software@buildint.co', // This should be a verified SES sender email address
        };

        ses.sendEmail(params, (emailErr, data) => {
          if (emailErr) {
            reject(emailErr);
            console.log(emailErr)
          } else {
            resolve();
          }
        });
      }
    );
  });
}

//Routes
app.post('/assest', (req, res) => {
  const {
    atm_id,
    city_name,
    date_of_visit,
    atm_site_address,
    mse_name,
    mse_cnct_no,
    mse_email,
    area,
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
    other_asset_details,
    remarks,
    engg_name,
    latitude,
    longitude,
    engg_cont_no,
    token,
    userName
  } = req.body;

  connection.query(`select jwt_token from user_login where username = "${userName}"`, (err, results) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      return res.status(500).json({ status: 500, message: 'Error inserting data into the database.' });
    } else {
      if (req.body["token"] == results[0]["jwt_token"]) {
        console.log(true)
        const sql = `INSERT INTO atm_asset_report(
                atm_id,
                city_name,
                date_of_visit,
                atm_site_address,
                mse_name,
                mse_cnct_no,
                mse_email,
                area,
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
                other_asset_details,
                remarks,
                engg_name,
                latitude,
                longitude,
                engg_cont_no
              ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

        const values = [
          atm_id,
          city_name,
          date_of_visit,
          atm_site_address,
          mse_name,
          mse_cnct_no,
          mse_email,
          area,
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
          other_asset_details,
          remarks,
          engg_name,
          latitude,
          longitude,
          engg_cont_no
        ];

        connection.query(sql, values, (err, results) => {
          if (err) {
            console.error('Error inserting data into MySQL:', err);
            return res.status(500).json({ status: 500, message: 'Error inserting data into the database.' });
          }

          return res.json({ status: 200, message: 'Item added successfully' });
        });
      } else {
        return res.json({ status: 500, message: 'Invalid Token' });
      }
    }
  });
  // Insert form data into the MySQL database


});


// Routes
app.post('/project', (req, res) => {
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
    token,
    userName,
    engg_cont_no,
  } = req.body;

  connection.query(`select jwt_token from user_login where username = "${userName}"`, (err, results) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      return res.status(500).json({ status: 500, message: 'Error inserting data into the database.' });
    } else {
      if (req.body["token"] == results[0, "jwt_token"]) {
        console.log(true)
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
            return res.status(500).json({ status: 500, message: 'Error inserting data into the database.' });
          }

          return res.json({ status: 200, message: 'Item added successfully' });
        });
      } else {
        return res.json({ status: 500, message: 'Invalid Token' });
      }
    }
  });
  // Insert form data into the MySQL database


});

// Routes
app.post('/baimage', upload.fields([{ name: 'ATMOutdoorPhoto', maxCount: 1 }, { name: 'ACCompressor', maxCount: 1 }, { name: 'DoorPhoto_VisibleSensor', maxCount: 1 }, { name: 'ATMMachine', maxCount: 1 }, { name: 'TempreatureSensorMounting', maxCount: 1 }, { name: 'AtmPanelBackroom', maxCount: 1 }, { name: 'SurviellancePanel', maxCount: 1 }, { name: 'UPS', maxCount: 1 }, { name: 'Batteries', maxCount: 1 }, { name: 'VsatRouter', maxCount: 1 }, { name: 'PorchLight', maxCount: 1 }, { name: 'Signage', maxCount: 1 }, { name: 'iATMBoxMountingPlace', maxCount: 1 }, { name: 'LightPanelLobbyLight', maxCount: 1 }, { name: 'AC1', maxCount: 1 }, { name: 'AC2', maxCount: 1 }]), (req, res) => {

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
  let istDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const sql = `INSERT INTO ba_inst_images(
         AC1, AC2, atm_id,ATMOutdoorPhoto,Signage,ACCompressor,DoorPhoto_VisibleSensor,ATMMachine,TempreatureSensorMounting,
         AtmPanelBackroom,SurviellancePanel,UPS,Batteries,VsatRouter,PorchLight,LightPanelLobbyLight,iATMBoxMountingPlace,atmaddress, created_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const values = [AC1, AC2, atm_id, ATMOutdoorPhoto, Signage, ACCompressor, DoorPhoto_VisibleSensor, ATMMachine, TempreatureSensorMounting,
    AtmPanelBackroom, SurviellancePanel, UPS, Batteries, VsatRouter, PorchLight, LightPanelLobbyLight, iATMBoxMountingPlace, atmaddress, moment(istDate).format("YYYY-MM-DD HH:mm:ss")];
  connection.query(sql, values, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ status: 500, message: 'Error inserting data into the database.' });
    } else {
      return res.json({ status: 200, message: 'Item added successfully', insertId: results["insertId"] });
    }
  })
});

app.get('/api/data', (req, res) => {
  atm_id = 'ATM001'
  const query = `
    SELECT * 
    FROM ba_inst_images
    JOIN atm_asset_report ON ba_inst_images.atm_id = atm_asset_report.atm_id
    JOIN project_engg ON ba_inst_images.atm_id = project_engg.atm_id
    where atm_id=?
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results);
  });
});

function generatePDF(data, project) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({size: [595.28, 955.89]});
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
      doc.font('Times-Bold').fontSize(10).text(moment(row.date_of_visit).format("YYYY-MM-DD") , 345, 165, { width: 160, height: 5, align: 'left' })
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

      doc.rect(50, 330, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('PARTICULAR', 55, 335, { width: 135, height: 20, align: 'center' })
      doc.rect(195, 330, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('CONNECTED', 200, 335, { width: 135, height: 20, align: 'center' })
      doc.rect(340, 330, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('REMARKS', 345, 335, { width: 214, height: 20, align: 'center' })

      doc.rect(50, 360, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('AC1', 55, 365, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 360, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.ac1 == 0 ? 'Not Connected' : 'Connected'), 200, 365, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 360, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text(row.ac1_remark, 345, 365, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 390, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('AC2', 55, 395, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 390, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.ac2 == 0 ? 'Not Connected' : 'Connected'), 200, 395, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 390, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text(row.ac2_remark, 345, 395, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 420, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('Lobby Light', 55, 425, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 420, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.lobby == 0 ? 'Not Connected' : 'Connected'), 200, 425, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 420, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text(row.lobby_remark, 345, 425, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 450, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('Signage', 55, 455, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 450, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.signage == 0 ? 'Not Connected' : 'Connected'), 200, 455, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 450, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text(row.signage_remark, 345, 455, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 480, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('Temprature & Humidity', 55, 485, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 480, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.temp_hum == 0 ? 'Not Connected' : 'Connected'), 200, 485, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 480, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text(row.temp_hum_remark, 345, 485, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 510, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('Door sensor', 55, 515, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 510, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.door_sensor == 0 ? 'Not Connected' : 'Connected'), 200, 515, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 510, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text(row.door_sensor_remark, 345, 515, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 540, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('Earting', 55, 545, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 540, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.earthing == 0 ? 'Not Connected' : 'Connected'), 200, 545, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 540, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text(row.earthing_remark, 345, 545, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 570, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('UPS Charging & Output', 55, 575, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 570, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.ups_charg_op == 0 ? 'Not Connected' : 'Connected'), 200, 575, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 570, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text(row.ups_charg_op_remark, 345, 575, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 600, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('iATM Box', 55, 605, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 600, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.iatm_box == 0 ? 'Not Connected' : 'Connected'), 200, 605, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 600, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text(row.iatm_remark, 345, 605, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 630, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('Router', 55, 635, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 630, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.router == 0 ? 'Not Connected' : 'Connected'), 200, 635, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 630, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text(row.router_remark, 345, 635, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 660, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('Bettery', 55, 665, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 660, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.battery == 0 ? 'Not Connected' : 'Connected'), 200, 665, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 660, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text(row.battery_remark, 345, 665, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 690, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text('ATM Machine', 55, 695, { width: 135, height: 20, align: 'left' })
      doc.rect(195, 690, 145, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text((row.atm_machine == 0 ? 'Not Connected' : 'Connected'), 200, 695, { width: 135, height: 20, align: 'left' })
      doc.rect(340, 690, 224, 30).stroke();
      doc.font('Times-Bold').fontSize(10).text(row.atm_machine_remark, 345, 695, { width: 214, height: 20, align: 'left' })

      doc.rect(50, 720, 514, 50).stroke();
      doc.font('Times-Bold').fontSize(10).text('Remarks: ' + row.remark, 55, 725, { width: 504, height: 40, align: 'left' })
      doc.rect(50, 770, 290, 100).stroke();
      doc.font('Times-Bold').fontSize(10).text('Authorised Signature: ', 55, 775, { width: 504, height: 40, align: 'left' })
      doc.image('./authorised_signature.png', 55, 787, { width: 200, height: 80, align: 'center', valign: 'center' });
      doc.rect(340, 770, 224, 100).stroke();
      doc.font('Times-Bold').fontSize(10).text('Engineer Name: ' + row.engg_name, 345, 775, { width: 504, height: 40, align: 'left' })
      doc.font('Times-Bold').fontSize(10).text('Engineer Number: ' + row.engg_cont_no, 345, 787, { width: 504, height: 40, align: 'left' })
      doc.font('Times-Bold').fontSize(10).text('Signature: ', 345, 799, { width: 504, height: 40, align: 'left' })
      doc.image('./authorised_signature.png', 345, 811, { width: 100, height: 40, align: 'center', valign: 'center' });

    });






    doc.end(); // Finish the PDF document
  });
}




app.get('/generate-pdf', async (req, res) => {
  try {
    // Replace 123 with the specific ATM ID you want to query
    const { atm_asset_report, ba_inst_images, project_engg, after_inst_images } = req.query;

    const query1 = 'SELECT * FROM atm_asset_report WHERE c_id = ?';
    const query2 = 'SELECT * FROM ba_inst_images WHERE c_id = ?';
    const query3 = 'SELECT * FROM project_engg WHERE c_id = ?';
    const query4 = 'SELECT * FROM after_inst_images WHERE c_id = ?';

    const values = [atm_asset_report, ba_inst_images, project_engg, after_inst_images];

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

    const queries = [query1, query2, query3, query4];
    const keys = ['atm_asset_report', 'ba_inst_images', 'project_engg', 'after_inst_images'];

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

// Define the API route for uploading an image

app.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    const image = req.file.buffer;
    const id = 1 // The uploaded image data
    // Assuming you have an 'ba_inst_images' table with 'before_inst_images' column
    const query = (`UPDATE ba_inst_images SET before_inst_images = ? where id = ?`);

    // Execute the query
    connection.query(query, [image, id], (err, results) => {
      if (err) {
        console.error('Error updating image:', err);
        res.status(500).json({ message: 'Image not uploaded successfully', error: err });
      } else {
        console.log('Image uploaded successfully');
        res.status(200).json({ message: 'Image uploaded successfully' });
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
