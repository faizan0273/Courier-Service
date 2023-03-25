const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const io = require('socket.io')();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const customerAuthMiddleware = require('./customerAuthMiddleware');
const riderAuthMiddleware = require('./riderAuthMiddleware');
const app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost/myapp', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

//Customer
const { customerInfoSchema } = require('./models/customer');
const customerInfo = mongoose.model('customer', customerInfoSchema);
//Rider
const { personalInfoSchema } = require('./models/personalInfo');
const PersonalInfo = mongoose.model('PersonalInfo', personalInfoSchema);
const { vehicleInfoSchema } = require('./models/vehicleInfo');
const VehicleInfo = mongoose.model('VehicleInfo', vehicleInfoSchema);
const { bankInfoSchema } = require('./models/bankInfo');
const BankInfo = mongoose.model('BankInfo', bankInfoSchema);
const { walletSchema } = require('./models/wallet');
const Wallet = mongoose.model('Wallet', walletSchema);
const { orderSchema } = require('./models/order');
const Order = mongoose.model('Order', orderSchema);
const { transactionSchema } = require('./models/transaction');
const Transaction = mongoose.model('Transaction', transactionSchema);


// Customer signup
app.post('/customerSignup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await customerInfo.findOne({ email });
    if (userExists) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await customerInfo.create({ name, email, password: hashedPassword });

    return res.status(201).json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Customer login
app.post('/customerLogin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await customerInfo.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password1' });
    }

    // Create and sign JWT token
    const token = jwt.sign({ userId: user._id }, 'secret');
    user.token = token;
    await user.save();
    return res.status(200).json({ 'token':token, 'userId': user._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Forgot Password Screen 1 for customer
app.post('/forgot-passwordc/email',customerAuthMiddleware, async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).send('Missing required fields');
  }

  try {
    const user = await customerInfo.findOne({ email });
    if (!user) {
      return res.status(404).send('User not found');
    }
    const nodemailer = require('nodemailer');

// create a transport object using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'immuhammadfaizan@gmail.com',
    pass: 'nryxirwyakabaebt'
  }
});

// generate a 6 digit code
const code = Math.floor(1000 + Math.random() * 9000);

const updateResult = await customerInfo.findOneAndUpdate({ email }, { storedCode: code }, { upsert: true });      

// send an email to the user with the code
const mailOptions = {
  from: 'immuhammadfaizan@gmail.com',
  to: email,
  subject: 'Verification Code',
  text: `Your verification code is ${code}`
};

transporter.sendMail(mailOptions, (err, info) => {
  if (err) {
    console.log(err);
    return res.status(500).send('Failed to send verification code');
  }
  return res.send('Verification code sent to email');
});

    // send code to email
    return res.send('Code sent to email');
  } catch (err) {
    return res.status(500).send(err);
  }
});

// Forgot Password Screen 2 for customer
app.post('/forgot-passwordc/code',customerAuthMiddleware, async (req, res) => {
    const { email, code } = req.body;
  
    if (!email || !code) {
      return res.status(400).send('Missing required fields');
    }
  
    // retrieve storedCode from your database using the email address
    const user = await customerInfo.findOne({ email });
    const storedCode = user.storedCode;

    if (code == storedCode) {
      // code is correct, allow user to reset password
      return res.send('Code verified');
    } else {
      // code is incorrect
      return res.status(400).send('Invalid verification code');
    }
  });
  
// Forgot Password Screen 3 for customer
app.post('/forgot-passwordc/password',customerAuthMiddleware, async (req, res) => {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).send('Missing required fields');
    }
  
    try {
      // update password in database
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await customerInfo.findOneAndUpdate({ email }, { password: hashedPassword }, { upsert: true });  
      return res.send('Password updated');
    } catch (err) {
      return res.status(500).send(err);
    }
  });

// Rider Signup Screen 1
app.post('/signup/personal', async (req, res) => {
  const { firstName, lastName, email, password, phoneNumber, city, dateOfBirth } = req.body;

  // Check if all required fields are present and not empty
  if (!firstName || !lastName || !email || !password || !phoneNumber || !city || !dateOfBirth) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Check if email is in valid format
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }

  // Check if phoneNumber is in valid format
  if (!/^\d{10}$/.test(phoneNumber)) {
    return res.status(400).json({ message: 'Invalid phone number' });
  }

  try {
    const PersonalInfo = mongoose.model('PersonalInfo', personalInfoSchema);

    // Check if a user with the same email already exists
    const existingUser = await PersonalInfo.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with the same email already exists' });
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    const personalInfo = new PersonalInfo({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber,
      city,
      dateOfBirth,
    });

    const savedPersonalInfo = await personalInfo.save();

    return res.status(200).json({ message: 'Personal Info saved successfully' , id: personalInfo._id});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server Error' });
  }
});
  
