const express = require("express");
const { MongoClient } = require("mongodb");

const ObjectId = require("mongodb").ObjectId;
const SSLCommerzPayment = require("sslcommerz");

require("dotenv").config();
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5500;
const { v4: uuidv4 } = require("uuid");
// middleware
app.use(cors());
app.use(express.json());

// // -------------mongodb-------
const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0-shard-00-00.knujv.mongodb.net:27017,cluster0-shard-00-01.knujv.mongodb.net:27017,cluster0-shard-00-02.knujv.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-4bak04-shard-0&authSource=admin&retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

async function run() {
	try {
		await client.connect();
		console.log("connected to database");

		const database = client.db("venue-reservation");
		const serviceCollection = database.collection("services");
		const orderCollection = database.collection("myorder");
		const paymentCollection = database.collection("payment");
		const packageCollection = database.collection("packages");
		const addServiceCollection = database.collection("addservice");
		const userCollection = database.collection("user");

		// GET API
		app.get("/services", async (req, res) => {
			const cursor = serviceCollection.find({});
			const service = await cursor.toArray();
			res.send(service);
		});

		app.get("/booking/:id", async (req, res) => {
			let id = req.params.id;

			console.log("getting specific service", id);
			const query = { _id: ObjectId(id) };
			const service = await serviceCollection.findOne(query);
			res.json(service);
			// console.log(service);
		});

		app.post("/orders", async (req, res) => {
			const order = req.body;
			const result = await orderCollection.insertOne(order);
			res.send(result);
		});
		// find my order unique
		app.get("/myorder", async (req, res) => {
			const cursor = orderCollection.find({});
			const myorder = await cursor.toArray();
			res.send(myorder);
		});
		app.get("/myorder/:email", async (req, res) => {
			const email = req.params.email;
			console.log(email)
			const quary = { userMail : email };

			const cursor = orderCollection.find(quary);
			if ((await cursor.count()) === 0) {
				console.log("No Data Found");
			}

			const result = await cursor.toArray();
			res.send(result);
		});

		//  POST API

		app.post("/services", async (req, res) => {
			const service = req.body;
			console.log("hit the post api from service", service);

			const result = await orderCollection.insertOne(service);
			// alert('service added successfully')
			console.log(result);
			res.json(result);
		});

		// Delete
		app.delete("/orders/:id", async (req, res) => {
			const id = req.params.id;
			console.log("get delete request", id);
			const query = { _id: ObjectId(id) };
			const result = await orderCollection.deleteOne(query);
			console.log("service deleted successfully", result);
			res.json(result);
		});
		// finding admin or not
		app.get("/users/:email", async (req, res) => {
			const email = req.params.email;
			const query = { email: email };
			const user = await userCollection.findOne(query);
			let isAdmin = false;
			if (user?.isAdmin) {
				console.log(user.isAdmin);
				isAdmin = true;
			}
			res.json({ admin: isAdmin });
		});
		// update api

		app.post("/init", async (req, res) => {
			const data = {
				total_amount: req.body.product_amount,
				currency: "BDT",
				tran_id: uuidv4(), // use unique tran_id for each api call
				success_url: "http://localhost:5500/success",
				fail_url: "http://localhost:5500/fail",
				cancel_url: "http://localhost:5500/cancel",
				ipn_url: "http://localhost:5500/ipn",
				shipping_method: "Courier",
				paymentStatus: "pending",
				product_name: req.body.product_name,
				product_category: "Electronic",
				product_profile: req.body.product_profile,
				cus_name: req.body.cus_name,
				cus_email: req.body.cus_email,
				product_image: req.body.product_image,
				cus_add1: "Dhaka",
				cus_city: "Dhaka",
				cus_state: "Dhaka",
				cus_postcode: "1000",
				cus_country: "Bangladesh",
				cus_phone: "01711111111",
				ship_name: req.body.cus_name,
				ship_add1: "Dhaka",
				ship_add2: "Dhaka",
				ship_city: "Dhaka",
				ship_state: "Dhaka",
				ship_postcode: 1000,
				ship_country: "Bangladesh",
			};
			console.log(data);
			const paymentdata = await paymentCollection.insertOne(data);
			const sslcz = new SSLCommerzPayment(
				process.env.STORE_ID,
				process.env.STORE_PASS,
				false
			);
			sslcz.init(data).then((data) => {
				//     // Redirect the user to payment gateway
				//     let GatewayPageURL = apiResponse.GatewayPageURL
				if (data.GatewayPageURL) {
					res.json(data.GatewayPageURL);
				} else {
					return res.status(400).json({
						message: "payment session failed",
					});
				}
				//     console.log('Redirecting to: ', GatewayPageURL)
			});

			app.post("/success", async (req, res) => {
				const paydata = await paymentCollection.updateOne(
					{ tran_id: req.body.tran_id },
					{
						$set: {
							val_id: req.body.val_id,
						},
					}
				);

				res.redirect(`http://localhost:3000/success/`);
			});
			app.post("/fail", async (req, res) => {
				const order = await paymentCollection.deleteOne({
					tran_id: req.body.tran_id,
				});
				console.log(req.body);
				res.status(200).redirect(`http://localhost:3000/service`);
			});
			app.post("/cancel", async (req, res) => {
				const order = await paymentCollection.deleteOne({
					tran_id: req.body.tran_id,
				});
				// console.log("cancelled", req.body);
				res.status(200).redirect(`http://localhost:3000`);
			});
		});

		// add new services
		app.post("/addservice", async (req, res) => {
			const addservice = req.body;
			console.log("hit the post api from addservice", addservice);

			const result = await serviceCollection.insertOne(addservice);

			console.log(result);
			res.json(result);
		});
		// get for addservice data from database
		app.get("/addservice", async (req, res) => {
			const cursor = serviceCollection.find({});
			const addService = await cursor.toArray();
			res.send(addService);
		});
		app.put("/update/:id", async (req, res) => {
			const id = req.params.id;
			const status = req.body;
			const filter = { _id: ObjectId(id) };
			const options = { upsert: false };
			const updateDoc = {
				$set: {
					isPending: status.status,
				},
			};
			const result = await orderCollection.updateOne(
				filter,
				updateDoc,
				options
			);
			// console.log('updating', id,status.status)
			res.json(result);
		});
		app.delete("/myOrders/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await orderCollection.deleteOne(query);
			res.json(result);
		});

		//sslcommerz init
	} finally {
		// await client.close();
	}
}
run().catch(console.dir);

app.get("/", (req, res) => {
	res.send("running server now venue reservation system");
});
app.listen(port, () => {
	console.log("running  server on port", port);
});
