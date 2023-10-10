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
const storage = multer.memoryStorage();
const upload = multer({ storage });

const jwt = require('jsonwebtoken');
// Create a MySQL database connection
const connection = mysql.createPool({
  host: '3.7.158.221',
  user: 'admin_buildINT',
  password: 'buildINT@2023$',
  database: 'checklist',
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
  db.query(
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
  const { email, otp } = req.body;
  // Check if the provided OTP matches the one in the database
  db.query(
    'SELECT * FROM user_login WHERE email = ? AND otp = ?',
    [email, otp],
    (err, results) => {
      if (err) {
        console.error('Error checking OTP:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      if (results.length === 0) {
        res.status(401).json({ error: 'Invalid OTP' });
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
        db.query(
          'UPDATE user_login SET jwt_token = ? WHERE email = ?',
          [token, email],
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
        res.status(401).json({ error: 'OTP has expired' });
      }
    }
  );
});

// Helper function to send OTP via email
function sendOTP(email) {
  return new Promise((resolve, reject) => {
    const otp = randomstring.generate({ length: 6, charset: 'numeric' });
    const otpCreatedAt = new Date();
    const expiration_time = new Date(
      otpCreatedAt.setSeconds(otpCreatedAt.getSeconds() + 120)
    );

    // Save the OTP in the database
    db.query(
      'UPDATE user_login SET otp = ?, expiration_time = ? WHERE email = ?',
      [otp, expiration_time, email],
      (updateErr) => {
        if (updateErr) {
          reject(updateErr);
        }

        // Send the OTP via email
        const transporter = nodemailer.createTransport({
          host: 'smtp.rediffmailpro.com',
          port: 465,
          secure: true, // for SSL
          auth: {
            user: 'trainee.software@buildint.co',
            pass: 'BuildINT@123',
          },
        });

        const mailOptions = {
          from: 'trainee.software@buildint.co',
          to: email,
          subject: 'Your OTP for Login',
          text: `Your OTP for login is: ${otp}`,
        };

        transporter.sendMail(mailOptions, (emailErr) => {
          if (emailErr) {
            reject(emailErr);
          }

          resolve();
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
            if(req.body["token"] == results[0]["jwt_token"]){
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
            if(req.body["token"] == results[0,"jwt_token"]){
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
app.post('/baimage', upload.fields([{ name: 'ATMOutdoorPhoto', maxCount: 1 },{ name: 'ACCompressor', maxCount: 1 },{ name: 'DoorPhoto_VisibleSensor', maxCount: 1 },{ name: 'ATMMachine', maxCount: 1 },{ name: 'TempreatureSensorMounting', maxCount: 1 },{ name: 'AtmPanelBackroom', maxCount: 1 },{ name: 'SurviellancePanel', maxCount: 1 },{ name: 'UPS', maxCount: 1 },{ name: 'Batteries', maxCount: 1 },{ name: 'VsatRouter', maxCount: 1 },{ name: 'PorchLight', maxCount: 1 },{ name: 'Signage', maxCount: 1 },{ name: 'iATMBoxMountingPlace', maxCount: 1 },{ name: 'LightPanelLobbyLight', maxCount: 1 },{ name: 'AC1', maxCount: 1 }, { name: 'AC2', maxCount: 1 }]), (req, res) => {

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
  const values = [AC1, AC2, atm_id,ATMOutdoorPhoto,Signage,ACCompressor,DoorPhoto_VisibleSensor,ATMMachine,TempreatureSensorMounting,
    AtmPanelBackroom,SurviellancePanel,UPS,Batteries,VsatRouter,PorchLight,LightPanelLobbyLight,iATMBoxMountingPlace,atmaddress];
  connection.query(sql, values, (err, results)=> {
    if(err) {
      console.log(err);
      return res.status(500).json({ status: 500, message: 'Error inserting data into the database.' });
    } else {
      return res.json({ status: 200, message: 'Item added successfully',  insertId: results["insertId"]});
    }
  })
});
  
app.get('/api/data', (req, res) => {
  atm_id='ATM001'
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

function generatePDF(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();

    // Buffer to store PDF data
    const buffers = [];
    doc.on('data', (buffer) => buffers.push(buffer));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // Customize the PDF content as needed
    doc.fontSize(18).text('Data from Database', { align: 'center' });

    data.forEach((row) => {
        doc.image(row.AC1, {
          fit: [250, 300],
          align: 'center',
          valign: 'center'
        });
      // Add a separator between entries
      doc.fontSize(12).text('---');
    });
    data.forEach((row) => {
      doc.image(row.AC2, {
        fit: [250, 300],
        align: 'center',
        valign: 'center'
      });
    // Add a separator between entries
    doc.fontSize(12).text('---');
  });
    doc.end(); // Finish the PDF document
  });
}


app.get('/generate-pdf', async (req, res) => {
  try {
    connection.query(`select * from ba_inst_images`, async (err, results) => {
      if (err) {
        console.error('Error:', err);
        return res.status(500).json({ error: 'Database Error' });
      }

      const data = results;
      if (data.length === 0) {
        return res.status(404).json({ message: 'No data found' });
      }

      const pdfData = await generatePDF(data);

      // Send the generated PDF as a response
      res.setHeader('Content-Disposition', 'attachment; filename="output.pdf"');
      res.setHeader('Content-Type', 'application/pdf');
      res.status(200).end(pdfData);
    });
    
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