// Rider Signup Screen 2
app.post('/signup/vehicle', upload.fields([{ name: 'emiratesIdFront', maxCount: 1 }, { name: 'emiratesIdBack', maxCount: 1 }]),riderAuthMiddleware, async (req, res) => {
  const { drivingExperience, carMake, model, year, userId, color, licensePlateNumber, vehicleType } = req.body;

  if (!drivingExperience || !carMake || !model || !year || !userId || !color || !licensePlateNumber) {
    return res.status(400).send('Missing required fields');
  }

  try {
    const existingVehicleInfo = await VehicleInfo.findOne({ userId });

    if (existingVehicleInfo) {
      // User already exists, return an error response
      return res.status(400).json({message:'User already exists'});
    }

    // User does not exist, create a new entry
    const vehicleInfo = new VehicleInfo({
      emiratesIdFront: req.files.emiratesIdFront[0].buffer,
      emiratesIdBack: req.files.emiratesIdBack[0].buffer,
      drivingExperience,
      carMake,
      model,
      year,
      userId,
      color,
      licensePlateNumber,
      vehicleType // new field
    });

    const result = await vehicleInfo.save();

    if(result){
      return res.status(200).json({ message: 'Successfully uploaded' });
    }
  } catch (err) {
    return res.status(500).send(err);
  }
});

// RiderSignup Screen 3
app.post('/signup/bank',riderAuthMiddleware,async (req, res) => {
  const { userId, accountType, cardHolder, cardNumber, expiryDate, ccv } = req.body;

  if (!userId || !accountType || !cardHolder || !cardNumber || !expiryDate || !ccv) {
    return res.status(400).send('Missing required fields');
  }

  const bankInfo = new BankInfo({
    userId, accountType, cardHolder, cardNumber, expiryDate, ccv
  });

  bankInfo.save()
    .then(result => {
      return res.status(200).json({message:'Saved successfully'});
    })
    .catch(err => {
      return res.status(500).send(err);
    });
});

// Rider Login Screen
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Missing required fields');
  }

  try {
    const user = await PersonalInfo.findOne({ email });
    if (!user) {
      return res.status(401).send('Invalid email or password');
    }

    // Compare the hashed password stored in the database with the password provided by the user
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).send('Invalid email or password');
    }

    // Generate and sign JWT token
    const token = jwt.sign({ userId: user._id }, 'rider-secret');

    // Store the token in the user's document in the database
    user.token = token;
    await user.save();

    return res.status(200).json({ token:token, riderId:user._id });
  } catch (err) {
    return res.status(500).send(err);
  }
});
// Forgot Password Screen 1 for rider
app.post('/forgot-password/email',riderAuthMiddleware, async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).send('Missing required fields');
  }

  try {
    const user = await PersonalInfo.findOne({ email });
    if (!user) {
      return res.status(404).send('User not found');
    }
    const nodemailer = require('nodemailer');

// create a transport object using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'immuhammadfaizan@gmail.com',
    pass: 'nryxirwyakabaebt'
  }
});

// generate a 6 digit code
const code = Math.floor(1000 + Math.random() * 9000);

const updateResult = await PersonalInfo.findOneAndUpdate({ email }, { storedCode: code }, { upsert: true });      

// send an email to the user with the code
const mailOptions = {
  from: 'immuhammadfaizan@gmail.com',
  to: email,
  subject: 'Verification Code',
  text: `Your verification code is ${code}`
};

transporter.sendMail(mailOptions, (err, info) => {
  if (err) {
    console.log(err);
    return res.status(500).send('Failed to send verification code');
  }
  return res.send('Verification code sent to email');
});

    // send code to email
    return res.send('Code sent to email');
  } catch (err) {
    return res.status(500).send(err);
  }
});

// Forgot Password Screen 2 for rider
app.post('/forgot-password/code',riderAuthMiddleware, async (req, res) => {
    const { email, code } = req.body;
  
    if (!email || !code) {
      return res.status(400).send('Missing required fields');
    }
  
    // retrieve storedCode from your database using the email address
    const user = await PersonalInfo.findOne({ email });
    const storedCode = user.storedCode;

    if (code == storedCode) {
      // code is correct, allow user to reset password
      return res.send('Code verified');
    } else {
      // code is incorrect
      return res.status(400).send('Invalid verification code');
    }
  });
  
