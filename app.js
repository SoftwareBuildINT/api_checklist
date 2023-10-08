const express = require('express');
const mysql = require('mysql2/promise');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const bodyParser = require('body-parser');
const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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
app.post('/baimage', (req, res) => {
  const {
    atm_id,
    city_name,
    date_of_visit,
    atm_site_address,
    mse_name,
    mse_cnct_no,
    mse_email,
    before_inst_images, 
    after_inst_images ,
    remarks,
    engg_name,
    token,
    userName,
    engg_cont_no
  } = req.body;
  connection.query(`select jwt_token from user_login where username = "${userName}"`, (err, results) => {
    if (err) {
          console.error('Error inserting data into MySQL:', err);
          return res.status(500).json({ status: 500, message: 'Error inserting data into the database.' });
        } else {
            if(req.body["token"] == results[0,"jwt_token"]){
              console.log(true)
  // Insert form data into the MySQL database
  const sql = `INSERT INTO ba_inst_images(
    atm_id,
    city_name,
    date_of_visit,
    atm_site_address,
    mse_name,
    mse_cnct_no,
    mse_email,
    before_inst_images, 
    after_inst_images ,
    remarks,
    engg_name,
    engg_cont_no
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;  
  
  const values = [
    atm_id,
    city_name,
    date_of_visit,
    atm_site_address,
    mse_name,
    mse_cnct_no,
    mse_email,
    before_inst_images, 
    after_inst_images ,
    remarks,
    engg_name,
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
async function fetchDataFromDatabase() {
  //const connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.execute('SELECT * FROM atm_asset_report ');
  connection.end();
  return rows;
}
async function generatePDF(data) {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream('output.pdf')); // Save the PDF to a file

  // Customize the PDF content as needed
  doc.fontSize(18).text('Data from Database', { align: 'center' });

  data.forEach((row) => {
    doc.fontSize(12).text(`atm_id: ${row.atm_id}`);
    doc.fontSize(12).text(`city_name: ${row.city_name}`);
    doc.fontSize(12).text('---'); // Add a separator between entries
  });

  doc.end(); // Finish the PDF document
}

app.get('/generate-pdf', async (req, res) => {
  try {
    const data = await fetchDataFromDatabase();
    if (data.length === 0) {
      return res.status(404).json({ message: 'No data found' });
    }

    await generatePDF(data);

    // Send the generated PDF as a response
    res.setHeader('Content-Disposition', 'attachment; filename="output.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    res.status(200);
    res.sendFile('output.pdf', { root: __dirname });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
