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

  // Check if the user exists
  connection.query('SELECT * FROM user_login WHERE username = ? AND password = ?', [username, password], (err, results) => {
      if (err) {
          console.log(err)
          res.status(500).json({ error: 'Internal server error' });
          return;
      }

      if (results.length === 0) {
          res.status(401).json({ error: 'Invalid username or password' });
          return;
      }

      const user = results[0];

      // User is authenticated; generate a JWT token
      const token = jwt.sign({ id: user.id, username: user.username, role_id: user.role_id }, 'secretkey', {
          expiresIn: '6h', // Token expires in 1 hour
      });
        // Update the database with the JWT token
      connection.query('UPDATE user_login SET jwt_token = ? WHERE username = ?', [token, user.username], (updateErr, updateResults) => {
          if (updateErr) {
              console.log(updateErr);
              res.status(500).json({ error: 'Failed to update JWT token in the database' });
              return;
          }
          
      res.status(200).json({ "token":token});
  });
});
});
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
app.post('/baimage', upload.fields([{ name: 'AC1', maxCount: 1 }, { name: 'AC2', maxCount: 1 }]), (req, res) => {

  // const {
  //   atm_id,
  //   ATMOutdoorPhoto,
  //   Signage,
  //   AC1,
  //   AC2,
  //   ACCompressor,
  //   DoorPhoto_VisibleSensor,
  //   ATMMachine, 
  //   TempreatureSensorMounting ,
  //   AtmPanelBackroom,
  //   SurviellancePanel,
  //   token,
  //   UPS,
  //   Batteries,
  //   VsatRouter,
  //   PorchLight,
  //   LightPanelLobbyLight,
  //   iATMBoxMountingPlace,
  //   atmaddress,
  //   userName
  // } = req.body;
  const AC1 = req.files['AC1'][0].buffer;
  const AC2 = req.files['AC2'][0].buffer;
  const atm_id = req.body.atm_id
  const sql = `INSERT INTO ba_inst_images(
         AC1, AC2, atm_id
          ) VALUES ( ?, ?, ?)`;  
  const values = [AC1, AC2, atm_id];
  connection.query(sql, values, (err, results)=> {
    if(err) {
      console.log(err);
      return res.status(500).json({ status: 500, message: 'Error inserting data into the database.' });
    } else {
      console.log(results);
      return res.json({ status: 200, message: 'Item added successfully' });
    }
  })


//   connection.query(`select jwt_token from user_login where username = "${userName}"`, (err, results) => {
//     console.log(err)
//     if (err) {
          
//           console.error('Error inserting data into MySQL:', err);
//           return res.status(500).json({ status: 500, message: 'Error inserting data into the database.' });
//         } else {
//             if(req.body["token"] == results[0,"jwt_token"]){
//               console.log(true)
//   // Insert form data into the MySQL database
//   const sql = `INSERT INTO ba_inst_images(
//     atm_id,
//     ATMOutdoorPhoto,
//     Signage,
//     AC1,
//     AC2,
//     ACCompressor,
//     DoorPhoto_VisibleSensor,
//     ATMMachine, 
//     TempreatureSensorMounting ,
//     AtmPanelBackroom,
//     SurviellancePanel,
//     token,
//     UPS,
//     Batteries,
//     VsatRouter,
//     PorchLight,
//     LightPanelLobbyLight,
//     iATMBoxMountingPlace,
//     atmaddress,
//     userName
//   ) VALUES ( ?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?,?)`;  
  
//   const values = [
//     atm_id,
//     ATMOutdoorPhoto,
//     Signage,
//     AC1,
//     AC2,
//     ACCompressor,
//     DoorPhoto_VisibleSensor,
//     ATMMachine, 
//     TempreatureSensorMounting ,
//     AtmPanelBackroom,
//     SurviellancePanel,
//     token,
//     UPS,
//     Batteries,
//     VsatRouter,
//     PorchLight,
//     LightPanelLobbyLight,
//     iATMBoxMountingPlace,
//     atmaddress,
//     userName
//   ];
//   connection.query(sql, values, (err, results) => {
//     console.log('sadad',err)
//     if (err) {
      
//       console.error('Error inserting data into MySQL:', err);
//       return res.status(500).json({ status: 500, message: 'Error inserting data into the database.' });
//     }
      
//     return res.json({ status: 200, message: 'Item added successfully' });
//   });
// } else {
//     return res.json({ status: 500, message: 'Invalid Token' }); 
// }
// }
// });
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
        doc.image(row.before_inst_images, {
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