// Forgot Password Screen 3 for rider
app.post('/forgot-password/password',riderAuthMiddleware, async (req, res) => {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).send('Missing required fields');
    }
  
    try {
      // update password in database
      await PersonalInfo.findOneAndUpdate({ email }, { password: newPassword }, { upsert: true });  
      return res.send('Password updated');
    } catch (err) {
      return res.status(500).send(err);
    }
  });
  

// Store user order with order details
app.post('/storeOrders',customerAuthMiddleware, async (req, res) => {
  const { pickupLocation, dropoffLocation, packageSize, packageType, packageWeight, receiverName, receiverNumber, paymentMethod , userId, status,vehichleType} = req.body;
  //const userId = req.user._id; // Fetch the logged in user's ID

  try {
    // Create a new order object
    const newOrder = new Order({
      pickupLocation,
      dropoffLocation,
      packageSize,
      packageType,
      packageWeight,
      receiverName,
      receiverNumber,
      paymentMethod,
      userId,
      vehichleType,
      status
    });

    // Save the new order to the database
    await newOrder.save();

    res.status(201).json({ success: true, message: 'Order created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error creating order' });
  }
});

// Fetch user's orders history
app.get('/getOrders/:userId',customerAuthMiddleware, async (req, res) => {
  const {userId} = req.params;
  try {
    // Find all orders for the user and sort them by the most recent first
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching orders' });
  }
});


//Update order status
app.patch('/updateOrderStatus/:orderId',customerAuthMiddleware, async (req, res) => {
  const orderId = req.params.orderId;
  const newStatus = req.body.status;
  try {
    // Find the order in the database and update its status
    const updatedOrder = await Order.findByIdAndUpdate(orderId, { status: newStatus });

    // If the order was not found, return an error message
    if (!updatedOrder) {
      res.status(404).json({ success: false, message: 'Order not found' });
    } else {
      res.status(200).json({ success: true, message: 'Order status updated successfully', });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error updating order status' });
  }
});

//Delete order by id
app.delete('/deleteOrder/:orderId',customerAuthMiddleware, async (req, res) => {
  const orderId = req.params.orderId;
  try {
    // Find the order in the database and update its status
    const deletedOrder = await Order.findByIdAndDelete(orderId);

    // If the order was not found, return an error message
    if (!deletedOrder) {
      res.status(404).json({ success: false, message: 'Order not found' });
    } else {
      res.status(200).json({ success: true, message: 'Order deleted successfully', });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error deleting order' });
  }
});

//Delete customer by id
app.delete('/deleteCustomer/:customerId', customerAuthMiddleware,async (req, res) => {
  const customerId = req.params.customerId;
  try {
    // Find the order in the database and update its status
    const deletedCustomer = await customerInfo.findByIdAndDelete(customerId);

    // If the order was not found, return an error message
    if (!deletedCustomer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
    } else {
      res.status(200).json({ success: true, message: 'Customer deleted successfully', });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error deleting order' });
  }
});

//Delete rider by id
app.delete('/deleteProfile/:userId',riderAuthMiddleware, async (req, res) => {
  const userId = req.params.userId;

  try {
    // Delete Personal Info
    await PersonalInfo.deleteOne({ _id: userId });

    // Delete Vehicle Info
    await VehicleInfo.deleteOne({ _id: userId });

    // Delete Bank Info
    await BankInfo.deleteOne({ _id: userId });

    res.status(200).json({ success: true, message: 'Rider information deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error deleting profile information' });
  }
});


// Update rider information
app.put('/updateRider/:riderId',riderAuthMiddleware, async (req, res) => {
  const riderId = req.params.riderId;

  try {
    // Update Personal Info
    if (req.body.firstName || req.body.lastName || req.body.email || req.body.phoneNumber || req.body.city || req.body.dateOfBirth) {
      await PersonalInfo.updateOne({ _id:riderId }, { $set: req.body });
    }

    // Update Vehicle Info
    if (req.body.drivingExperience || req.body.carMake || req.body.model || req.body.year || req.body.color || req.body.licensePlateNumber) {
      await VehicleInfo.updateOne({ userId:riderId  }, { $set: req.body });
    }

    // Update Bank Info
    if (req.body.accountType || req.body.cardHolder || req.body.cardNumber || req.body.expiryDate || req.body.ccv) {
      await BankInfo.updateOne({ userId:riderId  }, { $set: req.body });
    }

    res.status(200).json({ success: true, message: 'Rider information updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error updating profile information' });
  }
});

// Add rider amount to wallet
app.post('/wallet',riderAuthMiddleware, async (req, res) => {
  try {
    const { rider, amount } = req.body;

    // Check if a wallet exists for the rider
    let wallet = await Wallet.findOne({ rider });

    if (!wallet) {
      // If a wallet does not exist, create a new one with the initial balance
      wallet = new Wallet({ rider, balance: amount });
      await wallet.save();
    } else {
      // If a wallet exists, add the new amount to the existing balance
      wallet.balance += Number(amount);
      await wallet.save();
    }

    res.status(201).json({message:"Amount added to rider wallet"});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


//transactions of rider from their wallet

app.post('/transactions',riderAuthMiddleware, async (req, res) => {
  try {
    const { rider, amount, method } = req.body;

    // Check if a wallet exists for the rider
    let wallet = await Wallet.findOne({ rider:rider });

    if (!wallet) {
      // If a wallet does not exist, return an error message
      return res.status(400).json({ message: 'Rider wallet does not exist' });
    } else if (wallet.balance < amount) {
      // If the rider wants to transact more than their wallet balance, return an error message
      return res.status(400).json({ message: 'Insufficient balance in rider wallet' });
    }

    // If the rider has sufficient balance, update the wallet balance by subtracting the transaction amount
    wallet.balance -= amount;
    await wallet.save();

    // Create a new transaction with the rider ID and the transaction details
    const transaction = new Transaction({ rider, amount, method });
    const savedTransaction = await transaction.save();

    res.status(201).json(savedTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//get amount of rider wallet

app.get('/wallet/:riderId',riderAuthMiddleware, async (req, res) => {
  try {
    const riderId = req.params.riderId;

    // Check if a wallet exists for the rider
    const wallet = await Wallet.findOne({ rider: riderId });

    if (!wallet) {
      // If a wallet does not exist, return a 404 Not Found response with an error message
      return res.status(404).json({ message: 'Rider wallet not found' });
    }

    // If a wallet exists, return the wallet balance as a response
    res.status(200).json({ balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//return all transactions of rider
app.get('/getransactions/:riderId',riderAuthMiddleware, async (req, res) => {
  try {
    const riderId = req.params.riderId;

    // Find all transactions of the rider by querying the Transaction model
    const transactions = await Transaction.find({ rider: riderId });

    // Return the transactions as a response
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get customer information
app.get('/customers/:customerId', customerAuthMiddleware, async (req, res) => {
  const { customerId } = req.params;

  try {
    const customer = await customerInfo.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Populate customerInfo object
    const customerData = {
      name: customer.name,
      email: customer.email,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };

    return res.status(200).json(customerData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server Error' });
  }
});

// Get rider information
app.get('/riders/:riderId',riderAuthMiddleware, async (req, res) => {
  const { riderId } = req.params;

  try {
    const rider = await PersonalInfo.findById(riderId);
    if (!rider) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    // Return only the necessary rider information
    const riderInfo = {
      name: rider.firstName+" "+rider.lastName,
      email: rider.email,
      phone: rider.phoneNumber,
      city: rider.city,
      dateOfBirth: rider.dateOfBirth
    };

    return res.status(200).json(riderInfo);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server Error' });
  }
});

//Rider logout
app.post('/riderLogout/:riderId', riderAuthMiddleware, async (req, res) => {
  try {
    const riderId = req.params.riderId;

    // Find the rider and update the token
    const rider = await PersonalInfo.findOneAndUpdate(
      { _id: riderId },
      { token: '' },
      { new: true }
    );

    // Return success response
    return res.status(200).json({ message: 'Rider logged out successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server Error' });
  }
});


//Customer logout
app.post('/customerLogout/:customerId', customerAuthMiddleware, async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await customerInfo.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    customer.token = '';
    await customer.save();

    return res.status(200).json({ message: 'Customer logged out successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server Error' });
  }
});

//Update customer Profile

app.put('/updateCustomer/:customerId', customerAuthMiddleware, async (req, res) => {
  const customerId = req.params.customerId;

  try {
    // Update Personal Info
    if (req.body.name ) {
      await customerInfo.updateOne({ _id: customerId }, { $set: req.body });
    }

    res.status(200).json({ success: true, message: 'Customer information updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error updating profile information' });
  }
  
});


// start the server
const port = 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
  
  